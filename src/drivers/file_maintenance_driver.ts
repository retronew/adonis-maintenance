import app from '@adonisjs/core/services/app'
import { MaintenanceDriver } from './maintenance_driver.js'
import { rm, writeFile, stat, readFile, mkdir } from 'node:fs/promises'
import { DownPayload } from '../types.js'

export class FileMaintenanceDriver implements MaintenanceDriver {
  public async activate(data: DownPayload): Promise<void> {
    const path = this.#path()
    const dir = path.split('/').slice(0, -1).join('/')
    await stat(dir).catch(async () => {
      await mkdir(dir, { recursive: true })
    })
    await writeFile(path, JSON.stringify(data))
  }

  public async deactivate(): Promise<void> {
    await rm(this.#path())
  }

  public async active(): Promise<boolean> {
    return stat(this.#path())
      .then(() => true)
      .catch(() => false)
  }

  public async data(): Promise<DownPayload> {
    return readFile(this.#path()).then((r) => JSON.parse(r.toString()))
  }

  #path(): string {
    return app.tmpPath('down.lock')
  }
}
