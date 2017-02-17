'use strict'

const fs = require('fs')
const mdeps = require('module-deps')
const browserPack = require('browser-pack')
const pathRelative = require('cached-path-relative')
const UglifyJS = require('uglify-js')
const Asset = require('../Asset')
const util = require('./util')

// Compresses JavaScript. May throw -- especially if code has an error
function maybeUglifyJs(jsBuf) {
  if (process.env.UGLIFY) {
    const js = jsBuf.toString('utf-8')
    const result = UglifyJS.minify(js, {
      fromString: true
      // TODO source map (inspiration: https://github.com/hughsk/uglifyify/blob/master/index.js)
    })
    return { data: Buffer.from(result.code) }
  } else {
    return { data: jsBuf }
  }
}

function compile(path, basePath, filePath, callback) {
  let done = false
  function callbackOnce(...args) {
    if (!done) callback(...args)
    done = true
  }

  const chunks = []
  const md = mdeps()
  const pack = browserPack({ raw: true })
  md.on('data', dep => {
    // I hate streams. Icky hack: modify in-place
    dep.id = pathRelative(basePath, dep.id)
    dep.file = pathRelative(basePath, dep.file)
    dep.sourceFile = dep.file
    for (const key of Object.keys(dep.deps)) {
      dep.deps[key] = pathRelative(basePath, dep.deps[key])
    }
  })
  md.on('error', callbackOnce)
  md.pipe(pack)
  pack.on('error', callbackOnce)
  pack.on('data', (chunk) => { chunks.push(chunk) })
  pack.on('end', () => {
    const js = Buffer.concat(chunks)

    try {
      return callbackOnce(null, Object.assign({ path: path }, maybeUglifyJs(js)))
    } catch (e) {
      return callbackOnce(e)
    }
  })
  md.end({ file: filePath })
}

function retvalsToAssets(bucket, retvals) {
  const ret = []
  for (const retval of retvals) {
    ret.push(new Asset(
      retval.path,
      retval.data,
      util.digestifyHref(`${bucket.baseHref}/${retval.path}`, retval.data),
      'application/javascript'
    ))
  }
  return ret
}

module.exports = {
  async(bucket, paths, callback) {
    const retvals = []

    const localPaths = paths.slice(0)
    function step() {
      if (localPaths.length === 0) return callback(null, retvalsToAssets(bucket, retvals))
      const path = localPaths.shift()
      const filePath = `${bucket.basePath}/${path}`

      compile(path, bucket.basePath, filePath, (err, retval) => {
        if (err) return callback(err)
        retvals.push(retval)
        process.nextTick(step)
      })
    }
    step()
  }
}
