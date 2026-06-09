# PDAE · Microservicio Soporte

Microservicio de soporte del sistema. Expone endpoints de diagnóstico y utilidades internas.

## Health
- `GET /api/health` -> verifica que el proceso está vivo. Devuelve `{ status: 'UP', service: 'PDAE-MS-SOPORTE-1', timestamp }`.

## Levantar
- Usar `example.env` para referencias de puertos y DB.
- En desarrollo: `npm run dev` (TS hot reload).
- En contenedor (desarrollo via docker-compose): `docker-compose up --build` (usa stage `dev` en Dockerfile).
