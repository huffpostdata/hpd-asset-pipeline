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
  or "href" (URL minus hostname).

Usage
-----

```javascript
'use strict'

const AssetPipeline = require('hpd-asset-pipeline')

const configuration = {
  host: 'https://assets.example.org', // For generating URLs
  baseHref: '/my-project',            // For generating URLs and hrefs
  basePath: `${__dirname}/assets`,    // Where we read our input files (may be ".")

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
  if (err) throw err

  // Now you have an AssetBucket! So exciting. What you can do with it:

  // You can generate a StaticWebsite -- you can upload this to S3 or
  // run it locally
  const website = bucket.to_website()

  // You can grab URLs:
  bucket.href_to('javascripts/social.js') // => '/my-project/javascripts/social-ab12341.js'
  bucket.url_to('javascripts/social.js')  // => 'https://assets.example.org/my-project/javascripts/social-ab12341.js'
  bucket.data_uri_for('images/logo.png')  // => 'data:image/png;base64,....'
  bucket.data_for('images/logo.png')      // => a Buffer containing PNG data
}
```

SCSS helper functions
---------------------

Our stylesheets are [Sass](http://sass-lang.com/documentation/file.SASS_REFERENCE.html).

We have a couple of helper functions:

* `asset-url(type, key)`: creates a `url()` value pointing to the specified
  asset. Example: `background-image: asset-url('digest', 'images/header.jpg')`
  will produce `background-image: url(/images/header-0f0f0f0f0f.jpg)`
* `asset-data-url(type, key)`: creates a `url(data:[mime];base64,[data])` value
  containing all the bytes of the specified asset, with the asset's MIME type.
  Example: `background-image: asset-url('digest', 'images/highlight.png')`
  will produce `background-image: url('data:image/png;base64,XXXXXXXXXX...')`

`asset-url()` forces an extra HTTP request. Use it for large assets or assets
on pages that most users will likely never see; that means most users won't load
it.

`asset-data-url()` makes the stylesheet larger, since it includes the file
contents. The page won't render until the stylesheet has transferred. Use it for
assets under a few kilobytes in size, or assets every user will see.

Error handling
--------------

Compilation failures (such as missing `require()` or invalid SCSS) will halt
all compilation and return an Error.

`href_to()`, `url_to()`, `data_uri_for()` and `data_for()` will throw Errors
when the assets they refer to do not exist.

Logic implementation
--------------------

These aren't "plugins" (yet). Each "logic" is an Object which a Function member
named `sync` or `async`. ([Prefer sync](https://medium.com/@adamhooper/node-synchronous-code-runs-faster-than-asynchronous-code-b0553d5cf54e).)

The `sync()` method accepts two arguments: `bucket` (an AssetBucket, with
`.baseHref` and `.baseUrl` properties, plus `.href_to()` et al for the
`.assets` which were compiled in previous steps); and `paths` (an Array of
String paths, from `glob()`). It may throw an Error. Otherwise, it will return
an Array of `Asset` objects as output.

The `async()` method accepts a third argument, `callback`; in case of error,
it calls `callback(new Error(...))`.

License
-------

Copyright (c) 2017 The Huffington Post

MIT. TODO include license text
