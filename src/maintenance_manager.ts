import { RuntimeException } from '@adonisjs/core/exceptions'
import { ManagerModeFactory as ManagerDriverFactory } from './types.js'

export class MaintenanceManager<KnownDrivers extends Record<string, ManagerDriverFactory>> {
  constructor(public config: { default?: keyof KnownDrivers; drivers: KnownDrivers }) {}

  driver<DriverName extends keyof KnownDrivers>(driver?: DriverName) {
    const driverToUse = (driver || this.config.default) as keyof KnownDrivers
    if (!driverToUse) throw new RuntimeException('No search engine selected')

    /**
     * Otherwise create a new instance and cache it
     */
    return this.config.drivers[driverToUse]() as ReturnType<KnownDrivers[DriverName]>
  }
}
