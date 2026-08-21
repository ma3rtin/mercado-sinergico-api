import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import streamifier from 'streamifier';

export class ImagenService {
  constructor() {}

  public uploadToCloudinary = (
    buffer: Buffer,
    folder = 'mercado_sinergico'
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            'Timeout excedido al subir imagen a Cloudinary (límite de 15 segundos). Por favor, verifique la configuración de credenciales de Cloudinary y la conectividad del servidor.'
          )
        );
      }, 15000);

      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          clearTimeout(timeoutId);
          if (error) return reject(error);
          if (!result?.secure_url)
            return reject(new Error('No se obtuvo URL segura de Cloudinary'));
          resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
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
