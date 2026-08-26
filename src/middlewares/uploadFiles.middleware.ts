import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { CustomError } from '../errors/custom.error.js';

const storage = multer.memoryStorage();

// Cloudinary hace la conversión a WebP del lado suyo, así que aceptamos todo
// lo que él sabe decodificar. Antes la lista era jpeg/png/gif y rechazaba con
// 415 dos casos que la propia UI ofrece: los .webp del selector de adicionales
// y las fotos HEIC/HEIF, que son el formato por defecto del iPhone.
const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Algunos navegadores no reconocen HEIC y mandan un mimetype genérico; en ese
  // caso se cae a la extensión antes de rechazar el archivo.
  const esHeicPorExtension =
    /\.(heic|heif)$/i.test(file.originalname) &&
    (file.mimetype === 'application/octet-stream' || file.mimetype === '');

  if (TIPOS_PERMITIDOS.includes(file.mimetype) || esHeicPorExtension) {
    cb(null, true);
  } else {
    cb(
      new CustomError(
        'Tipo de archivo no permitido. Se aceptan JPEG, PNG, GIF, WebP, HEIC y AVIF.',
        415
      )
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

type CampoImagen = {
  name: string;
  maxCount?: number;
};

export const procesarSubidaImagen = (
  campos: string | { fieldName: string; multiple?: boolean } | CampoImagen[]
) => {
  if (typeof campos === 'string') {
    return upload.single(campos);
  }

  if (Array.isArray(campos)) {
    const fields = campos.map(c => ({
      name: c.name,
      maxCount: c.maxCount ?? 1,
    }));
    return upload.fields(fields);
  }

  return upload.array(campos.fieldName, campos.multiple ? 10 : 1);
};
