const AssetBucket = require('../lib/AssetBucket')

describe('AssetBucket', () => {
  const config = { host: 'https://host', baseHref: '/slug', basePath: './assets' }

  it('should throw when called without a host', () => {
    expect(() => new AssetBucket({ baseHref: '/slug', basePath: './assets' }, [])).to.throw(Error)
  })
  it('should set baseHref default to ""', () => {
    expect(new AssetBucket(Object.assign({}, config, { baseHref: null }), []).baseHref).to.eq('')
  })
  it('should throw when called without a basePath', () => {
    expect(() => new AssetBucket({ host: 'https://host', baseHref: '/slug' }, [])).to.throw(Error)
  })

  describe('an empty bucket', () => {
    const bucket = new AssetBucket(config, [])

    it('should have host', () => expect(bucket.host).to.eq('https://host'))
    it('should have baseHref', () => expect(bucket.baseHref).to.eq('/slug'))
    it('should have basePath', () => expect(bucket.basePath).to.eq('./assets'))
  })

  describe('a bucket with assets', () => {
    const bucket = new AssetBucket(config, [
      { key: 'a', href: '/slug/a', data: Buffer.from('contents of "a"'), contentType: 'application/test-content' },
      { key: 'b.png', href: '/slug/b-1234.png' }
    ])

    it('should hrefTo() an asset', () => {
      expect(bucket.hrefTo('a')).to.eq('/slug/a')
    })
    it('should throw on invalid hrefTo() key', () => {
      expect(() => bucket.hrefTo('/a')).to.throw(Error)
    })

    it('should urlTo() an asset', () => {
      expect(bucket.urlTo('b.png')).to.eq('https://host/slug/b-1234.png')
    })
    it('should throw on invalid urlTo() key', () => {
      expect(() => bucket.urlTo('/a')).to.throw(Error)
    })

    it('should dataFor() an asset', () => {
      expect(bucket.dataFor('a')).to.deep.eq(Buffer.from('contents of "a"'))
    })
    it('should throw on invalid dataFor() key', () => {
      expect(() => bucket.dataFor('/a')).to.throw(Error)
    })

    it('should dataUriFor() an asset', () => {
      expect(bucket.dataUriFor('a')).to.deep.eq('data:application/test-content;base64,Y29udGVudHMgb2YgImEi')
    })
    it('should throw on invalid dataUriFor() key', () => {
      expect(() => bucket.dataUriFor('/a')).to.throw(Error)
    })
  })

  describe('toWebsite', () => {
    it('should generate a StaticWebsite', () => {
      const bucket = new AssetBucket(config, [
        { key: 'a', href: '/slug/a', data: Buffer.from('contents of "a"'), contentType: 'application/test-content' },
        { key: 'b.png', href: '/slug/b-1234.png', data: Buffer.from('image!'), contentType: 'image/png' }
      ])
      const website = bucket.toWebsite()
      expect(website.endpoints[0]).to.deep.eq({
        path: '/slug/a',
        body: Buffer.from('contents of "a"'),
        headers: {
          'Content-Type': 'application/test-content',
          'Cache-Control': 'public; max-age=31536000'
        }
      })
    })
  })
})
