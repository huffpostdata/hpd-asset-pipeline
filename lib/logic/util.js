const crypto = require('crypto')

function md5sum(string) {
  const hash = crypto.createHash('md5')
  hash.update(string)
  return hash.digest('hex')
}

module.exports = {
  // Returns a "guaranteed"-unique href by analyzing the given href and file
  // contents.
  //
  // It's likely to the extreme that if this method is invoked twice and
  // produces the same output string each time, then it was invoked with the
  // exact same arguments both times.
  digestifyHref(href, data) {
    const digest = md5sum(data).slice(0, 8)
    const m = /(.*)\.(\w+)/.exec(href)
    if (m) {
      return `${m[1]}-${digest}.${m[2]}`
    } else {
      return `${href}-${digest}`
    }
  }
}
