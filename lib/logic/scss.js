'use strict'

const fs = require('fs')
const path = require('path')
const sass = require('node-sass')
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')

const util = require('./util')
const Asset = require('../Asset')

function autoprefixSassResult(sassResult) {
  return autoprefixSassResult.processor.process(sassResult.css, {
    map: { prev: JSON.parse(sassResult.map) },
    annotation: false
  })
}
autoprefixSassResult.processor = postcss([ autoprefixer({
  remove: false,
  browsers: [ 'IE >= 10', 'safari >= 8', 'chrome >= 44', 'firefox >= 43' ]
}) ])

function buildSassFunctions(bucket) {
  return {
    'asset-url($key)': (key) => {
      // TODO figure out url-escaping
      return new sass.types.String(`url(${bucket.hrefTo(key.getValue())})`)
    },
    'asset-data-url($key)': (key) => {
      return new sass.types.String(`url(${bucket.dataUriFor(key.getValue())})`)
    }
  }
}

function compile(scssPath, bucket) {
  const cssPath = scssPath.replace(/\.scss$/, '.css')
  const hrefWithoutDigest = `${bucket.baseHref}/${cssPath}`

  let sassResult;
  try {
    sassResult = sass.renderSync({
      file: scssPath,
      outputStyle: 'compressed',
      sourceMap: 'a-string-without-slashes---this-value-is-not-used',
      sourceMapRoot: bucket.baseHref,
      sourceMapContents: true,
      omitSourceMapUrl: true,
      functions: buildSassFunctions(bucket)
    })
  } catch (e) {
    // node-sass errors are weird
    e.message = e.formatted
    throw e
  }

  const autoprefixResult = autoprefixSassResult(sassResult)
  const autoprefixCssBuf = Buffer.from(autoprefixResult.content)

  const href = util.digestifyHref(hrefWithoutDigest, autoprefixCssBuf)
  const css = Buffer.concat([
    autoprefixCssBuf,
    // TODO do we need to escape sourceMapHref?
    Buffer.from(`\n/*# sourceMappingURL=${href}.map */`)
  ])

  const sourceMap = autoprefixResult.map.toJSON()
  sourceMap.file = href

  return [
    new Asset(cssPath, css, href, 'text/css'),
    new Asset(`${cssPath}.map`, Buffer.from(JSON.stringify(sourceMap)), `${href}.map`, 'application/json')
  ]
}

module.exports = {
  sync(bucket, paths) {
    const ret = []

    // Use chdir so paths are relative
    const cwd = process.cwd()
    process.chdir(bucket.basePath)

    try {
      for (const path of paths) {
        ret.push(compile(path, bucket))
      }
    } finally {
      process.chdir(cwd)
    }

    return [].concat(...ret)
  }
}
