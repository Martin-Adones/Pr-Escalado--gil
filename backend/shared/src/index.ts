export { db } from './database/pg-client';
export { BaseRepository } from './repositories/base-repository';
export { transformAndValidate } from './utils/validator';
export { registerSwagger, type SwaggerConfig } from './utils/api-doc/swagger';
export { respuestaErrorValidacion, respuestaErrorServidor } from './utils/api-doc/openapi-schemas';
export { healthRoute } from './routes/health-routes';
export {
  REGEX_ID_BIGINT,
  MENSAJE_ID_BIGINT,
  vacioAIndefinido,
  normalizarBooleano,
  TransformVacioAIndefinido,
  TransformNormalizarBooleano,
} from './utils/dto-helpers';
