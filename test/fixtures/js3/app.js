'use strict'

const Js3 = require('./dependency')

return (new Js3('foobar')).doSomething(x => `barbaz${x}`)
