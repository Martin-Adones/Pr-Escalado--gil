/**
 * Punto de entrada del microservicio de usuarios.
 * Procedimientos en `database/usuarios/usuarios_funciones.sql` (sp_crear_usuario, sp_listar_usuarios, sp_actualizar_usuario).
 */
import dotenv from 'dotenv';
import { createServer } from './app';
import { db } from './database/pg-client';

dotenv.config();

const start = async () => {
  try {
    const server = await createServer();

    await db.query('SELECT NOW()');

    const port = Number(process.env.PORT) || 3003;
    await server.listen({ 
      port: port,
      host: '0.0.0.0' 
    });

    console.log(`✅ Microservicio corriendo en el puerto ${port}`);
    console.log(`📝 Documentación: http://localhost:${port}/api-doc\n`);
    
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
