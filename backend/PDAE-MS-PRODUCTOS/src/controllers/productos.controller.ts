import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductosService } from '../services/productos.service';
import { transformAndValidate } from 'shared';
import {
  CrearProductoEntradaDto,
  ListarProductosConsultaDto,
  ActualizarProductoEntradaDto,
  DesactivarProductoEntradaDto,
} from '../models/productos.dtos';

export class ProductosController {
  private servicio: ProductosService;

  constructor() {
    this.servicio = new ProductosService();
  }

  async manejarCrearProducto(solicitud: FastifyRequest, respuesta: FastifyReply) {
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
  }

  async manejarListarProductos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ListarProductosConsultaDto, datos);
    const resultado = await this.servicio.listarProductos(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarActualizarProducto(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(ActualizarProductoEntradaDto, datos);
    const resultado = await this.servicio.actualizarProducto(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }

  async manejarDesactivarProducto(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const datos = solicitud.method === 'GET' ? solicitud.query : solicitud.body;
    const entrada = await transformAndValidate(DesactivarProductoEntradaDto, datos);
    const resultado = await this.servicio.desactivarProducto(entrada);
    return respuesta.status(200).send({ success: true, data: resultado });
  }
}
