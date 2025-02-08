import app from '@adonisjs/core/services/app'
import { MaintenanceDriver } from './maintenance_driver.js'
import { rm, writeFile, stat, readFile, mkdir } from 'node:fs/promises'
import { DownPayload } from '../types.js'
import { dirname } from 'node:path'

export class FileMaintenanceDriver implements MaintenanceDriver {
  #path(): string {
    return app.tmpPath('down.lock')
  }

  public async activate(data: DownPayload): Promise<void> {
    const path = this.#path()

    // create the directory if it doesn't exist
    await mkdir(dirname(path), { recursive: true })

    await writeFile(path, JSON.stringify(data))
  }

  public async deactivate(): Promise<void> {
    await rm(this.#path())
  }

  public async active(): Promise<boolean> {
    try {
      await stat(this.#path())
      return true
    } catch {
      return false
    }
  }

  public async data(): Promise<DownPayload> {
    const content = await readFile(this.#path())
    return JSON.parse(content.toString())
  }
}
