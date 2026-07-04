const NOTIFICATIONS_URL = 'https://ucn-agil-notificaciones.up.railway.app/notifications/send';
const API_KEY = '8PtUwQxMoK3hVbR6cSjYnE1fDzA9GiL5';

interface EmailPayload {
  email: string;
  subject: string;
  htmlBody: string;
}

interface SmsPayload {
  telefono: string;
  smsBody: string;
}

interface EmailConFallbackSmsPayload {
  email: string;
  telefono: string;
  subject: string;
  htmlBody: string;
  smsBody: string;
}

type NotificacionPayload = EmailPayload | SmsPayload | EmailConFallbackSmsPayload;

async function enviarNotificacion(payload: NotificacionPayload): Promise<void> {
  let body: Record<string, unknown>;

  if ('telefono' in payload && 'subject' in payload) {
    body = {
      channel: 'email',
      recipient: { email: payload.email, telefono: payload.telefono },
      subject: payload.subject,
      body: { email: payload.htmlBody, sms: payload.smsBody },
    };
  } else if ('telefono' in payload) {
    body = {
      channel: 'sms',
      recipient: { telefono: payload.telefono },
      body: { sms: payload.smsBody },
    };
  } else {
    body = {
      channel: 'email',
      recipient: { email: payload.email },
      subject: payload.subject,
      body: { email: payload.htmlBody },
    };
  }

  try {
    const respuesta = await fetch(NOTIFICATIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!respuesta.ok) {
      const texto = await respuesta.text().catch(() => '');
      console.warn(
        `[notifications] Notificación rechazada HTTP ${respuesta.status}: ${texto}`
      );
    }
  } catch (err) {
    console.error('[notifications] Error al enviar notificación:', err);
  }
}

export function notificarEmail(payload: EmailPayload): void {
  enviarNotificacion(payload);
}

export function notificarSms(payload: SmsPayload): void {
  enviarNotificacion(payload);
}

export function notificarEmailConFallbackSms(payload: EmailConFallbackSmsPayload): void {
  enviarNotificacion(payload);
}
