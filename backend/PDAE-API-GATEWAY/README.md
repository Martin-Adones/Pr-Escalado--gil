# PDAE · API Gateway

API Gateway desarrollado con **Fastify** y **TypeScript** que centraliza el punto único de acceso para el backend de la plataforma PDAE.

## Características

* 🔄 Enrutamiento y Proxy reverso a microservicios a través de `@fastify/http-proxy`.
* 🛡️ Seguridad integrada con `@fastify/helmet` y limitación de peticiones con `@fastify/rate-limit`.
* 📜 Documentación de API unificada: Consume y expone de forma consolidada la documentación de los microservicios activos en `/api-doc`.
* 🩺 Health Check consolidado en `/api/health` para monitorear el Gateway y las dependencias downstream.

---

## Enrutamiento

| Ruta Externa | Microservicio Destino | Puerto por Defecto |
| :--- | :--- | :--- |
| `/api/usuarios/*` | `PDAE-MS-USUARIOS` | `3003` |
| `/api/contratos/*` | `PDAE-MS-CONTRATOS` | `3002` |
| `/api/health` | Gateway (Self + Chequeo de MS) | `3001` |
| `/api-doc` | Swagger UI Consolidado | `3001` |

---

## Requisitos

* **Node.js** `>= 18.18.0`

---

## Puesta en Marcha en Desarrollo

1. Instalar las dependencias de desarrollo y producción:
   ```bash
   npm install
   ```

2. Crear tu archivo `.env` tomando como base el ejemplo:
   ```bash
   cp .env.example .env
   ```

3. Levantar los microservicios correspondientes (`PDAE-MS-USUARIOS` y `PDAE-MS-CONTRATOS`).

4. Ejecutar el API Gateway en modo desarrollo:
   ```bash
   npm run dev
   ```

El Gateway estará escuchando en `http://localhost:3001` y podrás visualizar la documentación interactiva unificada en `http://localhost:3001/api-doc`.

---

## Construcción y Despliegue con Docker

El proyecto incluye un `Dockerfile` multi-stage optimizado para producción. Para construir la imagen de producción:

```bash
docker build -t pdae-api-gateway .
```

Y para ejecutarla:

```bash
docker run -p 3001:3001 --env MS_RUTAS_URL="usuarios:http://<host-usuarios>:3003,contratos:http://<host-contratos>:3002" pdae-api-gateway
```
