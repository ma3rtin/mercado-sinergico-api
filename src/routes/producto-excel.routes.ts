import { Router } from 'express';
import multer from 'multer';
import { productoExcelController } from '../controllers/producto-excel.controller.js';
import { authMiddleware, rolMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

const soloAdmin = [authMiddleware, rolMiddleware(['Administrador'])];

// Configurar multer para recibir archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB máximo
    },
    fileFilter: (req, file, cb) => {
        // Validar que sea un archivo Excel
        const allowedMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xls, .xlsx)'));
        }
    },
});

// Rutas
router.post('/importar', ...soloAdmin, upload.single('file'), productoExcelController.importar.bind(productoExcelController));
router.get('/exportar', ...soloAdmin, productoExcelController.exportar.bind(productoExcelController));
router.get('/plantilla', ...soloAdmin, productoExcelController.generarPlantilla.bind(productoExcelController));

export default router;
