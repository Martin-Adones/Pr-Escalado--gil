import dotenv from 'dotenv';
import { createServer } from './app';
import { db } from './database/pg-client';

dotenv.config();

const start = async () => {
  try {
    const server = await createServer();

    // Validar conexión con PostgreSQL
    await db.query('SELECT NOW()');

    const port = Number(process.env.PORT) || 3008;
    await server.listen({ 
      port: port,
      host: '0.0.0.0' 
    });

    console.log(`Microservicio de pagos corriendo en el puerto ${port}`);
    console.log(`Documentación: http://localhost:${port}/api-doc\n`);
    
  } catch (err) {
    console.error('Error al iniciar el microservicio de pagos:', err);
    process.exit(1);
  }
};

start();
