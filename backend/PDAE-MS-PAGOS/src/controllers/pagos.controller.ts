import { FastifyRequest, FastifyReply } from 'fastify';
import { PagosService } from '../services/pagos.service';
import { transformAndValidate } from 'shared';
import { CrearPagoEntradaDto, UcnpayWebhookEntradaDto, RegistrarTarjetaEntradaDto } from '../models/pagos.dtos';

export class PagosController {
  private servicio: PagosService;

  constructor() {
    this.servicio = new PagosService();
  }

  // --- Endpoints de Pagos ---

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

  // --- Endpoints de Gestión de Tarjetas (UCNPAY) ---

  async manejarRegistrarTarjeta(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const datos = solicitud.body as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      if (userRole === 'client') {
        if (!userId) {
          return respuesta.status(401).send({ success: false, message: 'No autenticado' });
        }
        datos.id_users = String(userId);
      }

      const entrada = await transformAndValidate(RegistrarTarjetaEntradaDto, datos);
      const resultado = await this.servicio.registrarTarjeta(entrada);

      return respuesta.status(200).send({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('ERROR EN registrarTarjeta CONTROLLER:', error);
      if (error.message?.startsWith('Error de Validación:')) {
        return respuesta.status(400).send({ success: false, message: error.message });
      }
      return respuesta.status(500).send({ success: false, message: error.message || 'Error interno del servidor' });
    }
  }

  async manejarObtenerTarjetasUsuario(solicitud: FastifyRequest, respuesta: FastifyReply) {
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

      const tarjetas = await this.servicio.obtenerTarjetasUsuario(targetUserId);

      return respuesta.status(200).send({
        success: true,
        data: tarjetas,
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  async manejarEliminarTarjeta(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { token } = solicitud.params as any;

      // Prevención de IDOR
      const userRole = solicitud.headers?.['x-user-role'];
      const userId = solicitud.headers?.['x-user-id'];
      if (userRole === 'client' && !userId) {
        return respuesta.status(401).send({ success: false, message: 'No autenticado' });
      }

      const exitoso = await this.servicio.eliminarTarjeta(String(userId), token);

      return respuesta.status(200).send({
        success: exitoso,
        message: exitoso ? 'Tarjeta eliminada con éxito' : 'No se pudo eliminar la tarjeta',
      });
    } catch (error: any) {
      return respuesta.status(500).send({ success: false, message: 'Error interno del servidor' });
    }
  }

  // --- Webhook Pasarela UCNPAY ---

  async manejarWebhookPagos(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const datos = solicitud.body;
      const entrada = await transformAndValidate(UcnpayWebhookEntradaDto, datos as any);
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

  // --- Simulación Pasarela Externa (Checkout Page) ---

  async manejarMockCheckoutPage(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const query = solicitud.query as any;
    const paymentId = query.paymentId || '---';
    const amount = Number(query.amount || 0);
    const idUsers = query.id_users || '';
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
        <title>UCNPAY Pasarela de Pago Segura — Proyecto Pagos</title>
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
        </style>
      </head>
      <body>
        <div class="container" id="main-container">
          <div class="header">
            <h2>UCNPAY GATEWAY</h2>
            <p>Mandato de pagos periódicos (MIT)</p>
          </div>
          <div class="payment-summary">
            <p style="font-size:12px; color:#888;">Monto a pagar</p>
            <div class="amount">${formattedAmount}</div>
            <div class="concept">${concept}</div>
            <p style="font-size:11px; color:#aaa; margin-top:5px;">Orden ID: #PAG-${paymentId}</p>
          </div>
          <div class="form-container">
            <div class="form-group">
              <label>Titular de la Tarjeta</label>
              <input type="text" id="holderName" value="Juan Perez">
            </div>
            <div class="form-group">
              <label>Número de Tarjeta</label>
              <input type="text" id="cardNumber" value="1111222233334444">
            </div>
            <div class="card-details-grid">
              <div class="form-group">
                <label>Mes (MM)</label>
                <input type="text" id="expMonth" value="12">
              </div>
              <div class="form-group">
                <label>Año (AAAA)</label>
                <input type="text" id="expYear" value="2029">
              </div>
            </div>
            <div class="actions">
              <button class="btn btn-success" onclick="procesarPago(true)">
                <i class="fa-solid fa-lock"></i> REGISTRAR Y PAGAR
              </button>
              <button class="btn btn-danger" onclick="procesarPago(false)">
                <i class="fa-solid fa-times-circle"></i> RECHAZAR TRANSACCIÓN
              </button>
            </div>
          </div>
          <div class="footer">
            <i class="fa-solid fa-shield-halved"></i> Conexión Encriptada SSL de UCNPAY
          </div>
        </div>

        <script>
          async function procesarPago(approve) {
            const container = document.getElementById('main-container');
            container.innerHTML = \`
              <div style="padding: 60px 30px; text-align: center;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 48px; color: var(--primary); margin-bottom: 20px;"></i>
                <h3 style="font-weight: 800; margin-bottom: 10px;">Procesando transacción segura...</h3>
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
                  approve: approve,
                  id_users: '${idUsers}',
                  titular: document.getElementById('holderName')?.value || 'Juan Perez',
                  tarjeta: {
                    numero: document.getElementById('cardNumber')?.value || '1111222233334444',
                    exp_mes: document.getElementById('expMonth')?.value || '12',
                    exp_ano: document.getElementById('expYear')?.value || '2029',
                    cvc: '123'
                  }
                })
              });
              const data = await res.json();
              
              if (data.success) {
                container.innerHTML = \`
                  <div style="padding: 60px 30px; text-align: center; animation: fadeIn 0.5s ease-out;">
                    <i class="fa-solid \${approve ? 'fa-circle-check' : 'fa-circle-xmark'}" style="font-size: 64px; color: \${approve ? 'var(--success)' : 'var(--danger)'}; margin-bottom: 20px;"></i>
                    <h3 style="font-weight: 800; margin-bottom: 10px;">\${approve ? '¡Tarjeta Guardada y Pago Aprobado!' : 'Pago Cancelado'}</h3>
                    <p style="font-size: 14px; color: #555; margin-bottom: 30px;">
                      \${approve ? 'Tu tarjeta ha sido tokenizada en UCNPAY y se ha activado tu suscripción periódica.' : 'La transacción fue rechazada voluntariamente.'}
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
                  <h3 style="font-weight: 800; margin-bottom: 10px;">Error al Procesar</h3>
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

  async manejarMockProcesar(solicitud: FastifyRequest, respuesta: FastifyReply) {
    try {
      const { id_payments, approve, id_users, tarjeta, titular } = solicitud.body as any;

      if (!id_payments) {
        return respuesta.status(400).send({ success: false, message: 'Falta el id_payments' });
      }

      const pago = await this.servicio.obtenerPagoPorId(id_payments);
      if (!pago) {
        return respuesta.status(404).send({ success: false, message: 'Pago no encontrado' });
      }

      let webhookPayload: UcnpayWebhookEntradaDto;

      if (approve) {
        // Registrar la tarjeta en UCNPAY a través de nuestro servicio (esto simula la pasarela llamando al init/suscription)
        const tarjetaRegistrada = await this.servicio.registrarTarjeta({
          id_users: id_users || pago.id_users,
          titular: titular || 'Cliente Demo UCNPAY',
          tarjeta: {
            numero: tarjeta?.numero || '1111222233334444',
            exp_mes: tarjeta?.exp_mes || '12',
            exp_ano: tarjeta?.exp_ano || '2029',
            cvc: tarjeta?.cvc || '123'
          }
        });

        // Crear la estructura de webhook que enviaría UCNPAY
        webhookPayload = {
          event: 'transaction.approved',
          transactionId: `trx_approved_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          idOrden: `PAG-${id_payments}`,
          status: 'APROBADO',
          monto: Number(pago.amount),
          paymentMethodToken: tarjetaRegistrada.payment_method_token,
          mandateId: `mandate_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          card: {
            brand: tarjetaRegistrada.card_brand,
            last4: tarjetaRegistrada.card_last4,
            expMonth: 12,
            expYear: 2029
          }
        };
      } else {
        webhookPayload = {
          event: 'transaction.rejected',
          transactionId: `trx_rejected_${Date.now()}`,
          idOrden: `PAG-${id_payments}`,
          status: 'RECHAZADO',
          monto: Number(pago.amount),
          reason: 'Transacción rechazada por el usuario'
        };
      }

      // Invocar webhook local asíncronamente
      const port = process.env.PORT || '3008';
      console.log(`[MockProveedor] Invocando webhook en: http://localhost:${port}/api/pagos/webhook`);
      
      fetch(`http://localhost:${port}/api/pagos/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      }).catch(err => {
        console.error('[MockProveedor] Error al invocar webhook de pagos:', err);
      });

      return respuesta.status(200).send({
        success: true,
        message: 'Webhook gatillado correctamente',
      });
    } catch (error: any) {
      console.error('Error en mock-procesar:', error);
      return respuesta.status(500).send({ success: false, message: error.message || 'Error interno del servidor' });
    }
  }
}
