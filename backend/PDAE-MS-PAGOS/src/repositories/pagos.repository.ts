import { BaseRepository } from './base-repository';
import { db } from '../database/pg-client';
import { FilaPago, FilaUserCard } from '../models/pagos.dtos';

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

  // --- Manejo de Tarjetas Guardadas ---

  async registrarTarjeta(
    idUsers: string,
    token: string,
    brand: string,
    last4: string,
    holderName: string
  ): Promise<FilaUserCard> {
    const query = `
      INSERT INTO "UserCards" ("id_users", "payment_method_token", "card_brand", "card_last4", "holder_name")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "id_user_cards", "id_users", "payment_method_token", "card_brand", "card_last4", "holder_name", "created_at"
    `;
    const result = await db.query(query, [idUsers, token, brand, last4, holderName]);
    return result.rows[0];
  }

  async obtenerTarjetasUsuario(idUsers: string): Promise<FilaUserCard[]> {
    const query = `
      SELECT "id_user_cards", "id_users", "payment_method_token", "card_brand", "card_last4", "holder_name", "created_at"
      FROM "UserCards"
      WHERE "id_users" = $1
      ORDER BY "created_at" DESC
    `;
    const result = await db.query(query, [idUsers]);
    return result.rows;
  }

  async obtenerPrimerTarjetaUsuario(idUsers: string): Promise<FilaUserCard | null> {
    const query = `
      SELECT "id_user_cards", "id_users", "payment_method_token", "card_brand", "card_last4", "holder_name", "created_at"
      FROM "UserCards"
      WHERE "id_users" = $1
      ORDER BY "created_at" DESC
      LIMIT 1
    `;
    const result = await db.query(query, [idUsers]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async eliminarTarjeta(idUsers: string, token: string): Promise<boolean> {
    const query = `
      DELETE FROM "UserCards"
      WHERE "id_users" = $1 AND "payment_method_token" = $2
    `;
    const result = await db.query(query, [idUsers, token]);
    return (result.rowCount ?? 0) > 0;
  }
}
