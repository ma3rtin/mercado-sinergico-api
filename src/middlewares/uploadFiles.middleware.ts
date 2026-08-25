import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { CustomError } from '../errors/custom.error.js';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new CustomError('Tipo de archivo no permitido. Solo JPEG, PNG y GIF.', 415));
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
