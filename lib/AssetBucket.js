const StaticEndpoint = require('in-memory-website').StaticEndpoint
const StaticWebsite = require('in-memory-website').StaticWebsite

function assetToEndpoint(asset) {
  return new StaticEndpoint(asset.href, {
    'Content-Type': asset.contentType,
    'Cache-Control': 'public; max-age=31536000'
  }, asset.data)
}

class AssetBucket {
  constructor(configuration, assets) {
    if (!configuration.host) throw new Error('Missing `host` option')
    if (!configuration.basePath) throw new Error('Missing `basePath` option')
    this.host = configuration.host
    this.baseHref = configuration.baseHref || ''
    this.basePath = configuration.basePath

    this.assets = assets
    const index = this.index = {}
    for (const asset of assets) {
      index[asset.key] = asset
    }
  }

  _checkKey(key) {
    if (!this.index.hasOwnProperty(key)) {
      throw new Error(`AssetBucket does not contain key ${key}. Valid keys are: ${this.assets.map(a => a.key).sort().join(' ')}`)
    }
  }

  hrefTo(key) {
    this._checkKey(key)
    return this.index[key].href
  }

  urlTo(key) {
    return this.host + this.hrefTo(key)
  }

  dataFor(key) {
    this._checkKey(key)
    return this.index[key].data
  }

  dataUriFor(key) {
    this._checkKey(key)
    const asset = this.index[key]
    const data = asset.data
    const contentType = asset.contentType
    return `data:${contentType};base64,${data.toString('base64')}`
  }

  toWebsite() {
    return new StaticWebsite(this.assets.map(assetToEndpoint))
  }

  _plusAssets(newAssets) {
    return new AssetBucket({
      host: this.host,
      baseHref: this.baseHref,
      basePath: this.basePath
    }, this.assets.concat(newAssets))
  }
}

module.exports = AssetBucket
