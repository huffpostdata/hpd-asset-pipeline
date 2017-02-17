'use strict'

const fs = require('fs')

describe('javascript logic', () => {
  const bucket = { host: 'http://a', baseHref: '/b', basePath: `${__dirname}/../fixtures` }

  function go(paths, callback) {
    return index.logic.javascript.async(bucket, paths, callback)
  }

  it('should error when file does not exist', (done) => {
    go([ 'this-file-does-not-exist' ], err => {
      expect(err).to.be.an('error')
      done()
    })
  })

  describe('with a JS file that has a dependency', () => {
    function async(test) {
      return function(done) {
        go([ 'js1/app.js' ], (err, assets) => {
          expect(err).to.not.exist
          test(assets)
          return done()
        })
      }
    }

    it('should set key', async(assets => expect(assets[0].key).to.eq('js1/app.js')))
    it('should set href = key+digest', async(assets => expect(assets[0].href).to.match(/\/b\/js1\/app-[a-f0-9]{8}\.js/)))
    it('should set Content-Type', async(assets => expect(assets[0].contentType).to.eq('application/javascript')))

    it('should return JavaScript code', async(assets => {
      const jsBuf = assets[0].data
      const js = jsBuf.toString('utf-8')
      expect(() => eval(js)).not.to.throw(Error)
      expect(js).to.contain('foobar') // something in the dependency
    }))

    xit('should return a source map', async(assets => {
      expect(assets.length).to.eq(2)
      expect(assets[1].key).to.eq('js1/app.js.map')
      expect(assets[1].path).to.eq('/b/app.js.map')
      expect(assets[1].contentType).to.eq('application/json; charset=utf-8')
      expect(() => JSON.parse(assets[1].data.toString('utf-8'))).not.to.throw(Error)
    }))
  })

  it('should handle multiple files', (done) => {
    go([ 'js1/app.js', 'js2.js', ], (err, assets) => {
      expect(err).to.not.exist
      const keys = assets.map(a => a.key)
      expect(keys.indexOf('js1/app.js')).to.not.eq(-1)
      expect(keys.indexOf('js2.js')).to.not.eq(-1)
      done()
    })
  })

  it('should return an error', (done) => {
    go([ 'js-with-error.js' ], (err, assets) => {
      expect(err).to.be.an('error')
      done()
    })
  })

  it('should handle zero files', (done) => {
    go([], (err, assets) => {
      expect(err).to.not.exist
      expect(assets).to.deep.eq([])
      done()
    })
  })
})
