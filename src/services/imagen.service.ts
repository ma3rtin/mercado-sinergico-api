import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import streamifier from 'streamifier';
import sharp from 'sharp';

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 85;

export class ImagenService {
  constructor() {}

  public uploadToCloudinary = async (
    buffer: Buffer,
    folder = 'mercado_sinergico'
  ): Promise<string> => {
    const start = Date.now();

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
    }).then((url) => {
      console.log(`[uploadToCloudinary] Total (compresión + subida): ${Date.now() - start}ms`);
      return url;
    });
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
