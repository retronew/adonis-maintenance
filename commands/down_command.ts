import 'reflect-metadata'
import { inject } from '@adonisjs/core'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import { DownPayload } from '../src/types.js'

export default class DownCommand extends BaseCommand {
  static commandName = 'maintenance:down'
  static description = 'Put the application into maintenance / demo mode'

  static aliases = ['down']

  static options = {
    startApp: true,
  }

  @flags.string({
    description: 'The secret phrase that may be used to bypass maintenance mode',
    alias: 's',
  })
  declare secret: string

  @flags.number({
    description: 'The status code that should be used when returning the maintenance mode response',
    default: 503,
  })
  declare status: number

  @flags.number({
    description: 'The number of seconds after which the browser may refresh',
  })
  declare refresh?: number

  @flags.string({
    description: 'The path that users should be redirected to',
  })
  declare redirect?: string

  @flags.number({
    description: 'The number of seconds after which the request may be retried',
  })
  declare retry?: number

  @flags.string({
    description: 'The message that should be displayed to users during maintenance mode',
    alias: 'm',
  })
  declare message?: string

  @flags.array({
    description: 'The paths that should be excluded from maintenance mode (supports wildcards *)',
    alias: 'e',
  })
  declare excludedPaths?: string[]

  @inject()
  async run(): Promise<any> {
    const maintenance = this.app.maintenance()

    if (await maintenance.active()) {
      this.logger.info('Application is already in maintenance')
      return
    }

    const payload = await this.payload()
    await maintenance.activate(payload)

    this.logger.info('Application is now in maintenance mode.')

    if (payload.secret) {
      this.logger.info(
        `You may bypass maintenance mode using the secret by accessing the path '/${payload.secret}'`
      )
    }
  }

  async payload(): Promise<DownPayload> {
    return {
      secret: this.secret,
      status: this.status,
      refresh: this.refresh,
      redirect: this.redirect,
      message: this.message,
      excludedPaths: this.excludedPaths,
    }
  }
}
