'use strict'

const fs = require('fs')

describe('scss logic', () => {
  const bucket = { host: 'http://a', baseHref: '/b', basePath: `${__dirname}/../fixtures` }

  function go(paths) {
    return index.logic.scss.sync(bucket, paths)
  }

  it('should error when file does not exist', () => {
    expect(() => go([ 'this-file-does-not-exist' ])).to.throw(Error)
  })

  describe('with an SCSS project', () => {
    const assets = go([ 'styles/index1.scss' ])
    const asset = assets[0]

    it('should set key', () => expect(asset.key).to.eq('styles/index1.css'))
    it('should set href = key', () => expect(asset.href).to.match(/\/b\/styles\/index1-[a-f0-9]{8}\.css/))
    it('should contain css', () => expect(asset.data.length).not.to.eq(0))
    it('should set Content-Type', () => expect(asset.contentType).to.eq('text/css'))

    it('should autoprefix flexbox', () => {
      expect(asset.data.toString('utf-8')).to.contain('display:-webkit-flex')
    })

    it('should write an asset map', () => {
      expect(assets.length).to.eq(2)
      expect(assets[1].key).to.eq('styles/index1.css.map')
      expect(assets[1].href).to.eq(assets[0].href + '.map')
      const map = JSON.parse(assets[1].data)
      expect(map.file).to.eq(asset.href)
      expect(map.sources.sort()[0]).to.eq('/b/styles/_index1-dependency.scss')
    })

    it('should link to its asset map', () => {
      expect(asset.data.toString('utf-8')).to.contain('/*# sourceMappingURL=' + assets[1].href + ' */')
    })
  })

  describe('in a bucket with existing assets', () => {
    const bucket = {
      basePath: `${__dirname}/../fixtures`,
      dataUriFor(key) { return `data:application/test,${key}` },
      hrefTo(key) { return `/path/to/${key}` }
    }
    const assets = index.logic.scss.sync(bucket, [ 'styles/asset-urls.scss' ])
    const asset = assets[0]
    const css = asset.data.toString('utf-8')

    it('should call dataUriFor()', () => {
      expect(css).to.contain('.test-asset-data-url{background:url(data:application/test,TEST_ASSET_DATA_URL)}')
    })

    it('should call hrefTo()', () => {
      expect(css).to.contain('.test-asset-url{background:url(/path/to/TEST_ASSET_URL)}')
    })
  })

  it('should handle zero files', () => {
    expect(go([])).to.deep.eq([])
  })
})
