'use strict'

const Js3 = require('./dependency')

const x = (new Js3('foobar')).doSomething(x => `barbaz${x}`)
x
