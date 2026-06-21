/**
 * Cliente HTTP hacia la API de analítica (Grupo 9).
 * Todos los envíos son fire-and-forget: los errores se logean pero nunca
 * bloquean ni propagan la excepción al flujo principal.
 *
 * Documentación de eventos soportados:
 *   POST https://analisis-proyecto-ti.onrender.com/v1/events
 */

const ANALYTICS_URL = 'https://analisis-proyecto-ti.onrender.com/v1/events';
const SOURCE = 'subscriptions';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface SubscriptionCreatedPayload {
  contract_id: string;
  user_id: number;
  plan_id: number;
  start_date?: string | null;
  status?: string | null;
  renewed?: boolean | null;
  auto_service?: boolean | null;
  billing_success?: boolean | null;
  end_date?: string | null;
}

interface RenewalSuccessPayload {
  contract_id: string;
  user_id: number;
  plan_id: number;
}

interface RenewalFailedPayload {
  contract_id: string;
  user_id: number;
  plan_id: number;
}

type AnalyticsEvent =
  | { source: typeof SOURCE; event_type: 'subscription_created'; payload: SubscriptionCreatedPayload }
  | { source: typeof SOURCE; event_type: 'renewal_success'; payload: RenewalSuccessPayload }
  | { source: typeof SOURCE; event_type: 'renewal_failed'; payload: RenewalFailedPayload };

// ─── Envío interno ───────────────────────────────────────────────────────────

async function enviarEvento(evento: AnalyticsEvent): Promise<void> {
  try {
    const respuesta = await fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evento),
    });

    if (!respuesta.ok) {
      const texto = await respuesta.text().catch(() => '');
      console.warn(
        `[analytics] Evento "${evento.event_type}" rechazado con HTTP ${respuesta.status}: ${texto}`
      );
    }
  } catch (err) {
    console.error(`[analytics] Error al enviar evento "${evento.event_type}":`, err);
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Notifica a analítica que se creó una nueva suscripción/contrato.
 *
 * Campos obligatorios: contract_id, user_id, plan_id
 */
export function notificarSubscriptionCreated(payload: SubscriptionCreatedPayload): void {
  enviarEvento({ source: SOURCE, event_type: 'subscription_created', payload });
}

/**
 * Notifica a analítica que una renovación fue exitosa.
 *
 * Campos obligatorios: contract_id, user_id, plan_id
 */
export function notificarRenewalSuccess(payload: RenewalSuccessPayload): void {
  enviarEvento({ source: SOURCE, event_type: 'renewal_success', payload });
}

export function notificarRenewalFailed(payload: RenewalFailedPayload): void {
  enviarEvento({ source: SOURCE, event_type: 'renewal_failed', payload });
}
