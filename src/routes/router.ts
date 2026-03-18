import { Router } from 'express';
import { usuarioRouter } from './modules/usuario.route.js';
import productoRouter from './modules/producto.route.js';
import { paqueteBaseRouter } from './modules/paqueteBase.route.js';
import { zonaRouter } from './modules/zona.route.js';
import { localidadRouter } from './modules/localidad.route.js';
import { paquetePublicadoRouter } from './modules/paquetePublicado.route.js';
import { plantillaRouter } from './modules/plantilla.route.js';
import marcaRouter from './modules/marca.route.js';
import categoriaRouter from './modules/categorias.route.js';
import pedidoRouter from './modules/pedido.route.js';
import { mercadoPagoRouter } from '../payments/mercadopago/mercadopago.routes.js';
import productoExcelRouter from './producto-excel.routes.js';

export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use('/api/usuarios', usuarioRouter);
    router.use('/api/productos', productoRouter);
    router.use('/api/productos/excel', productoExcelRouter);
    router.use('/api/paquetes-base', paqueteBaseRouter);
    router.use('/api/paquetes-publicados', paquetePublicadoRouter);
    router.use('/api/zonas', zonaRouter);
    router.use('/api/localidades', localidadRouter);
    router.use('/api/plantillas', plantillaRouter);
    router.use('/api/marcas', marcaRouter);
    router.use('/api/categorias', categoriaRouter);
    router.use('/api/pedidos', pedidoRouter);
    router.use('/api/pagos', mercadoPagoRouter);

    return router;
  }
}
