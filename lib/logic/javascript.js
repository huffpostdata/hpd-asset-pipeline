'use strict'

const fs = require('fs')
const mdeps = require('module-deps')
const browserPack = require('browser-pack')
const pathRelative = require('cached-path-relative')
const Asset = require('../Asset')
const util = require('./util')

// Our "pipeline" passes around simple objects. They look like:
// { javascript: <Buffer>, sourceMap: <JSON> }. Every variable with a name
// ending in "js" follows this format.

function uglifyJs(js) {
  // UglifyJS.minify() can only write source maps to the filesystem. Ick.
  // We have to break it down into steps instead.
  //
  // This is all from README.md

  const UglifyJS = require('uglify-es')
  const uglified = UglifyJS.minify({ "ignored.js": js.javascript.toString('utf-8') }, {
    sourceMap: {
      content: js.sourceMap,
    },
    compress: {
      unused: false, // apparently it's slow: http://stackoverflow.com/questions/15447727/how-to-speed-up-the-minification-process-of-uglifyjs-2
    }
  })

  if (uglified.error) throw uglified.error

  return {
    javascript: Buffer.from(uglified.code),
    sourceMap: JSON.parse(uglified.map),
  }
}

// Compresses JavaScript. May throw -- especially if code has an error
function maybeUglifyJs(js) {
  if (process.env.UGLIFY) {
    return uglifyJs(js)
  } else {
    return js
  }
}

// Returns { javascript: <Buffer>, sourceMap: <JSON> }
function parseBrowserPackOutput(buf) {
  const m = /\n\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,([^\s]+)\n?$/.exec(buf)
  if (!m) throw new Error('browser-pack did not insert source-map data URL in output: ' + buf.toString('utf-8'))
  const javascript = buf.slice(0, m.index)
  const sourceMap = JSON.parse(Buffer.from(m[1], 'base64'))
  return {
    javascript: javascript,
    sourceMap: sourceMap
  }
}

function runBrowserPack(basePath, filePath, callback) {
  let done = false
  function callbackOnce(...args) {
    if (!done) callback(...args)
    done = true
  }

  const chunks = []
  const md = mdeps()
  const pack = browserPack({
    raw: true,
    sourceMapPrefix: '//#'
  })

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
    const browserPackOutputBuf = Buffer.concat(chunks)
    try {
      const browserPackJs = parseBrowserPackOutput(browserPackOutputBuf)
      return callbackOnce(null, browserPackJs)
    } catch (e) {
      return callback(e)
    }
  })
  md.end({ file: filePath })
}

function compile(path, bucket, callback) {
  const filePath = `${bucket.basePath}/${path}`
  runBrowserPack(bucket.basePath, filePath, (err, browserPackJs) => {
    if (err) return callback(err)

    let uglifyOutputJs
    try {
      uglifyOutputJs = maybeUglifyJs(browserPackJs)
    } catch (e) {
      return callback(e)
    }

    const href = util.digestifyHref(`${bucket.baseHref}/${path}`, uglifyOutputJs.javascript)
    const sourceMap = uglifyOutputJs.sourceMap
    sourceMap.file = href
    sourceMap.sourceRoot = bucket.baseHref

    const javascript = Buffer.concat([
      uglifyOutputJs.javascript,
      Buffer.from(`\n//# sourceMappingURL=${sourceMap.file}.map`),
    ])

    return callback(null, [
      new Asset(path, javascript, href, 'application/javascript'),
      new Asset(`${path}.map`, Buffer.from(JSON.stringify(sourceMap)), `${href}.map`, 'application/json')
    ])
  })
}

module.exports = {
  async(bucket, paths, callback) {
    const assetses = [] // Arrays of Assets

    const localPaths = paths.slice(0)
    function step() {
      if (localPaths.length === 0) return callback(null, [].concat(...assetses))
      const path = localPaths.shift()

      compile(path, bucket, (err, assets) => {
        if (err) return callback(err)
        assetses.push(assets)
        process.nextTick(step)
      })
    }
    step()
  }
}
