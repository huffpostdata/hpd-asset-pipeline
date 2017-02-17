'use strict'

const fs = require('fs')

describe('digest logic', () => {
  const bucket = { host: 'http://a', baseHref: '/b', basePath: `${__dirname}/../fixtures` }

  function go(paths) {
    return index.logic.digest.sync(bucket, paths)
  }

  it('should error when file does not exist', () => {
    expect(() => go([ 'this-file-does-not-exist' ])).to.throw(Error)
  })

  describe('with a PNG', () => {
    const asset = go([ 'image-1.png' ])[0]

    it('should set key', () => expect(asset.key).to.eq('image-1.png'))
    it('should set href = key+digest', () => expect(asset.href).to.eq('/b/image-1-d87fc508.png'))
    it('should read data', () => expect(asset.data).to.deep.eq(fs.readFileSync(`${__dirname}/../fixtures/image-1.png`)))
    it('should set Content-Type', () => expect(asset.contentType).to.eq('image/png'))
  })

  it('should handle zero files', () => {
    expect(go([])).to.deep.eq([])
  })

  it('should handle multiple files', () => {
    expect(go([ 'image-1.png', 'image-2.png' ]).map(a => a.key).sort())
      .to.deep.eq([ 'image-1.png', 'image-2.png' ])
  })
})
