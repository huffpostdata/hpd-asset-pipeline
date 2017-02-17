module.exports = class AssetBucket {
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

  href_to(key) {
    this._checkKey(key)
    return this.index[key].path
  }

  url_to(key) {
    return this.host + this.href_to(key)
  }

  data_for(key) {
    this._checkKey(key)
    return this.index[key].data
  }

  data_uri_for(key) {
    this._checkKey(key)
    const asset = this.index[key]
    const data = asset.data
    const contentType = asset.contentType
    return `data:${contentType};base64,${data.toString('base64')}`
  }
}
