'use strict'

const fs = require('fs')
const Asset = require('../Asset')

module.exports = {
  sync(configuration, paths) {
    const ret = []

    for (const path of paths) {
      const filePath = `${configuration.basePath}/${path}`
      const href = `${configuration.baseHref}/${path}`
      const data = fs.readFileSync(filePath)
      ret.push(new Asset(path, data, href, null))
    }

    return ret
  }
}
