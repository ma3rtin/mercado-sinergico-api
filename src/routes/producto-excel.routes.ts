import { Router } from 'express';
import multer from 'multer';
import { productoExcelController } from '../controllers/producto-excel.controller.js';
import { authMiddleware, rolMiddleware } from '../middlewares/auth.middleware.js';
import path from 'path';
import fs from 'fs';

import { excelLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();
// Garantizar carpeta de uploads
const uploadDir = 'uploads/imports';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExts = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExts.includes(ext)) cb(null, true);
        else cb(new Error('Only Excel files are allowed'));
    }
});

// Rutas protegidas para Admins
router.post('/importar', excelLimiter, authMiddleware, rolMiddleware(['Admin']), upload.single('file'), (req, res, next) => {
    productoExcelController.importar(req, res).catch(next);
});

router.get('/importar/status/:id', authMiddleware, rolMiddleware(['Admin']), (req, res, next) => {
    productoExcelController.consultarEstado(req, res).catch(next);
});

router.get('/exportar', excelLimiter, authMiddleware, rolMiddleware(['Admin']), (req, res, next) => {
    productoExcelController.exportar(req, res).catch(next);
});


router.get('/plantilla', authMiddleware, (req, res, next) => {
    productoExcelController.generarPlantilla(req, res).catch(next);
});

export default router;


