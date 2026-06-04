import { microservices, MicroserviceConfig } from '../../config';

/**
 * Utilidad para consumir los esquemas Swagger/OpenAPI de los microservicios
 * y unificarlos en un solo esquema compatible con Swagger UI.
 */
export class SwaggerMerger {
  private services: MicroserviceConfig[];

  constructor() {
    this.services = microservices;
  }

  /**
   * Obtiene la especificación OpenAPI de un microservicio específico.
   * Si el microservicio está apagado, retorna null de forma segura.
   */
  private async fetchSchema(service: MicroserviceConfig): Promise<any | null> {
    try {
      const response = await fetch(`${service.url}/api-doc/json`);
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      console.warn(`[SwaggerMerger] No se pudo obtener el esquema de ${service.name} (${service.url}/api-doc/json): ${error.message}`);
      return null;
    }
  }

  /**
   * Genera una especificación OpenAPI consolidada fusionando los esquemas de los microservicios.
   */
  public async getUnifiedSchema(): Promise<any> {
    const unifiedSpec: any = {
      openapi: '3.0.3',
      info: {
        title: 'PDAE · API Gateway',
        description: 'Documentación unificada de todos los microservicios bajo el API Gateway.',
        version: '1.0.0',
        contact: {
          name: 'Equipo PDAE',
        },
      },
      servers: [
        {
          url: '/',
          description: 'Servidor API Gateway actual',
        },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {},
      },
      tags: [],
    };

    const tagsMap = new Map<string, any>();

    for (const service of this.services) {
      const schema = await this.fetchSchema(service);
      if (!schema) continue;

      // Fusionar paths y forzar que pertenezcan al grupo/tag del nombre del microservicio
      if (schema.paths) {
        Object.keys(schema.paths).forEach((path) => {
          const pathObject = schema.paths[path];
          if (!pathObject || typeof pathObject !== 'object') return;

          const modifiedPathObject: any = {};
          Object.keys(pathObject).forEach((method) => {
            const operation = pathObject[method];
            if (operation && typeof operation === 'object') {
              // Reemplazamos los tags originales por el nombre de este microservicio
              modifiedPathObject[method] = {
                ...operation,
                tags: [service.name],
              };
            } else {
              modifiedPathObject[method] = operation;
            }
          });

          unifiedSpec.paths[path] = modifiedPathObject;
        });
      }

      // Fusionar components schemas
      if (schema.components) {
        if (schema.components.schemas) {
          Object.keys(schema.components.schemas).forEach((schemaName) => {
            unifiedSpec.components.schemas[schemaName] = schema.components.schemas[schemaName];
          });
        }
        if (schema.components.securitySchemes) {
          Object.keys(schema.components.securitySchemes).forEach((schemeName) => {
            unifiedSpec.components.securitySchemes[schemeName] = schema.components.securitySchemes[schemeName];
          });
        }
      }

      // Agregar el tag descriptivo para este microservicio
      tagsMap.set(service.name, {
        name: service.name,
        description: `Endpoints pertenecientes al microservicio de ${service.name}.`,
      });
    }

    unifiedSpec.tags = Array.from(tagsMap.values());

    return unifiedSpec;
  }
}
