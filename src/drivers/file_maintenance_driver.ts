import app from '@adonisjs/core/services/app'
import { MaintenanceDriver } from './maintenance_driver.js'
import { rm, writeFile, stat, readFile, mkdir } from 'node:fs/promises'
import { DownPayload } from '../types.js'
import { dirname } from 'node:path'

interface Cache {
  active: boolean | null
  data: DownPayload | null
  lastCheck: number
}

export class FileMaintenanceDriver implements MaintenanceDriver {
  #cache: Cache = {
    active: null,
    data: null,
    lastCheck: 0,
  }

  readonly #cacheTTL = 1000 * 60 * 10 // 10 minutes (milliseconds)

  #path(): string {
    return app.tmpPath('down.lock')
  }

  #updateCache(updates: Partial<Cache>): void {
    Object.assign(this.#cache, {
      ...updates,
      lastCheck: Date.now(),
    })
  }

  #isCacheValid(): boolean {
    return Date.now() - this.#cache.lastCheck < this.#cacheTTL
  }

  public async activate(data: DownPayload): Promise<void> {
    const path = this.#path()

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(data))

    this.#updateCache({
      active: true,
      data,
    })
  }

  public async deactivate(): Promise<void> {
    await rm(this.#path())

    this.#updateCache({
      active: false,
      data: null,
    })
  }

  public async active(): Promise<boolean> {
    if (this.#cache.active !== null && this.#isCacheValid()) {
      return this.#cache.active
    }

    try {
      await stat(this.#path())
      this.#updateCache({ active: true })
      return true
    } catch {
      this.#updateCache({ active: false })
      return false
    }
  }

  public async data(): Promise<DownPayload> {
    if (this.#cache.data && this.#isCacheValid()) {
      return this.#cache.data
    }

    const content = await readFile(this.#path())
    const data = JSON.parse(content.toString()) as DownPayload

    this.#updateCache({ data })
    return data
  }
}
