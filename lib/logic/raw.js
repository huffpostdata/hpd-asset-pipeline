'use strict'

const fs = require('fs')
const Asset = require('../Asset')

module.exports = {
  sync(bucket, paths) {
    const ret = []

    for (const path of paths) {
      const filePath = `${bucket.basePath}/${path}`
      const href = `${bucket.baseHref}/${path}`
      const data = fs.readFileSync(filePath)
      ret.push(new Asset(path, data, href, null))
    }

    return ret
  }
}
