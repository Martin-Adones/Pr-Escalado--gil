import { BaseRepository } from './base-repository';
import { db } from '../database/pg-client';
import { FilaPago } from '../models/pagos.dtos';

export class PagosRepository extends BaseRepository {
  async crearPago(
    idUsers: string,
    amount: number,
    concept: string,
    idBillingCycles?: string
  ): Promise<FilaPago> {
    const query = `
      INSERT INTO "Payments" ("id_users", "id_billing_cycles", "amount", "concept", "status")
      VALUES ($1, $2, $3, $4, 'PENDIENTE')
      RETURNING "id_payments", "id_users", "id_billing_cycles", "amount", "concept", "status", "external_tx_id", "created_at", "updated_at"
    `;
    const result = await db.query(query, [idUsers, idBillingCycles || null, amount, concept]);
    return result.rows[0];
  }

  async obtenerPagoPorId(idPayments: string): Promise<FilaPago | null> {
    const query = `
      SELECT "id_payments", "id_users", "id_billing_cycles", "amount", "concept", "status", "external_tx_id", "created_at", "updated_at"
      FROM "Payments"
      WHERE "id_payments" = $1
    `;
    const result = await db.query(query, [idPayments]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async obtenerPagosPorUsuario(idUsers: string): Promise<FilaPago[]> {
    const query = `
      SELECT "id_payments", "id_users", "id_billing_cycles", "amount", "concept", "status", "external_tx_id", "created_at", "updated_at"
      FROM "Payments"
      WHERE "id_users" = $1
      ORDER BY "created_at" DESC
    `;
    const result = await db.query(query, [idUsers]);
    return result.rows;
  }

  async actualizarEstadoPago(
    idPayments: string,
    status: string,
    externalTxId: string | null
  ): Promise<FilaPago | null> {
    const query = `
      UPDATE "Payments"
      SET "status" = $2, "external_tx_id" = $3, "updated_at" = CURRENT_TIMESTAMP
      WHERE "id_payments" = $1
      RETURNING "id_payments", "id_users", "id_billing_cycles", "amount", "concept", "status", "external_tx_id", "created_at", "updated_at"
    `;
    const result = await db.query(query, [idPayments, status, externalTxId]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async obtenerContratoPorBillingCycle(idBillingCycles: string): Promise<{ id_contracts: string; amount: number } | null> {
    const query = `
      SELECT "id_contracts", "amount"
      FROM "billing_cycles"
      WHERE "id_billing_cycles" = $1
    `;
    const result = await db.query(query, [idBillingCycles]);
    if (result.rows.length === 0) return null;
    return {
      id_contracts: String(result.rows[0].id_contracts),
      amount: Number(result.rows[0].amount)
    };
  }
}
