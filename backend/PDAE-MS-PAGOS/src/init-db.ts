import fs from 'fs';
import path from 'path';
import { db } from './database/pg-client';

async function run() {
  try {
    console.log('[InitDB] Leyendo consolidado.sql...');
    const sqlPath = path.join(__dirname, 'database/consolidado.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('[InitDB] Conectando y ejecutando SQL...');
    await db.query(sql);
    
    console.log('[InitDB] ¡Base de datos inicializada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('[InitDB] Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

run();
