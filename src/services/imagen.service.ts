import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import streamifier from 'streamifier';
import pLimit from 'p-limit';
import { CustomError } from '../errors/custom.error.js';

const MAX_DIMENSION = 1200;
const UPLOAD_TIMEOUT_MS = 15000;

export class ImagenService {
  constructor() {}

  // Compartido por creación y edición de productos, y por la edición de
  // variantes individuales (VarianteService.actualizarVariante): el timeout
  // de acá protege a los tres flujos, no solo a la creación de productos.
  //
  // El resize/recompresión se delega a Cloudinary vía "incoming transformation"
  // en vez de procesarlo acá con sharp: en un contenedor de CPU compartida
  // (0.1-0.2 vCPU), decodificar+recodificar 16 imágenes secuencialmente
  // dominaba el tiempo de la request y disparaba 504 en el gateway. Subir el
  // buffer original y dejar que Cloudinary transforme del otro lado saca ese
  // costo de CPU del contenedor.
  public uploadToCloudinary = async (
    buffer: Buffer,
    folder = 'mercado_sinergico'
  ): Promise<string> => {
    const start = Date.now();

    const subir = (): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            transformation: [
              { width: MAX_DIMENSION, height: MAX_DIMENSION, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              console.error(
                `[uploadToCloudinary] Error subiendo a Cloudinary (${Date.now() - start}ms):`,
                error
              );
              return reject(error);
            }
            if (!result?.secure_url) {
              console.error(
                `[uploadToCloudinary] Cloudinary no devolvió URL segura (${Date.now() - start}ms)`
              );
              return reject(new Error('No se obtuvo URL segura de Cloudinary'));
            }
            console.log(
              `[uploadToCloudinary] Subida a Cloudinary completada en ${Date.now() - start}ms. URL: ${result.secure_url}`
            );
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });

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
      return await Promise.race([subir(), timeout]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Sube un lote de archivos a Cloudinary con concurrencia controlada.
  // - Reutilizable por cualquier controller mediante tipado estructural { buffer: Buffer }[].
  // - Promise.all preserva el orden por índice (urls[0] = icono en createProducto).
  // - Fail-fast idéntico al Promise.all anterior.
  // - folder?: string — undefined dispara el default 'mercado_sinergico' de uploadToCloudinary.
  // - limite sube de 3 a 6: sin sharp, la request es I/O de red, no CPU, y
  //   soporta más subidas simultáneas sin saturar el contenedor.
  public subirArchivosEnLotes = async (
    archivos: { buffer: Buffer }[],
    limite = 6,
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
