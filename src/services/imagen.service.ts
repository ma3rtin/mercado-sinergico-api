import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import streamifier from "streamifier";

export class ImagenService {
  constructor() {}

  public uploadToCloudinary = (
    buffer: Buffer,
    folder = 'mercado_sinergico'
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
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
    folder = "mercado_sinergico"
  ): Promise<string> {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");
    return this.uploadToCloudinary(buffer, folder);
  }
}
