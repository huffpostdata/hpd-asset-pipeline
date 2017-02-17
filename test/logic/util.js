const util = require('../../lib/logic/util')

describe('logic/util', () => {
  describe('digestifyHref', () => {
    const data = Buffer.from('foo') // digest acbd18db4cc2f85cedef654fccc4a4d8

    it('should add digest to href', () => {
      expect(util.digestifyHref('foo', data)).to.eq('foo-acbd18db')
    })

    it('should add digest before file extension', () => {
      expect(util.digestifyHref('foo.png', data)).to.eq('foo-acbd18db.png')
    })

    it('should add digest before last file extension, if there are many', () => {
      expect(util.digestifyHref('foo.FINAL.png', data)).to.eq('foo.FINAL-acbd18db.png')
    })
  })
})
