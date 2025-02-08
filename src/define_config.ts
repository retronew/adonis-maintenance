import { configProvider } from '@adonisjs/core'
import { ConfigProvider } from '@adonisjs/core/types'
import { InvalidArgumentsException } from '@adonisjs/core/exceptions'
import { ManagerModeFactory } from './types.js'
import type { FileMaintenanceDriver } from './drivers/file_maintenance_driver.js'

type ResolvedConfig<
  KnownDrivers extends Record<string, ManagerModeFactory | ConfigProvider<ManagerModeFactory>>,
> = {
  default?: keyof KnownDrivers
  cookieName?: string
  drivers: {
    [K in keyof KnownDrivers]: KnownDrivers[K] extends ConfigProvider<infer A> ? A : KnownDrivers[K]
  }
}

export function defineConfig<
  KnownDrivers extends Record<string, ManagerModeFactory | ConfigProvider<ManagerModeFactory>>,
>(config: {
  default?: keyof KnownDrivers
  cookieName?: string
  drivers: KnownDrivers
}): ConfigProvider<ResolvedConfig<KnownDrivers>> {
  if (!config.drivers) {
    throw new InvalidArgumentsException('Missing "drivers" property in maintenance config')
  }

  if (config.default && !config.drivers[config.default]) {
    throw new InvalidArgumentsException(
      `Missing "drivers.${String(config.default)} in maintenance config. It is referenced by the "default" property`
    )
  }

  return configProvider.create<ResolvedConfig<KnownDrivers>>(async (app) => {
    const driversList = Object.keys(config.drivers)
    const drivers = {} as Record<string, ManagerModeFactory | ConfigProvider<ManagerModeFactory>>

    for (const driverName of driversList) {
      const driver = config.drivers[driverName]
      if (typeof driver === 'function') {
        drivers[driverName] = driver
      } else {
        drivers[driverName] = await driver.resolver(app)
      }
    }

    return {
      default: config.default,
      cookieName: config.cookieName,
      drivers: drivers as ResolvedConfig<KnownDrivers>['drivers'],
    }
  })
}

export const drivers: {
  file: () => ConfigProvider<() => FileMaintenanceDriver>
} = {
  file: () => {
    return configProvider.create(async () => {
      const { FileMaintenanceDriver } = await import('./drivers/file_maintenance_driver.js')
      return () => new FileMaintenanceDriver()
    })
  },
}
