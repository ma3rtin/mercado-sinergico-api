import { Router } from 'express';
import multer from 'multer';
import { productoExcelController } from '../controllers/producto-excel.controller.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// Garantizar carpeta de uploads
const uploadDir = 'uploads/imports';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para disco (mejor para archivos grandes)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // Aumentado a 20 MB sugerido para prods
    },
});

// Rutas
router.post('/importar', upload.single('file'), (req, res, next) => {
    productoExcelController.importar(req, res).catch(next);
});

router.get('/importar/status/:id', (req, res, next) => {
    productoExcelController.consultarEstado(req, res).catch(next);
});

router.get('/exportar', (req, res, next) => {
    productoExcelController.exportar(req, res).catch(next);
});

router.get('/plantilla', (req, res, next) => {
    productoExcelController.generarPlantilla(req, res).catch(next);
});

export default router;

