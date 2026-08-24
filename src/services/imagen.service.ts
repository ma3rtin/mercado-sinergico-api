import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import streamifier from 'streamifier';
import sharp from 'sharp';
import pLimit from 'p-limit';
import { CustomError } from '../errors/custom.error.js';

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 80;
const UPLOAD_TIMEOUT_MS = 15000;

// Limita sharp a 1 hilo de libvips para evitar saturar el contenedor (0.1 vCPU).
// Los módulos ESM son singletons: corre una sola vez por proceso al boot.
sharp.concurrency(1);

export class ImagenService {
  constructor() {}

  // Compartido por creación y edición de productos, y por la edición de
  // variantes individuales (VarianteService.actualizarVariante): el timeout
  // de acá protege a los tres flujos, no solo a la creación de productos.
  public uploadToCloudinary = async (
    buffer: Buffer,
    folder = 'mercado_sinergico'
  ): Promise<string> => {
    const start = Date.now();

    const procesarYSubir = async (): Promise<string> => {
      let uploadBuffer = buffer;
      try {
        const metadata = await sharp(buffer).metadata();
        const originalKb = buffer.length / 1024;
        const longestSide = Math.max(metadata.width ?? 0, metadata.height ?? 0);
        console.log(
          `[uploadToCloudinary] Procesando imagen: ${metadata.width ?? '?'}x${
            metadata.height ?? '?'
          }px (${originalKb.toFixed(1)} KB, lado mayor ${longestSide}px)`
        );

        uploadBuffer = await sharp(buffer)
          .rotate()
          .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();

        const processedKb = uploadBuffer.length / 1024;
        console.log(
          `[uploadToCloudinary] Compresión con sharp: ${originalKb.toFixed(1)} KB -> ${
            processedKb.toFixed(1)
          } KB WebP en ${Date.now() - start}ms`
        );
      } catch (error) {
        console.warn(
          `[uploadToCloudinary] No se pudo procesar la imagen con sharp, se sube el buffer original (${Date.now() - start}ms):`,
          error
        );
      }

      const uploadStart = Date.now();
      return new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) {
              console.error(
                `[uploadToCloudinary] Error subiendo a Cloudinary (${Date.now() - uploadStart}ms):`,
                error
              );
              return reject(error);
            }
            if (!result?.secure_url) {
              console.error(
                `[uploadToCloudinary] Cloudinary no devolvió URL segura (${Date.now() - uploadStart}ms)`
              );
              return reject(new Error('No se obtuvo URL segura de Cloudinary'));
            }
            console.log(
              `[uploadToCloudinary] Subida a Cloudinary completada en ${
                Date.now() - uploadStart
              }ms. URL: ${result.secure_url}`
            );
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(uploadBuffer).pipe(stream);
      });
    };

    // Cubre toda la operación (compresión con sharp + subida), no solo la
    // subida: si sharp se cuelga con una imagen rara, este límite también
    // corta, no solo un problema de conectividad con Cloudinary.
    let timeoutId!: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new CustomError(
            `No se pudo subir la imagen: se superó el límite de ${UPLOAD_TIMEOUT_MS / 1000} segundos. Intentá de nuevo en unos minutos.`,
            500
          )
        );
      }, UPLOAD_TIMEOUT_MS);
    });

    try {
      const url = await Promise.race([procesarYSubir(), timeout]);
      console.log(`[uploadToCloudinary] Total (compresión + subida): ${Date.now() - start}ms`);
      return url;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Sube un lote de archivos a Cloudinary con concurrencia controlada.
  // - Reutilizable por cualquier controller mediante tipado estructural { buffer: Buffer }[].
  // - Promise.all preserva el orden por índice (urls[0] = icono en createProducto).
  // - Fail-fast idéntico al Promise.all anterior.
  // - folder?: string — undefined dispara el default 'mercado_sinergico' de uploadToCloudinary.
  public subirArchivosEnLotes = async (
    archivos: { buffer: Buffer }[],
    limite = 3,
    folder?: string
  ): Promise<string[]> => {
    const limit = pLimit(limite);
    return Promise.all(
      archivos.map((archivo) =>
        limit(() => this.uploadToCloudinary(archivo.buffer, folder))
      )
    );
  };

  public async uploadFromUrl(
    imageUrl: string,
    folder = 'mercado_sinergico'
  ): Promise<string> {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    return this.uploadToCloudinary(buffer, folder);
  }
}
