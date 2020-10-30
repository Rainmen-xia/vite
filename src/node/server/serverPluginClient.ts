import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { ServerPlugin } from '.'
import { defaultDefines } from '../config'

export const clientFilePath = path.resolve(__dirname, '../../client/client.js')

export const clientPublicPath = `/vite/client`

const legacyPublicPath = '/vite/hmr'

export const clientPlugin: ServerPlugin = ({ app, config }) => {
  const clientCode = fs
    .readFileSync(clientFilePath, 'utf-8')
    .replace(`__MODE__`, JSON.stringify(config.mode || 'development'))
    .replace(
      `__DEFINES__`,
      JSON.stringify({
        ...defaultDefines,
        ...config.define
      })
    )

  app.use(async (ctx, next) => {
    if (ctx.path === clientPublicPath) {
      //console.log('clienthmr',ctx);
      //ctx.request.header.referer解析 preview路径，之后注入到client上。
      const arr = ctx.request.header.referer.match(
        /projects\/(.*)\/index\.html/
      )
      //console.log(ctx.request.header.referer);
      //console.log(arr);
      const projectName = arr.length > 1 ? arr[1] : ''
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = clientCode
        .replace(`__PORT__`, ctx.port.toString())
        .replace(`__PROJECT_NAME__`, projectName)
    } else {
      if (ctx.path === legacyPublicPath) {
        console.error(
          chalk.red(
            `[vite] client import path has changed from "/vite/hmr" to "/vite/client". ` +
              `please update your code accordingly.`
          )
        )
      }
      return next()
    }
  })
}
