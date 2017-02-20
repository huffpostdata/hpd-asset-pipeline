const glob = require('glob')
const logic = require('./lib/logic')
const AssetBucket = require('./lib/AssetBucket')

function renderSteps(steps, stepIndex, partialBucket, callback) {
  if (stepIndex >= steps.length) return callback(null, partialBucket)

  const step = steps[stepIndex]
  if (!step.glob) {
    return callback(new Error(`Step ${stepIndex} is missing a "glob" pattern. Please add one.`))
  }

  const paths = glob.sync(step.glob, {
    cwd: partialBucket.basePath
  })

  const stepLogic = logic[step.logic]
  if (!stepLogic) {
    return callback(new Error(`Step ${stepIndex} does not have a valid "logic" property. Please set "logic" to one of ${Object.keys(logic).sort()}`))
  }

  if (stepLogic.sync) {
    let newAssets
    try {
      newAssets = stepLogic.sync(partialBucket, paths)
    } catch (e) {
      return callback(e)
    }
    return renderSteps(steps, stepIndex + 1, partialBucket._plusAssets(newAssets), callback)
  } else if (stepLogic.async) {
    stepLogic.async(partialBucket, paths, (err, newAssets) => {
      if (err) return callback(err)
      return renderSteps(steps, stepIndex + 1, partialBucket._plusAssets(newAssets), callback)
    })
  } else {
    return callback(new Error(`Logic ${step.logic} has neither a "sync()" or an "async()" member. That's a bug in the logic.`))
  }
}

module.exports = {
  logic: logic,
  render(config, callback) {
    if (!config.assets) {
      return callback(new Error('You must pass "config.assets", an Array of asset compilation steps.'))
    }

    let emptyBucket
    try {
      emptyBucket = new AssetBucket({
        host: config.host,
        baseHref: config.baseHref,
        basePath: config.basePath
      }, [])
    } catch (e) {
      return callback(e)
    }

    renderSteps(config.assets, 0, emptyBucket, callback)
  }
}
