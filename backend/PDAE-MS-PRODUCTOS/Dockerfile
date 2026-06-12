# Stage de desarrollo
FROM node:20-alpine AS dev

WORKDIR /shared
COPY shared/package*.json ./
RUN npm install
COPY shared/ ./
RUN npm run build

WORKDIR /app
COPY PDAE-MS-PRODUCTOS/package*.json ./
RUN npm install
COPY PDAE-MS-PRODUCTOS/ ./

ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# STAGE 1: Build y compilación limpia con TypeScript
FROM node:20-alpine AS builder

WORKDIR /shared
COPY shared/package*.json ./
RUN npm install
COPY shared/ ./
RUN npm run build

WORKDIR /app
COPY PDAE-MS-PRODUCTOS/package*.json ./
RUN npm install
COPY PDAE-MS-PRODUCTOS/ ./
RUN npm run build

# STAGE 2: Imagen productiva (Únicamente lo necesario para el runtime)
FROM node:20-alpine

WORKDIR /shared
COPY --from=builder /shared/lib ./lib
COPY shared/package*.json ./

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY PDAE-MS-PRODUCTOS/package*.json ./
RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/server.js"]
