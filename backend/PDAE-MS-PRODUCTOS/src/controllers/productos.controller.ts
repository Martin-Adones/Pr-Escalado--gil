import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductosService } from '../services/productos.service';
import { transformAndValidate } from 'shared';
import {
  CrearProductoEntradaDto,
  ListarProductosConsultaDto,
  ActualizarProductoEntradaDto,
  DesactivarProductoEntradaDto,
} from '../models/productos.dtos';

/**
 * Capa HTTP: valida DTOs y delega en {@link ProductosService}.
 */
export class ProductosController {
  private servicio: ProductosService;

  constructor() {
    this.servicio = new ProductosService();
  }

  async manejarCrearProducto(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_crear_producto' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;

      const rawProductos = Array.isArray(datos)
        ? datos
        : datos && Array.isArray((datos as any).products)
          ? (datos as any).products
          : [datos];

      const entradas = await Promise.all(
        rawProductos.map((item: any) => transformAndValidate(CrearProductoEntradaDto, item))
      );
      const resultado = await this.servicio.crearProducto(entradas.length === 1 ? entradas[0] : entradas);

      return respuesta.status(200).send({ success: true, data: resultado });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validacion:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_crear_producto' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarListarProductos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_listar_productos' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ListarProductosConsultaDto, datos);
      const resultado = await this.servicio.listarProductos(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validacion:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_listar_productos' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarActualizarProducto(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_actualizar_producto' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(ActualizarProductoEntradaDto, datos);
      const resultado = await this.servicio.actualizarProducto(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validacion:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_actualizar_producto' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async manejarDesactivarProducto(solicitud: FastifyRequest, respuesta: FastifyReply) {
    solicitud.log?.debug?.({ procedimiento: 'sp_desactivar_producto' }, 'ejecutando procedimiento');

    try {
      const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
      const entrada = await transformAndValidate(DesactivarProductoEntradaDto, datos);
      const resultado = await this.servicio.desactivarProducto(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error.message.startsWith('Error de Validacion:')) {
        return respuesta.status(400).send({
          success: false,
          message: error.message,
        });
      }

      solicitud.log?.error?.(
        { error: error.message, procedimiento: 'sp_desactivar_producto' },
        'Error en ejecucion de procedimiento'
      );
      return respuesta.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}
