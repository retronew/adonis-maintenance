import { Application } from '@adonisjs/core/app'
import maintenance from '../services/main.js'
import { type ContainerBindings } from '@adonisjs/core/types'

Application.macro('maintenance', function (this: Application<ContainerBindings>) {
  return maintenance.driver()
})
