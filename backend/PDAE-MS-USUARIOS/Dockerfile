# STAGE 1: Build y compilación limpia con TypeScript
FROM node:20-alpine AS builder

# Setear directorio de trabajo estándar
WORKDIR /app

# Copiar configuración de módulos
COPY package*.json ./

# Instalar TODAS las dependencias (necesitamos ts-node y typescript para compilar)
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar proyecto de TypeScript a JavaScript dist/
RUN npm run build

# ==========================================

# STAGE 2: Imagen productiva (Únicamente lo necesario para el runtime)
FROM node:20-alpine

# Setear directorio en contenedor final
WORKDIR /app

# Instalar sólamente las dependencias de producción (Sin tsc ni jest)
COPY package*.json ./
RUN npm install --omit=dev

# Mover los archivos compilados del Stage de construcción
COPY --from=builder /app/dist ./dist
# Mover Swagger u otros utilitarios (si existen estáticos)
# Copiar el .env en caso de usarlo dentro de CloudRun, pero es mejor inyectarlo en plataforma

ENV NODE_ENV=production

# Fastify debe escuchar de forma externa en Docker
ENV PORT=80

# Exponer el puerto
EXPOSE 80

# Punto de inicio nativo de Javascript
CMD ["node", "dist/server.js"]
