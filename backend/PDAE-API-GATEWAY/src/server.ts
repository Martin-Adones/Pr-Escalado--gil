/**
 * Punto de entrada del API Gateway.
 * Centraliza las peticiones y las enruta a los microservicios correspondientes.
 */
import dotenv from 'dotenv';
import { createServer } from './app';

dotenv.config();

const start = async () => {
  try {
    const server = await createServer();

    const port = Number(process.env.PORT) || 3001;
    
    await server.listen({ 
      port: port,
      host: '0.0.0.0' 
    });

    console.log(`\n======================================================`);
    console.log(`🚀 PDAE API GATEWAY está corriendo en el puerto ${port}`);
    console.log(`🔗 URL Base: http://localhost:${port}`);
    console.log(`📝 Documentación Unificada: http://localhost:${port}/api-doc`);
    console.log(`======================================================\n`);
    
  } catch (err) {
    console.error('❌ Error al iniciar el API Gateway:', err);
    process.exit(1);
  }
};

start();
