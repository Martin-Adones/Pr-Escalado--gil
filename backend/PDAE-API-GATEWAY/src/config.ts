import dotenv from 'dotenv';
dotenv.config();

export interface MicroserviceConfig {
  name: string;
  prefix: string;
  url: string;
}

// Configuración por defecto si no se define la variable de entorno
const defaultRoutes = 'auditoria:http://localhost:3007,contratos:http://localhost:3002,planes:http://localhost:3004,productos:http://localhost:3005,soporte:http://localhost:3006,usuarios:http://localhost:3003';
const routesConfig = process.env.MS_RUTAS_URL || defaultRoutes;

/**
 * Parsea la variable de entorno MS_RUTAS_URL que contiene microservicios en formato:
 * "prefijo1:http://url1,prefijo2:http://url2"
 */
export const parseMicroservices = (configStr: string): MicroserviceConfig[] => {
  if (!configStr) return [];
  
  return configStr
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => {
      const firstColon = item.indexOf(':');
      if (firstColon === -1) {
        throw new Error(`Configuración de ruta inválida (falta ':'): "${item}"`);
      }
      
      const prefix = item.substring(0, firstColon).trim().toLowerCase();
      const url = item.substring(firstColon + 1).trim();
      const name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      
      return { name, prefix, url };
    });
};

export const microservices: MicroserviceConfig[] = parseMicroservices(routesConfig);
export const port = Number(process.env.PORT) || 3001;
export const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'warn');
