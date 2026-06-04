# STAGE 1: Build y compilación limpia con TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar configuración de módulos
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar proyecto de TypeScript a JavaScript dist/
RUN npm run build

# ==========================================

# STAGE 2: Imagen productiva (Únicamente lo necesario para el runtime)
FROM node:20-alpine

WORKDIR /app

# Instalar sólamente las dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev

# Mover los archivos compilados del Stage de construcción
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3001

# Exponer el puerto
EXPOSE 3001

# Punto de inicio nativo de Javascript
CMD ["node", "dist/server.js"]
