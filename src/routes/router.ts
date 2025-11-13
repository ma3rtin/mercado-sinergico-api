
import { Router } from 'express';
import { usuarioRouter } from './modules/usuario.route';
import productoRouter from './modules/producto.route';
import { paqueteBaseRouter } from './modules/paqueteBase.route';
import { zonaRouter } from './modules/zona.route';
import { localidadRouter } from './modules/localidad.route';
import { paquetePublicadoRouter } from './modules/paquetePublicado.route';
import { plantillaRouter } from './modules/plantilla.route';
import marcaRouter from './modules/marca.route';
import categoriaRouter from './modules/categorias.route';
import pedidoRouter from './modules/pedido.route';


export class AppRoutes {

    static get routes(): Router {
        const router = Router();
      
        router.use('/api/usuarios', usuarioRouter);
        router.use('/api/productos', productoRouter);
        router.use('/api/paquetes-base', paqueteBaseRouter);
        router.use('/api/paquetes-publicados', paquetePublicadoRouter);
        router.use('/api/zonas', zonaRouter);
        router.use('/api/localidades', localidadRouter);
        router.use('/api/plantillas', plantillaRouter);
        router.use('/api/marcas', marcaRouter);
        router.use('/api/categorias', categoriaRouter);
        router.use('/api/pedidos', pedidoRouter);
      
        return router;
      
    }
}