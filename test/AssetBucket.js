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
      { key: 'a', path: '/slug/a', data: Buffer.from('contents of "a"'), contentType: 'application/test-content' },
      { key: 'b.png', path: '/slug/b-1234.png' }
    ])

    it('should href_to() an asset', () => {
      expect(bucket.href_to('a')).to.eq('/slug/a')
    })
    it('should throw on invalid href_to() key', () => {
      expect(() => bucket.href_to('/a')).to.throw(Error)
    })

    it('should url_to() an asset', () => {
      expect(bucket.url_to('b.png')).to.eq('https://host/slug/b-1234.png')
    })
    it('should throw on invalid url_to() key', () => {
      expect(() => bucket.url_to('/a')).to.throw(Error)
    })

    it('should data_for() an asset', () => {
      expect(bucket.data_for('a')).to.deep.eq(Buffer.from('contents of "a"'))
    })
    it('should throw on invalid data_for() key', () => {
      expect(() => bucket.data_for('/a')).to.throw(Error)
    })

    it('should data_uri_for() an asset', () => {
      expect(bucket.data_uri_for('a')).to.deep.eq('data:application/test-content;base64,Y29udGVudHMgb2YgImEi')
    })
    it('should throw on invalid data_for() key', () => {
      expect(() => bucket.data_uri_for('/a')).to.throw(Error)
    })
  })
})
