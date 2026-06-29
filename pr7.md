# Integración Suscripciones → CRM

**Dominio:** Suscripciones (P10)
**Versión:** `v1.0`
**Fecha:** 24 de junio de 2026

---

## Endpoint

```
POST https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo
```

### Headers

```
Content-Type: application/json
x-api-key: suscripciones_secret_p10
```

---

## Crear ticket

### Payload

```json
{
  "asunto": "Cobro de suscripción fallido",
  "descripcion": "3 intentos de cobro rechazados por el banco",
  "prioridad": "alta",
  "sistema_origen": "suscripciones",
  "sistema_id": "P10",
  "cliente_id": 12345,
  "suscripcion_id_ref": "SUB-8812"
}
```

### Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `asunto` | `string` | Sí | Motivo del ticket. |
| `descripcion` | `string` | No | Detalle. Se concatena al asunto. |
| `prioridad` | `string` | Sí | `"baja"`, `"media"`, `"alta"`, `"critica"`. |
| `sistema_origen` | `string` | Sí | Siempre `"suscripciones"`. |
| `sistema_id` | `string` | Sí | Siempre `"P10"`. |
| `cliente_id` | `number` | No | ID del cliente. |
| `suscripcion_id_ref` | `string` | No | ID de la suscripción. |
| `pedido_id_ref` | `string` | No | ID del pedido (si aplica). |
| `contexto` | `string` | No | Info adicional libre. |

### Respuesta (201)

```json
{
  "ok": true,
  "ticket": {
    "id": "5be148c6-5091-4a44-922d-82996a194983",
    "asunto": "Cobro de suscripción fallido - 3 intentos de cobro rechazados por el banco",
    "estado": "abierto",
    "prioridad": "alta",
    "canal": "email",
    "cliente_id": 12345,
    "agente_id": null,
    "fecha_vencimiento_sla": "2026-06-24T21:33:57.706Z",
    "pedido_id_ref": null,
    "suscripcion_id_ref": "SUB-8812",
    "creado_en": "2026-06-24T01:33:57.383Z",
    "actualizado_en": "2026-06-24T01:33:57.383Z"
  }
}
```

---

## Ejemplo en código

```javascript
const response = await fetch("https://pgti-proyecto-crm-backend.vercel.app/api/v1/tickets/externo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "suscripciones_secret_p10"
  },
  body: JSON.stringify({
    asunto: "Suscripción vencida",
    descripcion: "Cobro fallido 3 veces seguidas",
    prioridad: "critica",
    sistema_origen: "suscripciones",
    sistema_id: "P10",
    cliente_id: 4589,
    suscripcion_id_ref: "SUB-8812"
  })
});

const data = await response.json();
// { ok: true, ticket: { ... } }
```