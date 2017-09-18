// possible states
const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

class APromise {
  constructor (resolver) {
    // initial state
    this.state = PENDING
    // the fulfillment value or rejection reason is mapped internally to `value`
    // initially the promise doesn't have a value

    // .then handler queue
    this.queue = []

    // call the resolver immediately
    doResolve(this, resolver)
  }

  then (onFulfilled, onRejected) {
    // empty resolver
    const promise = new APromise(() => {})
    handle(this, { promise, onFulfilled, onRejected })
    return promise
  }
}

function handle (promise, handler) {
  // take the state of the returned promise
  while (promise.value instanceof APromise && promise.state !== REJECTED) {
    promise = promise.value
  }

  if (promise.state === PENDING) {
    // queue if PENDING
    promise.queue.push(handler)
  } else {
    // execute immediately
    handleResolved(promise, handler)
  }
}

// call either the onFulfilled or onRejected function
function handleResolved (promise, handler) {
  setImmediate(() => {
    const cb = promise.state === FULFILLED ? handler.onFulfilled : handler.onRejected
    if (typeof cb !== 'function') {
      if (promise.state === FULFILLED) {
        fulfill(handler.promise, promise.value)
      } else {
        reject(handler.promise, promise.value)
      }
      return
    }

    try {
      const ret = cb(promise.value)
      fulfill(handler.promise, ret)
    } catch (err) {
      reject(handler.promise, err)
    }
  })
}

// fulfill with `value`
function fulfill (promise, value) {
  if (value === promise) {
    return reject(promise, new TypeError('failed'))
  }
  if (value && (typeof value === 'object' || typeof value === 'function')) {
    let then
    try {
      then = value.then
    } catch (err) {
      return reject(promise, err)
    }

    // promise
    if (then === promise.then && promise instanceof APromise) {
      promise.state = FULFILLED
      promise.value = value
      return finale(promise)
    }

    // thenable
    if (typeof then === 'function') {
      return doResolve(promise, then.bind(value))
    }
  }

  // primitive
  promise.state = FULFILLED
  promise.value = value
  finale(promise)
}

// reject with `reason`
function reject (promise, reason) {
  promise.state = REJECTED
  promise.value = reason
  finale(promise)
}

function finale (promise) {
  var length = promise.queue.length
  for (var i = 0; i < length; i += 1) {
    handle(promise, promise.queue[i])
  }
}

// creates the fulfill/reject functions that are arguments of the resolver
function doResolve (promise, resolver) {
  let called = false

  function wrapFulfill (value) {
    if (called) { return }
    called = true
    fulfill(promise, value)
  }

  function wrapReject (reason) {
    if (called) { return }
    called = true
    reject(promise, reason)
  }

  try {
    resolver(wrapFulfill, wrapReject)
  } catch (err) {
    wrapReject(err)
  }
}

module.exports = APromise
