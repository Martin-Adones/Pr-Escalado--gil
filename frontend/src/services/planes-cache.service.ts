import { listarPlanes } from './planes.service'
import type { FilaPlanListado } from './interfaces'

/**
 * Servicio de caché en memoria para planes
 * Reduce llamadas repetidas al backend durante la sesión
 */
class PlanesCacheService {
  private cache = new Map<string, FilaPlanListado>()
  private pendingRequests = new Map<string, Promise<FilaPlanListado>>()

  /**
   * Obtiene un plan por ID, usando caché cuando está disponible
   */
  async obtenerPlan(idPlan: string): Promise<FilaPlanListado | undefined> {
    // Si ya está en caché, retornarlo inmediatamente
    if (this.cache.has(idPlan)) {
      return this.cache.get(idPlan)
    }

    // Si ya hay una request pendiente para este ID, esperar a esa
    if (this.pendingRequests.has(idPlan)) {
      return this.pendingRequests.get(idPlan)
    }

    // Hacer la request y cachear el resultado
    const request = listarPlanes({ id_plans: idPlan }).then((planes) => {
      const plan = planes[0]
      if (plan) {
        this.cache.set(idPlan, plan)
      }
      this.pendingRequests.delete(idPlan)
      return plan
    })

    this.pendingRequests.set(idPlan, request)
    return request
  }

  /**
   * Obtiene múltiples planes en paralelo, reutilizando el caché
   */
  async obtenerPlanes(idPlanes: string[]): Promise<Map<string, { name: string; amount: number }>> {
    const planIds = Array.from(new Set(idPlanes)) // Eliminar duplicados
    const promises = planIds.map((id) => this.obtenerPlan(id))
    const planes = await Promise.all(promises)

    const planesMap = new Map<string, { name: string; amount: number }>()
    planes.forEach((plan) => {
      if (plan) {
        const amount = Number(plan.amount || 0)
        planesMap.set(plan.id_plans, {
          name: plan.name,
          amount: Number.isNaN(amount) ? 0 : amount,
        })
      }
    })

    return planesMap
  }

  /**
   * Limpia el caché (útil para tests o cuando se necesita refrescar)
   */
  limpiar(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Invalida un plan específico del caché
   */
  invalidarPlan(idPlan: string): void {
    this.cache.delete(idPlan)
  }
}

export const planesCacheService = new PlanesCacheService()
