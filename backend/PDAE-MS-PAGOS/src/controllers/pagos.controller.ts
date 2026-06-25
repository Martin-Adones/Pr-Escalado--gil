import { FastifyRequest, FastifyReply } from 'fastify';
import { PagosService } from '../services/pagos.service';
import { transformAndValidate } from 'shared';
import { CrearPagoEntradaDto, WebhookProveedorEntradaDto } from '../models/pagos.dtos';

export class PagosController {
  private servicio: PagosService;

  constructor() {
    this.servicio = new PagosService();
  }

  async manejarCrearPago(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const datos = (solicitud.method === 'GET' ? solicitud.query : solicitud.body) as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      if (userRole === 'client') {
        if (!userId) {
          return respuesta.status(401).send({ success: false, message: 'No autenticado' });
        }
        datos.id_users = String(userId);
      }

      const entrada = await transformAndValidate(CrearPagoEntradaDto, datos);
      const resultado = await this.servicio.crearPago(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN crearPago CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({ success: false, message: error.message });
      }
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  async manejarObtenerPagoPorId(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { id_payments } = solicitud.params as any;
      const pago = await this.servicio.obtenerPagoPorId(id_payments);

      if (!pago) {
        return respuesta.status(404).send({ success: false, message: 'Pago no encontrado' });
      }

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      if (userRole === 'client' && String(pago.id_users) !== String(userId)) {
        return respuesta.status(403).send({ success: false, message: 'Acceso no autorizado a este registro de pago' });
      }

      return respuesta.status(200).send({
        success: true,
        data: pago,
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  async manejarObtenerPagosPorUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { id_users } = solicitud.params as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      let targetUserId = id_users;
      if (userRole === 'client') {
        if (!userId) {
          return respuesta.status(401).send({ success: false, message: 'No autenticado' });
        }
        targetUserId = String(userId);
      }

      const pagos = await this.servicio.obtenerPagosPorUsuario(targetUserId);

      return respuesta.status(200).send({
        success: true,
        data: pagos,
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  async manejarWebhookPagos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const datos = solicitud.body;
      const entrada = await transformAndValidate(WebhookProveedorEntradaDto, datos as any);
      const resultado = await this.servicio.procesarPagoWebhook(entrada);

      return respuesta.status(200).send({
        success: true,
        message: 'Webhook procesado con éxito',
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN webhookProveedor CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({ success: false, message: error.message });
      }
      return respuesta.status(500).send({ success: false, message: 'Error interno al procesar el webhook' });
    }
  }

  /**
   * Sirve la página HTML de la pasarela de pagos simulada del equipo externo ("pagos").
   */
  async manejarMockCheckoutPage(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const query = solicitud.query as any;
    const paymentId = query.paymentId || '---';
    const amount = Number(query.amount || 0);
    const concept = query.concept ? decodeURIComponent(query.concept) : 'Pago de servicio';

    const formattedAmount = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pasarela de Pago Segura — Proyecto Pagos</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          :root {
            --bg-color: #f4f7f6;
            --card-bg: #ffffff;
            --primary: #284b63;
            --primary-hover: #3c6e71;
            --success: #2ec4b6;
            --danger: #e63946;
            --text-color: #353535;
            --border-color: #d9d9d9;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            width: 100%;
            max-width: 480px;
            background: var(--card-bg);
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            overflow: hidden;
            border: 1px solid var(--border-color);
            animation: fadeIn 0.5s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .header {
            background: linear-gradient(135deg, var(--primary), var(--primary-hover));
            color: #ffffff;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .header h2 {
            font-weight: 800;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 14px;
            opacity: 0.8;
          }
          .payment-summary {
            padding: 25px 30px;
            background-color: #f8fafd;
            border-bottom: 1px solid var(--border-color);
            text-align: center;
          }
          .amount {
            font-size: 36px;
            font-weight: 800;
            color: var(--primary);
            margin: 10px 0;
          }
          .concept {
            font-weight: 600;
            color: #555555;
            font-size: 15px;
          }
          .form-container {
            padding: 30px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #777;
            margin-bottom: 8px;
          }
          input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            font-family: inherit;
            color: var(--text-color);
            background-color: #fafafa;
            transition: all 0.3s;
          }
          input:focus {
            outline: none;
            border-color: var(--primary-hover);
            background-color: #fff;
            box-shadow: 0 0 0 3px rgba(60,110,113,0.15);
          }
          .card-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 30px;
          }
          .btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
          }
          .btn-success {
            background-color: var(--success);
            color: white;
            box-shadow: 0 6px 20px rgba(46,196,182,0.3);
          }
          .btn-success:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }
          .btn-danger {
            background-color: transparent;
            color: var(--danger);
            border: 2px solid var(--danger);
          }
          .btn-danger:hover {
            background-color: rgba(230,57,70,0.05);
            transform: translateY(-1px);
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888;
            border-top: 1px solid var(--border-color);
          }
          .success-screen {
            display: none;
            padding: 40px 30px;
            text-align: center;
          }
          .success-screen i {
            font-size: 64px;
            color: var(--success);
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container" id="main-container">
          <div class="header">
            <h2>PROYECTO PAGOS</h2>
            <p>Pasarela externa de pago simulada</p>
          </div>
          <div class="payment-summary">
            <p style="font-size:12px; color:#888;">Monto a pagar</p>
            <div class="amount">${formattedAmount}</div>
            <div class="concept">${concept}</div>
            <p style="font-size:11px; color:#aaa; margin-top:5px;">ID Transacción: #${paymentId}</p>
          </div>
          <div class="form-container">
            <div class="form-group">
              <label>Número de Tarjeta</label>
              <input type="text" value="4575 •••• •••• 9812" readonly>
            </div>
            <div class="card-details-grid">
              <div class="form-group">
                <label>Vencimiento</label>
                <input type="text" value="12/29" readonly>
              </div>
              <div class="form-group">
                <label>CVV</label>
                <input type="text" value="•••" readonly>
              </div>
            </div>
            <div class="actions">
              <button class="btn btn-success" onclick="procesarPago('APROBADO')">
                <i class="fa-solid fa-lock"></i> APROBAR Y PAGAR
              </button>
              <button class="btn btn-danger" onclick="procesarPago('RECHAZADO')">
                <i class="fa-solid fa-times-circle"></i> RECHAZAR PAGO
              </button>
            </div>
          </div>
          <div class="footer">
            <i class="fa-solid fa-shield-halved"></i> Conexión Encriptada SSL de Prueba
          </div>
        </div>

        <script>
          async function procesarPago(status) {
            const container = document.getElementById('main-container');
            container.innerHTML = \`
              <div style="padding: 60px 30px; text-align: center;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 48px; color: var(--primary); margin-bottom: 20px;"></i>
                <h3 style="font-weight: 800; margin-bottom: 10px;">Procesando transacción...</h3>
                <p style="font-size: 14px; color: #888;">Por favor, no cierres esta ventana.</p>
              </div>
            \`;

            try {
              const res = await fetch('/api/pagos/mock-externo/procesar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  id_payments: '${paymentId}',
                  approve: status === 'APROBADO'
                })
              });
              const data = await res.json();
              
              if (data.success) {
                container.innerHTML = \`
                  <div style="padding: 60px 30px; text-align: center; animation: fadeIn 0.5s ease-out;">
                    <i class="fa-solid \${status === 'APROBADO' ? 'fa-circle-check' : 'fa-circle-xmark'}" style="font-size: 64px; color: \${status === 'APROBADO' ? 'var(--success)' : 'var(--danger)'}; margin-bottom: 20px;"></i>
                    <h3 style="font-weight: 800; margin-bottom: 10px;">\${status === 'APROBADO' ? '¡Pago Aprobado!' : 'Pago Rechazado'}</h3>
                    <p style="font-size: 14px; color: #555; margin-bottom: 30px;">
                      \${status === 'APROBADO' ? 'El pago se ha procesado con éxito y se ha notificado a tu sistema.' : 'La transacción fue rechazada por la pasarela de pagos.'}
                    </p>
                    <button class="btn btn-success" style="background-color: var(--primary);" onclick="window.close()">Cerrar Ventana</button>
                  </div>
                \`;
              } else {
                throw new Error(data.message || 'Error desconocido');
              }
            } catch (err) {
              container.innerHTML = \`
                <div style="padding: 60px 30px; text-align: center; animation: fadeIn 0.5s ease-out;">
                  <i class="fa-solid fa-circle-exclamation" style="font-size: 64px; color: var(--danger); margin-bottom: 20px;"></i>
                  <h3 style="font-weight: 800; margin-bottom: 10px;">Error del Servidor</h3>
                  <p style="font-size: 14px; color: #555; margin-bottom: 30px;">\${err.message}</p>
                  <button class="btn btn-success" style="background-color: var(--primary);" onclick="location.reload()">Reintentar</button>
                </div>
              \`;
            }
          }
        </script>
      </body>
      </html>
    `;

    respuesta.type('text/html').send(html);
  }

  /**
   * Procesa el resultado de la pasarela simulada, gatillando el webhook asíncrono.
   */
  async manejarMockProcesar(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { id_payments, approve } = solicitud.body as any;

      if (!id_payments) {
        return respuesta.status(400).send({ success: false, message: 'Falta el id_payments' });
      }

      // Simular que el proveedor de pagos notifica a nuestro webhook de forma asíncrona
      const webhookPayload = {
        external_tx_id: `ext_tx_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        status: approve ? 'APROBADO' : 'RECHAZADO',
        id_payments: String(id_payments)
      };

      // Disparar la llamada al webhook local asíncronamente
      const port = process.env.PORT || '3008';
      console.log(`[MockProveedor] Llamando a webhook local en: http://localhost:${port}/api/pagos/webhook`);
      
      // Ejecutar fetch asíncronamente (sin bloquear la respuesta de la interfaz)
      fetch(`http://localhost:${port}/api/pagos/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      }).catch(err => {
        console.error('[MockProveedor] Error en llamada asíncrona al webhook de pagos:', err);
      });

      return respuesta.status(200).send({
        success: true,
        message: 'Procesamiento en pasarela simulado. Se ha gatillado el webhook asíncrono.',
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }
}
