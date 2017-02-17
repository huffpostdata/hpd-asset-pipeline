'use strict'

function hrefToContentType(href) {
  const m = /\.(\w+)$/.exec(href)
  if (!m) throw new Error(`Expected ${href} to have a file extension. Maybe add one?`)
  const ext = m[1]

  switch (m[1]) {
    case 'css': return 'text/css; charset=utf-8'
    case 'csv': return 'text/csv; charset=utf-8'
    case 'gif': return 'image/gif'
    case 'jpg': return 'image/jpeg'
    case 'js': return 'application/javascript; charset=utf-8'
    case 'png': return 'image/png'
    case 'svg': return 'image/svg+xml'
    case 'ico': return 'image/x-icon'
    case 'tsv': return 'text/tab-separated-values; charset=utf-8'
    case 'txt': return 'text/plain; charset=utf-8'
    case 'woff': return 'application/font-woff'
    default: throw new Error(`No code handles the file extension ".${ext}". Please hack Asset.js.`)
  }
}

module.exports = class Asset {
  constructor(key, data, href, contentTypeOrNull) {
    this.key = key
    this.data = data
    this.href = href
    this.contentType = contentTypeOrNull || hrefToContentType(href)
  }
}
