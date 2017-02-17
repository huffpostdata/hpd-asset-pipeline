'use strict'

const fs = require('fs')
const util = require('./util')
const Asset = require('../Asset')

module.exports = {
  sync(configuration, paths) {
    const ret = []

    for (const path of paths) {
      const filePath = `${configuration.basePath}/${path}`
      const data = fs.readFileSync(filePath)
      const href = util.digestifyHref(`${configuration.baseHref}/${path}`, data)
      ret.push(new Asset(path, data, href, null))
    }

    return ret
  }
}
