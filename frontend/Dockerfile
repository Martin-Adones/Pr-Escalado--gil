FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV FRONTEND_PORT=5173
EXPOSE $FRONTEND_PORT

CMD sh -c "npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT"
