'use strict'

module.exports = class Foo {
  constructor(x) {
    this.x = x
  }

  doSomething(a) {
    let y = a(this.x)
    return y
  }
}
