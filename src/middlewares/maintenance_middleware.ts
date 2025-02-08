import { HttpContext, Request, Response } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import { NextFn } from '@adonisjs/core/types/http'
import { DownPayload } from '../types.js'

export default class MaintenanceMiddleware {
  protected cookie = app.config.get<string>('maintenance.cookieName', 'adonis_maintenance')

  async handle({ request, response }: HttpContext, next: NextFn) {
    const maintenance = app.maintenance()

    if (!(await maintenance.active())) return next()

    const data = await maintenance.data()

    if (
      data.excludedPaths?.some((path) => {
        const pattern = path.replace(/\*/g, '.*')
        const regex = new RegExp(`^${pattern}$`)
        return regex.test(request.url())
      })
    ) {
      return next()
    }

    const secret = request.input('secret') || request.header('X-Maintenance-Secret')

    if (data.secret && secret === data.secret) {
      return this.bypassResponse(response, data.secret)
    }

    if (data.secret && (await this.hasValidBypassCookie(request, data.secret))) {
      return next()
    }

    if (data.redirect) {
      return response.redirect().toPath(data.redirect)
    }

    return this.withHeaders(response, data)
      .status(data.status)
      .send(data.message ?? 'Service Unavailable')
  }

  protected async bypassResponse(response: Response, secret: string) {
    return response
      .cookie(this.cookie, await hash.make(secret))
      .redirect()
      .toPath('/')
  }

  protected async hasValidBypassCookie(request: Request, secret: string) {
    const cookie = request.cookie(this.cookie)
    if (!cookie) return false
    return hash.verify(cookie, secret)
  }

  protected withHeaders(response: Response, data: DownPayload) {
    if (data.retry) {
      response.header('Retry-After', data.retry)
    }

    if (data.refresh) {
      response.header('Refresh', data.refresh)
    }

    return response
  }
}
