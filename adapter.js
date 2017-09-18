const Promise = require('./promise')
module.exports = {
  Promise: Promise,
  deferred: function () {
    var resolve, reject
    return {
      // eslint-disable-next-line
      promise: new Promise(function (_resolve, _reject) {
        resolve = _resolve
        reject = _reject
      }),
      resolve: resolve,
      reject: reject
    }
  }
}
