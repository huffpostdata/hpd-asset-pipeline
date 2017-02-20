'use strict'

const fs = require('fs')

const AssetPipeline = require('../index')

describe('README.md', () => {
  it('should pass the tests', (done) => {
    const configuration = {
      host: 'https://assets.example.org', // For generating URLs
      baseHref: '/my-project',            // For generating URLs and hrefs
      basePath: `${__dirname}/fixtures/readme`,    // Where we read our input files (may be ".")

      assets: [
        // Asset-pipeline steps occur in order. Each step can read the output of all
        // previous steps.
        //
        // We'll put images first, so our SCSS can read from them.
        {
          // "digest" logic does this:
          //
          // * Reads file contents and does not mangle them
          // * Gives the asset an href incorporating the md5sum: e.g.,
          //   "image-ab2321a.png"
          // * Assigns a Content-Type based on the file extension
          logic: 'digest',
          glob: 'images/**/*.{png,jpg,gif,svg,ico}'
        },
        {
          logic: 'digest',
          glob: 'javascripts/{social,stats}.js'
        },
        {
          // "scss" logic does this:
          //
          // * Reads file contents
          // * Runs content through Sass, with special helper methods
          // * Runs content through postcss, to add vendor prefixes
          // * Gives the asset a "key" ending in ".css": e.g.,
          //   "stylesheets/index.css".
          // * Gives the asset an href incorporating the md5sum and '.css': e.g.,
          //   "index-ab15428.css"
          // * Assigns a Content-Type of 'text/css'
          // * Produces a source map, e.g., "index-ab15428.css.map", with a
          //   Content-Type of 'application/json'
          logic: 'scss',
          glob: 'stylesheets/index.scss'
        },
        {
          // "javascript" logic does this:
          //
          // * Reads file contents
          // * Resolves require() calls by embedding their contents
          // * Runs UglifyJS
          // * Gives the asset an href incorporating the md5sum: e.g.,
          //   "app-ab234512.js"
          // * Assigns a Content-Type of 'application/javascript'
          // * Produces a source map, e.g., "app-ab234512.js.map", with a
          //   Content-Type of 'application/json'
          logic: 'javascript',
          glob: 'javascrippts/app.js'
        },
        {
          // "raw" logic does this:
          //
          // * Reads file contents
          // * Assigns a Content-Type based on the file extension
          // * Assigns href based on filename
          //
          // Beware: if you use the AssetBucket as intended and serve the generated
          // assets with a year-long Cache-Control header, then any client that
          // downloads a raw asset will never see any updates. You should favor
          // "digest" logic unless A) the file won't change; and B) other websites
          // refer to this asset's URL.
          logic: 'raw',
          glob: 'javascripts/pym.min.js'
        }
      ]
    }

    AssetPipeline.render(configuration, (err, bucket) => {
      // Any compilation error halts compilation and returns an Error.
      if (err) return done(err)

      // Now you have an AssetBucket! So exciting. What you can do with it:

      // You can generate a StaticWebsite -- you can upload this to S3 or
      // run it locally
      const website = bucket.to_website()
      expect(website.endpoints.length).to.eq(5)

      // You can grab URLs:
      expect(bucket.href_to('javascripts/social.js')).to.eq('/my-project/javascripts/social-c947ca36.js')
      expect(bucket.url_to('javascripts/social.js')).to.eq('https://assets.example.org/my-project/javascripts/social-c947ca36.js')
      expect(bucket.data_uri_for('images/logo.png')).to.eq('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==')
      expect(bucket.data_for('images/logo.png')).to.deep.eq(fs.readFileSync(`${__dirname}/fixtures/readme/images/logo.png`))
      done()
    })
  })
})
