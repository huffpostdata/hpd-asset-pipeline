A _fast_, in-memory, easy-to-configure asset pipeline, for
[HuffPostData](https://data.huffingtonpost.com) stories.

Takes a JSON configuration as input. Outputs an AssetBucket. (Read more on both
below.)

The idea is to compile all your assets (images, stylesheets, scripts) within
milliseconds. This tasteful feature list:

* [SCSS](http://sass-lang.com/documentation/file.SASS_REFERENCE.html)
  compilation.
* Simple JavaScript bundling: `require()`-ed JavaScript is included inline.
* [UglifyJS2](https://github.com/mishoo/UglifyJS2) compression. (This can be
  slow; use `UGLIFY=false` or `UGLIFY=true` environment variables to control
  it.)
* Filename [globbing](https://github.com/isaacs/node-glob) lets you specify
  filenames by pattern.
* md5sum-digested URLs: they let you cache forever and deploy at will, without
  worrying about race conditions.
* URL helpers: given a key, AssetBucket will return the URL (including hostname)
  or path (without a hostname).

Usage
-----

```javascript
'use strict'

const AssetPipeline = require('hpd-asset-pipeline')

const configuration = {
  host: 'https://assets.example.org', // For generating URLs
  baseHref: '/my-project',            // For generating URLs and hrefs
  basePath: `${__dirname}/assets`,    // Where we read our input files

  assets: [
    // Asset-pipeline steps occur in order. Each step can read the output of all
    // previous steps.
    //
    // We'll put images first, so our SCSS can read from them.
    {
      // "digest" logic does this:
      //
      // * Reads file contents and does not mangle them
      // * Gives the asset a path incorporating the md5sum: e.g.,
      //   "image-ab2321a.png"
      // * Assigns a Content-Type based on the file extension
      logic: 'digest',
      glob: images/**/*.{png,jpg,gif,svg,ico}'
    },
    {
      logic: 'digest',
      glob: 'javascripts/(social|stats).js'
    },
    {
      // "scss" logic does this:
      //
      // * Reads file contents
      // * Runs content through Sass, with special helper methods
      // * Gives the asset a path incorporating the md5sum and '.css': e.g.,
      //   "index-ab15428.css"
      // * Assigns a Content-Type of 'text/css'
      logic: 'scss',
      glob: 'stylesheets/index.scss'
    },
    {
      // "javascript" logic does this:
      //
      // * Reads file contents
      // * Resolves require() calls by embedding their contents
      // * Runs UglifyJS
      // * Gives the asset a path incorporating the md5sum: e.g.,
      //   "app-ab234512.js"
      // * Assigns a Content-Type of 'application/javascript'
      // * Produces a source map, e.g., "app-ab234512.js.map", with a
      //   Content-Type of 'application/json'
      logic: 'js',
      glob: 'javascrippts/app.js'
    }
  ]
}

const bucket = AssetPipeline.render(configuration)

// Now you have an AssetBucket! So exciting. What you can do with it:

// You can generate a StaticWebsite -- you can upload this to S3 or
// run it locally
const website = bucket.to_website()

// You can grab URLs:
bucket.href_to('javascripts/social.js') // => '/my-project/javascripts/social-ab12341.js'
bucket.url_to('javascripts/social.js')  // => 'https://assets.example.org/my-project/javascripts/social-ab12341.js'
bucket.data_uri_for('images/logo.png')  // => 'data:image/png;base64,....'
bucket.data_for('images/logo.png')      // => a Buffer containing PNG data
```

License
-------

Copyright (c) 2017 The Huffington Post

MIT. TODO include license text
