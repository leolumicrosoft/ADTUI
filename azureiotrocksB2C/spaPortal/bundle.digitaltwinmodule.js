(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)

},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const modelEditorDialog = require("../sharedSourceFiles/modelEditorDialog")
const editLayoutDialog = require("./editLayoutDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel");
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")
const globalCache=require("../sharedSourceFiles/globalCache")
const newTwinDialog=require("../sharedSourceFiles/newTwinDialog");

function digitaltwinmoduleUI() {
    this.initUILayout()

    this.twinsTree= new twinsTree($("#treeHolder"),$("#treeSearch"))
    
    mainToolbar.render()
    this.topologyInstance=new topologyDOM($('#canvas'))
    this.topologyInstance.init()

    this.broadcastMessage() //initialize all ui components to have the broadcast capability

    //try if it already B2C signed in, if not going back to the start page
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);


    var theAccount=msalHelper.fetchAccount();
    if(theAccount==null && !globalAppSettings.isLocalTest) window.open(globalAppSettings.logoutRedirectUri,"_self")

    globalCache.loadUserData().then(re=>{
        if(globalCache.DBModelsArr.length==0){
            //directly popup to model management dialog allow user import or create model
            modelManagerDialog.popup()
            //pop up welcome screen
            var popWin=$('<div class="w3-blue w3-card-4 w3-padding-large" style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:105;width:400px;cursor:default"></div>')
            popWin.html(`Welcome, ${msalHelper.userName}! Firstly, you may consider importing a few twin model files or creating twin models from scratch. <br/><br/>Click to continue...`)
            $("body").append(popWin)
            popWin.on("click",()=>{popWin.remove()})
        }else{
            startSelectionDialog.popup()
        }
        this.broadcastMessage(this,{ "message": "visualDefinitionRefresh"})
        this.broadcastMessage(this,{ "message": "layoutsUpdated"})
    })
}

digitaltwinmoduleUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[this.twinsTree,startSelectionDialog,modelManagerDialog,modelEditorDialog,editLayoutDialog,
         mainToolbar,this.topologyInstance,infoPanel,newTwinDialog]

    if(source==null){
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            this.assignBroadcastMessage(theComponent)
        }
    }else{
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            if(theComponent.rxMessage && theComponent!=source) theComponent.rxMessage(msgPayload)
        }
    }
}

digitaltwinmoduleUI.prototype.assignBroadcastMessage=function(uiComponent){
    uiComponent.broadcastMessage=(msgObj)=>{this.broadcastMessage(uiComponent,msgObj)}
}

digitaltwinmoduleUI.prototype.initUILayout = function () {
    var myLayout = $('body').layout({
        //	reference only - these options are NOT required because 'true' is the default
        closable: true	// pane can open & close
        , resizable: true	// when open, pane can be resized 
        , slidable: true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
        , livePaneResizing: true

        //	some resizing/toggling settings
        , north__slidable: false	// OVERRIDE the pane-default of 'slidable=true'
        //, north__togglerLength_closed: '100%'	// toggle-button is full-width of resizer-bar
        , north__spacing_closed: 6		// big resizer-bar when open (zero height)
        , north__spacing_open:0
        , north__resizable: false	// OVERRIDE the pane-default of 'resizable=true'
        , north__closable: false
        , west__closable: false
        , east__closable: false
        

        //	some pane-size settings
        , west__minSize: 100
        , east__size: 300
        , east__minSize: 200
        , east__maxSize: .5 // 50% of layout width
        , center__minWidth: 100
        ,east__closable: false
        ,west__closable: false
        ,east__initClosed:	true
    });


    /*
     *	DISABLE TEXT-SELECTION WHEN DRAGGING (or even _trying_ to drag!)
     *	this functionality will be included in RC30.80
     */
    $.layout.disableTextSelection = function () {
        var $d = $(document)
            , s = 'textSelectionDisabled'
            , x = 'textSelectionInitialized'
            ;
        if ($.fn.disableSelection) {
            if (!$d.data(x)) // document hasn't been initialized yet
                $d.on('mouseup', $.layout.enableTextSelection).data(x, true);
            if (!$d.data(s))
                $d.disableSelection().data(s, true);
        }
        //console.log('$.layout.disableTextSelection');
    };
    $.layout.enableTextSelection = function () {
        var $d = $(document)
            , s = 'textSelectionDisabled';
        if ($.fn.enableSelection && $d.data(s))
            $d.enableSelection().data(s, false);
        //console.log('$.layout.enableTextSelection');
    };
    $(".ui-layout-resizer-north").hide()
    $(".ui-layout-west").css("border-right","solid 1px lightGray")
    $(".ui-layout-west").addClass("w3-card")
}


module.exports = new digitaltwinmoduleUI();
},{"../globalAppSettings.js":11,"../msalHelper":12,"../sharedSourceFiles/globalCache":13,"../sharedSourceFiles/modelEditorDialog":15,"../sharedSourceFiles/modelManagerDialog":16,"../sharedSourceFiles/newTwinDialog":18,"./editLayoutDialog":5,"./infoPanel":6,"./mainToolbar":7,"./startSelectionDialog":8,"./topologyDOM.js":9,"./twinsTree":10}],5:[function(require,module,exports){
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache=require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function editLayoutDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

editLayoutDialog.prototype.refillOptions = function () {
    this.switchLayoutSelector.clearOptions()
    
    for(var ind in globalCache.layoutJSON){
        this.switchLayoutSelector.addOption(ind)
    }
}

editLayoutDialog.prototype.popup = function () {
    this.DOM.show()
    this.DOM.empty()

    this.DOM.css({"width":"320px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Layout</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var nameInput=$('<input type="text" style="outline:none; width:180px; display:inline;margin-left:2px;margin-right:2px"  placeholder="Fill in a new layout name..."/>').addClass("w3-input w3-border");   
    this.DOM.append(nameInput)
    var saveAsNewBtn=$('<button class="w3-button w3-green w3-hover-light-green">Save New Layout</button>')
    this.DOM.append(saveAsNewBtn)
    saveAsNewBtn.on("click",()=>{this.saveIntoLayout(nameInput.val())})


    if(!jQuery.isEmptyObject(globalCache.layoutJSON)){
        var lbl=$('<div class="w3-bar w3-padding-16" style="text-align:center;">- OR -</div>')
        this.DOM.append(lbl) 
        var switchLayoutSelector=new simpleSelectMenu("",{fontSize:"1em",colorClass:"w3-light-gray",width:"120px"})
        this.switchLayoutSelector=switchLayoutSelector
        this.refillOptions()
        this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
            if(optionText==null) this.switchLayoutSelector.changeName(" ")
            else this.switchLayoutSelector.changeName(optionText)
        }
            
        var saveAsBtn=$('<button class="w3-button w3-green w3-hover-light-green" style="margin-left:2px;margin-right:5px">Save As</button>')
        var deleteBtn=$('<button class="w3-button w3-red w3-hover-pink" style="margin-left:5px">Delete Layout</button>')
        this.DOM.append(saveAsBtn,switchLayoutSelector.DOM,deleteBtn)
        saveAsBtn.on("click",()=>{this.saveIntoLayout(switchLayoutSelector.curSelectVal)})
        deleteBtn.on("click",()=>{this.deleteLayout(switchLayoutSelector.curSelectVal)})

        if(globalCache.currentLayoutName!=null){
            switchLayoutSelector.triggerOptionValue(globalCache.currentLayoutName)
        }else{
            switchLayoutSelector.triggerOptionIndex(0)
        }
    }
}

editLayoutDialog.prototype.saveIntoLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return
    }
    this.broadcastMessage({ "message": "saveLayout", "layoutName": layoutName})
    this.DOM.hide()
}


editLayoutDialog.prototype.deleteLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return;
    }

    var confirmDialogDiv=new simpleConfirmDialog()

    confirmDialogDiv.show(
        { width: "250px" },
        {
            title: "Confirm"
            , content: "Confirm deleting layout \"" + layoutName + "\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        delete globalCache.layoutJSON[layoutName]
                        if (layoutName == globalCache.currentLayoutName) globalCache.currentLayoutName = null
                        confirmDialogDiv.close()
                        this.broadcastMessage({ "message": "layoutsUpdated"})
                        this.refillOptions()
                        this.switchLayoutSelector.triggerOptionIndex(0)
                        try{
                            await msalHelper.callAPI("digitaltwin/deleteLayout", "POST", { "layoutName": layoutName })
                        }catch(e){
                            console.log(e)
                            if(e.responseText) alert(e.responseText)
                        }
                    }
                },
                {
                    colorClass: "w3-gray",text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                }}
            ]
        }
    )

}

module.exports = new editLayoutDialog();
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":13,"../sharedSourceFiles/simpleConfirmDialog":19,"../sharedSourceFiles/simpleSelectMenu":20}],6:[function(require,module,exports){
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper = require("../msalHelper")

function infoPanel() {
    this.continerDOM=$('<div class="w3-card" style="position:absolute;z-index:90;right:0px;top:50%;height:70%;width:300px;transform: translateY(-50%);"></div>')
    this.continerDOM.hide()
    this.continerDOM.append($('<div style="height:50px" class="w3-bar w3-red"></div>'))

    this.closeButton1=$('<button style="height:100%" class="w3-bar-item w3-button"><i class="fa fa-info-circle fa-2x" style="padding:2px"></i></button>')
    this.closeButton2=$('<button class="w3-bar-item w3-button w3-right" style="font-size:2em">×</button>')
    this.continerDOM.children(':first').append(this.closeButton1,this.closeButton2) 

    this.isMinimized=false;
    var buttonAnim=()=>{
        if(!this.isMinimized){
            this.continerDOM.animate({
                right: "-250px",
                height:"50px"
            })
            this.isMinimized=true;
        }else{
            this.continerDOM.animate({
                right: "0px",
                height: "70%"
            })
            this.isMinimized=false;
        }
    }
    this.closeButton1.on("click",buttonAnim)
    this.closeButton2.on("click",buttonAnim)

    this.DOM=$('<div class="w3-container" style="postion:absolute;top:50px;height:calc(100% - 50px);overflow:auto"></div>')
    this.continerDOM.css("background-color","rgba(255, 255, 255, 0.8)")
    this.continerDOM.hover(() => {
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 1)")
    }, () => {
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
    });
    this.continerDOM.append(this.DOM)
    $('body').append(this.continerDOM)

    this.drawButtons(null)
    this.selectedObjects=null;
}

infoPanel.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelectionDialog_closed"){
        if(!this.continerDOM.is(":visible")) {
            this.continerDOM.show()
            this.continerDOM.addClass("w3-animate-right")
        }
    }else if(msgPayload.message=="showInfoSelectedNodes"){
        this.DOM.empty()
        var arr=msgPayload.info;
        
        if(arr==null || arr.length==0){
            this.drawButtons(null)
            this.selectedObjects=[];
            return;
        }
        this.selectedObjects=arr;
        if(arr.length==1){
            var singleElementInfo=arr[0];
            
            if(singleElementInfo["$dtId"]){// select a node
                this.drawButtons("singleNode")
                
                //instead of draw the $dtId, draw display name instead
                //this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
                this.drawStaticInfo(this.DOM,{"name":singleElementInfo["displayName"]},"1em","13px")


                var modelName=singleElementInfo['$metadata']['$model']
                
                if(modelAnalyzer.DTDLModels[modelName]){
                    this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
                }
                //instead of drawing the original infomration, draw more meaningful one
                //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
                this.drawStaticInfo(this.DOM,{"Model":singleElementInfo["$metadata"]["$model"]},"1em","10px")
                for(var ind in singleElementInfo["$metadata"]){
                    if(ind == "$model") continue;
                    var tmpObj={}
                    tmpObj[ind]=singleElementInfo["$metadata"][ind]
                    this.drawStaticInfo(this.DOM,tmpObj,"1em","10px")
                }
            }else if(singleElementInfo["$sourceId"]){
                this.drawButtons("singleRelationship")
                this.drawStaticInfo(this.DOM,{
                    "From":globalCache.twinIDMapToDisplayName[singleElementInfo["$sourceId"]],
                    "To":globalCache.twinIDMapToDisplayName[singleElementInfo["$targetId"]],
                    "Relationship Type":singleElementInfo["$relationshipName"]
                    //,"$relationshipId":singleElementInfo["$relationshipId"]
                },"1em","13px")
                var relationshipName=singleElementInfo["$relationshipName"]
                var sourceModel=singleElementInfo["sourceModel"]
                
                this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
                for(var ind in singleElementInfo["$metadata"]){
                    var tmpObj={}
                    tmpObj[ind]=singleElementInfo["$metadata"][ind]
                    this.drawStaticInfo(this.DOM,tmpObj,"1em","10px")
                }
                //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
            }
        }else if(arr.length>1){
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }
}

infoPanel.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

infoPanel.prototype.drawButtons=function(selectType){
    var impBtn=$('<button class="w3-bar-item w3-button w3-blue"><i class="fa fa-arrow-circle-o-down"></i></button>')
    var actualImportTwinsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    if(selectType!=null){
        var refreshBtn=$('<button class="w3-bar-item w3-button w3-black"><i class="fa fa-refresh"></i></button>')
        var expBtn=$('<button class="w3-bar-item w3-button w3-green"><i class="fa fa-arrow-circle-o-up"></i></button>')    
        this.DOM.append(refreshBtn,expBtn,impBtn,actualImportTwinsBtn)
        refreshBtn.on("click",()=>{this.refreshInfomation()})
        expBtn.on("click",()=>{
            //find out the twins in selection and their connections (filter both src and target within the selected twins)
            //and export them
            this.exportSelected()
        })    
    }else{
        this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to select multiple in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press ctrl or shift key to select multiple in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:5px'>Import twins data by clicking button below</a>")
        this.DOM.append(impBtn,actualImportTwinsBtn)
    }
    
    impBtn.on("click",()=>{actualImportTwinsBtn.trigger('click');})
    actualImportTwinsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readTwinsFilesContentAndImport(files)
        actualImportTwinsBtn.val("")
    })
    if(selectType==null) return;

    if(selectType=="singleRelationship"){
        var delBtn =  $('<button style="width:50%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        this.DOM.append(delBtn)
        delBtn.on("click",()=>{this.deleteSelected()})
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var delBtn = $('<button style="width:50%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        var connectToBtn =$('<button style="width:45%"  class="w3-button w3-border">Connect to</button>')
        var connectFromBtn = $('<button style="width:45%" class="w3-button w3-border">Connect from</button>')
        var showInboundBtn = $('<button  style="width:45%" class="w3-button w3-border">Query Inbound</button>')
        var showOutBoundBtn = $('<button style="width:45%" class="w3-button w3-border">Query Outbound</button>')
        
        this.DOM.append(delBtn, connectToBtn,connectFromBtn , showInboundBtn, showOutBoundBtn)
    
        showOutBoundBtn.on("click",()=>{this.showOutBound()})
        showInboundBtn.on("click",()=>{this.showInBound()})  
        connectToBtn.on("click",()=>{this.broadcastMessage({ "message": "connectTo"}) })
        connectFromBtn.on("click",()=>{this.broadcastMessage({ "message": "connectFrom"}) })

        delBtn.on("click",()=>{this.deleteSelected()})
    }
    
    var numOfNode = 0;
    var arr=this.selectedObjects;
    arr.forEach(element => {
        if (element['$dtId']) numOfNode++
    });
    if(numOfNode>0){
        var selectInboundBtn = $('<button class="w3-button w3-border">+Select Inbound</button>')
        var selectOutBoundBtn = $('<button class="w3-button w3-border">+Select Outbound</button>')
        var coseLayoutBtn= $('<button class="w3-button w3-border">COSE View</button>')
        var hideBtn= $('<button class="w3-button w3-border">Hide</button>')
        this.DOM.append(selectInboundBtn, selectOutBoundBtn,coseLayoutBtn,hideBtn)

        selectInboundBtn.on("click",()=>{this.broadcastMessage({"message": "addSelectInbound"})})
        selectOutBoundBtn.on("click",()=>{this.broadcastMessage({"message": "addSelectOutbound"})})
        coseLayoutBtn.on("click",()=>{this.broadcastMessage({"message": "COSESelectedNodes"})})
        hideBtn.on("click",()=>{this.broadcastMessage({"message": "hideSelectedNodes"})})
    }
}

infoPanel.prototype.exportSelected=async function(){
    var arr=this.selectedObjects;
    if(arr.length==0) return;
    var twinIDArr=[]
    var twinToBeStored=[]
    var twinIDs={}
    arr.forEach(element => {
        if (element['$sourceId']) return
        twinIDArr.push(element['$dtId'])
        var anExpTwin={}
        anExpTwin["$metadata"]={"$model":element["$metadata"]["$model"]}
        for(var ind in element){
            if(ind=="$metadata" || ind=="$etag") continue 
            else anExpTwin[ind]=element[ind]
        }
        twinToBeStored.push(anExpTwin)
        twinIDs[element['$dtId']]=1
    });
    var relationsToBeStored=[]
    twinIDArr.forEach(oneID=>{
        var relations=globalCache.storedOutboundRelationships[oneID]
        if(!relations) return;
        relations.forEach(oneRelation=>{
            var targetID=oneRelation["$targetId"]
            if(twinIDs[targetID]) {
                var obj={}
                for(var ind in oneRelation){
                    if(ind =="$etag"||ind =="$relationshipId"||ind =="$sourceId"||ind =="sourceModel") continue
                    obj[ind]=oneRelation[ind]
                }
                var oneAction={"$srcId":oneID,
                                "$relationshipId":oneRelation["$relationshipId"],
                                "obj":obj}
                relationsToBeStored.push(oneAction)
            }
        })
    })
    var finalJSON={"twins":twinToBeStored,"relations":relationsToBeStored}
    var pom = $("<a></a>")
    pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(finalJSON)));
    pom.attr('download', "exportTwinsData.json");
    pom[0].click()
}

infoPanel.prototype.readOneFile= async function(aFile){
    return new Promise((resolve, reject) => {
        try{
            var reader = new FileReader();
            reader.onload = ()=> {
                resolve(reader.result)
            };
            reader.readAsText(aFile);
        }catch(e){
            reject(e)
        }
    })
}

infoPanel.prototype.readTwinsFilesContentAndImport=async function(files){
    var importTwins=[]
    var importRelations=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            if(obj.twins) importTwins=importTwins.concat(obj.twins)
            if(obj.relations) importRelations=importRelations.concat(obj.relations)
        }catch(err){
            alert(err)
        }
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    var oldTwinID2NewID={}
    importTwins.forEach(oneTwin=>{
        var oldID= oneTwin["$dtId"]
        var newID=uuidv4();
        oldTwinID2NewID[oldID]=newID
        oneTwin["$dtId"]=newID
    })

    for(var i=importRelations.length-1;i>=0;i--){
        var oneRel=importRelations[i]
        if(oldTwinID2NewID[oneRel["$srcId"]]==null || oldTwinID2NewID[oneRel["obj"]["$targetId"]]==null){
            importRelations.splice(i,1)
        } else{
            oneRel["$srcId"]=oldTwinID2NewID[oneRel["$srcId"]]
            oneRel["obj"]["$targetId"]=oldTwinID2NewID[oneRel["obj"]["$targetId"]]
            oneRel["$relationshipId"]=uuidv4();
        }
    }


    try{
        var re = await msalHelper.callAPI("digitaltwin/batchImportTwins", "POST", {"twins":JSON.stringify(importTwins)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return;
    }

    re.DBTwins=JSON.parse(re.DBTwins)
    re.ADTTwins=JSON.parse(re.ADTTwins)
    re.DBTwins.forEach(DBTwin=>{ globalCache.storeSingleDBTwin(DBTwin) })
    var adtTwins=[]
    re.ADTTwins.forEach(ADTTwin=>{
        globalCache.storeSingleADTTwin(ADTTwin)
        adtTwins.push(ADTTwin)
    })

    this.broadcastMessage({ "message": "addNewTwins", "twinsInfo": adtTwins })

    //continue to import relations
    try{
        var relationsImported = await msalHelper.callAPI("digitaltwin/createRelations", "POST",  {actions:JSON.stringify(importRelations)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    globalCache.storeTwinRelationships_append(relationsImported)
    this.broadcastMessage({ "message": "drawAllRelations",info:relationsImported})

    var numOfTwins=adtTwins.length
    var numOfRelations=relationsImported.length
    var str="Add "+numOfTwins+ " node"+((numOfTwins<=1)?"":"s")+` (from ${importTwins.length})`
    str+=" and "+numOfRelations+" relationship"+((numOfRelations<=1)?"":"s")+` (from ${importRelations.length})`
    var confirmDialogDiv = new simpleConfirmDialog()
    confirmDialogDiv.show(
        { width: "400px" },
        {
            title: "Import Result"
            , content:str
            , buttons: [
                {
                    colorClass: "w3-gray", text: "Ok", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
    
}

infoPanel.prototype.refreshInfomation=async function(){
    var twinIDs=[]
    this.selectedObjects.forEach(oneItem=>{  if(oneItem['$dtId']) twinIDs.push(oneItem['$dtId'])  })
    try{
        var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
        twinsdata.forEach(oneRe=>{
            var twinID= oneRe['$dtId']
            if(globalCache.storedTwins[twinID]!=null){
                for(var ind in oneRe)  globalCache.storeSingleADTTwin(oneRe[ind])
            }
        })
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }

    while(twinIDs.length>0){
        var smallArr= twinIDs.splice(0, 100);
        try{
            var data = await msalHelper.callAPI("digitaltwin/getRelationshipsFromTwinIDs", "POST", smallArr)
            if (data == "") continue;
            globalCache.storeTwinRelationships(data) //store them in global available array
            this.broadcastMessage({ "message": "drawAllRelations", info: data })
        } catch (e) {
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
    //redraw infopanel if needed
    if(this.selectedObjects.length==1) this.rxMessage({ "message": "showInfoSelectedNodes", info: this.selectedObjects })

}


infoPanel.prototype.deleteSelected=async function(){
    var arr=this.selectedObjects;
    if(arr.length==0) return;
    var relationsArr=[]
    var twinIDArr=[]
    var twinIDs={}
    arr.forEach(element => {
        if (element['$sourceId']) relationsArr.push(element);
        else{
            twinIDArr.push(element['$dtId'])
            twinIDs[element['$dtId']]=1
        }
    });
    for(var i=relationsArr.length-1;i>=0;i--){ //clear those relationships that are going to be deleted after twins deleting
        var srcId=  relationsArr[i]['$sourceId']
        var targetId = relationsArr[i]['$targetId']
        if(twinIDs[srcId]!=null || twinIDs[targetId]!=null){
            relationsArr.splice(i,1)
        }
    }
    var confirmDialogDiv = new simpleConfirmDialog()
    var dialogStr=""
    var twinNumber=twinIDArr.length;
    var relationsNumber = relationsArr.length;
    if(twinNumber>0) dialogStr =  twinNumber+" twin"+((twinNumber>1)?"s":"") + " (with connected relations)"
    if(twinNumber>0 && relationsNumber>0) dialogStr+=" and additional "
    if(relationsNumber>0) dialogStr +=  relationsNumber+" relation"+((relationsNumber>1)?"s":"" )
    dialogStr+=" will be deleted. Please confirm"
    confirmDialogDiv.show(
        { width: "350px" },
        {
            title: "Confirm"
            , content:dialogStr
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        confirmDialogDiv.close()
                        this.DOM.empty()
                        this.drawButtons(null)
                        if (relationsArr.length > 0) await this.deleteRelations(relationsArr)
                        if (twinIDArr.length > 0) await this.deleteTwins(twinIDArr)
                    }
                },
                {
                    colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
}

infoPanel.prototype.deleteTwins=async function(twinIDArr){
    var ioTDevices=[]
    twinIDArr.forEach(oneTwinID=>{
        var dbTwinInfo=globalCache.getSingleDBTwinByID(oneTwinID)
        if(dbTwinInfo.IoTDeviceID!=null && dbTwinInfo.IoTDeviceID!=""){
            ioTDevices.push(dbTwinInfo.IoTDeviceID)
        }
    })
    if(ioTDevices.length>0){
        msalHelper.callAPI("devicemanagement/unregisterIoTDevices", "POST", {arr:ioTDevices})
    }
    

    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        
        try{
            var result = await msalHelper.callAPI("digitaltwin/deleteTwins", "POST", {arr:smallArr})
            result.forEach((oneID)=>{
                delete globalCache.storedTwins[oneID]
                delete globalCache.storedOutboundRelationships[oneID]
            });
            this.broadcastMessage({ "message": "twinsDeleted",twinIDArr:result})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.deleteRelations=async function(relationsArr){
    var arr=[]
    relationsArr.forEach(oneRelation=>{
        arr.push({srcID:oneRelation['$sourceId'],relID:oneRelation['$relationshipId']})
    })
    try{
        var data = await msalHelper.callAPI("digitaltwin/deleteRelations", "POST", {"relations":arr})
        globalCache.storeTwinRelationships_remove(data)
        this.broadcastMessage({ "message": "relationsDeleted","relations":data})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

infoPanel.prototype.showOutBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr = twinIDArr.splice(0, 100);

        var knownTargetTwins = {}
        smallArr.forEach(oneID => {
            knownTargetTwins[oneID] = 1 //itself also is known
            var outBoundRelation = globalCache.storedOutboundRelationships[oneID]
            if (outBoundRelation) {
                outBoundRelation.forEach(oneRelation => {
                    var targetID = oneRelation["$targetId"]
                    if (globalCache.storedTwins[targetID] != null) knownTargetTwins[targetID] = 1
                })
            }
        })

        try{
            var data = await msalHelper.callAPI("digitaltwin/queryOutBound", "POST",  { arr: smallArr, "knownTargets": knownTargetTwins })
            //new twin's relationship should be stored as well
            globalCache.storeTwinRelationships(data.newTwinRelations)
            data.childTwinsAndRelations.forEach(oneSet=>{
                for(var ind in oneSet.childTwins){
                    var oneTwin=oneSet.childTwins[ind]
                    globalCache.storeSingleADTTwin(oneTwin)
                }
            })
            this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.showInBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var knownSourceTwins = {}
        var IDDict = {}
        smallArr.forEach(oneID => {
            IDDict[oneID] = 1
            knownSourceTwins[oneID] = 1 //itself also is known
        })
        for (var twinID in globalCache.storedOutboundRelationships) {
            var relations = globalCache.storedOutboundRelationships[twinID]
            relations.forEach(oneRelation => {
                var targetID = oneRelation['$targetId']
                var srcID = oneRelation['$sourceId']
                if (IDDict[targetID] != null) {
                    if (globalCache.storedTwins[srcID] != null) knownSourceTwins[srcID] = 1
                }
            })
        }

        try{
            var data = await msalHelper.callAPI("digitaltwin/queryInBound", "POST",  { arr: smallArr, "knownSources": knownSourceTwins })
            //new twin's relationship should be stored as well
            globalCache.storeTwinRelationships(data.newTwinRelations)
            data.childTwinsAndRelations.forEach(oneSet=>{
                for(var ind in oneSet.childTwins){
                    var oneTwin=oneSet.childTwins[ind]
                    globalCache.storeSingleADTTwin(oneTwin)
                }
            })
            this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.drawMultipleObj=function(){
    var numOfEdge = 0;
    var numOfNode = 0;
    var arr=this.selectedObjects;
    if(arr==null) return;
    arr.forEach(element => {
        if (element['$sourceId']) numOfEdge++
        else numOfNode++
    });
    var textDiv=$("<label style='display:block;margin-top:10px'></label>")
    textDiv.text(numOfNode+ " node"+((numOfNode<=1)?"":"s")+", "+numOfEdge+" relationship"+((numOfEdge<=1)?"":"s"))
    this.DOM.append(textDiv)
}

infoPanel.prototype.drawStaticInfo=function(parent,jsonInfo,paddingTop,fontSize){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div class='w3-border' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        keyDiv.css({"fontSize":fontSize,"color":"darkGray"})
        parent.append(keyDiv)
        keyDiv.css("padding-top",paddingTop)

        var contentDOM=$("<label></label>")
        if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawStaticInfo(contentDOM,jsonInfo[ind],".5em",fontSize)
        }else {
            contentDOM.css("padding-top",".2em")
            contentDOM.text(jsonInfo[ind])
        }
        contentDOM.css({"fontSize":fontSize,"color":"black"})
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; font-weight:bold;color:black'>"+ind+"</div></label>")
        parent.append(keyDiv)
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(Array.isArray(jsonInfo[ind])){
            this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],originElementInfo)
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath)
        }else {
            var aInput=$('<input type="text" style="padding:2px;width:50%;outline:none;display:inline" placeholder="type: '+jsonInfo[ind]+'"/>').addClass("w3-input w3-border");  
            contentDOM.append(aInput)
            var val=this.searchValue(originElementInfo,newPath)
            if(val!=null) aInput.val(val)
            aInput.data("path", newPath)
            aInput.data("dataType", jsonInfo[ind])
            aInput.change((e)=>{
                this.editDTProperty(originElementInfo,$(e.target).data("path"),$(e.target).val(),$(e.target).data("dataType"))
            })
        }
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawDropdownOption=function(contentDOM,newPath,valueArr,originElementInfo){
    var aSelectMenu=new simpleSelectMenu("",{buttonCSS:{"padding":"4px 16px"}})
    contentDOM.append(aSelectMenu.DOM)
    aSelectMenu.DOM.data("path", newPath)
    valueArr.forEach((oneOption)=>{
        var str =oneOption["displayName"]  || oneOption["enumValue"] 
        aSelectMenu.addOption(str)
    })
    aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        aSelectMenu.changeName(optionText)
        if(realMouseClick) this.editDTProperty(originElementInfo,aSelectMenu.DOM.data("path"),optionValue,"string")
    }
    var val=this.searchValue(originElementInfo,newPath)
    if(val!=null){
        aSelectMenu.triggerOptionValue(val)
    }    
}

infoPanel.prototype.editDTProperty=async function(originElementInfo,path,newVal,dataType){
    if(["double","boolean","float","integer","long"].includes(dataType)) newVal=Number(newVal)

    //{ "op": "add", "path": "/x", "value": 30 }
    if(path.length==1){
        var str=""
        path.forEach(segment=>{str+="/"+segment})
        var jsonPatch=[ { "op": "add", "path": str, "value": newVal} ]
    }else{
        //it is a property inside a object type of root property,update the whole root property
        var rootProperty=path[0]
        var patchValue= originElementInfo[rootProperty]
        if(patchValue==null) patchValue={}
        else patchValue=JSON.parse(JSON.stringify(patchValue)) //make a copy
        this.updateOriginObjectValue(patchValue,path.slice(1),newVal)
        
        var jsonPatch=[ { "op": "add", "path": "/"+rootProperty, "value": patchValue} ]
    }

    if(originElementInfo["$dtId"]){ //edit a node property
        var twinID = originElementInfo["$dtId"]
        var payLoad={"jsonPatch":JSON.stringify(jsonPatch),"twinID":twinID}
    }else if(originElementInfo["$relationshipId"]){ //edit a relationship property
        var twinID = originElementInfo["$sourceId"]
        var relationshipID = originElementInfo["$relationshipId"]
        var payLoad={"jsonPatch":JSON.stringify(jsonPatch),"twinID":twinID,"relationshipID":relationshipID}
    }
    
    
    try{
        await msalHelper.callAPI("digitaltwin/changeAttribute", "POST", payLoad)
        this.updateOriginObjectValue(originElementInfo,path,newVal)
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    
}

infoPanel.prototype.updateOriginObjectValue=function(nodeInfo,pathArr,newVal){
    if(pathArr.length==0) return;
    var theJson=nodeInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]

        if(i==pathArr.length-1){
            theJson[key]=newVal
            break
        }
        if(theJson[key]==null) theJson[key]={}
        theJson=theJson[key]
    }
    return
}

infoPanel.prototype.searchValue=function(originElementInfo,pathArr){
    if(pathArr.length==0) return null;
    var theJson=originElementInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]
        theJson=theJson[key]
        if(theJson==null) return null;
    }
    return theJson //it should be the final value
}

module.exports = new infoPanel();
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":13,"../sharedSourceFiles/modelAnalyzer":14,"../sharedSourceFiles/simpleConfirmDialog":19,"../sharedSourceFiles/simpleSelectMenu":20}],7:[function(require,module,exports){
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const globalCache = require("../sharedSourceFiles/globalCache")
const moduleSwitchDialog=require("../sharedSourceFiles/moduleSwitchDialog")

function mainToolbar() {
}

mainToolbar.prototype.render = function () {
    $("#mainToolBar").addClass("w3-bar w3-red")
    $("#mainToolBar").css({"z-index":100,"overflow":"visible"})

    this.switchADTInstanceBtn=$('<a class="w3-bar-item w3-button" href="#">Source</a>')
    this.modelIOBtn=$('<a class="w3-bar-item w3-button" href="#">Models</a>')
    this.showForgeViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">ForgeView</a>')
    this.showGISViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">GISView</a>')
    this.editLayoutBtn=$('<a class="w3-bar-item w3-button" href="#"><i class="fa fa-edit"></i></a>')

    this.testSignalRBtn=$('<a class="w3-bar-item w3-button w3-amber" href="#">Test SignalR</a>')
    this.testSendSignalRBtn=$('<a class="w3-bar-item w3-button w3-amber" href="#">send SignalR message</a>')


    this.switchLayoutSelector=new simpleSelectMenu("Layout")

    $("#mainToolBar").empty()
    $("#mainToolBar").append(moduleSwitchDialog.modulesSidebar)
    $("#mainToolBar").append(moduleSwitchDialog.modulesSwitchButton, this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn
        ,this.switchLayoutSelector.DOM,this.editLayoutBtn)
        //,this.testSignalRBtn,this.testSendSignalRBtn

    this.switchADTInstanceBtn.on("click",()=>{ startSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })


    this.testSendSignalRBtn.on("click",async ()=>{
        const msalHelper=require("../msalHelper")
        var re = await msalHelper.callAzureFunctionsService("messages","POST",{
            recipient: "5eb81f5f-fd9e-481d-996b-4d0b9536f477",
            text: "how do you do"
          })
    })
    this.testSignalRBtn.on("click",async ()=>{
        const msalHelper=require("../msalHelper")
        var signalRInfo = await msalHelper.callAzureFunctionsService("negotiate?name=ff","GET")
        const connection = new signalR.HubConnectionBuilder()
        .withUrl(signalRInfo.url, {accessTokenFactory: () => signalRInfo.accessToken})
        //.configureLogging(signalR.LogLevel.Information)
        .configureLogging(signalR.LogLevel.Warning)
        .build();
        console.log(signalRInfo.accessToken)

        connection.on('newMessage', (message)=>{
            console.log(message)
        });
        connection.onclose(() => console.log('disconnected'));
        console.log('connecting...');
        connection.start()
          .then(() => console.log('connected!'))
          .catch(console.error);
    })


    this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
        globalCache.currentLayoutName=optionValue
        this.broadcastMessage({ "message": "layoutChange"})
        if(optionValue=="[NA]") this.switchLayoutSelector.changeName("Layout","")
        else this.switchLayoutSelector.changeName("Layout:",optionText)
    }
}

mainToolbar.prototype.updateLayoutSelector = function () {
    var curSelect=this.switchLayoutSelector.curSelectVal
    this.switchLayoutSelector.clearOptions()
    this.switchLayoutSelector.addOption('[No Layout Specified]','[NA]')

    for (var ind in globalCache.layoutJSON) {
        this.switchLayoutSelector.addOption(ind)
    }

    if(curSelect!=null && this.switchLayoutSelector.findOption(curSelect)==null) this.switchLayoutSelector.changeName("Layout","")
}

mainToolbar.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="layoutsUpdated") {
        this.updateLayoutSelector()
    }
}

module.exports = new mainToolbar();
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":13,"../sharedSourceFiles/modelManagerDialog":16,"../sharedSourceFiles/moduleSwitchDialog":17,"../sharedSourceFiles/simpleSelectMenu":20,"./editLayoutDialog":5,"./startSelectionDialog":8}],8:[function(require,module,exports){
const globalCache = require("../sharedSourceFiles/globalCache")

function startSelectionDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

startSelectionDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:665px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Select Twins</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)

    this.buttonHolder = $("<div style='height:100%'></div>")
    this.contentDOM.children(':first').append(this.buttonHolder)
    closeButton.on("click", () => {
        this.useStartSelection("append")
        this.closeDialog() 
    })

    var replaceButton = $('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%; margin-right:8px">Replace All Data</button>')
    var appendButton = $('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%">Append Data</button>')

    replaceButton.on("click", () => { this.useStartSelection("replace") })
    appendButton.on("click", () => { this.useStartSelection("append") })
    this.buttonHolder.append(replaceButton, appendButton)

    var panelHeight=450
    var row2=$('<div class="w3-cell-row"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div style="padding:5px;width:230px;padding-right:5px;overflow:hidden"></div>')
    row2.append(leftSpan)
    this.leftSpan=leftSpan

    var rightSpan=$('<div class="w3-container w3-cell" style="padding-top:10px;"></div>')
    row2.append(rightSpan) 
    rightSpan.append($('<div class="w3-container w3-card" style="color:gray;height:'+(panelHeight-10)+'px;overflow:auto;width:410px;"></div>'))
    var selectedTwinsDOM=$("<table style='width:100%'></table>")
    selectedTwinsDOM.css({"border-collapse":"collapse"})
    rightSpan.children(':first').append(selectedTwinsDOM)
    this.selectedTwinsDOM=selectedTwinsDOM 

    this.leftSpan.append($('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Select Twins from<p style="position:absolute;text-align:left;font-weight:normal;top:-10px;width:200px" class="w3-text w3-tag w3-tiny">choose one or more models</p></div></div>'))

    this.modelsCheckBoxes=$('<form class="w3-container w3-border" style="height:'+(panelHeight-40)+'px;overflow:auto"></form>')
    leftSpan.append(this.modelsCheckBoxes)
    this.fillAvailableModels()

    this.listTwins()
}

startSelectionDialog.prototype.closeDialog=function(){
    this.DOM.hide()
    this.broadcastMessage({ "message": "startSelectionDialog_closed"})
}

startSelectionDialog.prototype.fillAvailableModels = function() {
    this.modelsCheckBoxes.append('<input class="w3-check" type="checkbox" id="ALL"><label style="padding-left:5px"><b>ALL</b></label><p/>')
    globalCache.DBModelsArr.forEach(oneModel=>{
        var modelName=oneModel["displayName"]
        var modelID=oneModel["id"]
        this.modelsCheckBoxes.append(`<input class="w3-check" type="checkbox" id="${modelID}"><label style="padding-left:5px">${modelName}</label><p/>`)
    })
    this.modelsCheckBoxes.on("change",(evt)=>{
        if($(evt.target).attr("id")=="ALL"){
            //select all the other input
            var val=$(evt.target).prop("checked")
            this.modelsCheckBoxes.children('input').each(function () {
                $(this).prop("checked",val)
            });
        }
        this.listTwins()
    })
}

startSelectionDialog.prototype.getSelectedTwins=function(){
    var reArr=[]
    var chosenModels={}
    this.modelsCheckBoxes.children('input').each(function () {
        if(!$(this).prop("checked")) return;
        if($(this).attr("id")=="ALL") return;
        chosenModels[$(this).attr("id")]=1
    });
    globalCache.DBTwinsArr.forEach(aTwin=>{
        if(chosenModels[aTwin["modelID"]])  reArr.push(aTwin)
    })
    return reArr;
}

startSelectionDialog.prototype.listTwins=function(){
    this.selectedTwinsDOM.empty()
    var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey;font-weight:bold">ID</td><td style="border-bottom:solid 1px lightgrey;font-weight:bold">MODEL</td></tr>')
    this.selectedTwinsDOM.append(tr)

    var selectedTwins=this.getSelectedTwins()
    selectedTwins.forEach(aTwin=>{
        var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey">'+aTwin["displayName"]+'</td><td style="border-bottom:solid 1px lightgrey">'+aTwin['modelID']+'</td></tr>')
        this.selectedTwinsDOM.append(tr)
    })
    if(selectedTwins.length==0){
        var tr=$('<tr><td style="color:gray">zero record</td><td></td></tr>')
        this.selectedTwinsDOM.append(tr)    
    }
}


startSelectionDialog.prototype.useStartSelection=function(action){
    var selectedTwins=this.getSelectedTwins()
    var twinIDs=[]
    selectedTwins.forEach(aTwin=>{twinIDs.push(aTwin["id"])})

    var modelIDs=[]
    globalCache.DBModelsArr.forEach(oneModel=>{modelIDs.push(oneModel["id"])})

    this.broadcastMessage({ "message": "startSelection_"+action, "twinIDs": twinIDs,"modelIDs":modelIDs })
    this.closeDialog()
}

module.exports = new startSelectionDialog();
},{"../sharedSourceFiles/globalCache":13}],9:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu = require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function topologyDOM(DOM){
    this.DOM=DOM
    this.defaultNodeSize=30
    this.nodeSizeModelAdjustmentRatio={}
}

topologyDOM.prototype.init=function(){
    cytoscape.warnings(false)  
    this.core = cytoscape({
        container:  this.DOM[0], // container to render in

        // initial viewport state:
        zoom: 1,
        pan: { x: 0, y: 0 },

        // interaction options:
        minZoom: 0.1,
        maxZoom: 10,
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: true,
        selectionType: 'single',
        touchTapThreshold: 8,
        desktopTapThreshold: 4,
        autolock: false,
        autoungrabify: false,
        autounselectify: false,

        // rendering options:
        headless: false,
        styleEnabled: true,
        hideEdgesOnViewport: false,
        textureOnViewport: false,
        motionBlur: false,
        motionBlurOpacity: 0.2,
        wheelSensitivity: 0.3,
        pixelRatio: 'auto',

        elements: [], // list of graph elements to start with

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    "width":this.defaultNodeSize,"height":this.defaultNodeSize,
                    'label': 'data(id)',
                    'opacity':0.9,
                    'font-size':"12px",
                    'font-family':'Geneva, Arial, Helvetica, sans-serif'
                    //,'background-image': function(ele){ return "images/cat.png"; }
                    //,'background-fit':'contain' //cover
                    //'background-color': function( ele ){ return ele.data('bg') }
                    ,'background-width':'70%'
                    ,'background-height':'70%'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width':2,
                    'line-color': '#888',
                    'target-arrow-color': '#555',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale':0.6
                }
            },
            {selector: 'edge:selected',
            style: {
                'width': 3,
                'line-color': 'red',
                'target-arrow-color': 'red',
                'source-arrow-color': 'red',
                'line-fill':"linear-gradient",
                'line-gradient-stop-colors':['cyan', 'magenta', 'yellow'],
                'line-gradient-stop-positions':['0%','70%','100%']
            }},
            {selector: 'node:selected',
            style: {
                'border-color':"red",
                'border-width':2,
                'background-fill':'radial-gradient',
                'background-gradient-stop-colors':['cyan', 'magenta', 'yellow'],
                'background-gradient-stop-positions':['0%','50%','60%']
            }},
            {selector: 'node.hover',
            style: {
                'background-blacken':0.5
            }}
            
            ,{selector: 'edge.hover',
            style: {
                'width':5
            }}
            
        ]
    });

    //cytoscape edge editing plug-in
    this.core.edgeEditing({
        undoable: true,
        bendRemovalSensitivity: 16,
        enableMultipleAnchorRemovalOption: true,
        stickyAnchorTolerence: 20,
        anchorShapeSizeFactor: 5,
        enableAnchorSizeNotImpactByZoom:true,
        enableRemoveAnchorMidOfNearLine:false,
        enableCreateAnchorOnDrag:false
    });

    
    this.core.boxSelectionEnabled(true)


    this.core.on('tapselect', ()=>{this.selectFunction()});
    this.core.on('tapunselect', ()=>{this.selectFunction()});

    this.core.on('boxend',(e)=>{//put inside boxend event to trigger only one time, and repleatly after each box select
        this.core.one('boxselect',()=>{this.selectFunction()})
    })

    this.core.on('cxttap',(e)=>{
        this.cancelTargetNodeMode()
    })

    this.core.on('mouseover',e=>{

        this.mouseOverFunction(e)
    })
    this.core.on('mouseout',e=>{
        this.mouseOutFunction(e)
    })
    
    this.core.on('zoom',(e)=>{
        var fs=this.getFontSizeInCurrentZoom();
        var dimension=this.getNodeSizeInCurrentZoom();
        this.core.style()
            .selector('node')
            .style({ 'font-size': fs, width: dimension, height: dimension })
            .update()
        for (var modelID in this.nodeSizeModelAdjustmentRatio) {
            var newDimension = Math.ceil(this.nodeSizeModelAdjustmentRatio[modelID] * dimension)
            this.core.style()
                .selector('node[modelID = "' + modelID + '"]')
                .style({ width: newDimension, height: newDimension })
                .update()
        }
        this.core.style()
            .selector('node:selected')
            .style({ 'border-width': Math.ceil(dimension / 15) })
            .update()
    })

    var instance = this.core.edgeEditing('get');
    var tapdragHandler=(e) => {
        instance.keepAnchorsAbsolutePositionDuringMoving()
        if(e.target.isNode && e.target.isNode()) this.draggingNode=e.target
        this.smartPositionNode(e.position)
    }
    var setOneTimeGrab = () => {
        this.core.once("grab", (e) => {
            var draggingNodes = this.core.collection()
            if (e.target.isNode()) draggingNodes.merge(e.target)
            var arr = this.core.$(":selected")
            arr.forEach((ele) => {
                if (ele.isNode()) draggingNodes.merge(ele)
            })
            instance.storeAnchorsAbsolutePosition(draggingNodes)
            this.core.on("tapdrag",tapdragHandler )
            setOneTimeFree()
        })
    }
    var setOneTimeFree = () => {
        this.core.once("free", (e) => {
            var instance = this.core.edgeEditing('get');
            instance.resetAnchorsAbsolutePosition()
            this.draggingNode=null
            setOneTimeGrab()
            this.core.removeListener("tapdrag",tapdragHandler)
        })
    }
    setOneTimeGrab()
    this.core.trigger("zoom")
}

topologyDOM.prototype.smartPositionNode = function (mousePosition) {
    var zoomLevel=this.core.zoom()
    if(!this.draggingNode) return
    //comparing nodes set: its connectfrom nodes and their connectto nodes, its connectto nodes and their connectfrom nodes
    var incomers=this.draggingNode.incomers()
    var outerFromIncom= incomers.outgoers()
    var outer=this.draggingNode.outgoers()
    var incomFromOuter=outer.incomers()
    var monitorSet=incomers.union(outerFromIncom).union(outer).union(incomFromOuter).filter('node').unmerge(this.draggingNode)

    var returnExpectedPos=(diffArr,posArr)=>{
        var minDistance=Math.min(...diffArr)
        if(minDistance*zoomLevel < 10)  return posArr[diffArr.indexOf(minDistance)]
        else return null;
    }

    var xDiff=[]
    var xPos=[]
    var yDiff=[]
    var yPos=[]
    monitorSet.forEach((ele)=>{
        xDiff.push(Math.abs(ele.position().x-mousePosition.x))
        xPos.push(ele.position().x)
        yDiff.push(Math.abs(ele.position().y-mousePosition.y))
        yPos.push(ele.position().y)
    })
    var prefX=returnExpectedPos(xDiff,xPos)
    var prefY=returnExpectedPos(yDiff,yPos)
    if(prefX!=null) {
        this.draggingNode.position('x', prefX);
    }
    if(prefY!=null) {
        this.draggingNode.position('y', prefY);
    }
    //console.log("----")
    //monitorSet.forEach((ele)=>{console.log(ele.id())})
    //console.log(monitorSet.size())
}

topologyDOM.prototype.mouseOverFunction= function (e) {
    if(!e.target.data) return
    
    var info=e.target.data().originalInfo
    if(info==null) return;
    if(this.lastHoverTarget) this.lastHoverTarget.removeClass("hover")
    this.lastHoverTarget=e.target
    e.target.addClass("hover")
    this.broadcastMessage({ "message": "showInfoSelectedNodes", "info": [info] })
}

topologyDOM.prototype.mouseOutFunction= function (e) {
    this.selectFunction()
    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 

}

topologyDOM.prototype.selectFunction = function () {
    var arr = this.core.$(":selected")
    var re = []
    arr.forEach((ele) => { re.push(ele.data().originalInfo) })
    this.broadcastMessage({ "message": "showInfoSelectedNodes", info: re })

    //for debugging purpose
    //arr.forEach((ele)=>{
    //  console.log("")
    //})
}

topologyDOM.prototype.getFontSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    if(curZoom>1){
        var maxFS=12
        var minFS=5
        var ratio= (maxFS/minFS-1)/9*(curZoom-1)+1
        var fs=Math.ceil(maxFS/ratio)
    }else{
        var maxFS=120
        var minFS=12
        var ratio= (maxFS/minFS-1)/9*(1/curZoom-1)+1
        var fs=Math.ceil(minFS*ratio)
    }
    return fs;
}

topologyDOM.prototype.getNodeSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    if(curZoom>1){//scale up but not too much
        var ratio= (curZoom-1)*(2-1)/9+1
        return Math.ceil(this.defaultNodeSize/ratio)
    }else{
        var ratio= (1/curZoom-1)*(4-1)/9+1
        return Math.ceil(this.defaultNodeSize*ratio)
    }
}


topologyDOM.prototype.updateModelAvarta=function(modelID,dataUrl){
    try{
        this.core.style() 
        .selector('node[modelID = "'+modelID+'"]')
        .style({'background-image': dataUrl})
        .update()   
    }catch(e){
        
    }
    
}
topologyDOM.prototype.updateModelTwinColor=function(modelID,colorCode){
    this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'background-color': colorCode})
        .update()   
}

topologyDOM.prototype.updateModelTwinShape=function(modelID,shape){
    if(shape=="hexagon"){
        this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'shape': 'polygon','shape-polygon-points':[0,-1,0.866,-0.5,0.866,0.5,0,1,-0.866,0.5,-0.866,-0.5]})
        .update()   
    }else{
        this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'shape': shape})
        .update()   
    }
    
}
topologyDOM.prototype.updateModelTwinDimension=function(modelID,dimensionRatio){
    this.nodeSizeModelAdjustmentRatio[modelID]=parseFloat(dimensionRatio)
    this.core.trigger("zoom")
}

topologyDOM.prototype.updateRelationshipColor=function(srcModelID,relationshipName,colorCode){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-color': colorCode})
        .update()   
}

topologyDOM.prototype.updateRelationshipShape=function(srcModelID,relationshipName,shape){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-style': shape})
        .update()   
}
topologyDOM.prototype.updateRelationshipWidth=function(srcModelID,relationshipName,edgeWidth){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)})
        .update()   
    this.core.style()
        .selector('edge:selected[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)+1,'line-color': 'red'})
        .update()   
    this.core.style()
        .selector('edge.hover[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)+3})
        .update()   
}

topologyDOM.prototype.deleteRelations=function(relations){
    relations.forEach(oneRelation=>{
        var srcID=oneRelation["srcID"]
        var relationID=oneRelation["relID"]
        var theNodeName=globalCache.twinIDMapToDisplayName[srcID]
        var theNode=this.core.filter('[id = "'+theNodeName+'"]');
        var edges=theNode.connectedEdges().toArray()
        for(var i=0;i<edges.length;i++){
            var anEdge=edges[i]
            if(anEdge.data("originalInfo")["$relationshipId"]==relationID){
                anEdge.remove()
                break
            }
        }
    })   
}


topologyDOM.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        var twinDisplayName=globalCache.twinIDMapToDisplayName[twinID]
        this.core.$('[id = "'+twinDisplayName+'"]').remove()
    })   
}

topologyDOM.prototype.animateANode=function(twin){
    var curDimension= twin.width()
    twin.animate({
        style: { 'height': curDimension*2,'width': curDimension*2 },
        duration: 200
    });

    setTimeout(()=>{
        twin.animate({
            style: { 'height': curDimension,'width': curDimension },
            duration: 200
            ,complete:()=>{
                twin.removeStyle() //must remove the style after animation, otherwise they will have their own style
            }
        });
    },200)
}

topologyDOM.prototype.drawTwins=function(twinsData,animation){
    var arr=[]
    for(var i=0;i<twinsData.length;i++){
        var originalInfo=twinsData[i];
        var newNode={data:{},group:"nodes"}
        newNode.data["originalInfo"]= originalInfo;
        newNode.data["id"]=originalInfo['displayName']
        var modelID=originalInfo['$metadata']['$model']
        newNode.data["modelID"]=modelID
        arr.push(newNode)
    }

    var eles = this.core.add(arr)
    if(eles.size()==0) return eles
    this.noPosition_grid(eles)
    if(animation){
        eles.forEach((ele)=>{ this.animateANode(ele) })
    }

    //if there is currently a layout there, apply it
    this.applyNewLayout()

    return eles
}

topologyDOM.prototype.drawRelations=function(relationsData){
    var relationInfoArr=[]
    for(var i=0;i<relationsData.length;i++){
        var originalInfo=relationsData[i];
        
        var theID=originalInfo['$relationshipName']+"_"+originalInfo['$relationshipId']
        var aRelation={data:{},group:"edges"}
        aRelation.data["originalInfo"]=originalInfo
        aRelation.data["id"]=theID
        aRelation.data["source"]=globalCache.twinIDMapToDisplayName[originalInfo['$sourceId']]
        aRelation.data["target"]=globalCache.twinIDMapToDisplayName[originalInfo['$targetId']]


        if(this.core.$("#"+aRelation.data["source"]).length==0 || this.core.$("#"+aRelation.data["target"]).length==0) continue
        var sourceNode=this.core.$("#"+aRelation.data["source"])
        var sourceModel=sourceNode[0].data("originalInfo")['$metadata']['$model']
        
        //add additional source node information to the original relationship information
        originalInfo['sourceModel']=sourceModel
        aRelation.data["sourceModel"]=sourceModel
        aRelation.data["relationshipName"]=originalInfo['$relationshipName']

        var existEdge=this.core.$('edge[id = "'+theID+'"]')
        if(existEdge.size()>0) {
            existEdge.data("originalInfo",originalInfo)
            continue;  //no need to draw it
        }

        relationInfoArr.push(aRelation)
    }
    if(relationInfoArr.length==0) return null;

    var edges=this.core.add(relationInfoArr)
    return edges
}

topologyDOM.prototype.reviewStoredRelationshipsToDraw=function(){
    //check the storedOutboundRelationships again and maybe some of them can be drawn now since targetNode is available
    var storedRelationArr=[]
    for(var twinID in globalCache.storedOutboundRelationships){
        storedRelationArr=storedRelationArr.concat(globalCache.storedOutboundRelationships[twinID])
    }
    this.drawRelations(storedRelationArr)
}

topologyDOM.prototype.drawTwinsAndRelations=function(data){
    var twinsAndRelations=data.childTwinsAndRelations

    //draw those new twins first
    twinsAndRelations.forEach(oneSet=>{
        var twinInfoArr=[]
        for(var ind in oneSet.childTwins) twinInfoArr.push(oneSet.childTwins[ind])
        var eles=this.drawTwins(twinInfoArr,"animation")
    })

    //draw those known twins from the relationships
    var twinsInfo={}
    twinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    this.drawTwins(tmpArr)

    //then check all stored relationships and draw if it can be drawn
    this.reviewStoredRelationshipsToDraw()
}

topologyDOM.prototype.applyVisualDefinition=function(){
    var visualJson=globalCache.visualDefinition["default"]
    if(visualJson==null) return;
    for(var modelID in visualJson){
        if(visualJson[modelID].color) this.updateModelTwinColor(modelID,visualJson[modelID].color)
        if(visualJson[modelID].shape) this.updateModelTwinShape(modelID,visualJson[modelID].shape)
        if(visualJson[modelID].avarta) this.updateModelAvarta(modelID,visualJson[modelID].avarta)
        if(visualJson[modelID].dimensionRatio) this.updateModelTwinDimension(modelID,visualJson[modelID].dimensionRatio)
        if(visualJson[modelID].rels){
            for(var relationshipName in visualJson[modelID].rels){
                if(visualJson[modelID]["rels"][relationshipName].color){
                    this.updateRelationshipColor(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].color)
                }
                if(visualJson[modelID]["rels"][relationshipName].shape){
                    this.updateRelationshipShape(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].shape)
                }
                if(visualJson[modelID]["rels"][relationshipName].edgeWidth){
                    this.updateRelationshipWidth(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].edgeWidth)
                }
            }
        }
    }
}

topologyDOM.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelection_replace"){
        this.core.nodes().remove()
    }else if(msgPayload.message=="replaceAllTwins") {
        this.core.nodes().remove()
        var eles= this.drawTwins(msgPayload.info)
        this.core.center(eles)
    }else if(msgPayload.message=="visualDefinitionRefresh") {
        this.applyVisualDefinition()
    }else if(msgPayload.message=="appendAllTwins") {
        var eles= this.drawTwins(msgPayload.info,"animate")
        this.core.center(eles)
        this.reviewStoredRelationshipsToDraw()
    }else if(msgPayload.message=="drawAllRelations"){
        var edges= this.drawRelations(msgPayload.info)
        if(edges!=null) {
            if(globalCache.currentLayoutName==null)  this.noPosition_cose()
        }
    }else if(msgPayload.message=="addNewTwin") {
        this.core.nodes().unselect()
        this.core.edges().unselect()
        this.drawTwins([msgPayload.twinInfo],"animation")
        var nodeInfo= msgPayload.twinInfo;
        var nodeName= globalCache.twinIDMapToDisplayName[nodeInfo["$dtId"]]
        var topoNode= this.core.nodes("#"+nodeName)
        if(topoNode){
            var position=topoNode.renderedPosition()
            this.core.panBy({x:-position.x+200,y:-position.y+50})
            topoNode.select()
            this.selectFunction()
        }
    }else if(msgPayload.message=="addNewTwins") {
        this.drawTwins(msgPayload.twinsInfo,"animation")
    }else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="showInfoSelectedNodes"){ //from selecting twins in the twintree
        this.core.nodes().unselect()
        this.core.edges().unselect()
        var arr=msgPayload.info;
        var mouseClickDetail=msgPayload.mouseClickDetail;
        arr.forEach(element => {
            var aTwin= this.core.nodes("#"+element['displayName'])
            aTwin.select()
            if(mouseClickDetail!=2) this.animateANode(aTwin) //ignore double click second click
        });
    }else if(msgPayload.message=="PanToNode"){
        var nodeInfo= msgPayload.info;
        var nodeName= globalCache.twinIDMapToDisplayName[nodeInfo["$dtId"]]
        var topoNode= this.core.nodes("#"+nodeName)
        if(topoNode){
            this.core.center(topoNode)
        }
    }else if(msgPayload.message=="visualDefinitionChange"){
        if(msgPayload.srcModelID){
            if(msgPayload.color) this.updateRelationshipColor(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.color)
            else if(msgPayload.shape) this.updateRelationshipShape(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.shape)
            else if(msgPayload.edgeWidth) this.updateRelationshipWidth(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.edgeWidth)
        } 
        else{
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color)
            else if(msgPayload.shape) this.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
            else if(msgPayload.avarta) this.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            else if(msgPayload.noAvarta)  this.updateModelAvarta(msgPayload.modelID,null)
            else if(msgPayload.dimensionRatio)  this.updateModelTwinDimension(msgPayload.modelID,msgPayload.dimensionRatio)
        } 
    }else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="relationsDeleted") this.deleteRelations(msgPayload.relations)
    else if(msgPayload.message=="connectTo"){ this.startTargetNodeMode("connectTo")   }
    else if(msgPayload.message=="connectFrom"){ this.startTargetNodeMode("connectFrom")   }
    else if(msgPayload.message=="addSelectOutbound"){ this.selectOutboundNodes()   }
    else if(msgPayload.message=="addSelectInbound"){ this.selectInboundNodes()   }
    else if(msgPayload.message=="hideSelectedNodes"){ this.hideSelectedNodes()   }
    else if(msgPayload.message=="COSESelectedNodes"){ this.COSESelectedNodes()   }
    else if(msgPayload.message=="saveLayout"){ this.saveLayout(msgPayload.layoutName)   }
    else if(msgPayload.message=="layoutChange"){ this.applyNewLayout()   }
}

topologyDOM.prototype.applyNewLayout = function () {
    var layoutName=globalCache.currentLayoutName
    
    var layoutDetail= globalCache.layoutJSON[layoutName]
    
    //remove all bending edge 
    this.core.edges().forEach(oneEdge=>{
        oneEdge.removeClass('edgebendediting-hasbendpoints')
        oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
    })
    
    if(layoutDetail==null) return;
    
    var storedPositions={}
    for(var ind in layoutDetail){
        storedPositions[ind]={
            x:layoutDetail[ind][0]
            ,y:layoutDetail[ind][1]
        }
    }
    var newLayout=this.core.layout({
        name: 'preset',
        positions:storedPositions,
        fit:false,
        animate: true,
        animationDuration: 300,
    })
    newLayout.run()

    //restore edges bending or control points
    var edgePointsDict=layoutDetail["edges"]
    if(edgePointsDict==null)return;
    for(var srcID in edgePointsDict){
        for(var relationshipID in edgePointsDict[srcID]){
            var obj=edgePointsDict[srcID][relationshipID]
            this.applyEdgeBendcontrolPoints(srcID,relationshipID,obj["cyedgebendeditingWeights"]
            ,obj["cyedgebendeditingDistances"],obj["cyedgecontroleditingWeights"],obj["cyedgecontroleditingDistances"])
        }
    }
}

topologyDOM.prototype.applyEdgeBendcontrolPoints = function (srcID,relationshipID
    ,cyedgebendeditingWeights,cyedgebendeditingDistances,cyedgecontroleditingWeights,cyedgecontroleditingDistances) {
        var nodeName=globalCache.twinIDMapToDisplayName[srcID]
        var theNode=this.core.filter('[id = "'+nodeName+'"]');
        var edges=theNode.connectedEdges().toArray()
        for(var i=0;i<edges.length;i++){
            var anEdge=edges[i]
            if(anEdge.data("originalInfo")["$relationshipId"]==relationshipID){
                if(cyedgebendeditingWeights){
                    anEdge.data("cyedgebendeditingWeights",cyedgebendeditingWeights)
                    anEdge.data("cyedgebendeditingDistances",cyedgebendeditingDistances)
                    anEdge.addClass('edgebendediting-hasbendpoints');
                }
                if(cyedgecontroleditingWeights){
                    anEdge.data("cyedgecontroleditingWeights",cyedgecontroleditingWeights)
                    anEdge.data("cyedgecontroleditingDistances",cyedgecontroleditingDistances)
                    anEdge.addClass('edgecontrolediting-hascontrolpoints');
                }
                
                break
            }
        }
}



topologyDOM.prototype.saveLayout = async function (layoutName) {
    var layoutDict=globalCache.layoutJSON[layoutName]
    if(!layoutDict){
        layoutDict=globalCache.layoutJSON[layoutName]={}
    }
    
    if(this.core.nodes().size()==0) return;

    //store nodes position
    this.core.nodes().forEach(oneNode=>{
        var position=oneNode.position()
        layoutDict[oneNode.id()]=[this.numberPrecision(position['x']),this.numberPrecision(position['y'])]
    })

    //store any edge bending points or controling points

    if(layoutDict.edges==null) layoutDict.edges={}
    var edgeEditInstance= this.core.edgeEditing('get');
    this.core.edges().forEach(oneEdge=>{
        var srcID=oneEdge.data("originalInfo")["$sourceId"]
        var relationshipID=oneEdge.data("originalInfo")["$relationshipId"]
        var cyedgebendeditingWeights=oneEdge.data('cyedgebendeditingWeights')
        var cyedgebendeditingDistances=oneEdge.data('cyedgebendeditingDistances')
        var cyedgecontroleditingWeights=oneEdge.data('cyedgecontroleditingWeights')
        var cyedgecontroleditingDistances=oneEdge.data('cyedgecontroleditingDistances')
        if(!cyedgebendeditingWeights && !cyedgecontroleditingWeights) return;

        if(layoutDict.edges[srcID]==null)layoutDict.edges[srcID]={}
        layoutDict.edges[srcID][relationshipID]={}
        if(cyedgebendeditingWeights && cyedgebendeditingWeights.length>0) {
            layoutDict.edges[srcID][relationshipID]["cyedgebendeditingWeights"]=this.numberPrecision(cyedgebendeditingWeights)
            layoutDict.edges[srcID][relationshipID]["cyedgebendeditingDistances"]=this.numberPrecision(cyedgebendeditingDistances)
        }
        if(cyedgecontroleditingWeights && cyedgecontroleditingWeights.length>0) {
            layoutDict.edges[srcID][relationshipID]["cyedgecontroleditingWeights"]=this.numberPrecision(cyedgecontroleditingWeights)
            layoutDict.edges[srcID][relationshipID]["cyedgecontroleditingDistances"]=this.numberPrecision(cyedgecontroleditingDistances)
        }
    })

    var saveLayoutObj={"layouts":{}}
    saveLayoutObj["layouts"][layoutName]=JSON.stringify(layoutDict)
    try{
        await msalHelper.callAPI("digitaltwin/saveLayout", "POST", saveLayoutObj)
        this.broadcastMessage({ "message": "layoutsUpdated","layoutName":layoutName})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

topologyDOM.prototype.numberPrecision = function (number) {
    if(Array.isArray(number)){
        for(var i=0;i<number.length;i++){
            number[i] = this.numberPrecision(number[i])
        }
        return number
    }else
    return parseFloat(number.toFixed(3))
}

topologyDOM.prototype.COSESelectedNodes = function () {
    var selected=this.core.$(':selected')
    this.noPosition_cose(selected)
}

topologyDOM.prototype.hideSelectedNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    selectedNodes.remove()
}

topologyDOM.prototype.selectInboundNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    var eles=this.core.nodes().edgesTo(selectedNodes).sources()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.selectOutboundNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    var eles=selectedNodes.edgesTo(this.core.nodes()).targets()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.addConnections = function (targetNode) {
    var theConnectMode=this.targetNodeMode
    var srcNodeArr=this.core.nodes(":selected")

    var preparationInfo=[]

    srcNodeArr.forEach(theNode=>{
        var connectionTypes
        if(theConnectMode=="connectTo") {
            connectionTypes=this.checkAvailableConnectionType(theNode.data("modelID"),targetNode.data("modelID"))
            preparationInfo.push({from:theNode,to:targetNode,connect:connectionTypes})
        }else if(theConnectMode=="connectFrom") {
            connectionTypes=this.checkAvailableConnectionType(targetNode.data("modelID"),theNode.data("modelID"))
            preparationInfo.push({to:theNode,from:targetNode,connect:connectionTypes})
        }
    })
    //TODO: check if it is needed to popup dialog, if all connection is doable and only one type to use, no need to show dialog
    this.showConnectionDialog(preparationInfo)
}

topologyDOM.prototype.showConnectionDialog = function (preparationInfo) {
    var confirmDialogDiv = new simpleConfirmDialog()
    var resultActions=[]
    confirmDialogDiv.show(
        { width: "450px" },
        {
            title: "Add connections"
            , content: ""
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        confirmDialogDiv.close();
                        this.createConnections(resultActions)
                    }
                },
                {
                    colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
    confirmDialogDiv.dialogDiv.empty()
    preparationInfo.forEach((oneRow,index)=>{
        resultActions.push(this.createOneConnectionAdjustRow(oneRow,confirmDialogDiv))
    })
}

topologyDOM.prototype.createOneConnectionAdjustRow = function (oneRow,confirmDialogDiv) {
    var returnObj={}
    var fromNode=oneRow.from
    var toNode=oneRow.to
    var connectionTypes=oneRow.connect
    var label=$('<label style="display:block;margin-bottom:2px"></label>')
    if(connectionTypes.length==0){
        label.css("color","red")
        label.html("No usable connection type from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>")
    }else if(connectionTypes.length>1){ 
        label.html("From <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
        var switchTypeSelector=new simpleSelectMenu(" ")
        label.prepend(switchTypeSelector.DOM)
        connectionTypes.forEach(oneType=>{
            switchTypeSelector.addOption(oneType)
        })
        returnObj["from"]=fromNode.id()
        returnObj["to"]=toNode.id()
        returnObj["connect"]=connectionTypes[0]
        switchTypeSelector.callBack_clickOption=(optionText,optionValue)=>{
            returnObj["connect"]=optionText
            switchTypeSelector.changeName(optionText)
        }
        switchTypeSelector.triggerOptionIndex(0)
    }else if(connectionTypes.length==1){
        returnObj["from"]=fromNode.id()
        returnObj["to"]=toNode.id()
        returnObj["connect"]=connectionTypes[0]
        label.css("color","green")
        label.html("Add <b>"+connectionTypes[0]+"</b> connection from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
    }
    confirmDialogDiv.dialogDiv.append(label)
    return returnObj;
}

topologyDOM.prototype.createConnections = async function (resultActions) {
    // for each resultActions, calculate the appendix index, to avoid same ID is used for existed connections
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var finalActions=[]
    resultActions.forEach(oneAction=>{
        var oneFinalAction={}
        oneFinalAction["$srcId"]=oneAction["from"]
        oneFinalAction["$relationshipId"]=uuidv4();
        oneFinalAction["obj"]={
            "$targetId": oneAction["to"],
            "$relationshipName": oneAction["connect"]
        }
        finalActions.push(oneFinalAction)
    })
    try{
        var data = await msalHelper.callAPI("digitaltwin/createRelations", "POST",  {actions:JSON.stringify(finalActions)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    globalCache.storeTwinRelationships_append(data)
    this.drawRelations(data)
}



topologyDOM.prototype.checkAvailableConnectionType = function (fromNodeModel,toNodeModel) {
    var re=[]
    var validRelationships=modelAnalyzer.DTDLModels[fromNodeModel].validRelationships
    var toNodeBaseClasses=modelAnalyzer.DTDLModels[toNodeModel].allBaseClasses
    if(validRelationships){
        for(var relationName in validRelationships){
            var theRelationType=validRelationships[relationName]
            if(theRelationType.target==null
                 || theRelationType.target==toNodeModel
                 ||toNodeBaseClasses[theRelationType.target]!=null) re.push(relationName)
        }
    }
    return re
}


topologyDOM.prototype.startTargetNodeMode = function (mode) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    $(document).keydown((event) => {
        if (event.keyCode == 27) this.cancelTargetNodeMode()
    });

    this.core.nodes().on('click', (e)=>{
        var clickedNode = e.target;
        this.addConnections(clickedNode)
        //delay a short while so node selection will not be changed to the clicked target node
        setTimeout(()=>{this.cancelTargetNodeMode()},50)

    });
}

topologyDOM.prototype.cancelTargetNodeMode=function(){
    this.targetNodeMode=null;
    this.core.container().style.cursor = 'default';
    $(document).off('keydown');
    this.core.nodes().off("click")
    this.core.autounselectify( false );
}


topologyDOM.prototype.noPosition_grid=function(eles){
    var newLayout = eles.layout({
        name: 'grid',
        animate: false,
        fit:false
    }) 
    newLayout.run()
}

topologyDOM.prototype.noPosition_cose=function(eles){
    if(eles==null) eles=this.core.elements()

    var newLayout =eles.layout({
        name: 'cose',
        animate: true,
        gravity:1,
        animate: false
        ,fit:false
    }) 
    newLayout.run()
    this.core.center(eles)
}

topologyDOM.prototype.noPosition_concentric=function(eles,box){
    if(eles==null) eles=this.core.elements()
    var newLayout =eles.layout({
        name: 'concentric',
        animate: false,
        fit:false,
        minNodeSpacing:60,
        gravity:1,
        boundingBox:box
    }) 
    newLayout.run()
}

topologyDOM.prototype.layoutWithNodePosition=function(nodePosition){
    var newLayout = this.core.layout({
        name: 'preset',
        positions: nodePosition,
        animate: false, // whether to transition the node positions
        animationDuration: 500, // duration of animation in ms if enabled
    })
    newLayout.run()
}



module.exports = topologyDOM;
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":13,"../sharedSourceFiles/modelAnalyzer":14,"../sharedSourceFiles/simpleConfirmDialog":19,"../sharedSourceFiles/simpleSelectMenu":20}],10:[function(require,module,exports){
const simpleTree=require("../sharedSourceFiles/simpleTree")
const modelAnalyzer=require("../sharedSourceFiles/modelAnalyzer")
const msalHelper = require("../msalHelper")
const globalCache = require("../sharedSourceFiles/globalCache")
const newTwinDialog=require("../sharedSourceFiles/newTwinDialog");

function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM,{"leafNameProperty":"displayName"})

    this.tree.options.groupNodeIconFunc=(gn)=>{
        var modelClass=gn.info["@id"]
        var dbModelInfo=globalCache.getSingleDBModelByID(modelClass)
        var colorCode="darkGray"
        var shape="ellipse"
        var avarta=null
        var dimension=20;
        if(globalCache.visualDefinition["default"][modelClass]){
            var visualJson =globalCache.visualDefinition["default"][modelClass]
            var colorCode= visualJson.color || "darkGray"
            var shape=  visualJson.shape || "ellipse"
            var avarta= visualJson.avarta 
            if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
        }

        var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative;padding-top:2px'></div>")
        if(dbModelInfo.isIoTDeviceModel){
            var iotDiv=$("<div class='w3-border' style='position:absolute;right:-5px;padding:0px 2px;top:-7px;border-radius: 3px;font-size:7px'>IoT</div>")
            iconDOM.append(iotDiv)
        }

        var imgSrc=encodeURIComponent(this.shapeSvg(shape,colorCode))
        iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
        if(avarta){
            var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
            iconDOM.append(avartaimg)
        }
        return iconDOM
    }

    this.tree.options.groupNodeTailButtonFunc = (gn) => {
        var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="font-size:1.2em;padding:4px 8px;position:absolute;top:50%;height:27px; right:10px;transform:translateY(-50%)">+</button>')
        addButton.on("click", (e) => {
            gn.expand()
            newTwinDialog.popup({
                "$metadata": {
                    "$model": gn.info["@id"]
                }
            })
            return false
        })
        return addButton;
    }

    this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        this.broadcastMessage({ "message": "showInfoSelectedNodes", info:infoArr, "mouseClickDetail":mouseClickDetail})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.searchBox=$('<input type="text"  placeholder="search..."/>').addClass("w3-input");
    this.searchBox.css({"outline":"none","height":"100%","width":"100%"}) 
    searchDOM.append(this.searchBox)
    var hideOrShowEmptyGroup=$('<button style="height:20px;border:none;padding-left:2px" class="w3-block w3-tiny w3-hover-red w3-amber">Hide Empty Models</button>')
    searchDOM.append(hideOrShowEmptyGroup)
    DOM.css("top","50px")
    hideOrShowEmptyGroup.attr("status","show")
    hideOrShowEmptyGroup.on("click",()=>{
        if(hideOrShowEmptyGroup.attr("status")=="show"){
            hideOrShowEmptyGroup.attr("status","hide")
            hideOrShowEmptyGroup.text("Show Empty Models")
            this.tree.options.hideEmptyGroup=true
        }else{
            hideOrShowEmptyGroup.attr("status","show")
            hideOrShowEmptyGroup.text("Hide Empty Models")
            delete this.tree.options.hideEmptyGroup
        }
        this.tree.groupNodes.forEach(oneGroupNode=>{oneGroupNode.checkOptionHideEmptyGroup()})
    })
    this.searchBox.keyup((e)=>{
        if(e.keyCode == 13)
        {
            var aNode = this.tree.searchText($(e.target).val())
            if(aNode!=null){
                aNode.parentGroupNode.expand()
                this.tree.selectLeafNode(aNode)
                this.tree.scrollToLeafNode(aNode)
            }
        }
    });
}

twinsTree.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
}


twinsTree.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelection_replace") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"replace")
    else if(msgPayload.message=="startSelection_append") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"append")
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels()
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
    else if(msgPayload.message=="addNewTwins") {
        msgPayload.twinsInfo.forEach(oneTwinInfo=>{this.drawOneTwin(oneTwinInfo)})
    }
    else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="visualDefinitionChange"){
        if(!msgPayload.srcModelID){ // change model class visualization
            this.tree.groupNodes.forEach(gn=>{gn.refreshName()})
        } 
    }
}

twinsTree.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        var twinDisplayName=globalCache.twinIDMapToDisplayName[twinID]
        this.tree.deleteLeafNode(twinDisplayName)
    })
}

twinsTree.prototype.refreshModels=function(){
    var modelsData={}
    for(var modelID in modelAnalyzer.DTDLModels){
        var oneModel=modelAnalyzer.DTDLModels[modelID]
        modelsData[oneModel["displayName"]] = oneModel
    }
    //delete all group nodes of deleted models
    this.tree.groupNodes.forEach((gnode)=>{
        if(modelsData[gnode.name]==null){
            //delete this group node
            gnode.deleteSelf()
        }
    })

    //then add all group nodes that to be added
    var currentModelNameArr=[]
    this.tree.groupNodes.forEach((gnode)=>{currentModelNameArr.push(gnode.name)})

    var actualModelNameArr=[]
    for(var ind in modelsData) actualModelNameArr.push(ind)
    actualModelNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });

    for(var i=0;i<actualModelNameArr.length;i++){
        if(i<currentModelNameArr.length && currentModelNameArr[i]==actualModelNameArr[i]) continue
        //otherwise add this group to the tree
        var newGroup=this.tree.insertGroupNode(modelsData[actualModelNameArr[i]],i)
        newGroup.shrink()
        currentModelNameArr.splice(i, 0, actualModelNameArr[i]);
    }
}


twinsTree.prototype.loadStartSelection=async function(twinIDs,modelIDs,replaceOrAppend){
    if(replaceOrAppend=="replace") this.tree.clearAllLeafNodes()

    
    this.refreshModels()
    
    //add new twins under the model group node
    try{
        var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
        var twinIDArr = []
        //check if any current leaf node does not have stored outbound relationship data yet
        this.tree.groupNodes.forEach((gNode) => {
            gNode.childLeafNodes.forEach(leafNode => {
                var nodeId = leafNode.leafInfo["$dtId"]
                if (globalCache.storedOutboundRelationships[nodeId] == null) twinIDArr.push(nodeId)
            })
        })

        globalCache.storeADTTwins(twinsdata)
        for (var i = 0; i < twinsdata.length; i++) {
            var groupName = globalCache.modelIDMapToName[twinsdata[i]["$metadata"]["$model"]]
            this.tree.addLeafnodeToGroup(groupName, twinsdata[i], "skipRepeat")
            twinIDArr.push(twinsdata[i]["$dtId"])
        }
        if(replaceOrAppend=="replace") this.broadcastMessage({ "message": "replaceAllTwins", info: twinsdata })
        else this.broadcastMessage({ "message": "appendAllTwins", info: twinsdata })
        

        this.fetchAllRelationships(twinIDArr)
    } catch (e) {
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}



twinsTree.prototype.drawTwinsAndRelations= function(data){
    data.childTwinsAndRelations.forEach(oneSet=>{
        for(var ind in oneSet.childTwins){
            var oneTwin=oneSet.childTwins[ind]
            this.drawOneTwin(oneTwin)
        }
    })
    
    //draw those known twins from the relationships
    var twinsInfo={}
    data.childTwinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    tmpArr.forEach(oneTwin=>{this.drawOneTwin(oneTwin)})
}

twinsTree.prototype.drawOneTwin= function(twinInfo){
    var groupName=globalCache.modelIDMapToName[twinInfo["$metadata"]["$model"]]
    this.tree.addLeafnodeToGroup(groupName,twinInfo,"skipRepeat")
}

twinsTree.prototype.fetchAllRelationships= async function(twinIDArr){
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        try{
            var data = await msalHelper.callAPI("digitaltwin/getRelationshipsFromTwinIDs", "POST", smallArr)
            if (data == "") continue;
            globalCache.storeTwinRelationships(data) //store them in global available array
            this.broadcastMessage({ "message": "drawAllRelations", info: data })
        } catch (e) {
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

module.exports = twinsTree;
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":13,"../sharedSourceFiles/modelAnalyzer":14,"../sharedSourceFiles/newTwinDialog":18,"../sharedSourceFiles/simpleTree":21}],11:[function(require,module,exports){
const signupsigninname="B2C_1_singupsignin_spaapp1"
const b2cTenantName="azureiotb2c"

const url = new URL(window.location.href);

var strArr=window.location.href.split("?")
var isLocalTest=(strArr.indexOf("test=1")!=-1)

const globalAppSettings={
    "b2cSignUpSignInName": signupsigninname,
    "b2cScope_taskmaster":"https://"+b2cTenantName+".onmicrosoft.com/taskmastermodule/operation",
    "b2cScope_functions":"https://"+b2cTenantName+".onmicrosoft.com/azureiotrocksfunctions/basic",
    "logoutRedirectUri": url.origin+"/spaindex.html",
    "msalConfig":{
        auth: {
            clientId: "f4693be5-601b-4d0e-9208-c35d9ad62387",
            authority: "https://"+b2cTenantName+".b2clogin.com/"+b2cTenantName+".onmicrosoft.com/"+signupsigninname,
            knownAuthorities: [b2cTenantName+".b2clogin.com"],
            redirectUri: window.location.href
        },
        cache: {
            cacheLocation: "sessionStorage", 
            storeAuthStateInCookie: false
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {}
            }
        }
    },
    "isLocalTest":isLocalTest,
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5002/":"https://azureiotrockstaskmastermodule.azurewebsites.net/"),
    "functionsAPIURI":"https://azureiotrocksfunctions.azurewebsites.net/api/"
}

module.exports = globalAppSettings;
},{}],12:[function(require,module,exports){
(function (Buffer){(function (){
const globalAppSettings=require("./globalAppSettings")
const globalCache=require("./sharedSourceFiles/globalCache")


function msalHelper(){
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
}

msalHelper.prototype.signIn=async function(){
    try{
        var response= await this.myMSALObj.loginPopup({ scopes:[]  }) //globalAppSettings.b2cScopes
        if (response != null){
            this.setAccount(response.account)
            return response.account
        } 
        else  return this.fetchAccount()
    }catch(e){
        if(e.errorCode!="user_cancelled") console.log(e)
    }
}

msalHelper.prototype.setAccount=function(theAccount){
    if(theAccount==null)return;
    this.accountId = theAccount.homeAccountId;
    this.accountName = theAccount.username;
    this.userName=theAccount.name;
}

msalHelper.prototype.fetchAccount=function(noAnimation){
    const currentAccounts = this.myMSALObj.getAllAccounts();
    if (currentAccounts.length < 1) return;
    var foundAccount=null;
    for(var i=0;i<currentAccounts.length;i++){
        var anAccount= currentAccounts[i]
        if(anAccount.homeAccountId.toUpperCase().includes(globalAppSettings.b2cSignUpSignInName.toUpperCase())
            && anAccount.idTokenClaims.iss.toUpperCase().includes(globalAppSettings.msalConfig.auth.knownAuthorities[0].toUpperCase())
            && anAccount.idTokenClaims.aud === globalAppSettings.msalConfig.auth.clientId
        ){
            foundAccount= anAccount;
        }
    }
    this.setAccount(foundAccount)
    return foundAccount;
}


msalHelper.prototype.callAzureFunctionsService=async function(APIString,RESTMethod,payload){
    var headersObj={}
    var token=await this.getToken(globalAppSettings.b2cScope_functions)
    headersObj["Authorization"]=`Bearer ${token}`
    return new Promise((resolve, reject) => {
        var ajaxContent={
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.functionsAPIURI+APIString,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        }
        if(RESTMethod=="POST") ajaxContent.data= JSON.stringify(payload)
        $.ajax(ajaxContent);
    })
}

msalHelper.prototype.parseJWT=function(token){
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    base64= Buffer.from(base64, 'base64').toString();
    var jsonPayload = decodeURIComponent(base64.split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

msalHelper.prototype.reloadUserAccountData=async function(){
    try{
        var res=await this.callAPI("digitaltwin/fetchUserData")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return

    }
    globalCache.storeUserData(res)
}

msalHelper.prototype.callAPI=async function(APIString,RESTMethod,payload){
    var headersObj={}
    if(!globalAppSettings.isLocalTest){
        try{
            var token=await this.getToken(globalAppSettings.b2cScope_taskmaster)
        }catch(e){
            window.open(globalAppSettings.logoutRedirectUri,"_self")
        }
        
        headersObj["Authorization"]=`Bearer ${token}`

        //in case joined projects JWT is going to expire, renew another one
        if(globalCache.joinedProjectsToken) {
            var expTS=this.parseJWT(globalCache.joinedProjectsToken).exp
            var currTime=parseInt(new Date().getTime()/1000)
            if(expTS-currTime<30){ //fetch a new projects JWT token 
                console.log("reload user account data")
                await this.reloadUserAccountData()
            }
        }

        //if the API need to use project ID, must add a header "projects" jwt token so server side will verify
        if(payload && payload.projectID && globalCache.joinedProjectsToken){
            headersObj["projects"]=globalCache.joinedProjectsToken
        }

    }

    return new Promise((resolve, reject) => {
        var ajaxContent={
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.taskMasterAPIURI+APIString,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        }
        if(RESTMethod=="POST") ajaxContent.data= JSON.stringify(payload)
        $.ajax(ajaxContent);
    })
}

msalHelper.prototype.getToken=async function(b2cScope){
    try{
        if(this.storedToken==null) this.storedToken={}
        if(this.storedToken[b2cScope]!=null){
            var currTime=parseInt(new Date().getTime()/1000)
            if(currTime+60 < this.storedToken[b2cScope].expire) return this.storedToken[b2cScope].accessToken
        }
        var tokenRequest={
            scopes: [b2cScope],
            forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
            account: this.myMSALObj.getAccountByHomeId(this.accountId)
        }
    
        var response = await this.myMSALObj.acquireTokenSilent(tokenRequest)
        if (!response.accessToken || response.accessToken === "") {
            throw new msal.InteractionRequiredAuthError;
        }
        this.storedToken[b2cScope]={"accessToken":response.accessToken,"expire":response.idTokenClaims.exp}
    }catch(error){
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            var response=await this.myMSALObj.acquireTokenPopup(tokenRequest)
        } else {
            throw error;
        }
    }

    return response.accessToken;
}

module.exports = new msalHelper();
}).call(this)}).call(this,require("buffer").Buffer)

},{"./globalAppSettings":11,"./sharedSourceFiles/globalCache":13,"buffer":2}],13:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")

function globalCache(){
    this.accountInfo=null;
    this.joinedProjectsToken=null;
    //TODO: going to be changable
    this.changeCurrentProject("1faede18-c6a0-484b-843a-7105b168568f")
}


globalCache.prototype.changeCurrentProject = function (newProjectID) {
    if(newProjectID==this.currentProjectID) return;
    this.storedOutboundRelationships = {}
    this.storedTwins = {}
    //stored data, seperately from ADT service and from cosmosDB service
    this.DBModelsArr = []
    this.modelIDMapToName={}
    this.modelNameMapToID={}

    this.DBTwinsArr = []
    this.twinIDMapToDisplayName={}

    this.currentLayoutName=null
    this.layoutJSON={}

    this.visualDefinition={"default":{}}
    this.currentProjectID=newProjectID
}


globalCache.prototype.storeADTTwins=function(twinsData){
    twinsData.forEach((oneNode)=>{this.storeSingleADTTwin(oneNode)});
}

globalCache.prototype.storeSingleADTTwin=function(oneNode){
    this.storedTwins[oneNode["$dtId"]] = oneNode
    oneNode["displayName"]= this.twinIDMapToDisplayName[oneNode["$dtId"]]
}


globalCache.prototype.storeSingleDBTwin=function(DBTwin){
    for(var i=0;i<this.DBTwinsArr.length;i++){
        var oneDBTwin=this.DBTwinsArr[i]
        if(oneDBTwin["id"]==DBTwin["id"]){
            this.DBTwinsArr.splice(i,1)
            break;
        }
    }
    this.DBTwinsArr.push(DBTwin)

    this.twinIDMapToDisplayName[DBTwin["id"]]=DBTwin["displayName"]
}

globalCache.prototype.storeDBTwinsArr=function(DBTwinsArr){
    this.DBTwinsArr.length=0
    this.DBTwinsArr=this.DBTwinsArr.concat(DBTwinsArr)
    for(var ind in this.twinIDMapToDisplayName) delete this.twinIDMapToDisplayName[ind]
    this.DBTwinsArr.forEach(oneDBTwin=>{
        this.twinIDMapToDisplayName[oneDBTwin["id"]]=oneDBTwin["displayName"]
    })
}

globalCache.prototype.mergeDBTwinsArr=function(DBTwinsArr){
    var idList={}
    var arr=[].concat(DBTwinsArr)
    arr.forEach(aDBTwin=>{
        idList[aDBTwin.id]=1
    })
    this.DBTwinsArr.forEach(aDBTwin=>{
        if(idList[aDBTwin.id]) return;
        arr.push(aDBTwin)
    })

    this.storeDBTwinsArr(arr)
}

globalCache.prototype.storeUserData=function(res){
    res.forEach(oneResponse=>{
        if(oneResponse.type=="joinedProjectsToken") this.joinedProjectsToken=oneResponse.jwt;
        else if(oneResponse.type=="user") this.accountInfo=oneResponse
    })
}

globalCache.prototype.storeProjectModelsData=function(DBModels,adtModels){
    this.storeDBModelsArr(DBModels)

    for(var ind in this.modelIDMapToName) delete this.modelIDMapToName[ind]
    for(var ind in this.modelNameMapToID) delete this.modelNameMapToID[ind]

    var tmpNameToObj = {}
    for (var i = 0; i < adtModels.length; i++) {
        if (adtModels[i]["displayName"] == null) adtModels[i]["displayName"] = adtModels[i]["@id"]
        if ($.isPlainObject(adtModels[i]["displayName"])) {
            if (adtModels[i]["displayName"]["en"]) adtModels[i]["displayName"] = adtModels[i]["displayName"]["en"]
            else adtModels[i]["displayName"] = JSON.stringify(adtModels[i]["displayName"])
        }
        if (tmpNameToObj[adtModels[i]["displayName"]] != null) {
            //repeated model display name
            adtModels[i]["displayName"] = adtModels[i]["@id"]
        }
        tmpNameToObj[adtModels[i]["displayName"]] = 1

        this.modelIDMapToName[adtModels[i]["@id"]] = adtModels[i]["displayName"]
        this.modelNameMapToID[adtModels[i]["displayName"]] = adtModels[i]["@id"]
    }
    modelAnalyzer.clearAllModels();
    modelAnalyzer.addModels(adtModels)
    modelAnalyzer.analyze();
}

/*
var dbtwins=[]
    var dbmodels=[]
    DBModels.forEach(element => {
        if(element.type=="visualSchema") {
            //TODO: now there is only one "default" schema to use
            globalCache.visualDefinition[element.name]=element.detail
        }else if(element.type=="Topology") {
            globalCache.layoutJSON[element.name]=element.detail
        }else if(element.type=="DTModel") dbmodels.push(element)
        else if(element.type=="DTTwin") dbtwins.push(element)
    });
    globalCache.storeDBTwinsArr(dbtwins)
    globalCache.storeDBModelsArr(dbmodels)
*/

globalCache.prototype.getDBTwinsByModelID=function(modelID){
    var resultArr=[]
    for(var i=0;i<this.DBTwinsArr.length;i++){
        var ele = this.DBTwinsArr[i]
        if(ele.modelID==modelID){
            resultArr.push(ele)
        }
    }
    return resultArr;
}

globalCache.prototype.getSingleDBTwinByID=function(twinID){
    for(var i=0;i<this.DBTwinsArr.length;i++){
        var ele = this.DBTwinsArr[i]
        if(ele.id==twinID){
            return ele
        }
    }
    return null;
}

globalCache.prototype.getSingleDBModelByID=function(modelID){
    for(var i=0;i<this.DBModelsArr.length;i++){
        var ele = this.DBModelsArr[i]
        if(ele.id==modelID){
            return ele
        }
    }
    return null;
}

globalCache.prototype.storeSingleDBModel=function(singleDBModelInfo){
    var modelID = singleDBModelInfo.id
    for(var i=0;i<this.DBModelsArr.length;i++){
        var ele = this.DBModelsArr[i]
        if(ele.id==modelID){
            for(var ind in ele) delete ele[ind]
            for(var ind in singleDBModelInfo) ele[ind]=singleDBModelInfo[ind]
            return;
        }
    }
    //it is a new single model if code reaches here
    this.DBModelsArr.push(singleDBModelInfo)
    this.sortDBModelsArr()
}

globalCache.prototype.storeDBModelsArr=function(DBModelsArr){
    this.DBModelsArr.length=0
    this.DBModelsArr=this.DBModelsArr.concat(DBModelsArr)
    this.sortDBModelsArr()
    
}
globalCache.prototype.sortDBModelsArr=function(){
    this.DBModelsArr.sort(function (a, b) { 
        var aName=a.displayName.toLowerCase()
        var bName=b.displayName.toLowerCase()
        return aName.localeCompare(bName) 
    });
}


globalCache.prototype.storeTwinRelationships=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var twinID=oneRelationship['$sourceId']
        this.storedOutboundRelationships[twinID]=[]
    })

    relationsData.forEach((oneRelationship)=>{
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_append=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        if(!this.storedOutboundRelationships[oneRelationship['$sourceId']])
            this.storedOutboundRelationships[oneRelationship['$sourceId']]=[]
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_remove=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var srcID=oneRelationship["srcID"]
        if(this.storedOutboundRelationships[srcID]){
            var arr=this.storedOutboundRelationships[srcID]
            for(var i=0;i<arr.length;i++){
                if(arr[i]['$relationshipId']==oneRelationship["relID"]){
                    arr.splice(i,1)
                    break;
                }
            }
        }
    })
}

module.exports = new globalCache();
},{"./modelAnalyzer":14}],14:[function(require,module,exports){
//This is a singleton class

function modelAnalyzer(){
    this.DTDLModels={}
    this.relationshipTypes={}
}

modelAnalyzer.prototype.clearAllModels=function(){
    //console.log("clear all model info")
    for(var id in this.DTDLModels) delete this.DTDLModels[id]
}

modelAnalyzer.prototype.resetAllModels=function(arr){
    for(var modelID in this.DTDLModels){
        var jsonStr=this.DTDLModels[modelID]["original"]
        this.DTDLModels[modelID]=JSON.parse(jsonStr)
        this.DTDLModels[modelID]["original"]=jsonStr
    }
}


modelAnalyzer.prototype.addModels=function(arr){
    arr.forEach((ele)=>{
        var modelID= ele["@id"]
        ele["original"]=JSON.stringify(ele)
        this.DTDLModels[modelID]=ele
    })
}


modelAnalyzer.prototype.recordAllBaseClasses= function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;

    parentObj[baseClassID]=1

    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.recordAllBaseClasses(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandEditablePropertiesFromBaseClass = function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;
    if (baseClass.editableProperties) {
        for (var ind in baseClass.editableProperties) parentObj[ind] = baseClass.editableProperties[ind]
    }
    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.expandEditablePropertiesFromBaseClass(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandValidRelationshipTypesFromBaseClass = function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;
    if (baseClass.validRelationships) {
        for (var ind in baseClass.validRelationships) {
            if(parentObj[ind]==null) parentObj[ind] = this.relationshipTypes[ind][baseClassID]
        }
    }
    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.expandValidRelationshipTypesFromBaseClass(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandEditableProperties=function(parentObj,dataInfo,embeddedSchema){
    dataInfo.forEach((oneContent)=>{
        if(oneContent["@type"]=="Relationship") return;
        if(oneContent["@type"]=="Property"
        ||(Array.isArray(oneContent["@type"]) && oneContent["@type"].includes("Property"))
        || oneContent["@type"]==null) {
            if(typeof(oneContent["schema"]) != 'object' && embeddedSchema[oneContent["schema"]]!=null) oneContent["schema"]=embeddedSchema[oneContent["schema"]]

            if(typeof(oneContent["schema"]) === 'object' && oneContent["schema"]["@type"]=="Object"){
                var newParent={}
                parentObj[oneContent["name"]]=newParent
                this.expandEditableProperties(newParent,oneContent["schema"]["fields"],embeddedSchema)
            }else if(typeof(oneContent["schema"]) === 'object' && oneContent["schema"]["@type"]=="Enum"){
                parentObj[oneContent["name"]]=oneContent["schema"]["enumValues"]
            }else{
                parentObj[oneContent["name"]]=oneContent["schema"]
            }           
        }
    })
}


modelAnalyzer.prototype.analyze=function(){
    //console.log("analyze model info")
    //analyze all relationship types
    for (var id in this.relationshipTypes) delete this.relationshipTypes[id]
    for (var modelID in this.DTDLModels) {
        var ele = this.DTDLModels[modelID]
        var embeddedSchema = {}
        if (ele.schemas) {
            var tempArr;
            if (Array.isArray(ele.schemas)) tempArr = ele.schemas
            else tempArr = [ele.schemas]
            tempArr.forEach((ele) => {
                embeddedSchema[ele["@id"]] = ele
            })
        }

        var contentArr = ele.contents
        if (!contentArr) continue;
        contentArr.forEach((oneContent) => {
            if (oneContent["@type"] == "Relationship") {
                if(!this.relationshipTypes[oneContent["name"]]) this.relationshipTypes[oneContent["name"]]= {}
                this.relationshipTypes[oneContent["name"]][modelID] = oneContent
                oneContent.editableRelationshipProperties = {}
                if (Array.isArray(oneContent.properties)) {
                    this.expandEditableProperties(oneContent.editableRelationshipProperties, oneContent.properties, embeddedSchema)
                }
            }
        })
    }

    //analyze each model's property that can be edited
    for(var modelID in this.DTDLModels){ //expand possible embedded schema to editableProperties, also extract possible relationship types for this model
        var ele=this.DTDLModels[modelID]
        var embeddedSchema={}
        if(ele.schemas){
            var tempArr;
            if(Array.isArray(ele.schemas)) tempArr=ele.schemas
            else tempArr=[ele.schemas]
            tempArr.forEach((ele)=>{
                embeddedSchema[ele["@id"]]=ele
            })
        }
        ele.editableProperties={}
        ele.validRelationships={}
        ele.includedComponents=[]
        ele.allBaseClasses={}
        if(Array.isArray(ele.contents)){
            this.expandEditableProperties(ele.editableProperties,ele.contents,embeddedSchema)

            ele.contents.forEach((oneContent)=>{
                if(oneContent["@type"]=="Relationship") {
                    ele.validRelationships[oneContent["name"]]=this.relationshipTypes[oneContent["name"]][modelID]
                }
            })
        }
    }

    for(var modelID in this.DTDLModels){//expand component properties
        var ele=this.DTDLModels[modelID]
        if(Array.isArray(ele.contents)){
            ele.contents.forEach(oneContent=>{
                if(oneContent["@type"]=="Component"){
                    var componentName=oneContent["name"]
                    var componentClass=oneContent["schema"]
                    ele.editableProperties[componentName]={}
                    this.expandEditablePropertiesFromBaseClass(ele.editableProperties[componentName],componentClass)
                    ele.includedComponents.push(componentName)
                } 
            })
        }
    }

    for(var modelID in this.DTDLModels){//expand base class properties to editableProperties and valid relationship types to validRelationships
        var ele=this.DTDLModels[modelID]
        var baseClassIDs=ele.extends;
        if(baseClassIDs==null) continue;
        if(Array.isArray(baseClassIDs)) var tmpArr=baseClassIDs
        else tmpArr=[baseClassIDs]
        tmpArr.forEach((eachBase)=>{
            this.recordAllBaseClasses(ele.allBaseClasses,eachBase)
            this.expandEditablePropertiesFromBaseClass(ele.editableProperties,eachBase)
            this.expandValidRelationshipTypesFromBaseClass(ele.validRelationships,eachBase)
        })
    }

    //console.log(this.DTDLModels)
    //console.log(this.relationshipTypes)
}


module.exports = new modelAnalyzer();
},{}],15:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const globalCache = require("./globalCache")

function modelEditorDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:100" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

modelEditorDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:665px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Model Editor</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var buttonRow=$('<div  style="height:40px" class="w3-bar"></div>')
    this.contentDOM.append(buttonRow)
    var importButton =$('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green w3-right" style="height:100%">Import</button>')
    buttonRow.append(importButton)

    importButton.on("click", async () => {
        var modelToBeImported = [this.dtdlobj]
        try {
            var response = await msalHelper.callAPI("digitaltwin/importModels", "POST", { "models": JSON.stringify(modelToBeImported) })

            alert("Model \"" + this.dtdlobj["displayName"] + "\" is created!")
            this.broadcastMessage({ "message": "ADTModelEdited" })
            modelAnalyzer.addModels(modelToBeImported) //add so immediatley the list can show the new models
            this.popup() //refresh content
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }        
    })

    var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;font-size:1.2em;">Model Template</div>')
    buttonRow.append(lable)
    var modelTemplateSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1.2em",colorClass:"w3-light-gray",buttonCSS:{"padding":"5px 10px"},"optionListHeight":300})
    buttonRow.append(modelTemplateSelector.DOM)
    modelTemplateSelector.callBack_clickOption=(optionText,optionValue)=>{
        modelTemplateSelector.changeName(optionText)
        this.chooseTemplate(optionValue)
    }
    modelTemplateSelector.addOption("New Model...","New")
    for(var modelName in modelAnalyzer.DTDLModels){
        modelTemplateSelector.addOption(modelName)
    }

    var panelHeight="450px"
    var row2=$('<div class="w3-cell-row" style="margin:2px"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div class="w3-card" style="padding:5px;width:330px;padding-right:5px;height:'+panelHeight+';overflow:auto"></div>')
    row2.append(leftSpan)
    this.leftSpan=leftSpan

    var rightSpan=$('<div class="w3-container w3-cell"></div>')
    row2.append(rightSpan) 
    var dtdlScriptPanel=$('<div class="w3-card-2 w3-white" style="overflow:auto;margin-top:2px;width:310px;height:'+panelHeight+'"></div>')
    rightSpan.append(dtdlScriptPanel)
    this.dtdlScriptPanel=dtdlScriptPanel

    modelTemplateSelector.triggerOptionIndex(0)
}

modelEditorDialog.prototype.chooseTemplate=function(tempalteName){
    if(tempalteName!="New"){
        this.dtdlobj=JSON.parse(modelAnalyzer.DTDLModels[tempalteName]["original"])
    }else{
        this.dtdlobj = {
            "@id": "dtmi:aNameSpace:aModelID;1",
            "@context": ["dtmi:dtdl:context;2"],
            "@type": "Interface",
            "displayName": "New Model",
            "contents": [
                {
                    "@type": "Property",
                    "name": "attribute1",
                    "schema": "double"
                },{
                    "@type": "Relationship",
                    "name": "link"
                }
            ]
        }
    }
    this.leftSpan.empty()

    this.refreshDTDL()
    this.leftSpan.append($('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Model ID & Name<p style="position:absolute;text-align:left;font-weight:normal;top:-10px;width:200px" class="w3-text w3-tag w3-tiny">model ID contains namespace, a model string and a version number</p></div></div>'))
    new idRow(this.dtdlobj,this.leftSpan,()=>{this.refreshDTDL()})
    new displayNameRow(this.dtdlobj,this.leftSpan,()=>{this.refreshDTDL()})

    if(!this.dtdlobj["contents"])this.dtdlobj["contents"]=[]
    new parametersRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()},this.DOM.offset())
    new relationsRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()},this.DOM.offset())
    new componentsRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()})

    if(!this.dtdlobj["extends"])this.dtdlobj["extends"]=[]
    new baseClassesRow(this.dtdlobj["extends"],this.leftSpan,()=>{this.refreshDTDL()})
}

modelEditorDialog.prototype.refreshDTDL=function(){
    this.dtdlScriptPanel.empty()
    this.dtdlScriptPanel.append($('<div style="height:20px;width:100px" class="w3-bar w3-gray">Generated DTDL</div>'))
    this.dtdlScriptPanel.append($('<pre style="color:gray">'+JSON.stringify(this.dtdlobj,null,2)+'</pre>'))
}

module.exports = new modelEditorDialog();


function baseClassesRow(dtdlObj,parentDOM,refreshDTDLF){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item  w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Base Classes<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Base class model\'s parameters and relationship type are inherited</p></div></div>')

    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)
    addButton.on("click",()=>{
        var newObj = "unknown"
        dtdlObj.push(newObj)
        new singleBaseclassRow(newObj,contentDOM,refreshDTDLF,dtdlObj)
        refreshDTDLF()
    })
    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        new singleBaseclassRow(element,contentDOM,refreshDTDLF,dtdlObj)
    });
}

function singleBaseclassRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj){
    var DOM = $('<div class="w3-cell-row"></div>')
    var baseClassNameInput=$('<input type="text" style="outline:none;display:inline;width:220px;padding:4px"  placeholder="base model id"/>').addClass("w3-bar-item w3-input w3-border");
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(baseClassNameInput,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] == dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    parentDOM.append(DOM)

    baseClassNameInput.val(dtdlObj)
    baseClassNameInput.on("change",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] == dtdlObj) {
                parentDtdlObj[i]=baseClassNameInput.val()
                break;
            }
        }
        refreshDTDLF()
    })
}

function componentsRow(dtdlObj,parentDOM,refreshDTDLF){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item  w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Components<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Component model\'s parameters are embedded under a name</p></div></div>')

    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)

    addButton.on("click",()=>{
        var newObj = {
            "@type": "Component",
            "name": "SomeComponent",
            "schema":"dtmi:someComponentModel;1"
        }
        dtdlObj.push(newObj)
        new singleComponentRow(newObj,contentDOM,refreshDTDLF,dtdlObj)
        refreshDTDLF()
    })
    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Component") return
        new singleComponentRow(element,contentDOM,refreshDTDLF,dtdlObj)
    });
}

function singleComponentRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj){
    var DOM = $('<div class="w3-cell-row"></div>')
    var componentNameInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="component name"/>').addClass("w3-bar-item w3-input w3-border");
    var schemaInput=$('<input type="text" style="outline:none;display:inline;width:160px;padding:4px"  placeholder="component model id..."/>').addClass("w3-bar-item w3-input w3-border");
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(componentNameInput,schemaInput,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    parentDOM.append(DOM)

    componentNameInput.val(dtdlObj["name"])
    schemaInput.val(dtdlObj["schema"]||"")

    componentNameInput.on("change",()=>{
        dtdlObj["name"]=componentNameInput.val()
        refreshDTDLF()
    })
    schemaInput.on("change",()=>{
        dtdlObj["schema"]=schemaInput.val()
        refreshDTDLF()
    })
}

function relationsRow(dtdlObj,parentDOM,refreshDTDLF,dialogOffset){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Relationship Types<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Relationship can have its own parameters</p></div></div>')


    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)

    addButton.on("click",()=>{
        var newObj = {
            "@type": "Relationship",
            "name": "relation1",
        }
        dtdlObj.push(newObj)
        new singleRelationTypeRow(newObj,contentDOM,refreshDTDLF,dtdlObj,dialogOffset)
        refreshDTDLF()
    })

    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Relationship") return
        new singleRelationTypeRow(element,contentDOM,refreshDTDLF,dtdlObj,dialogOffset)
    });
}

function singleRelationTypeRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj,dialogOffset){
    var DOM = $('<div class="w3-cell-row"></div>')
    var relationNameInput=$('<input type="text" style="outline:none;display:inline;width:90px;padding:4px"  placeholder="relation name"/>').addClass("w3-bar-item w3-input w3-border");
    var targetModelID=$('<input type="text" style="outline:none;display:inline;width:140px;padding:4px"  placeholder="(optional)target model"/>').addClass("w3-bar-item w3-input w3-border");
    var addButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-cog fa-lg"></i></button>')
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(relationNameInput,targetModelID,addButton,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    var contentDOM=$('<div style="padding-left:10px"></div>')
    DOM.append(contentDOM)
    parentDOM.append(DOM)

    relationNameInput.val(dtdlObj["name"])
    targetModelID.val(dtdlObj["target"]||"")

    addButton.on("click",()=>{
        if(! dtdlObj["properties"]) dtdlObj["properties"]=[]
        var newObj = {
            "name": "newP",
            "schema": "double"
        }
        dtdlObj["properties"].push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj["properties"],null,dialogOffset)
        refreshDTDLF()
    })

    relationNameInput.on("change",()=>{
        dtdlObj["name"]=relationNameInput.val()
        refreshDTDLF()
    })
    targetModelID.on("change",()=>{
        if(targetModelID.val()=="") delete dtdlObj["target"]
        else dtdlObj["target"]=targetModelID.val()
        refreshDTDLF()
    })
    if(dtdlObj["properties"] && dtdlObj["properties"].length>0){
        var properties=dtdlObj["properties"]
        properties.forEach(oneProperty=>{
            new singleParameterRow(oneProperty,contentDOM,refreshDTDLF,dtdlObj["properties"],null,dialogOffset)
        })
    }
}

function parametersRow(dtdlObj,parentDOM,refreshDTDLF,dialogOffset){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Parameters</div></div>')
    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)
    addButton.on("click",()=>{
        var newObj = {
            "@type": "Property",
            "name": "newP",
            "schema": "double"
        }
        dtdlObj.push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj,"topLevel",dialogOffset)
        refreshDTDLF()
    })

    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Property") return
        new singleParameterRow(element,contentDOM,refreshDTDLF,dtdlObj,"topLevel",dialogOffset)
    });
}

function singleParameterRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj,topLevel,dialogOffset){
    var DOM = $('<div class="w3-cell-row"></div>')
    var parameterNameInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="parameter name"/>').addClass("w3-bar-item w3-input w3-border");
    var enumValueInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="str1,str2,..."/>').addClass("w3-bar-item w3-input w3-border");
    var addButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-plus fa-lg"></i></button>')
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    var ptypeSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1em",colorClass:"w3-light-gray w3-bar-item",buttonCSS:{"padding":"4px 5px"},"optionListHeight":300,"isClickable":1,"optionListMarginTop":-150,"optionListMarginLeft":60,
    "adjustPositionAnchor":dialogOffset})
    ptypeSelector.addOptionArr(["Enum","Object","boolean","date","dateTime","double","duration","float","integer","long","string","time"])
    DOM.append(parameterNameInput,ptypeSelector.DOM,enumValueInput,addButton,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })
    
    var contentDOM=$('<div style="padding-left:10px"></div>')
    DOM.append(contentDOM)
    parentDOM.append(DOM)

    parameterNameInput.val(dtdlObj["name"])
    ptypeSelector.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        ptypeSelector.changeName(optionText)
        contentDOM.empty()//clear all content dom content
        if(realMouseClick){
            for(var ind in dtdlObj) delete dtdlObj[ind]    //clear all object content
            if(topLevel) dtdlObj["@type"]="Property"
            dtdlObj["name"]=parameterNameInput.val()
        } 
        if(optionText=="Enum"){
            enumValueInput.val("")
            enumValueInput.show();
            addButton.hide()
            if(realMouseClick) dtdlObj["schema"]={"@type": "Enum","valueSchema": "string"}
        }else if(optionText=="Object"){
            enumValueInput.hide();
            addButton.show()
            if(realMouseClick) dtdlObj["schema"]={"@type": "Object"}
        }else{
            if(realMouseClick) dtdlObj["schema"]=optionText
            enumValueInput.hide();
            addButton.hide()
        }
        refreshDTDLF()
    }
    addButton.on("click",()=>{
        if(! dtdlObj["schema"]["fields"]) dtdlObj["schema"]["fields"]=[]
        var newObj = {
            "name": "newP",
            "schema": "double"
        }
        dtdlObj["schema"]["fields"].push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj["schema"]["fields"],null,dialogOffset)
        refreshDTDLF()
    })

    parameterNameInput.on("change",()=>{
        dtdlObj["name"]=parameterNameInput.val()
        refreshDTDLF()
    })
    enumValueInput.on("change",()=>{
        var valueArr=enumValueInput.val().split(",")
        dtdlObj["schema"]["enumValues"]=[]
        valueArr.forEach(aVal=>{
            dtdlObj["schema"]["enumValues"].push({
                "name": aVal.replace(" ",""), //remove all the space in name
                "enumValue": aVal
              })
        })
        refreshDTDLF()
    })
    if(typeof(dtdlObj["schema"]) != 'object') var schema=dtdlObj["schema"]
    else schema=dtdlObj["schema"]["@type"]
    ptypeSelector.triggerOptionValue(schema)
    if(schema=="Enum"){
        var enumArr=dtdlObj["schema"]["enumValues"]
        if(enumArr!=null){
            var inputStr=""
            enumArr.forEach(oneEnumValue=>{inputStr+=oneEnumValue.enumValue+","})
            inputStr=inputStr.slice(0, -1)//remove the last ","
            enumValueInput.val(inputStr)
        }
    }else if(schema=="Object"){
        var fields=dtdlObj["schema"]["fields"]
        fields.forEach(oneField=>{
            new singleParameterRow(oneField,contentDOM,refreshDTDLF,dtdlObj["schema"]["fields"],null,dialogOffset)
        })
    }
}


function idRow(dtdlObj,parentDOM,refreshDTDLF){
    var DOM = $('<div class="w3-cell-row"></div>')
    var label1=$('<div class="w3-opacity" style="display:inline">dtmi:</div>')
    var domainInput=$('<input type="text" style="outline:none;display:inline;width:80px;padding:4px"  placeholder="Namespace"/>').addClass("w3-input w3-border");
    var modelIDInput=$('<input type="text" style="outline:none;display:inline;width:140px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
    var versionInput=$('<input type="text" style="outline:none;display:inline;width:60px;padding:4px"  placeholder="version"/>').addClass("w3-input w3-border");
    DOM.append(label1,domainInput,$('<div class="w3-opacity" style="display:inline">:</div>'),modelIDInput,$('<div class="w3-opacity" style="display:inline">;</div>'),versionInput)
    parentDOM.append(DOM)

    var valueChange=()=>{
        var str=`dtmi:${domainInput.val()}:${modelIDInput.val()};${versionInput.val()}`
        dtdlObj["@id"]=str
        refreshDTDLF()
    }
    domainInput.on("change",valueChange)
    modelIDInput.on("change",valueChange)
    versionInput.on("change",valueChange)

    var str=dtdlObj["@id"]
    if(str!="" && str!=null){
        var arr1=str.split(";")
        if(arr1.length!=2) return;
        versionInput.val(arr1[1])
        var arr2=arr1[0].split(":")
        domainInput.val(arr2[1])
        arr2.shift(); arr2.shift()
        modelIDInput.val(arr2.join(":"))
    }
}

function displayNameRow(dtdlObj,parentDOM,refreshDTDLF){
    var DOM = $('<div class="w3-cell-row"></div>')
    var label1=$('<div class="w3-opacity" style="display:inline">Display Name:</div>')
    var nameInput=$('<input type="text" style="outline:none;display:inline;width:150px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
    DOM.append(label1,nameInput)
    parentDOM.append(DOM)
    var valueChange=()=>{
        dtdlObj["displayName"]=nameInput.val()
        refreshDTDLF()
    }
    nameInput.on("change",valueChange)
    var str=dtdlObj["displayName"]
    if(str!="" && str!=null) nameInput.val(str)
}
},{"../msalHelper":12,"./globalCache":13,"./modelAnalyzer":14,"./simpleSelectMenu":20}],16:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleTree= require("./simpleTree")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const modelEditorDialog = require("./modelEditorDialog")
const globalCache = require("./globalCache")
const msalHelper=require("../msalHelper")

function modelManagerDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        this.DOM.hide()
    }
    this.showRelationVisualizationSettings=true;
}


modelManagerDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:650px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Models</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var importModelsBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Import</button>')
    var actualImportModelsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    var modelEditorBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Create Model</button>')
    var exportModelBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Export All Models</button>')
    this.contentDOM.children(':first').append(importModelsBtn,actualImportModelsBtn, modelEditorBtn,exportModelBtn)
    importModelsBtn.on("click", ()=>{
        actualImportModelsBtn.trigger('click');
    });
    actualImportModelsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readModelFilesContentAndImport(files)
        actualImportModelsBtn.val("")
    })
    modelEditorBtn.on("click",()=>{
        modelEditorDialog.popup()
    })
    exportModelBtn.on("click", () => {
        var modelArr=[]
        for(var modelID in modelAnalyzer.DTDLModels) modelArr.push(JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]))
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(modelArr)));
        pom.attr('download', "exportModels.json");
        pom[0].click()
    })

    var row2=$('<div class="w3-cell-row" style="margin-top:2px"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div class="w3-cell" style="width:240px;padding-right:5px"></div>')
    row2.append(leftSpan)
    leftSpan.append($('<div style="height:30px" class="w3-bar w3-red"><div class="w3-bar-item" style="">Models</div></div>'))
    
    var modelList = $('<ul class="w3-ul w3-hoverable">')
    modelList.css({"overflow-x":"hidden","overflow-y":"auto","height":"420px", "border":"solid 1px lightgray"})
    leftSpan.append(modelList)
    this.modelList = modelList;
    
    var rightSpan=$('<div class="w3-container w3-cell" style="padding:0px"></div>')
    row2.append(rightSpan) 
    var panelCardOut=$('<div class="w3-card-2 w3-white" style="margin-top:2px"></div>')

    this.modelButtonBar=$('<div class="w3-bar" style="height:35px"></div>')
    panelCardOut.append(this.modelButtonBar)

    rightSpan.append(panelCardOut)
    var panelCard=$('<div style="width:410px;height:412px;overflow:auto;margin-top:2px"></div>')
    panelCardOut.append(panelCard)
    this.panelCard=panelCard;

    this.modelButtonBar.empty()
    panelCard.html("<a style='display:block;font-style:italic;color:gray;padding-left:5px'>Choose a model to view infomration</a>")

    this.listModels()
}

modelManagerDialog.prototype.resizeImgFile = async function(theFile,max_size) {
    return new Promise((resolve, reject) => {
        try {
            var reader = new FileReader();
            var tmpImg = new Image();
            reader.onload = () => {
                tmpImg.onload =  ()=> {
                    var canvas = document.createElement('canvas')
                    var width = tmpImg.width
                    var height = tmpImg.height;
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(tmpImg, 0, 0, width, height);
                    var dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl)
                }
                tmpImg.src = reader.result;
            }
            reader.readAsDataURL(theFile);
        } catch (e) {
            reject(e)
        }
    })
}

modelManagerDialog.prototype.fillRightSpan=async function(modelID){
    this.panelCard.empty()
    this.modelButtonBar.empty()

    var delBtn = $('<button style="margin-bottom:2px" class="w3-button w3-light-gray w3-hover-pink w3-border-right">Delete Model</button>')
    this.modelButtonBar.append(delBtn)


    var importPicBtn = $('<button class="w3-button w3-light-gray w3-hover-amber w3-border-right">Upload Avarta</button>')
    var actualImportPicBtn = $('<input type="file" name="img" style="display:none"></input>')
    var clearAvartaBtn = $('<button class="w3-button w3-light-gray w3-hover-pink w3-border-right">Clear Avarta</button>')
    this.modelButtonBar.append(importPicBtn, actualImportPicBtn, clearAvartaBtn)
    importPicBtn.on("click", () => {
        actualImportPicBtn.trigger('click');
    });

    actualImportPicBtn.change(async (evt) => {
        var files = evt.target.files; // FileList object
        var theFile = files[0]

        if (theFile.type == "image/svg+xml") {
            var str = await this.readOneFile(theFile)
            var dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(str);
        } else if (theFile.type.match('image.*')) {
            var dataUrl = await this.resizeImgFile(theFile, 70)
        } else {
            var confirmDialogDiv = new simpleConfirmDialog()
            confirmDialogDiv.show({ width: "200px" },
                {
                    title: "Note"
                    , content: "Please import image file (png,jpg,svg and so on)"
                    , buttons: [{ colorClass: "w3-gray", text: "Ok", "clickFunc": () => { confirmDialogDiv.close() } }]
                }
            )
        }
        if (this.avartaImg) this.avartaImg.attr("src", dataUrl)

        var visualJson = globalCache.visualDefinition["default"]
        if (!visualJson[modelID]) visualJson[modelID] = {}
        visualJson[modelID].avarta = dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "avarta": dataUrl })
        this.refreshModelTreeLabel()
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", () => {
        var visualJson = globalCache.visualDefinition["default"]
        if (visualJson[modelID]) delete visualJson[modelID].avarta
        if (this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "noAvarta": true })
        this.refreshModelTreeLabel()
    });

    
    delBtn.on("click",()=>{
        var confirmDialogDiv = new simpleConfirmDialog()

        //check how many twins are under this model ID
        var numberOfTwins=0
        globalCache.DBTwinsArr.forEach(oneDBTwin=>{
            if(oneDBTwin["modelID"]==modelID) numberOfTwins++
        })

        var contentStr="This will DELETE model \"" + modelID + "\". "
        contentStr+="(There "+((numberOfTwins>1)?("are "+numberOfTwins+" twins"):("is "+numberOfTwins+" twin") ) + " of this model."
        if(numberOfTwins>0) contentStr+=" You may still delete the model, but please import a model with this modelID to ensure normal operation)"
        else contentStr+=")"
        confirmDialogDiv.show(
            { width: "350px" },
            {
                title: "Warning"
                , content: contentStr
                , buttons: [
                    {
                        colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                            confirmDialogDiv.close();
                            try{
                                await msalHelper.callAPI("digitaltwin/deleteModel", "POST", { "model": modelID })
                                delete modelAnalyzer.DTDLModels[modelID]
                                this.tree.deleteLeafNode(globalCache.modelIDMapToName[modelID])
                                this.broadcastMessage({ "message": "ADTModelsChange"})
                                this.panelCard.empty()
                                //TODO: clear the visualization setting of this deleted model
                                /*
                                if (globalCache.visualDefinition["default"][modelID]) {
                                    delete globalCache.visualDefinition["default"][modelID]
                                    this.saveVisualDefinition()
                                }*/
                            }catch(e){
                                console.log(e)
                                if(e.responseText) alert(e.responseText)
                            }   
                        }
                    },
                    {
                        colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                            confirmDialogDiv.close()
                        }
                    }
                ]
            }
        )
        
    })
    
    var VisualizationDOM=this.addAPartInRightSpan("Visualization")
    var editablePropertiesDOM=this.addAPartInRightSpan("Editable Properties And Relationships")
    var baseClassesDOM=this.addAPartInRightSpan("Base Classes")
    var originalDefinitionDOM=this.addAPartInRightSpan("Original Definition")

    var str=JSON.stringify(JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]),null,2)
    originalDefinitionDOM.append($('<pre id="json">'+str+'</pre>'))

    var edittableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    this.fillEditableProperties(edittableProperties,editablePropertiesDOM)
    var validRelationships=modelAnalyzer.DTDLModels[modelID].validRelationships
    this.fillRelationshipInfo(validRelationships,editablePropertiesDOM)

    this.fillVisualization(modelID,VisualizationDOM)

    this.fillBaseClasses(modelAnalyzer.DTDLModels[modelID].allBaseClasses,baseClassesDOM) 
}

modelManagerDialog.prototype.refreshModelTreeLabel=function(){
    if(this.tree.selectedNodes.length>0) this.tree.selectedNodes[0].redrawLabel()
}

modelManagerDialog.prototype.fillBaseClasses=function(baseClasses,parentDom){
    for(var ind in baseClasses){
        var keyDiv= $("<label style='display:block;padding:.1em'>"+ind+"</label>")
        parentDom.append(keyDiv)
    }
}

modelManagerDialog.prototype.fillVisualization=function(modelID,parentDom){
    var modelJson=modelAnalyzer.DTDLModels[modelID];
    var aTable=$("<table style='width:100%'></table>")
    aTable.html('<tr><td></td><td></td></tr>')
    parentDom.append(aTable) 

    var leftPart=aTable.find("td:first")
    var rightPart=aTable.find("td:nth-child(2)")
    rightPart.css({"width":"50px","height":"50px","border":"solid 1px lightGray"})
    
    var avartaImg=$("<img style='height:45px'></img>")
    rightPart.append(avartaImg)
    var visualJson=globalCache.visualDefinition["default"]
    if(visualJson && visualJson[modelID] && visualJson[modelID].avarta) avartaImg.attr('src',visualJson[modelID].avarta)
    this.avartaImg=avartaImg;
    this.addOneVisualizationRow(modelID,leftPart)

    if(this.showRelationVisualizationSettings){
        for(var ind in modelJson.validRelationships){
            this.addOneVisualizationRow(modelID,leftPart,ind)
        }
    }
}
modelManagerDialog.prototype.addOneVisualizationRow=function(modelID,parentDom,relatinshipName){
    if(relatinshipName==null) var nameStr="◯" //visual for node
    else nameStr="⟜ "+relatinshipName
    var containerDiv=$("<div style='padding-bottom:8px'></div>")
    parentDom.append(containerDiv)
    var contentDOM=$("<label style='margin-right:10px'>"+nameStr+"</label>")
    containerDiv.append(contentDOM)

    var definedColor=null
    var definedShape=null
    var definedDimensionRatio=null
    var definedEdgeWidth=null
    var visualJson=globalCache.visualDefinition["default"]
    if(relatinshipName==null){
        if(visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
        if(visualJson[modelID] && visualJson[modelID].dimensionRatio) definedDimensionRatio=visualJson[modelID].dimensionRatio
    }else{
        if (visualJson[modelID] && visualJson[modelID]["rels"] && visualJson[modelID]["rels"][relatinshipName]) {
            if (visualJson[modelID]["rels"][relatinshipName].color) definedColor = visualJson[modelID]["rels"][relatinshipName].color
            if (visualJson[modelID]["rels"][relatinshipName].shape) definedShape = visualJson[modelID]["rels"][relatinshipName].shape
            if(visualJson[modelID]["rels"][relatinshipName].edgeWidth) definedEdgeWidth=visualJson[modelID]["rels"][relatinshipName].edgeWidth
        }
    }

    var colorSelector=$('<select class="w3-border" style="outline:none;width:75px"></select>')
    containerDiv.append(colorSelector)
    var colorArr=["darkGray","Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
    colorArr.forEach((oneColorCode)=>{
        var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
        colorSelector.append(anOption)
        anOption.css("color",oneColorCode)
    })
    if(definedColor!=null) {
        colorSelector.val(definedColor)
        colorSelector.css("color",definedColor)
    }else{
        colorSelector.css("color","darkGray")
    }
    colorSelector.change((eve)=>{
        var selectColorCode=eve.target.value
        colorSelector.css("color",selectColorCode)
        var visualJson=globalCache.visualDefinition["default"]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"color":selectColorCode })
            this.refreshModelTreeLabel()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"color":selectColorCode })
        }
        this.saveVisualDefinition()
    })
    var shapeSelector = $('<select class="w3-border" style="outline:none"></select>')
    containerDiv.append(shapeSelector)
    if(relatinshipName==null){
        shapeSelector.append($("<option value='ellipse'>◯</option>"))
        shapeSelector.append($("<option value='round-rectangle' style='font-size:120%'>▢</option>"))
        shapeSelector.append($("<option value='hexagon' style='font-size:130%'>⬡</option>"))
    }else{
        shapeSelector.append($("<option value='solid'>→</option>"))
        shapeSelector.append($("<option value='dotted'>⇢</option>"))
    }
    if(definedShape!=null) {
        shapeSelector.val(definedShape)
    }
    shapeSelector.change((eve)=>{
        var selectShape=eve.target.value
        var visualJson = globalCache.visualDefinition["default"]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"shape":selectShape })
            this.refreshModelTreeLabel()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"shape":selectShape })
        }
        this.saveVisualDefinition()
    })

    var sizeAdjustSelector = $('<select class="w3-border" style="outline:none;width:110px"></select>')
    if(relatinshipName==null){
        for(var f=0.2;f<2;f+=0.2){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">dimension*"+val+"</option>"))
        }
        if(definedDimensionRatio!=null) sizeAdjustSelector.val(definedDimensionRatio)
        else sizeAdjustSelector.val("1.0")
    }else{
        sizeAdjustSelector.css("width","80px")
        for(var f=0.5;f<=4;f+=0.5){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">width *"+val+"</option>"))
        }
        if(definedEdgeWidth!=null) sizeAdjustSelector.val(definedEdgeWidth)
        else sizeAdjustSelector.val("2.0")
    }
    containerDiv.append(sizeAdjustSelector)

    
    sizeAdjustSelector.change((eve)=>{
        var chooseVal=eve.target.value
        var visualJson = globalCache.visualDefinition["default"]

        if(!relatinshipName) {
            if(!visualJson[modelID]) visualJson[modelID]={}
            visualJson[modelID].dimensionRatio=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"dimensionRatio":chooseVal })
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].edgeWidth=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"edgeWidth":chooseVal })
        }
        this.saveVisualDefinition()
    })
    
}

modelManagerDialog.prototype.saveVisualDefinition=async function(){
    try{
        await msalHelper.callAPI("digitaltwin/saveVisualDefinition", "POST", {"visualDefinitionJson":JSON.stringify(globalCache.visualDefinition["default"])})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

modelManagerDialog.prototype.fillRelationshipInfo=function(validRelationships,parentDom){
    for(var ind in validRelationships){
        var keyDiv= $("<label style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")
        var label=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px'></label>")
        label.text("Relationship")
        parentDom.append(label)
        if(validRelationships[ind].target){
            var label1=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px;margin-left:2px'></label>")
            label1.text(validRelationships[ind].target)
            parentDom.append(label1)
        }
        var contentDOM=$("<label></label>")
        contentDOM.css("display","block")
        contentDOM.css("padding-left","1em")
        parentDom.append(contentDOM)
        this.fillEditableProperties(validRelationships[ind].editableRelationshipProperties, contentDOM)
    }
}

modelManagerDialog.prototype.fillEditableProperties=function(jsonInfo,parentDom){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")

        if(Array.isArray(jsonInfo[ind])){
            var contentDOM=$("<label class='w3-dark-gray' ></label>")
            contentDOM.text("enum")
            contentDOM.css({"fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)

            var valueArr=[]
            jsonInfo[ind].forEach(ele=>{valueArr.push(ele.enumValue)})
            var label1=$("<label class='w3-dark-gray' ></label>")
            label1.css({"fontSize":"9px","padding":'2px',"margin-left":"2px"})
            label1.text(valueArr.join())
            keyDiv.append(label1)
        }else if(typeof(jsonInfo[ind])==="object") {
            var contentDOM=$("<label></label>")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.fillEditableProperties(jsonInfo[ind],contentDOM)
            keyDiv.append(contentDOM)
        }else {
            var contentDOM=$("<label class='w3-dark-gray' ></label>")
            contentDOM.text(jsonInfo[ind])
            contentDOM.css({"fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)
        }
    }
}


modelManagerDialog.prototype.addAPartInRightSpan=function(partName){
    var headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align" style="font-weight:bold"></button>')
    headerDOM.text(partName)
    var listDOM=$('<div class="w3-container w3-hide w3-border w3-show" style="background-color:white"></div>')
    this.panelCard.append(headerDOM,listDOM)

    headerDOM.on("click",(evt)=> {
        if(listDOM.hasClass("w3-show")) listDOM.removeClass("w3-show")
        else listDOM.addClass("w3-show")
 
        return false;
    });
    
    return listDOM;
}

modelManagerDialog.prototype.readModelFilesContentAndImport=async function(files){
    // files is a FileList of File objects. List some properties.
    var fileContentArr=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            if(Array.isArray(obj)) fileContentArr=fileContentArr.concat(obj)
            else fileContentArr.push(obj)
        }catch(err){
            alert(err)
        }
    }
    if(fileContentArr.length==0) return;
    try {
        var response = await msalHelper.callAPI("digitaltwin/importModels", "POST", {"models":JSON.stringify(fileContentArr)})
        this.listModels("shouldBroadCast")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }  
}

modelManagerDialog.prototype.readOneFile= async function(aFile){
    return new Promise((resolve, reject) => {
        try{
            var reader = new FileReader();
            reader.onload = ()=> {
                resolve(reader.result)
            };
            reader.readAsText(aFile);
        }catch(e){
            reject(e)
        }
    })
}


modelManagerDialog.prototype.listModels=async function(shouldBroadcast){
    this.modelList.empty()
    await globalCache.loadUserData()

    if(jQuery.isEmptyObject(modelAnalyzer.DTDLModels)){
        var zeroModelItem=$('<li style="font-size:0.9em">zero model record. Please import...</li>')
        this.modelList.append(zeroModelItem)
        zeroModelItem.css("cursor","default")
    }else{
        this.tree = new simpleTree(this.modelList, {
            "leafNameProperty": "displayName"
            , "noMultipleSelectAllowed": true, "hideEmptyGroup": true
        })

        this.tree.options.leafNodeIconFunc = (ln) => {
            var modelClass = ln.leafInfo["@id"]
            var dbModelInfo=globalCache.getSingleDBModelByID(modelClass)
            
            var colorCode = "darkGray"
            var shape = "ellipse"
            var avarta = null
            var dimension=20;
            if (globalCache.visualDefinition["default"][modelClass]) {
                var visualJson = globalCache.visualDefinition["default"][modelClass]
                var colorCode = visualJson.color || "darkGray"
                var shape = visualJson.shape || "ellipse"
                var avarta = visualJson.avarta
                if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
            }

            var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative'></div>")
            if(dbModelInfo.isIoTDeviceModel){
                var iotDiv=$("<div class='w3-border' style='position:absolute;right:-5px;padding:0px 2px;top:-9px;border-radius: 3px;font-size:7px'>IoT</div>")
                iconDOM.append(iotDiv)
            }


            var imgSrc=encodeURIComponent(this.shapeSvg(shape,colorCode))
            iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
            if(avarta){
                var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
                iconDOM.append(avartaimg)
            }
            return iconDOM
        }

        this.tree.callback_afterSelectNodes = (nodesArr, mouseClickDetail) => {
            var theNode = nodesArr[0]
            this.fillRightSpan(theNode.leafInfo["@id"])
        }

        var groupNameList = {}
        for (var modelID in modelAnalyzer.DTDLModels) groupNameList[this.modelNameToGroupName(modelID)] = 1
        var modelgroupSortArr = Object.keys(groupNameList)
        modelgroupSortArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
        modelgroupSortArr.forEach(oneGroupName => {
            var gn=this.tree.addGroupNode({ displayName: oneGroupName })
            gn.expand()
        })

        for (var modelID in modelAnalyzer.DTDLModels) {
            var gn = this.modelNameToGroupName(modelID)
            this.tree.addLeafnodeToGroup(gn, JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]))
        }

        this.tree.sortAllLeaves()
    }
    
    if(shouldBroadcast) this.broadcastMessage({ "message": "ADTModelsChange"})
}

modelManagerDialog.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
}

modelManagerDialog.prototype.modelNameToGroupName=function(modelName){
    var nameParts=modelName.split(":")
    if(nameParts.length>=2)  return nameParts[1]
    else return "Others"
}

modelManagerDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTModelEdited") this.listModels("shouldBroadcast")
}


module.exports = new modelManagerDialog();
},{"../msalHelper":12,"./globalCache":13,"./modelAnalyzer":14,"./modelEditorDialog":15,"./simpleConfirmDialog":19,"./simpleTree":21}],17:[function(require,module,exports){
function moduleSwitchDialog(){
    this.modulesSidebar=$('<div class="w3-sidebar w3-bar-block w3-white w3-animate-left w3-card-4" style="display:none;height:160px;width:240px;overflow:hidden"><div style="height:40px" class="w3-bar w3-red"><button class="w3-bar-item w3-button w3-left w3-hover-amber" style="font-size:2em;padding-top:4px;width:55px">☰</button><div class="w3-bar-item" style="font-size:1.5em;width:70px;float:left;cursor:default">Open</div></div><a href="#" class="w3-bar-item w3-button w3-medium"><img src="faviconiothub.ico" style="width:25px;margin-right:10px"></img>Device Management</a><a href="#" class="w3-bar-item w3-button w3-medium"><img src="favicondigitaltwin.ico" style="width:25px;margin-right:10px"></img>Digital Twin</a><a href="#" class="w3-bar-item w3-button w3-medium"><img src="faviconeventlog.ico" style="width:25px;margin-right:10px"></img>Event Log</a></div>')
    
    this.modulesSwitchButton=$('<a class="w3-bar-item w3-button" href="#">☰</a>')
    
    this.modulesSwitchButton.on("click",()=>{ this.modulesSidebar.css("display","block") })
    this.modulesSidebar.children(':first').on("click",()=>{this.modulesSidebar.css("display","none")})
    
    var allModeuls=this.modulesSidebar.children("a")
    $(allModeuls[0]).on("click",()=>{
        window.open("devicemanagement.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
    $(allModeuls[1]).on("click",()=>{
        window.open("digitaltwinmodule.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
    $(allModeuls[2]).on("click",()=>{
        window.open("eventlogmodule.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
}

module.exports = new moduleSwitchDialog();
},{}],18:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const globalCache=require("./globalCache")

function newTwinDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

newTwinDialog.prototype.popup = async function(twinInfo) {
    this.originalTwinInfo=JSON.parse(JSON.stringify(twinInfo))
    this.twinInfo=twinInfo
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:520px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Editor</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var addButton = $('<button class="w3-button w3-card w3-green w3-hover-light-green" style="height:100%">Add</button>')
    this.contentDOM.children(':first').append(addButton)
    addButton.on("click", async () => { this.addNewTwin() })
    
    var addAndCloseButton = $('<button class="w3-button w3-card w3-green w3-hover-light-green" style="height:100%;margin-left:5px">Add & Close</button>')    
    this.contentDOM.children(':first').append(addAndCloseButton)
    addAndCloseButton.on("click", async () => {this.addNewTwin("CloseDialog")})
        
    var IDLableDiv= $("<div class='w3-padding' style='display:inline;font-weight:bold;color:black'>Twin ID</div>")
    var IDInput=$('<input type="text" style="margin:8px 0;padding:2px;width:150px;outline:none;display:inline" placeholder="ID"/>').addClass("w3-input w3-border");
    this.IDInput=IDInput 
    var modelID=twinInfo["$metadata"]["$model"]
    var modelLableDiv= $("<div class='w3-padding' style='display:inline;font-weight:bold;color:black'>Model</div>")
    var modelInput=$('<div type="text" style="margin:8px 0;padding:2px;display:inline"/>').text(modelID);  
    this.contentDOM.append($("<div/>").append(IDLableDiv,IDInput))
    this.contentDOM.append($("<div style='padding:8px 0px'/>").append(modelLableDiv,modelInput))
    IDInput.change((e)=>{
        this.twinInfo["$dtId"]=$(e.target).val()
    })

    var dialogDOM=$('<div />')
    this.contentDOM.append(dialogDOM)    
    var titleTable=$('<table style="width:100%" cellspacing="0px" cellpadding="0px"></table>')
    titleTable.append($('<tr><td style="font-weight:bold">Properties Tree</td></tr>'))
    dialogDOM.append($("<div class='w3-container'/>").append(titleTable))

    var settingsDiv=$("<div class='w3-container w3-border' style='width:100%;max-height:310px;overflow:auto'></div>")
    this.settingsDiv=settingsDiv
    dialogDOM.append(settingsDiv)
    this.drawModelSettings()
}

newTwinDialog.prototype.addNewTwin = async function(closeDialog) {
    var modelID=this.twinInfo["$metadata"]["$model"]
    var DBModelInfo=globalCache.getSingleDBModelByID(modelID)

    if(!this.twinInfo["$dtId"]||this.twinInfo["$dtId"]==""){
        alert("Please fill in name for the new digital twin")
        return;
    }
    var componentsNameArr=modelAnalyzer.DTDLModels[modelID].includedComponents
    componentsNameArr.forEach(oneComponentName=>{ //adt service requesting all component appear by mandatory
        if(this.twinInfo[oneComponentName]==null)this.twinInfo[oneComponentName]={}
        this.twinInfo[oneComponentName]["$metadata"]= {}
    })

    //ask taskmaster to add the twin
    try{
        var postBody= {"newTwinJson":JSON.stringify(this.twinInfo)}
        var data = await msalHelper.callAPI("digitaltwin/upsertDigitalTwin", "POST", postBody )
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }

    globalCache.storeSingleDBTwin(data.DBTwin)    
    globalCache.storeSingleADTTwin(data.ADTTwin)


    //ask taskmaster to provision the twin to iot hub if the model is a iot device model
    if(DBModelInfo.isIoTDeviceModel){
        try{
            var postBody= {"DBTwin":data.DBTwin,"desiredInDeviceTwin":{}}
            DBModelInfo.desiredProperties.forEach(ele=>{
                var propertyName=ele.path[ele.path.length-1]
                var propertySampleV= ""
                postBody.desiredInDeviceTwin[propertyName]=propertySampleV
            })
            var provisionedDocument = await msalHelper.callAPI("devicemanagement/provisionIoTDeviceTwin", "POST", postBody )
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
        data.DBTwin=provisionedDocument
        globalCache.storeSingleDBTwin(provisionedDocument)   
    }

    //it should select the new node in the tree, and move topology view to show the new node (note pan to a place that is not blocked by the dialog itself)
    this.broadcastMessage({ "message": "addNewTwin", "twinInfo": data.ADTTwin, "DBTwinInfo":data.DBTwin})

    if(closeDialog)this.DOM.hide()
    else{
        //clear the input editbox
        this.popup(this.originalTwinInfo)
    }
}

newTwinDialog.prototype.drawModelSettings = async function() {
    var modelID=this.twinInfo["$metadata"]["$model"]
    var modelDetail= modelAnalyzer.DTDLModels[modelID]
    var copyModelEditableProperty=JSON.parse(JSON.stringify(modelDetail.editableProperties))
    
    if($.isEmptyObject(copyModelEditableProperty)){
        this.settingsDiv.text("There is no editable property")
        this.settingsDiv.addClass("w3-text-gray")
        return;
    }   

    var settingsTable=$('<table style="width:100%" cellspacing="0px" cellpadding="0px"></table>')
    this.settingsDiv.append(settingsTable)

    var initialPathArr=[]
    var lastRootNodeRecord=[]
    this.drawEditable(settingsTable,copyModelEditableProperty,initialPathArr,lastRootNodeRecord)
}


newTwinDialog.prototype.drawEditable = async function(parentTable,jsonInfo,pathArr,lastRootNodeRecord) {
    if(jsonInfo==null) return;
    var arr=[]
    for(var ind in jsonInfo) arr.push(ind)

    for(var theIndex=0;theIndex<arr.length;theIndex++){
        if(theIndex==arr.length-1) lastRootNodeRecord[pathArr.length] =true;
        
        var ind = arr[theIndex]
        var tr=$("<tr/>")
        var rightTD=$("<td style='height:30px'/>")
        tr.append(rightTD)
        parentTable.append(tr)
        
        for(var i=0;i<pathArr.length;i++){
            if(!lastRootNodeRecord[i]) rightTD.append(this.treeLineDiv(2))
            else rightTD.append(this.treeLineDiv(4))
        }

        if(theIndex==arr.length-1) rightTD.append(this.treeLineDiv(3))
        else rightTD.append(this.treeLineDiv(1))

        var pNameDiv=$("<div style='float:left;line-height:28px;margin-left:3px'>"+ind+"</div>")
        rightTD.append(pNameDiv)
        var newPath=pathArr.concat([ind])

        if (Array.isArray(jsonInfo[ind])) { //it is a enumerator
            this.drawDropDownBox(rightTD,newPath,jsonInfo[ind])
        } else if (typeof (jsonInfo[ind])==="object") {
            this.drawEditable(parentTable,jsonInfo[ind],newPath,lastRootNodeRecord)
        }else {
            var aInput=$('<input type="text" style="margin-left:5px;padding:2px;width:200px;outline:none;display:inline" placeholder="type: '+jsonInfo[ind]+'"/>').addClass("w3-input w3-border");  
            rightTD.append(aInput)
            aInput.data("path", newPath)
            aInput.data("dataType", jsonInfo[ind])
            aInput.change((e)=>{
                this.updateOriginObjectValue($(e.target).data("path"),$(e.target).val(),$(e.target).data("dataType"))
            })
        } 
    }
}

newTwinDialog.prototype.drawDropDownBox=function(rightTD,newPath,valueArr){
    var aSelectMenu = new simpleSelectMenu(""
        , { width: "200" 
            ,buttonCSS: { "padding": "4px 16px"}
            , "optionListMarginTop": 25//,"optionListMarginLeft":210
            , "adjustPositionAnchor": this.DOM.offset()
        })


    rightTD.append(aSelectMenu.rowDOM)  //use rowDOM instead of DOM to allow select option window float above dialog
    aSelectMenu.DOM.data("path", newPath)
    valueArr.forEach((oneOption) => {
        var str = oneOption["displayName"] || oneOption["enumValue"]
        aSelectMenu.addOption(str)
    })
    aSelectMenu.callBack_clickOption = (optionText, optionValue, realMouseClick) => {
        aSelectMenu.changeName(optionText)
        if (realMouseClick) this.updateOriginObjectValue(aSelectMenu.DOM.data("path"), optionValue, "string")
    }
}

newTwinDialog.prototype.updateOriginObjectValue=function(pathArr,newVal,dataType){
    if(["double","boolean","float","integer","long"].includes(dataType)) newVal=Number(newVal)
    if(pathArr.length==0) return;
    var theJson=this.twinInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]

        if(i==pathArr.length-1){
            theJson[key]=newVal
            break
        }
        if(theJson[key]==null) theJson[key]={}
        theJson=theJson[key]
    }
}

newTwinDialog.prototype.treeLineDiv = function(typeNumber) {
    var reDiv=$('<div style="margin-left:10px;width:15px;height: 100%;float: left"></div>')
    if(typeNumber==1){
        reDiv.append($('<div class="w3-border-bottom w3-border-left" style="width:100%;height:50%;"></div><div class="w3-border-left" style="width:100%;height:50%;"></div>'))
    }else if(typeNumber==2){
        reDiv.append($('<div class="w3-border-left" style="width:100%;height:50%;"></div><div class="w3-border-left" style="width:100%;height:50%;"></div>'))
    }else if(typeNumber==3){
        reDiv.append($('<div class="w3-border-bottom w3-border-left" style="width:100%;height:50%;">'))
    }else if(typeNumber==4){
        
    }
    return reDiv
}

module.exports = new newTwinDialog();
},{"../msalHelper":12,"./globalCache":13,"./modelAnalyzer":14,"./simpleSelectMenu":20}],19:[function(require,module,exports){
function simpleConfirmDialog(){
    this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:102" class="w3-card-4"></div>')
    //this.DOM.css("overflow","hidden")
}

simpleConfirmDialog.prototype.show=function(cssOptions,otherOptions){
    this.DOM.css(cssOptions)
    this.DOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">' + otherOptions.title + '</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.close() })

    var dialogDiv=$('<div class="w3-container" style="margin-top:10px;margin-bottom:10px"></div>')
    dialogDiv.text(otherOptions.content)
    this.DOM.append(dialogDiv)
    this.dialogDiv=dialogDiv

    this.bottomBar=$('<div class="w3-bar"></div>')
    this.DOM.append(this.bottomBar)

    otherOptions.buttons.forEach(btn=>{
        var aButton=$('<button class="w3-button w3-right '+(btn.colorClass||"")+'" style="margin-right:2px;margin-left:2px">'+btn.text+'</button>')
        aButton.on("click",()=> { btn.clickFunc()  }  )
        this.bottomBar.append(aButton)    
    })
    $("body").append(this.DOM)
}

simpleConfirmDialog.prototype.close=function(){
    this.DOM.remove()
}

module.exports = simpleConfirmDialog;
},{}],20:[function(require,module,exports){
function simpleSelectMenu(buttonName,options){
    options=options||{} //{isClickable:1,withBorder:1,fontSize:"",colorClass:"",buttonCSS:""}
    if(options.isClickable){
        this.isClickable=true
        this.DOM=$('<div class="w3-dropdown-click"></div>')
    }else{
        this.DOM=$('<div class="w3-dropdown-hover "></div>')
        this.DOM.on("mouseover",(e)=>{
            this.adjustDropDownPosition()
        })
    }


    //it seems that the select menu only can show outside of a parent scrollable dom when it is inside a w3-bar item... not very sure about why 
    var rowDOM=$('<div class="w3-bar" style="display:inline-block;margin-left:5px"></div>')
    rowDOM.css("width",(options.width||100)+"px")
    this.rowDOM=rowDOM
    this.rowDOM.append(this.DOM)
    
    this.button=$('<button class="w3-button" style="outline: none;"><a>'+buttonName+'</a><a style="font-weight:bold;padding-left:2px"></a><i class="fa fa-caret-down" style="padding-left:3px"></i></button>')
    if(options.withBorder) this.button.addClass("w3-border")
    if(options.fontSize) this.DOM.css("font-size",options.fontSize)
    if(options.colorClass) this.button.addClass(options.colorClass)
    if(options.width) this.button.css("width",options.width)
    if(options.buttonCSS) this.button.css(options.buttonCSS)
    if(options.adjustPositionAnchor) this.adjustPositionAnchor=options.adjustPositionAnchor

    this.optionContentDOM=$('<div class="w3-dropdown-content w3-bar-block w3-card-4"></div>')
    if(options.optionListHeight) this.optionContentDOM.css({height:options.optionListHeight+"px","overflow-y":"auto","overflow-x":"visible"})
    if(options.optionListMarginTop) this.optionContentDOM.css({"margin-top":options.optionListMarginTop+"px"})
    if(options.optionListMarginLeft) this.optionContentDOM.css({"margin-left":options.optionListMarginLeft+"px"})
    
    this.DOM.append(this.button,this.optionContentDOM)
    this.curSelectVal=null;

    if(options.isClickable){
        this.button.on("click",(e)=>{
            this.adjustDropDownPosition()
            if(this.optionContentDOM.hasClass("w3-show"))  this.optionContentDOM.removeClass("w3-show")
            else{
                this.callBack_beforeClickExpand()
                this.optionContentDOM.addClass("w3-show")
            } 
            return false;
        })    
    }
}

simpleSelectMenu.prototype.shrink=function(){
    if(this.optionContentDOM.hasClass("w3-show"))  this.optionContentDOM.removeClass("w3-show")
}

simpleSelectMenu.prototype.adjustDropDownPosition=function(){
    if(!this.adjustPositionAnchor) return;
    var offset=this.DOM.offset()
    var newTop=offset.top-this.adjustPositionAnchor.top
    var newLeft=offset.left-this.adjustPositionAnchor.left
    this.optionContentDOM.css({"top":newTop+"px","left":newLeft+"px"})
}

simpleSelectMenu.prototype.findOption=function(optionValue){
    var options=this.optionContentDOM.children()
    for(var i=0;i<options.length;i++){
        var anOption=$(options[i])
        if(optionValue==anOption.data("optionValue")){
            return {"text":anOption.text(),"value":anOption.data("optionValue"),"colorClass":anOption.data("optionColorClass")}
        }
    }
}

simpleSelectMenu.prototype.addOptionArr=function(arr){
    arr.forEach(element => {
        this.addOption(element)
    });
}

simpleSelectMenu.prototype.addOption=function(optionText,optionValue,colorClass){
    var optionItem=$('<a href="#" class="w3-bar-item w3-button">'+optionText+'</a>')
    if(colorClass) optionItem.addClass(colorClass)
    this.optionContentDOM.append(optionItem)
    optionItem.data("optionValue",optionValue||optionText)
    optionItem.data("optionColorClass",colorClass)
    optionItem.on('click',(e)=>{
        this.curSelectVal=optionItem.data("optionValue")
        if(this.isClickable){
            this.optionContentDOM.removeClass("w3-show")
        }else{
            this.DOM.removeClass('w3-dropdown-hover')
            this.DOM.addClass('w3-dropdown-click')
            setTimeout(() => { //this is to hide the drop down menu after click
                this.DOM.addClass('w3-dropdown-hover')
                this.DOM.removeClass('w3-dropdown-click')
            }, 100);
        }
        this.callBack_clickOption(optionText,optionItem.data("optionValue"),"realMouseClick",optionItem.data("optionColorClass"))
        return false
    })
}

simpleSelectMenu.prototype.changeName=function(nameStr1,nameStr2){
    this.button.children(":first").text(nameStr1)
    this.button.children().eq(1).text(nameStr2)
}

simpleSelectMenu.prototype.triggerOptionIndex=function(optionIndex){
    var theOption=this.optionContentDOM.children().eq(optionIndex)
    if(theOption.length==0) {
        this.curSelectVal=null;
        this.callBack_clickOption(null,null)
        return;
    }
    this.curSelectVal=theOption.data("optionValue")
    this.callBack_clickOption(theOption.text(),theOption.data("optionValue"),null,theOption.data("optionColorClass"))
}

simpleSelectMenu.prototype.triggerOptionValue=function(optionValue){
    var re=this.findOption(optionValue)
    if(re==null){
        this.curSelectVal=null
        this.callBack_clickOption(null,null)
    }else{
        this.curSelectVal=re.value
        this.callBack_clickOption(re.text,re.value,null,re.colorClass)
    }
}


simpleSelectMenu.prototype.clearOptions=function(optionText,optionValue){
    this.optionContentDOM.empty()
    this.curSelectVal=null;
}

simpleSelectMenu.prototype.callBack_clickOption=function(optiontext,optionValue,realMouseClick){
}

simpleSelectMenu.prototype.callBack_beforeClickExpand=function(optiontext,optionValue,realMouseClick){
}


module.exports = simpleSelectMenu;
},{}],21:[function(require,module,exports){
'use strict';

function simpleTree(DOM,options){
    this.DOM=DOM
    this.groupNodes=[] //each group header is one node
    this.selectedNodes=[];
    this.options=options || {}

    this.lastClickedNode=null;
}

simpleTree.prototype.scrollToLeafNode=function(aNode){
    var scrollTop=this.DOM.scrollTop()
    var treeHeight=this.DOM.height()
    var nodePosition=aNode.DOM.position().top //which does not consider parent DOM's scroll height
    //console.log(scrollTop,treeHeight,nodePosition)
    if(treeHeight-50<nodePosition){
        this.DOM.scrollTop(scrollTop + nodePosition-(treeHeight-50)) 
    }else if(nodePosition<50){
        this.DOM.scrollTop(scrollTop + (nodePosition-50)) 
    }
}

simpleTree.prototype.clearAllLeafNodes=function(){
    this.lastClickedNode=null
    this.groupNodes.forEach((gNode)=>{
        gNode.listDOM.empty()
        gNode.childLeafNodes.length=0
        gNode.refreshName()
    })
}

simpleTree.prototype.firstLeafNode=function(){
    if(this.groupNodes.length==0) return null;
    var firstLeafNode=null;
    this.groupNodes.forEach(aGroupNode=>{
        if(firstLeafNode!=null) return;
        if(aGroupNode.childLeafNodes.length>0) firstLeafNode=aGroupNode.childLeafNodes[0]
    })

    return firstLeafNode
}

simpleTree.prototype.nextGroupNode=function(aGroupNode){
    if(aGroupNode==null) return;
    var index=this.groupNodes.indexOf(aGroupNode)
    if(this.groupNodes.length-1>index){
        return this.groupNodes[index+1]
    }else{ //rotate backward to first group node
        return this.groupNodes[0] 
    }
}

simpleTree.prototype.nextLeafNode=function(aLeafNode){
    if(aLeafNode==null) return;
    var aGroupNode=aLeafNode.parentGroupNode
    var index=aGroupNode.childLeafNodes.indexOf(aLeafNode)
    if(aGroupNode.childLeafNodes.length-1>index){
        //next node is in same group
        return aGroupNode.childLeafNodes[index+1]
    }else{
        //find next group first node
        while(true){
            var nextGroupNode = this.nextGroupNode(aGroupNode)
            if(nextGroupNode.childLeafNodes.length==0){
                aGroupNode=nextGroupNode
            }else{
                return nextGroupNode.childLeafNodes[0]
            }
        }
    }
}

simpleTree.prototype.searchText=function(str){
    if(str=="") return null;
    //search from current select item the next leaf item contains the text
    var regex = new RegExp(str, 'i');
    var startNode
    if(this.selectedNodes.length==0) {
        startNode=this.firstLeafNode()
        if(startNode==null) return;
        var theStr=startNode.name;
        if(theStr.match(regex)!=null){
            //find target node 
            return startNode
        }
    }else startNode=this.selectedNodes[0]

    if(startNode==null) return null;
    
    var fromNode=startNode;
    while(true){
        var nextNode=this.nextLeafNode(fromNode)
        if(nextNode==startNode) return null;
        var nextNodeStr=nextNode.name;
        if(nextNodeStr.match(regex)!=null){
            //find target node
            return nextNode
        }else{
            fromNode=nextNode;
        }
    }    
}

simpleTree.prototype.getAllLeafNodeArr=function(){
    var allLeaf=[]
    this.groupNodes.forEach(gn=>{
        allLeaf=allLeaf.concat(gn.childLeafNodes)
    })
    return allLeaf;
}


simpleTree.prototype.addLeafnodeToGroup=function(groupName,obj,skipRepeat){
    var aGroupNode=this.findGroupNode(groupName)
    if(aGroupNode == null) return;
    aGroupNode.addNode(obj,skipRepeat)
}

simpleTree.prototype.removeAllNodes=function(){
    this.lastClickedNode=null
    this.groupNodes.length=0;
    this.selectedNodes.length=0;
    this.DOM.empty()
}

simpleTree.prototype.findGroupNode=function(groupName){
    var foundGroupNode=null
    this.groupNodes.forEach(aGroupNode=>{
        if(aGroupNode.name==groupName){
            foundGroupNode=aGroupNode
            return;
        }
    })
    return foundGroupNode;
}

simpleTree.prototype.delGroupNode=function(gnode){
    this.lastClickedNode=null
    gnode.deleteSelf()
}

simpleTree.prototype.deleteLeafNode=function(nodeName){
    this.lastClickedNode=null
    var findLeafNode=null
    this.groupNodes.forEach((gNode)=>{
        if(findLeafNode!=null) return;
        gNode.childLeafNodes.forEach((aLeaf)=>{
            if(aLeaf.name==nodeName){
                findLeafNode=aLeaf
                return;
            }
        })
    })
    if(findLeafNode==null) return;
    findLeafNode.deleteSelf()
}


simpleTree.prototype.insertGroupNode=function(obj,index){
    var aNewGroupNode = new simpleTreeGroupNode(this,obj)
    var existGroupNode= this.findGroupNode(aNewGroupNode.name)
    if(existGroupNode!=null) return;
    this.groupNodes.splice(index, 0, aNewGroupNode);

    if(index==0){
        this.DOM.append(aNewGroupNode.headerDOM)
        this.DOM.append(aNewGroupNode.listDOM)
    }else{
        var prevGroupNode=this.groupNodes[index-1]
        aNewGroupNode.headerDOM.insertAfter(prevGroupNode.listDOM)
        aNewGroupNode.listDOM.insertAfter(aNewGroupNode.headerDOM)
    }

    return aNewGroupNode;
}

simpleTree.prototype.addGroupNode=function(obj){
    var aNewGroupNode = new simpleTreeGroupNode(this,obj)
    var existGroupNode= this.findGroupNode(aNewGroupNode.name)
    if(existGroupNode!=null) return existGroupNode;
    this.groupNodes.push(aNewGroupNode);
    this.DOM.append(aNewGroupNode.headerDOM)
    this.DOM.append(aNewGroupNode.listDOM)
    return aNewGroupNode;
}

simpleTree.prototype.selectLeafNode=function(leafNode,mouseClickDetail){
    this.selectLeafNodeArr([leafNode],mouseClickDetail)
}
simpleTree.prototype.appendLeafNodeToSelection=function(leafNode){
    var newArr=[].concat(this.selectedNodes)
    newArr.push(leafNode)
    this.selectLeafNodeArr(newArr)
}

simpleTree.prototype.addNodeArrayToSelection=function(arr){
    var newArr = this.selectedNodes
    var filterArr=arr.filter((item) => newArr.indexOf(item) < 0)
    newArr = newArr.concat(filterArr)
    this.selectLeafNodeArr(newArr)
}

simpleTree.prototype.selectGroupNode=function(groupNode){
    if(this.callback_afterSelectGroupNode) this.callback_afterSelectGroupNode(groupNode.info)
}

simpleTree.prototype.selectLeafNodeArr=function(leafNodeArr,mouseClickDetail){
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].dim()
    }
    this.selectedNodes.length=0;
    this.selectedNodes=this.selectedNodes.concat(leafNodeArr)
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].highlight()
    }

    if(this.callback_afterSelectNodes) this.callback_afterSelectNodes(this.selectedNodes,mouseClickDetail)
}

simpleTree.prototype.dblClickNode=function(theNode){
    if(this.callback_afterDblclickNode) this.callback_afterDblclickNode(theNode)
}

simpleTree.prototype.sortAllLeaves=function(){
    this.groupNodes.forEach(oneGroupNode=>{oneGroupNode.sortNodesByName()})
}

//----------------------------------tree group node---------------
function simpleTreeGroupNode(parentTree,obj){
    this.parentTree=parentTree
    this.info=obj
    this.childLeafNodes=[] //it's child leaf nodes array
    this.name=obj.displayName;
    this.createDOM()
}

simpleTreeGroupNode.prototype.refreshName=function(){
    this.headerDOM.empty()
    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)
    
    if(this.childLeafNodes.length>0) lblColor="w3-lime"
    else var lblColor="w3-gray" 
    this.headerDOM.css("font-weight","bold")

    
    if(this.parentTree.options.groupNodeIconFunc){
        var iconLabel=this.parentTree.options.groupNodeIconFunc(this)
        this.headerDOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
    }
    
    var numberlabel=$("<label class='"+lblColor+"' style='display:inline;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+this.childLeafNodes.length+"</label>")
    this.headerDOM.append(nameDiv,numberlabel)


    if(this.parentTree.options.groupNodeTailButtonFunc){
        var tailButton=this.parentTree.options.groupNodeTailButtonFunc(this)
        this.headerDOM.append(tailButton)
    }

    this.checkOptionHideEmptyGroup()

}
simpleTreeGroupNode.prototype.checkOptionHideEmptyGroup=function(){
    if (this.parentTree.options.hideEmptyGroup && this.childLeafNodes.length == 0) {
        this.shrink()
        this.headerDOM.hide()
        if (this.listDOM) this.listDOM.hide()
    } else {
        this.headerDOM.show()
        if (this.listDOM) this.listDOM.show()
    }

}
simpleTreeGroupNode.prototype.deleteSelf = function () {
    this.headerDOM.remove()
    this.listDOM.remove()
    var parentArr = this.parentTree.groupNodes
    const index = parentArr.indexOf(this);
    if (index > -1) parentArr.splice(index, 1);
}

simpleTreeGroupNode.prototype.createDOM=function(){
    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom" style="position:relative"></button>')
    this.refreshName()
    this.listDOM=$('<div class="w3-container w3-hide w3-border w3-padding-16"></div>')

    this.headerDOM.on("click",(evt)=> {
        if(this.listDOM.hasClass("w3-show")) this.listDOM.removeClass("w3-show")
        else this.listDOM.addClass("w3-show")

        this.parentTree.selectGroupNode(this)    
        return false;
    });
}

simpleTreeGroupNode.prototype.isOpen=function(){
    return  this.listDOM.hasClass("w3-show")
}


simpleTreeGroupNode.prototype.expand=function(){
    if(this.listDOM) this.listDOM.addClass("w3-show")
}

simpleTreeGroupNode.prototype.shrink=function(){
    if(this.listDOM) this.listDOM.removeClass("w3-show")
}

simpleTreeGroupNode.prototype.sortNodesByName=function(){
    var treeOptions=this.parentTree.options
    if(treeOptions.leafNameProperty) var leafNameProperty=treeOptions.leafNameProperty
    else leafNameProperty="$dtId"
    this.childLeafNodes.sort(function (a, b) { 
        var aName=a.name.toLowerCase()
        var bName=b.name.toLowerCase()
        return aName.localeCompare(bName) 
    });
    //this.listDOM.empty() //NOTE: Can not delete those leaf node otherwise the event handle is lost
    this.childLeafNodes.forEach(oneLeaf=>{this.listDOM.append(oneLeaf.DOM)})
}

simpleTreeGroupNode.prototype.addNode=function(obj,skipRepeat){
    var treeOptions=this.parentTree.options
    if(treeOptions.leafNameProperty) var leafNameProperty=treeOptions.leafNameProperty
    else leafNameProperty="$dtId"

    if(skipRepeat){
        var foundRepeat=false;
        this.childLeafNodes.forEach(aNode=>{
            if(aNode.name==obj[leafNameProperty]) {
                foundRepeat=true
                return;
            }
        })
        if(foundRepeat) return;
    }

    var aNewNode = new simpleTreeLeafNode(this,obj)
    this.childLeafNodes.push(aNewNode)
    this.refreshName()
    this.listDOM.append(aNewNode.DOM)
}

//----------------------------------tree leaf node------------------
function simpleTreeLeafNode(parentGroupNode,obj){
    this.parentGroupNode=parentGroupNode
    this.leafInfo=obj;

    var treeOptions=this.parentGroupNode.parentTree.options
    if(treeOptions.leafNameProperty) this.name=this.leafInfo[treeOptions.leafNameProperty]
    else this.name=this.leafInfo["$dtId"]

    this.createLeafNodeDOM()
}

simpleTreeLeafNode.prototype.deleteSelf = function () {
    this.DOM.remove()
    var gNode = this.parentGroupNode
    const index = gNode.childLeafNodes.indexOf(this);
    if (index > -1) gNode.childLeafNodes.splice(index, 1);
    gNode.refreshName()
}

simpleTreeLeafNode.prototype.clickSelf=function(mouseClickDetail){
    this.parentGroupNode.parentTree.lastClickedNode=this;
    this.parentGroupNode.parentTree.selectLeafNode(this,mouseClickDetail)
}

simpleTreeLeafNode.prototype.createLeafNodeDOM=function(){
    this.DOM=$('<button class="w3-button w3-white" style="display:block;text-align:left;width:98%"></button>')
    this.redrawLabel()


    var clickF=(e)=>{
        this.highlight();
        var clickDetail=e.detail
        if (e.ctrlKey) {
            if(this.parentGroupNode.parentTree.options.noMultipleSelectAllowed){
                this.clickSelf()
                return;
            }
            this.parentGroupNode.parentTree.appendLeafNodeToSelection(this)
            this.parentGroupNode.parentTree.lastClickedNode=this;
        }else if(e.shiftKey){
            if(this.parentGroupNode.parentTree.options.noMultipleSelectAllowed){
                this.clickSelf()
                return;
            }
            if(this.parentGroupNode.parentTree.lastClickedNode==null){
                this.clickSelf()
            }else{
                var allLeafNodeArr=this.parentGroupNode.parentTree.getAllLeafNodeArr()
                var index1 = allLeafNodeArr.indexOf(this.parentGroupNode.parentTree.lastClickedNode)
                var index2 = allLeafNodeArr.indexOf(this)
                if(index1==-1 || index2==-1){
                    this.clickSelf()
                }else{
                    //select all leaf between
                    var lowerI= Math.min(index1,index2)
                    var higherI= Math.max(index1,index2)
                    
                    var middleArr=allLeafNodeArr.slice(lowerI,higherI)                  
                    middleArr.push(allLeafNodeArr[higherI])
                    this.parentGroupNode.parentTree.addNodeArrayToSelection(middleArr)
                }
            }
        }else{
            this.clickSelf(clickDetail)
        }
    }
    this.DOM.on("click",(e)=>{clickF(e)})

    this.DOM.on("dblclick",(e)=>{
        this.parentGroupNode.parentTree.dblClickNode(this)
    })
}

simpleTreeLeafNode.prototype.redrawLabel=function(){
    this.DOM.empty()

    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)

    if(this.parentGroupNode.parentTree.options.leafNodeIconFunc){
        var iconLabel=this.parentGroupNode.parentTree.options.leafNodeIconFunc(this)
        this.DOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
    }
    
    this.DOM.append(nameDiv)
}
simpleTreeLeafNode.prototype.highlight=function(){
    this.DOM.addClass("w3-orange")
    this.DOM.addClass("w3-hover-amber")
    this.DOM.removeClass("w3-white")
}
simpleTreeLeafNode.prototype.dim=function(){
    this.DOM.removeClass("w3-orange")
    this.DOM.removeClass("w3-hover-amber")
    this.DOM.addClass("w3-white")
}


module.exports = simpleTree;
},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9BcHBEYXRhL1JvYW1pbmcvbnBtL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vQXBwRGF0YS9Sb2FtaW5nL25wbS9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9kaWdpdGFsdHdpbm1vZHVsZVVJLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9pbmZvUGFuZWwuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL21haW5Ub29sYmFyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9zdGFydFNlbGVjdGlvbkRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvdG9wb2xvZ3lET00uanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3R3aW5zVHJlZS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZ2xvYmFsQXBwU2V0dGluZ3MuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEVkaXRvckRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbW9kZWxNYW5hZ2VyRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9tb2R1bGVTd2l0Y2hEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL25ld1R3aW5EaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVRyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqc0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsOEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeG1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICB2YXIgaVxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHxcbiAgICAgIHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAyKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMSkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArXG4gICAgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9XG4gICAgICAoKHVpbnQ4W2ldIDw8IDE2KSAmIDB4RkYwMDAwKSArXG4gICAgICAoKHVpbnQ4W2kgKyAxXSA8PCA4KSAmIDB4RkYwMCkgK1xuICAgICAgKHVpbnQ4W2kgKyAyXSAmIDB4RkYpXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsodWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKSkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG52YXIgS19NQVhfTEVOR1RIID0gMHg3ZmZmZmZmZlxuZXhwb3J0cy5rTWF4TGVuZ3RoID0gS19NQVhfTEVOR1RIXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFByaW50IHdhcm5pbmcgYW5kIHJlY29tbWVuZCB1c2luZyBgYnVmZmVyYCB2NC54IHdoaWNoIGhhcyBhbiBPYmplY3RcbiAqICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIFdlIHJlcG9ydCB0aGF0IHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGlmIHRoZSBhcmUgbm90IHN1YmNsYXNzYWJsZVxuICogdXNpbmcgX19wcm90b19fLiBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YFxuICogKFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4KS4gSUUgMTAgbGFja3Mgc3VwcG9ydFxuICogZm9yIF9fcHJvdG9fXyBhbmQgaGFzIGEgYnVnZ3kgdHlwZWQgYXJyYXkgaW1wbGVtZW50YXRpb24uXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5pZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSAnICtcbiAgICAnYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC4nXG4gIClcbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICAvLyBDYW4gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWQ/XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLl9fcHJvdG9fXyA9IHsgX19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9IH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MlxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdwYXJlbnQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyXG4gIH1cbn0pXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAnb2Zmc2V0Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ5dGVPZmZzZXRcbiAgfVxufSlcblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKGxlbmd0aCA+IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgbGVuZ3RoICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGxlbmd0aClcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZylcbiAgfVxuICByZXR1cm4gZnJvbShhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbmlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAhPSBudWxsICYmXG4gICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgdmFsdWU6IG51bGwsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuZnVuY3Rpb24gZnJvbSAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh2YWx1ZSlcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICAgIClcbiAgfVxuXG4gIGlmIChpc0luc3RhbmNlKHZhbHVlLCBBcnJheUJ1ZmZlcikgfHxcbiAgICAgICh2YWx1ZSAmJiBpc0luc3RhbmNlKHZhbHVlLmJ1ZmZlciwgQXJyYXlCdWZmZXIpKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICApXG4gIH1cblxuICB2YXIgdmFsdWVPZiA9IHZhbHVlLnZhbHVlT2YgJiYgdmFsdWUudmFsdWVPZigpXG4gIGlmICh2YWx1ZU9mICE9IG51bGwgJiYgdmFsdWVPZiAhPT0gdmFsdWUpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odmFsdWVPZiwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgdmFyIGIgPSBmcm9tT2JqZWN0KHZhbHVlKVxuICBpZiAoYikgcmV0dXJuIGJcblxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvUHJpbWl0aXZlICE9IG51bGwgJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSgnc3RyaW5nJyksIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aFxuICAgIClcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgc2l6ZSArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgPyBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICAgIDogY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbClcbiAgfVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmaWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogYWxsb2Moc2l6ZVssIGZpbGxbLCBlbmNvZGluZ11dKVxuICoqL1xuQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24gKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIHJldHVybiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gYWxsb2NVbnNhZmUgKHNpemUpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUgPCAwID8gMCA6IGNoZWNrZWQoc2l6ZSkgfCAwKVxufVxuXG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gQnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gU2xvd0J1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICovXG5CdWZmZXIuYWxsb2NVbnNhZmVTbG93ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuXG4gIHZhciBhY3R1YWwgPSBidWYud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcblxuICBpZiAoYWN0dWFsICE9PSBsZW5ndGgpIHtcbiAgICAvLyBXcml0aW5nIGEgaGV4IHN0cmluZywgZm9yIGV4YW1wbGUsIHRoYXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIHdpbGxcbiAgICAvLyBjYXVzZSBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdCBpbnZhbGlkIGNoYXJhY3RlciB0byBiZSBpZ25vcmVkLiAoZS5nLlxuICAgIC8vICdhYnh4Y2QnIHdpbGwgYmUgdHJlYXRlZCBhcyAnYWInKVxuICAgIGJ1ZiA9IGJ1Zi5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGggPCAwID8gMCA6IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcIm9mZnNldFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciBidWZcbiAgaWYgKGJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAob2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuKVxuXG4gICAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBidWZcbiAgICB9XG5cbiAgICBvYmouY29weShidWYsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBudW1iZXJJc05hTihvYmoubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKVxuICAgIH1cbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmopXG4gIH1cblxuICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIEFycmF5LmlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IEtfTUFYX0xFTkdUSGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsgS19NQVhfTEVOR1RILnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyID09PSB0cnVlICYmXG4gICAgYiAhPT0gQnVmZmVyLnByb3RvdHlwZSAvLyBzbyBCdWZmZXIuaXNCdWZmZXIoQnVmZmVyLnByb3RvdHlwZSkgd2lsbCBiZSBmYWxzZVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKGlzSW5zdGFuY2UoYSwgVWludDhBcnJheSkpIGEgPSBCdWZmZXIuZnJvbShhLCBhLm9mZnNldCwgYS5ieXRlTGVuZ3RoKVxuICBpZiAoaXNJbnN0YW5jZShiLCBVaW50OEFycmF5KSkgYiA9IEJ1ZmZlci5mcm9tKGIsIGIub2Zmc2V0LCBiLmJ5dGVMZW5ndGgpXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcImJ1ZjFcIiwgXCJidWYyXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXknXG4gICAgKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdsYXRpbjEnOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBidWYgPSBsaXN0W2ldXG4gICAgaWYgKGlzSW5zdGFuY2UoYnVmLCBVaW50OEFycmF5KSkge1xuICAgICAgYnVmID0gQnVmZmVyLmZyb20oYnVmKVxuICAgIH1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBpc0luc3RhbmNlKHN0cmluZywgQXJyYXlCdWZmZXIpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBvciBBcnJheUJ1ZmZlci4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHN0cmluZ1xuICAgIClcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBtdXN0TWF0Y2ggPSAoYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdID09PSB0cnVlKVxuICBpZiAoIW11c3RNYXRjaCAmJiBsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHtcbiAgICAgICAgICByZXR1cm4gbXVzdE1hdGNoID8gLTEgOiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICB9XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIC8vIE5vIG5lZWQgdG8gdmVyaWZ5IHRoYXQgXCJ0aGlzLmxlbmd0aCA8PSBNQVhfVUlOVDMyXCIgc2luY2UgaXQncyBhIHJlYWQtb25seVxuICAvLyBwcm9wZXJ0eSBvZiBhIHR5cGVkIGFycmF5LlxuXG4gIC8vIFRoaXMgYmVoYXZlcyBuZWl0aGVyIGxpa2UgU3RyaW5nIG5vciBVaW50OEFycmF5IGluIHRoYXQgd2Ugc2V0IHN0YXJ0L2VuZFxuICAvLyB0byB0aGVpciB1cHBlci9sb3dlciBib3VuZHMgaWYgdGhlIHZhbHVlIHBhc3NlZCBpcyBvdXQgb2YgcmFuZ2UuXG4gIC8vIHVuZGVmaW5lZCBpcyBoYW5kbGVkIHNwZWNpYWxseSBhcyBwZXIgRUNNQS0yNjIgNnRoIEVkaXRpb24sXG4gIC8vIFNlY3Rpb24gMTMuMy4zLjcgUnVudGltZSBTZW1hbnRpY3M6IEtleWVkQmluZGluZ0luaXRpYWxpemF0aW9uLlxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCB8fCBzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICAvLyBSZXR1cm4gZWFybHkgaWYgc3RhcnQgPiB0aGlzLmxlbmd0aC4gRG9uZSBoZXJlIHRvIHByZXZlbnQgcG90ZW50aWFsIHVpbnQzMlxuICAvLyBjb2VyY2lvbiBmYWlsIGJlbG93LlxuICBpZiAoc3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbmQgPD0gMCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgLy8gRm9yY2UgY29lcnNpb24gdG8gdWludDMyLiBUaGlzIHdpbGwgYWxzbyBjb2VyY2UgZmFsc2V5L05hTiB2YWx1ZXMgdG8gMC5cbiAgZW5kID4+Pj0gMFxuICBzdGFydCA+Pj49IDBcblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuLy8gVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIChhbmQgdGhlIGBpcy1idWZmZXJgIG5wbSBwYWNrYWdlKVxuLy8gdG8gZGV0ZWN0IGEgQnVmZmVyIGluc3RhbmNlLiBJdCdzIG5vdCBwb3NzaWJsZSB0byB1c2UgYGluc3RhbmNlb2YgQnVmZmVyYFxuLy8gcmVsaWFibHkgaW4gYSBicm93c2VyaWZ5IGNvbnRleHQgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBkaWZmZXJlbnRcbi8vIGNvcGllcyBvZiB0aGUgJ2J1ZmZlcicgcGFja2FnZSBpbiB1c2UuIFRoaXMgbWV0aG9kIHdvcmtzIGV2ZW4gZm9yIEJ1ZmZlclxuLy8gaW5zdGFuY2VzIHRoYXQgd2VyZSBjcmVhdGVkIGZyb20gYW5vdGhlciBjb3B5IG9mIHRoZSBgYnVmZmVyYCBwYWNrYWdlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTU0XG5CdWZmZXIucHJvdG90eXBlLl9pc0J1ZmZlciA9IHRydWVcblxuZnVuY3Rpb24gc3dhcCAoYiwgbiwgbSkge1xuICB2YXIgaSA9IGJbbl1cbiAgYltuXSA9IGJbbV1cbiAgYlttXSA9IGlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMTYgPSBmdW5jdGlvbiBzd2FwMTYgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDIgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAxKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDMyID0gZnVuY3Rpb24gc3dhcDMyICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA0ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAzMi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgMilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXA2NCA9IGZ1bmN0aW9uIHN3YXA2NCAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgOCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNjQtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gOCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDcpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDYpXG4gICAgc3dhcCh0aGlzLCBpICsgMiwgaSArIDUpXG4gICAgc3dhcCh0aGlzLCBpICsgMywgaSArIDQpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZ1xuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLnJlcGxhY2UoLyguezJ9KS9nLCAnJDEgJykudHJpbSgpXG4gIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKGlzSW5zdGFuY2UodGFyZ2V0LCBVaW50OEFycmF5KSkge1xuICAgIHRhcmdldCA9IEJ1ZmZlci5mcm9tKHRhcmdldCwgdGFyZ2V0Lm9mZnNldCwgdGFyZ2V0LmJ5dGVMZW5ndGgpXG4gIH1cbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidGFyZ2V0XCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheS4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB0YXJnZXQpXG4gICAgKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAobnVtYmVySXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGxhdGluMVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggPj4+IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyAoYnl0ZXNbaSArIDFdICogMjU2KSlcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmID0gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9XG5cbiAgLy8gSW52YWxpZCByYW5nZXMgYXJlIG5vdCBzZXQgdG8gYSBkZWZhdWx0LCBzbyBjYW4gcmFuZ2UgY2hlY2sgZWFybHkuXG4gIGlmIChzdGFydCA8IDAgfHwgdGhpcy5sZW5ndGggPCBzdGFydCB8fCB0aGlzLmxlbmd0aCA8IGVuZCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdPdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gdGhpcy5sZW5ndGggOiBlbmQgPj4+IDBcblxuICBpZiAoIXZhbCkgdmFsID0gMFxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgIHRoaXNbaV0gPSB2YWxcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gQnVmZmVyLmlzQnVmZmVyKHZhbClcbiAgICAgID8gdmFsXG4gICAgICA6IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyB2YWwgK1xuICAgICAgICAnXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXCJ2YWx1ZVwiJylcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyArK2kpIHtcbiAgICAgIHRoaXNbaSArIHN0YXJ0XSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSB0YWtlcyBlcXVhbCBzaWducyBhcyBlbmQgb2YgdGhlIEJhc2U2NCBlbmNvZGluZ1xuICBzdHIgPSBzdHIuc3BsaXQoJz0nKVswXVxuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyLnRyaW0oKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVyIG9yIFVpbnQ4QXJyYXkgb2JqZWN0cyBmcm9tIG90aGVyIGNvbnRleHRzIChpLmUuIGlmcmFtZXMpIGRvIG5vdCBwYXNzXG4vLyB0aGUgYGluc3RhbmNlb2ZgIGNoZWNrIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIG9mIHRoYXQgdHlwZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNJbnN0YW5jZSAob2JqLCB0eXBlKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8XG4gICAgKG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLm5hbWUpXG59XG5mdW5jdGlvbiBudW1iZXJJc05hTiAob2JqKSB7XG4gIC8vIEZvciBJRTExIHN1cHBvcnRcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCIvKiEgaWVlZTc1NC4gQlNELTMtQ2xhdXNlIExpY2Vuc2UuIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZy9vcGVuc291cmNlPiAqL1xuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSAoZSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSAobSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICgodmFsdWUgKiBjKSAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5jb25zdCB0b3BvbG9neURPTT1yZXF1aXJlKFwiLi90b3BvbG9neURPTS5qc1wiKVxyXG5jb25zdCB0d2luc1RyZWU9cmVxdWlyZShcIi4vdHdpbnNUcmVlXCIpXHJcbmNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nID0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBtYWluVG9vbGJhciA9IHJlcXVpcmUoXCIuL21haW5Ub29sYmFyXCIpXHJcbmNvbnN0IGluZm9QYW5lbD0gcmVxdWlyZShcIi4vaW5mb1BhbmVsXCIpO1xyXG5jb25zdCBnbG9iYWxBcHBTZXR0aW5ncyA9IHJlcXVpcmUoXCIuLi9nbG9iYWxBcHBTZXR0aW5ncy5qc1wiKTtcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbmV3VHdpbkRpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbmV3VHdpbkRpYWxvZ1wiKTtcclxuXHJcbmZ1bmN0aW9uIGRpZ2l0YWx0d2lubW9kdWxlVUkoKSB7XHJcbiAgICB0aGlzLmluaXRVSUxheW91dCgpXHJcblxyXG4gICAgdGhpcy50d2luc1RyZWU9IG5ldyB0d2luc1RyZWUoJChcIiN0cmVlSG9sZGVyXCIpLCQoXCIjdHJlZVNlYXJjaFwiKSlcclxuICAgIFxyXG4gICAgbWFpblRvb2xiYXIucmVuZGVyKClcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZT1uZXcgdG9wb2xvZ3lET00oJCgnI2NhbnZhcycpKVxyXG4gICAgdGhpcy50b3BvbG9neUluc3RhbmNlLmluaXQoKVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSgpIC8vaW5pdGlhbGl6ZSBhbGwgdWkgY29tcG9uZW50cyB0byBoYXZlIHRoZSBicm9hZGNhc3QgY2FwYWJpbGl0eVxyXG5cclxuICAgIC8vdHJ5IGlmIGl0IGFscmVhZHkgQjJDIHNpZ25lZCBpbiwgaWYgbm90IGdvaW5nIGJhY2sgdG8gdGhlIHN0YXJ0IHBhZ2VcclxuICAgIHRoaXMubXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcblxyXG5cclxuICAgIHZhciB0aGVBY2NvdW50PW1zYWxIZWxwZXIuZmV0Y2hBY2NvdW50KCk7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsICYmICFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCkgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG5cclxuICAgIGdsb2JhbENhY2hlLmxvYWRVc2VyRGF0YSgpLnRoZW4ocmU9PntcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAvL2RpcmVjdGx5IHBvcHVwIHRvIG1vZGVsIG1hbmFnZW1lbnQgZGlhbG9nIGFsbG93IHVzZXIgaW1wb3J0IG9yIGNyZWF0ZSBtb2RlbFxyXG4gICAgICAgICAgICBtb2RlbE1hbmFnZXJEaWFsb2cucG9wdXAoKVxyXG4gICAgICAgICAgICAvL3BvcCB1cCB3ZWxjb21lIHNjcmVlblxyXG4gICAgICAgICAgICB2YXIgcG9wV2luPSQoJzxkaXYgY2xhc3M9XCJ3My1ibHVlIHczLWNhcmQtNCB3My1wYWRkaW5nLWxhcmdlXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDU7d2lkdGg6NDAwcHg7Y3Vyc29yOmRlZmF1bHRcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICBwb3BXaW4uaHRtbChgV2VsY29tZSwgJHttc2FsSGVscGVyLnVzZXJOYW1lfSEgRmlyc3RseSwgeW91IG1heSBjb25zaWRlciBpbXBvcnRpbmcgYSBmZXcgdHdpbiBtb2RlbCBmaWxlcyBvciBjcmVhdGluZyB0d2luIG1vZGVscyBmcm9tIHNjcmF0Y2guIDxici8+PGJyLz5DbGljayB0byBjb250aW51ZS4uLmApXHJcbiAgICAgICAgICAgICQoXCJib2R5XCIpLmFwcGVuZChwb3BXaW4pXHJcbiAgICAgICAgICAgIHBvcFdpbi5vbihcImNsaWNrXCIsKCk9Pntwb3BXaW4ucmVtb3ZlKCl9KVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzdGFydFNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh0aGlzLHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvblJlZnJlc2hcIn0pXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHRoaXMseyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxuICAgIH0pXHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmJyb2FkY2FzdE1lc3NhZ2U9ZnVuY3Rpb24oc291cmNlLG1zZ1BheWxvYWQpe1xyXG4gICAgdmFyIGNvbXBvbmVudHNBcnI9W3RoaXMudHdpbnNUcmVlLHN0YXJ0U2VsZWN0aW9uRGlhbG9nLG1vZGVsTWFuYWdlckRpYWxvZyxtb2RlbEVkaXRvckRpYWxvZyxlZGl0TGF5b3V0RGlhbG9nLFxyXG4gICAgICAgICBtYWluVG9vbGJhcix0aGlzLnRvcG9sb2d5SW5zdGFuY2UsaW5mb1BhbmVsLG5ld1R3aW5EaWFsb2ddXHJcblxyXG4gICAgaWYoc291cmNlPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGNvbXBvbmVudHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVDb21wb25lbnQ9Y29tcG9uZW50c0FycltpXVxyXG4gICAgICAgICAgICB0aGlzLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2UodGhlQ29tcG9uZW50KVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIGlmKHRoZUNvbXBvbmVudC5yeE1lc3NhZ2UgJiYgdGhlQ29tcG9uZW50IT1zb3VyY2UpIHRoZUNvbXBvbmVudC5yeE1lc3NhZ2UobXNnUGF5bG9hZClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2U9ZnVuY3Rpb24odWlDb21wb25lbnQpe1xyXG4gICAgdWlDb21wb25lbnQuYnJvYWRjYXN0TWVzc2FnZT0obXNnT2JqKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh1aUNvbXBvbmVudCxtc2dPYmopfVxyXG59XHJcblxyXG5kaWdpdGFsdHdpbm1vZHVsZVVJLnByb3RvdHlwZS5pbml0VUlMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbXlMYXlvdXQgPSAkKCdib2R5JykubGF5b3V0KHtcclxuICAgICAgICAvL1x0cmVmZXJlbmNlIG9ubHkgLSB0aGVzZSBvcHRpb25zIGFyZSBOT1QgcmVxdWlyZWQgYmVjYXVzZSAndHJ1ZScgaXMgdGhlIGRlZmF1bHRcclxuICAgICAgICBjbG9zYWJsZTogdHJ1ZVx0Ly8gcGFuZSBjYW4gb3BlbiAmIGNsb3NlXHJcbiAgICAgICAgLCByZXNpemFibGU6IHRydWVcdC8vIHdoZW4gb3BlbiwgcGFuZSBjYW4gYmUgcmVzaXplZCBcclxuICAgICAgICAsIHNsaWRhYmxlOiB0cnVlXHQvLyB3aGVuIGNsb3NlZCwgcGFuZSBjYW4gJ3NsaWRlJyBvcGVuIG92ZXIgb3RoZXIgcGFuZXMgLSBjbG9zZXMgb24gbW91c2Utb3V0XHJcbiAgICAgICAgLCBsaXZlUGFuZVJlc2l6aW5nOiB0cnVlXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHJlc2l6aW5nL3RvZ2dsaW5nIHNldHRpbmdzXHJcbiAgICAgICAgLCBub3J0aF9fc2xpZGFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdzbGlkYWJsZT10cnVlJ1xyXG4gICAgICAgIC8vLCBub3J0aF9fdG9nZ2xlckxlbmd0aF9jbG9zZWQ6ICcxMDAlJ1x0Ly8gdG9nZ2xlLWJ1dHRvbiBpcyBmdWxsLXdpZHRoIG9mIHJlc2l6ZXItYmFyXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19jbG9zZWQ6IDZcdFx0Ly8gYmlnIHJlc2l6ZXItYmFyIHdoZW4gb3BlbiAoemVybyBoZWlnaHQpXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19vcGVuOjBcclxuICAgICAgICAsIG5vcnRoX19yZXNpemFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdyZXNpemFibGU9dHJ1ZSdcclxuICAgICAgICAsIG5vcnRoX19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsIHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHBhbmUtc2l6ZSBzZXR0aW5nc1xyXG4gICAgICAgICwgd2VzdF9fbWluU2l6ZTogMTAwXHJcbiAgICAgICAgLCBlYXN0X19zaXplOiAzMDBcclxuICAgICAgICAsIGVhc3RfX21pblNpemU6IDIwMFxyXG4gICAgICAgICwgZWFzdF9fbWF4U2l6ZTogLjUgLy8gNTAlIG9mIGxheW91dCB3aWR0aFxyXG4gICAgICAgICwgY2VudGVyX19taW5XaWR0aDogMTAwXHJcbiAgICAgICAgLGVhc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICx3ZXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsZWFzdF9faW5pdENsb3NlZDpcdHRydWVcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICpcdERJU0FCTEUgVEVYVC1TRUxFQ1RJT04gV0hFTiBEUkFHR0lORyAob3IgZXZlbiBfdHJ5aW5nXyB0byBkcmFnISlcclxuICAgICAqXHR0aGlzIGZ1bmN0aW9uYWxpdHkgd2lsbCBiZSBpbmNsdWRlZCBpbiBSQzMwLjgwXHJcbiAgICAgKi9cclxuICAgICQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkZCA9ICQoZG9jdW1lbnQpXHJcbiAgICAgICAgICAgICwgcyA9ICd0ZXh0U2VsZWN0aW9uRGlzYWJsZWQnXHJcbiAgICAgICAgICAgICwgeCA9ICd0ZXh0U2VsZWN0aW9uSW5pdGlhbGl6ZWQnXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICBpZiAoJC5mbi5kaXNhYmxlU2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YSh4KSkgLy8gZG9jdW1lbnQgaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XHJcbiAgICAgICAgICAgICAgICAkZC5vbignbW91c2V1cCcsICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24pLmRhdGEoeCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgICAgICRkLmRpc2FibGVTZWxlY3Rpb24oKS5kYXRhKHMsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCckLmxheW91dC5kaXNhYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCc7XHJcbiAgICAgICAgaWYgKCQuZm4uZW5hYmxlU2VsZWN0aW9uICYmICRkLmRhdGEocykpXHJcbiAgICAgICAgICAgICRkLmVuYWJsZVNlbGVjdGlvbigpLmRhdGEocywgZmFsc2UpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24nKTtcclxuICAgIH07XHJcbiAgICAkKFwiLnVpLWxheW91dC1yZXNpemVyLW5vcnRoXCIpLmhpZGUoKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5jc3MoXCJib3JkZXItcmlnaHRcIixcInNvbGlkIDFweCBsaWdodEdyYXlcIilcclxuICAgICQoXCIudWktbGF5b3V0LXdlc3RcIikuYWRkQ2xhc3MoXCJ3My1jYXJkXCIpXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBkaWdpdGFsdHdpbm1vZHVsZVVJKCk7IiwiY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBlZGl0TGF5b3V0RGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDFcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yZWZpbGxPcHRpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgXHJcbiAgICBmb3IodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKXtcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbihpbmQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5ET00uY3NzKHtcIndpZHRoXCI6XCIzMjBweFwiLFwicGFkZGluZy1ib3R0b21cIjpcIjNweFwifSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHg7bWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPkxheW91dDwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7IHdpZHRoOjE4MHB4OyBkaXNwbGF5OmlubGluZTttYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjJweFwiICBwbGFjZWhvbGRlcj1cIkZpbGwgaW4gYSBuZXcgbGF5b3V0IG5hbWUuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZUlucHV0KVxyXG4gICAgdmFyIHNhdmVBc05ld0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCI+U2F2ZSBOZXcgTGF5b3V0PC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChzYXZlQXNOZXdCdG4pXHJcbiAgICBzYXZlQXNOZXdCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlSW50b0xheW91dChuYW1lSW5wdXQudmFsKCkpfSlcclxuXHJcblxyXG4gICAgaWYoIWpRdWVyeS5pc0VtcHR5T2JqZWN0KGdsb2JhbENhY2hlLmxheW91dEpTT04pKXtcclxuICAgICAgICB2YXIgbGJsPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtcGFkZGluZy0xNlwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+LSBPUiAtPC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQobGJsKSBcclxuICAgICAgICB2YXIgc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIix7Zm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLHdpZHRoOlwiMTIwcHhcIn0pXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1zd2l0Y2hMYXlvdXRTZWxlY3RvclxyXG4gICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgaWYob3B0aW9uVGV4dD09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiIFwiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdmFyIHNhdmVBc0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjVweFwiPlNhdmUgQXM8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBkZWxldGVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGlua1wiIHN0eWxlPVwibWFyZ2luLWxlZnQ6NXB4XCI+RGVsZXRlIExheW91dDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc0J0bixzd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sZGVsZXRlQnRuKVxyXG4gICAgICAgIHNhdmVBc0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG4gICAgICAgIGRlbGV0ZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZUxheW91dChzd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWwpfSlcclxuXHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUhPW51bGwpe1xyXG4gICAgICAgICAgICBzd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuc2F2ZUludG9MYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzYXZlTGF5b3V0XCIsIFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lfSlcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG59XHJcblxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuZGVsZXRlTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKGxheW91dE5hbWU9PVwiXCIgfHwgbGF5b3V0TmFtZT09bnVsbCl7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIHRhcmdldCBsYXlvdXQgTmFtZVwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMjUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJDb25maXJtIGRlbGV0aW5nIGxheW91dCBcXFwiXCIgKyBsYXlvdXROYW1lICsgXCJcXFwiP1wiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczpbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0TmFtZSA9PSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSkgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZpbGxPcHRpb25zKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlTGF5b3V0XCIsIFwiUE9TVFwiLCB7IFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZWRpdExheW91dERpYWxvZygpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplclwiKTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXIgPSByZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gaW5mb1BhbmVsKCkge1xyXG4gICAgdGhpcy5jb250aW5lckRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZFwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDo5MDtyaWdodDowcHg7dG9wOjUwJTtoZWlnaHQ6NzAlO3dpZHRoOjMwMHB4O3RyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKTtcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5oaWRlKClcclxuICAgIHRoaXMuY29udGluZXJET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NTBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjwvZGl2PicpKVxyXG5cclxuICAgIHRoaXMuY2xvc2VCdXR0b24xPSQoJzxidXR0b24gc3R5bGU9XCJoZWlnaHQ6MTAwJVwiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+PGkgY2xhc3M9XCJmYSBmYS1pbmZvLWNpcmNsZSBmYS0yeFwiIHN0eWxlPVwicGFkZGluZzoycHhcIj48L2k+PC9idXR0b24+JylcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW1cIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQodGhpcy5jbG9zZUJ1dHRvbjEsdGhpcy5jbG9zZUJ1dHRvbjIpIFxyXG5cclxuICAgIHRoaXMuaXNNaW5pbWl6ZWQ9ZmFsc2U7XHJcbiAgICB2YXIgYnV0dG9uQW5pbT0oKT0+e1xyXG4gICAgICAgIGlmKCF0aGlzLmlzTWluaW1pemVkKXtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiBcIi0yNTBweFwiLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OlwiNTBweFwiXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuaXNNaW5pbWl6ZWQ9dHJ1ZTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiBcIjBweFwiLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBcIjcwJVwiXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuaXNNaW5pbWl6ZWQ9ZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjEub24oXCJjbGlja1wiLGJ1dHRvbkFuaW0pXHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMi5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuXHJcbiAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCIgc3R5bGU9XCJwb3N0aW9uOmFic29sdXRlO3RvcDo1MHB4O2hlaWdodDpjYWxjKDEwMCUgLSA1MHB4KTtvdmVyZmxvdzphdXRvXCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjgpXCIpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmhvdmVyKCgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDEpXCIpXHJcbiAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjgpXCIpXHJcbiAgICB9KTtcclxuICAgIHRoaXMuY29udGluZXJET00uYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLmNvbnRpbmVyRE9NKVxyXG5cclxuICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzPW51bGw7XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uRGlhbG9nX2Nsb3NlZFwiKXtcclxuICAgICAgICBpZighdGhpcy5jb250aW5lckRPTS5pcyhcIjp2aXNpYmxlXCIpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uc2hvdygpXHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uYWRkQ2xhc3MoXCJ3My1hbmltYXRlLXJpZ2h0XCIpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiKXtcclxuICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoYXJyPT1udWxsIHx8IGFyci5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzPVtdO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzPWFycjtcclxuICAgICAgICBpZihhcnIubGVuZ3RoPT0xKXtcclxuICAgICAgICAgICAgdmFyIHNpbmdsZUVsZW1lbnRJbmZvPWFyclswXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl0pey8vIHNlbGVjdCBhIG5vZGVcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVOb2RlXCIpXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vaW5zdGVhZCBvZiBkcmF3IHRoZSAkZHRJZCwgZHJhdyBkaXNwbGF5IG5hbWUgaW5zdGVhZFxyXG4gICAgICAgICAgICAgICAgLy90aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRkdElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXX0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wibmFtZVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiZGlzcGxheU5hbWVcIl19LFwiMWVtXCIsXCIxM3B4XCIpXHJcblxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbE5hbWU9c2luZ2xlRWxlbWVudEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZihtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsTmFtZV0uZWRpdGFibGVQcm9wZXJ0aWVzLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9pbnN0ZWFkIG9mIGRyYXdpbmcgdGhlIG9yaWdpbmFsIGluZm9tcmF0aW9uLCBkcmF3IG1vcmUgbWVhbmluZ2Z1bCBvbmVcclxuICAgICAgICAgICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl0sXCIkbWV0YWRhdGFcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXX0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiTW9kZWxcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXX0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIHNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihpbmQgPT0gXCIkbW9kZWxcIikgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRtcE9iaj17fVxyXG4gICAgICAgICAgICAgICAgICAgIHRtcE9ialtpbmRdPXNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdW2luZF1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHRtcE9iaixcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9ZWxzZSBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwic2luZ2xlUmVsYXRpb25zaGlwXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgICAgICAgICBcIkZyb21cIjpnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdXSxcclxuICAgICAgICAgICAgICAgICAgICBcIlRvXCI6Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtzaW5nbGVFbGVtZW50SW5mb1tcIiR0YXJnZXRJZFwiXV0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJSZWxhdGlvbnNoaXAgVHlwZVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgICAgICAgICAvLyxcIiRyZWxhdGlvbnNoaXBJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgICAgICAgICB9LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVsYXRpb25zaGlwTmFtZT1zaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlTW9kZWw9c2luZ2xlRWxlbWVudEluZm9bXCJzb3VyY2VNb2RlbFwiXVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSx0aGlzLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcyhyZWxhdGlvbnNoaXBOYW1lLHNvdXJjZU1vZGVsKSxzaW5nbGVFbGVtZW50SW5mbyxbXSlcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIHNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wT2JqPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdG1wT2JqW2luZF09c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1baW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00sdG1wT2JqLFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdfSxcIjFlbVwiLFwiMTBweFwiLFwiRGFya0dyYXlcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1lbHNlIGlmKGFyci5sZW5ndGg+MSl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJtdWx0aXBsZVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdNdWx0aXBsZU9iaigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihyZWxhdGlvbnNoaXBOYW1lLHNvdXJjZU1vZGVsKXtcclxuICAgIGlmKCFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdIHx8ICFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXSkgcmV0dXJuXHJcbiAgICByZXR1cm4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0uZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0J1dHRvbnM9ZnVuY3Rpb24oc2VsZWN0VHlwZSl7XHJcbiAgICB2YXIgaW1wQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtYmx1ZVwiPjxpIGNsYXNzPVwiZmEgZmEtYXJyb3ctY2lyY2xlLW8tZG93blwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydFR3aW5zQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIGlmKHNlbGVjdFR5cGUhPW51bGwpe1xyXG4gICAgICAgIHZhciByZWZyZXNoQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtYmxhY2tcIj48aSBjbGFzcz1cImZhIGZhLXJlZnJlc2hcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgZXhwQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtZ3JlZW5cIj48aSBjbGFzcz1cImZhIGZhLWFycm93LWNpcmNsZS1vLXVwXCI+PC9pPjwvYnV0dG9uPicpICAgIFxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChyZWZyZXNoQnRuLGV4cEJ0bixpbXBCdG4sYWN0dWFsSW1wb3J0VHdpbnNCdG4pXHJcbiAgICAgICAgcmVmcmVzaEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnJlZnJlc2hJbmZvbWF0aW9uKCl9KVxyXG4gICAgICAgIGV4cEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgLy9maW5kIG91dCB0aGUgdHdpbnMgaW4gc2VsZWN0aW9uIGFuZCB0aGVpciBjb25uZWN0aW9ucyAoZmlsdGVyIGJvdGggc3JjIGFuZCB0YXJnZXQgd2l0aGluIHRoZSBzZWxlY3RlZCB0d2lucylcclxuICAgICAgICAgICAgLy9hbmQgZXhwb3J0IHRoZW1cclxuICAgICAgICAgICAgdGhpcy5leHBvcnRTZWxlY3RlZCgpXHJcbiAgICAgICAgfSkgICAgXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLkRPTS5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheSc+Q2hvb3NlIHR3aW5zIG9yIHJlbGF0aW9uc2hpcHMgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIHNoaWZ0IGtleSB0byBzZWxlY3QgbXVsdGlwbGUgaW4gdG9wb2xvZ3kgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206MjBweCc+UHJlc3MgY3RybCBvciBzaGlmdCBrZXkgdG8gc2VsZWN0IG11bHRpcGxlIGluIHRyZWUgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206NXB4Jz5JbXBvcnQgdHdpbnMgZGF0YSBieSBjbGlja2luZyBidXR0b24gYmVsb3c8L2E+XCIpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGltcEJ0bixhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW1wQnRuLm9uKFwiY2xpY2tcIiwoKT0+e2FjdHVhbEltcG9ydFR3aW5zQnRuLnRyaWdnZXIoJ2NsaWNrJyk7fSlcclxuICAgIGFjdHVhbEltcG9ydFR3aW5zQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZFR3aW5zRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydFR3aW5zQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuICAgIGlmKHNlbGVjdFR5cGU9PW51bGwpIHJldHVybjtcclxuXHJcbiAgICBpZihzZWxlY3RUeXBlPT1cInNpbmdsZVJlbGF0aW9uc2hpcFwiKXtcclxuICAgICAgICB2YXIgZGVsQnRuID0gICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo1MCVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGluayB3My1ib3JkZXJcIj5EZWxldGUgQWxsPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuKVxyXG4gICAgICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZVNlbGVjdGVkKCl9KVxyXG4gICAgfWVsc2UgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVOb2RlXCIgfHwgc2VsZWN0VHlwZT09XCJtdWx0aXBsZVwiKXtcclxuICAgICAgICB2YXIgZGVsQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjUwJVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rIHczLWJvcmRlclwiPkRlbGV0ZSBBbGw8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb25uZWN0VG9CdG4gPSQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiAgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCB0bzwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbm5lY3RGcm9tQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNvbm5lY3QgZnJvbTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNob3dJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiAgc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBJbmJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2hvd091dEJvdW5kQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPlF1ZXJ5IE91dGJvdW5kPC9idXR0b24+JylcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuLCBjb25uZWN0VG9CdG4sY29ubmVjdEZyb21CdG4gLCBzaG93SW5ib3VuZEJ0biwgc2hvd091dEJvdW5kQnRuKVxyXG4gICAgXHJcbiAgICAgICAgc2hvd091dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2hvd091dEJvdW5kKCl9KVxyXG4gICAgICAgIHNob3dJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2hvd0luQm91bmQoKX0pICBcclxuICAgICAgICBjb25uZWN0VG9CdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiY29ubmVjdFRvXCJ9KSB9KVxyXG4gICAgICAgIGNvbm5lY3RGcm9tQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImNvbm5lY3RGcm9tXCJ9KSB9KVxyXG5cclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVTZWxlY3RlZCgpfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bU9mTm9kZSA9IDA7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRkdElkJ10pIG51bU9mTm9kZSsrXHJcbiAgICB9KTtcclxuICAgIGlmKG51bU9mTm9kZT4wKXtcclxuICAgICAgICB2YXIgc2VsZWN0SW5ib3VuZEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+K1NlbGVjdCBJbmJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2VsZWN0T3V0Qm91bmRCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPitTZWxlY3QgT3V0Ym91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb3NlTGF5b3V0QnRuPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNPU0UgVmlldzwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGhpZGVCdG49ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+SGlkZTwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNlbGVjdEluYm91bmRCdG4sIHNlbGVjdE91dEJvdW5kQnRuLGNvc2VMYXlvdXRCdG4saGlkZUJ0bilcclxuXHJcbiAgICAgICAgc2VsZWN0SW5ib3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImFkZFNlbGVjdEluYm91bmRcIn0pfSlcclxuICAgICAgICBzZWxlY3RPdXRCb3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImFkZFNlbGVjdE91dGJvdW5kXCJ9KX0pXHJcbiAgICAgICAgY29zZUxheW91dEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcIkNPU0VTZWxlY3RlZE5vZGVzXCJ9KX0pXHJcbiAgICAgICAgaGlkZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImhpZGVTZWxlY3RlZE5vZGVzXCJ9KX0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZXhwb3J0U2VsZWN0ZWQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICB2YXIgdHdpblRvQmVTdG9yZWQ9W11cclxuICAgIHZhciB0d2luSURzPXt9XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVyblxyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgdmFyIGFuRXhwVHdpbj17fVxyXG4gICAgICAgIGFuRXhwVHdpbltcIiRtZXRhZGF0YVwiXT17XCIkbW9kZWxcIjplbGVtZW50W1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdfVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIGVsZW1lbnQpe1xyXG4gICAgICAgICAgICBpZihpbmQ9PVwiJG1ldGFkYXRhXCIgfHwgaW5kPT1cIiRldGFnXCIpIGNvbnRpbnVlIFxyXG4gICAgICAgICAgICBlbHNlIGFuRXhwVHdpbltpbmRdPWVsZW1lbnRbaW5kXVxyXG4gICAgICAgIH1cclxuICAgICAgICB0d2luVG9CZVN0b3JlZC5wdXNoKGFuRXhwVHdpbilcclxuICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dPTFcclxuICAgIH0pO1xyXG4gICAgdmFyIHJlbGF0aW9uc1RvQmVTdG9yZWQ9W11cclxuICAgIHR3aW5JREFyci5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9ucz1nbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgaWYoIXJlbGF0aW9ucykgcmV0dXJuO1xyXG4gICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXVxyXG4gICAgICAgICAgICBpZih0d2luSURzW3RhcmdldElEXSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaj17fVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmVsYXRpb24pe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGluZCA9PVwiJGV0YWdcInx8aW5kID09XCIkcmVsYXRpb25zaGlwSWRcInx8aW5kID09XCIkc291cmNlSWRcInx8aW5kID09XCJzb3VyY2VNb2RlbFwiKSBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgICAgIG9ialtpbmRdPW9uZVJlbGF0aW9uW2luZF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBvbmVBY3Rpb249e1wiJHNyY0lkXCI6b25lSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwSWRcIjpvbmVSZWxhdGlvbltcIiRyZWxhdGlvbnNoaXBJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9ialwiOm9ian1cclxuICAgICAgICAgICAgICAgIHJlbGF0aW9uc1RvQmVTdG9yZWQucHVzaChvbmVBY3Rpb24pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciBmaW5hbEpTT049e1widHdpbnNcIjp0d2luVG9CZVN0b3JlZCxcInJlbGF0aW9uc1wiOnJlbGF0aW9uc1RvQmVTdG9yZWR9XHJcbiAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoZmluYWxKU09OKSkpO1xyXG4gICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRUd2luc0RhdGEuanNvblwiKTtcclxuICAgIHBvbVswXS5jbGljaygpXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydD1hc3luYyBmdW5jdGlvbihmaWxlcyl7XHJcbiAgICB2YXIgaW1wb3J0VHdpbnM9W11cclxuICAgIHZhciBpbXBvcnRSZWxhdGlvbnM9W11cclxuICAgIGZvciAodmFyIGkgPSAwLCBmOyBmID0gZmlsZXNbaV07IGkrKykge1xyXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBqc29uIGZpbGVzLlxyXG4gICAgICAgIGlmIChmLnR5cGUhPVwiYXBwbGljYXRpb24vanNvblwiKSBjb250aW51ZTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUoZilcclxuICAgICAgICAgICAgdmFyIG9iaj1KU09OLnBhcnNlKHN0cilcclxuICAgICAgICAgICAgaWYob2JqLnR3aW5zKSBpbXBvcnRUd2lucz1pbXBvcnRUd2lucy5jb25jYXQob2JqLnR3aW5zKVxyXG4gICAgICAgICAgICBpZihvYmoucmVsYXRpb25zKSBpbXBvcnRSZWxhdGlvbnM9aW1wb3J0UmVsYXRpb25zLmNvbmNhdChvYmoucmVsYXRpb25zKVxyXG4gICAgICAgIH1jYXRjaChlcnIpe1xyXG4gICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgICAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHZhciBvbGRUd2luSUQyTmV3SUQ9e31cclxuICAgIGltcG9ydFR3aW5zLmZvckVhY2gob25lVHdpbj0+e1xyXG4gICAgICAgIHZhciBvbGRJRD0gb25lVHdpbltcIiRkdElkXCJdXHJcbiAgICAgICAgdmFyIG5ld0lEPXV1aWR2NCgpO1xyXG4gICAgICAgIG9sZFR3aW5JRDJOZXdJRFtvbGRJRF09bmV3SURcclxuICAgICAgICBvbmVUd2luW1wiJGR0SWRcIl09bmV3SURcclxuICAgIH0pXHJcblxyXG4gICAgZm9yKHZhciBpPWltcG9ydFJlbGF0aW9ucy5sZW5ndGgtMTtpPj0wO2ktLSl7XHJcbiAgICAgICAgdmFyIG9uZVJlbD1pbXBvcnRSZWxhdGlvbnNbaV1cclxuICAgICAgICBpZihvbGRUd2luSUQyTmV3SURbb25lUmVsW1wiJHNyY0lkXCJdXT09bnVsbCB8fCBvbGRUd2luSUQyTmV3SURbb25lUmVsW1wib2JqXCJdW1wiJHRhcmdldElkXCJdXT09bnVsbCl7XHJcbiAgICAgICAgICAgIGltcG9ydFJlbGF0aW9ucy5zcGxpY2UoaSwxKVxyXG4gICAgICAgIH0gZWxzZXtcclxuICAgICAgICAgICAgb25lUmVsW1wiJHNyY0lkXCJdPW9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCIkc3JjSWRcIl1dXHJcbiAgICAgICAgICAgIG9uZVJlbFtcIm9ialwiXVtcIiR0YXJnZXRJZFwiXT1vbGRUd2luSUQyTmV3SURbb25lUmVsW1wib2JqXCJdW1wiJHRhcmdldElkXCJdXVxyXG4gICAgICAgICAgICBvbmVSZWxbXCIkcmVsYXRpb25zaGlwSWRcIl09dXVpZHY0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vYmF0Y2hJbXBvcnRUd2luc1wiLCBcIlBPU1RcIiwge1widHdpbnNcIjpKU09OLnN0cmluZ2lmeShpbXBvcnRUd2lucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICByZS5EQlR3aW5zPUpTT04ucGFyc2UocmUuREJUd2lucylcclxuICAgIHJlLkFEVFR3aW5zPUpTT04ucGFyc2UocmUuQURUVHdpbnMpXHJcbiAgICByZS5EQlR3aW5zLmZvckVhY2goREJUd2luPT57IGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlREJUd2luKERCVHdpbikgfSlcclxuICAgIHZhciBhZHRUd2lucz1bXVxyXG4gICAgcmUuQURUVHdpbnMuZm9yRWFjaChBRFRUd2luPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKEFEVFR3aW4pXHJcbiAgICAgICAgYWR0VHdpbnMucHVzaChBRFRUd2luKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luc1wiLCBcInR3aW5zSW5mb1wiOiBhZHRUd2lucyB9KVxyXG5cclxuICAgIC8vY29udGludWUgdG8gaW1wb3J0IHJlbGF0aW9uc1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNJbXBvcnRlZCA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NyZWF0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwgIHthY3Rpb25zOkpTT04uc3RyaW5naWZ5KGltcG9ydFJlbGF0aW9ucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQocmVsYXRpb25zSW1wb3J0ZWQpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsaW5mbzpyZWxhdGlvbnNJbXBvcnRlZH0pXHJcblxyXG4gICAgdmFyIG51bU9mVHdpbnM9YWR0VHdpbnMubGVuZ3RoXHJcbiAgICB2YXIgbnVtT2ZSZWxhdGlvbnM9cmVsYXRpb25zSW1wb3J0ZWQubGVuZ3RoXHJcbiAgICB2YXIgc3RyPVwiQWRkIFwiK251bU9mVHdpbnMrIFwiIG5vZGVcIisoKG51bU9mVHdpbnM8PTEpP1wiXCI6XCJzXCIpK2AgKGZyb20gJHtpbXBvcnRUd2lucy5sZW5ndGh9KWBcclxuICAgIHN0cis9XCIgYW5kIFwiK251bU9mUmVsYXRpb25zK1wiIHJlbGF0aW9uc2hpcFwiKygobnVtT2ZSZWxhdGlvbnM8PTEpP1wiXCI6XCJzXCIpK2AgKGZyb20gJHtpbXBvcnRSZWxhdGlvbnMubGVuZ3RofSlgXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjQwMHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkltcG9ydCBSZXN1bHRcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6c3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIk9rXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVmcmVzaEluZm9tYXRpb249YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciB0d2luSURzPVtdXHJcbiAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cy5mb3JFYWNoKG9uZUl0ZW09PnsgIGlmKG9uZUl0ZW1bJyRkdElkJ10pIHR3aW5JRHMucHVzaChvbmVJdGVtWyckZHRJZCddKSAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgdHdpbnNkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vbGlzdFR3aW5zRm9ySURzXCIsIFwiUE9TVFwiLCB0d2luSURzKVxyXG4gICAgICAgIHR3aW5zZGF0YS5mb3JFYWNoKG9uZVJlPT57XHJcbiAgICAgICAgICAgIHZhciB0d2luSUQ9IG9uZVJlWyckZHRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3R3aW5JRF0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmUpICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4ob25lUmVbaW5kXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUodHdpbklEcy5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURzLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9nZXRSZWxhdGlvbnNoaXBzRnJvbVR3aW5JRHNcIiwgXCJQT1NUXCIsIHNtYWxsQXJyKVxyXG4gICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhKSAvL3N0b3JlIHRoZW0gaW4gZ2xvYmFsIGF2YWlsYWJsZSBhcnJheVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsIGluZm86IGRhdGEgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL3JlZHJhdyBpbmZvcGFuZWwgaWYgbmVlZGVkXHJcbiAgICBpZih0aGlzLnNlbGVjdGVkT2JqZWN0cy5sZW5ndGg9PTEpIHRoaXMucnhNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86IHRoaXMuc2VsZWN0ZWRPYmplY3RzIH0pXHJcblxyXG59XHJcblxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVTZWxlY3RlZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciByZWxhdGlvbnNBcnI9W11cclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIHZhciB0d2luSURzPXt9XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJlbGF0aW9uc0Fyci5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgICAgIHR3aW5JRHNbZWxlbWVudFsnJGR0SWQnXV09MVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgZm9yKHZhciBpPXJlbGF0aW9uc0Fyci5sZW5ndGgtMTtpPj0wO2ktLSl7IC8vY2xlYXIgdGhvc2UgcmVsYXRpb25zaGlwcyB0aGF0IGFyZSBnb2luZyB0byBiZSBkZWxldGVkIGFmdGVyIHR3aW5zIGRlbGV0aW5nXHJcbiAgICAgICAgdmFyIHNyY0lkPSAgcmVsYXRpb25zQXJyW2ldWyckc291cmNlSWQnXVxyXG4gICAgICAgIHZhciB0YXJnZXRJZCA9IHJlbGF0aW9uc0FycltpXVsnJHRhcmdldElkJ11cclxuICAgICAgICBpZih0d2luSURzW3NyY0lkXSE9bnVsbCB8fCB0d2luSURzW3RhcmdldElkXSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHJlbGF0aW9uc0Fyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgdmFyIGRpYWxvZ1N0cj1cIlwiXHJcbiAgICB2YXIgdHdpbk51bWJlcj10d2luSURBcnIubGVuZ3RoO1xyXG4gICAgdmFyIHJlbGF0aW9uc051bWJlciA9IHJlbGF0aW9uc0Fyci5sZW5ndGg7XHJcbiAgICBpZih0d2luTnVtYmVyPjApIGRpYWxvZ1N0ciA9ICB0d2luTnVtYmVyK1wiIHR3aW5cIisoKHR3aW5OdW1iZXI+MSk/XCJzXCI6XCJcIikgKyBcIiAod2l0aCBjb25uZWN0ZWQgcmVsYXRpb25zKVwiXHJcbiAgICBpZih0d2luTnVtYmVyPjAgJiYgcmVsYXRpb25zTnVtYmVyPjApIGRpYWxvZ1N0cis9XCIgYW5kIGFkZGl0aW9uYWwgXCJcclxuICAgIGlmKHJlbGF0aW9uc051bWJlcj4wKSBkaWFsb2dTdHIgKz0gIHJlbGF0aW9uc051bWJlcitcIiByZWxhdGlvblwiKygocmVsYXRpb25zTnVtYmVyPjEpP1wic1wiOlwiXCIgKVxyXG4gICAgZGlhbG9nU3RyKz1cIiB3aWxsIGJlIGRlbGV0ZWQuIFBsZWFzZSBjb25maXJtXCJcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6ZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRpb25zQXJyLmxlbmd0aCA+IDApIGF3YWl0IHRoaXMuZGVsZXRlUmVsYXRpb25zKHJlbGF0aW9uc0FycilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR3aW5JREFyci5sZW5ndGggPiAwKSBhd2FpdCB0aGlzLmRlbGV0ZVR3aW5zKHR3aW5JREFycilcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVUd2lucz1hc3luYyBmdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgdmFyIGlvVERldmljZXM9W11cclxuICAgIHR3aW5JREFyci5mb3JFYWNoKG9uZVR3aW5JRD0+e1xyXG4gICAgICAgIHZhciBkYlR3aW5JbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCVHdpbkJ5SUQob25lVHdpbklEKVxyXG4gICAgICAgIGlmKGRiVHdpbkluZm8uSW9URGV2aWNlSUQhPW51bGwgJiYgZGJUd2luSW5mby5Jb1REZXZpY2VJRCE9XCJcIil7XHJcbiAgICAgICAgICAgIGlvVERldmljZXMucHVzaChkYlR3aW5JbmZvLklvVERldmljZUlEKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICBpZihpb1REZXZpY2VzLmxlbmd0aD4wKXtcclxuICAgICAgICBtc2FsSGVscGVyLmNhbGxBUEkoXCJkZXZpY2VtYW5hZ2VtZW50L3VucmVnaXN0ZXJJb1REZXZpY2VzXCIsIFwiUE9TVFwiLCB7YXJyOmlvVERldmljZXN9KVxyXG4gICAgfVxyXG4gICAgXHJcblxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICBcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVUd2luc1wiLCBcIlBPU1RcIiwge2FycjpzbWFsbEFycn0pXHJcbiAgICAgICAgICAgIHJlc3VsdC5mb3JFYWNoKChvbmVJRCk9PntcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVJRF1cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ0d2luc0RlbGV0ZWRcIix0d2luSURBcnI6cmVzdWx0fSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWFzeW5jIGZ1bmN0aW9uKHJlbGF0aW9uc0Fycil7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICByZWxhdGlvbnNBcnIuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIGFyci5wdXNoKHtzcmNJRDpvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ10scmVsSUQ6b25lUmVsYXRpb25bJyRyZWxhdGlvbnNoaXBJZCddfSlcclxuICAgIH0pXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVSZWxhdGlvbnNcIiwgXCJQT1NUXCIsIHtcInJlbGF0aW9uc1wiOmFycn0pXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19yZW1vdmUoZGF0YSlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyZWxhdGlvbnNEZWxldGVkXCIsXCJyZWxhdGlvbnNcIjpkYXRhfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zaG93T3V0Qm91bmQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyID0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG5cclxuICAgICAgICB2YXIga25vd25UYXJnZXRUd2lucyA9IHt9XHJcbiAgICAgICAgc21hbGxBcnIuZm9yRWFjaChvbmVJRCA9PiB7XHJcbiAgICAgICAgICAgIGtub3duVGFyZ2V0VHdpbnNbb25lSURdID0gMSAvL2l0c2VsZiBhbHNvIGlzIGtub3duXHJcbiAgICAgICAgICAgIHZhciBvdXRCb3VuZFJlbGF0aW9uID0gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgICAgICBpZiAob3V0Qm91bmRSZWxhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgb3V0Qm91bmRSZWxhdGlvbi5mb3JFYWNoKG9uZVJlbGF0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQgPSBvbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gIT0gbnVsbCkga25vd25UYXJnZXRUd2luc1t0YXJnZXRJRF0gPSAxXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3F1ZXJ5T3V0Qm91bmRcIiwgXCJQT1NUXCIsICB7IGFycjogc21hbGxBcnIsIFwia25vd25UYXJnZXRzXCI6IGtub3duVGFyZ2V0VHdpbnMgfSlcclxuICAgICAgICAgICAgLy9uZXcgdHdpbidzIHJlbGF0aW9uc2hpcCBzaG91bGQgYmUgc3RvcmVkIGFzIHdlbGxcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhLm5ld1R3aW5SZWxhdGlvbnMpXHJcbiAgICAgICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4ob25lVHdpbilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2hvd0luQm91bmQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGtub3duU291cmNlVHdpbnMgPSB7fVxyXG4gICAgICAgIHZhciBJRERpY3QgPSB7fVxyXG4gICAgICAgIHNtYWxsQXJyLmZvckVhY2gob25lSUQgPT4ge1xyXG4gICAgICAgICAgICBJRERpY3Rbb25lSURdID0gMVxyXG4gICAgICAgICAgICBrbm93blNvdXJjZVR3aW5zW29uZUlEXSA9IDEgLy9pdHNlbGYgYWxzbyBpcyBrbm93blxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZm9yICh2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgICAgICB2YXIgcmVsYXRpb25zID0gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF1cclxuICAgICAgICAgICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldElEID0gb25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgICAgICB2YXIgc3JjSUQgPSBvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgICAgIGlmIChJRERpY3RbdGFyZ2V0SURdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdICE9IG51bGwpIGtub3duU291cmNlVHdpbnNbc3JjSURdID0gMVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3F1ZXJ5SW5Cb3VuZFwiLCBcIlBPU1RcIiwgIHsgYXJyOiBzbWFsbEFyciwgXCJrbm93blNvdXJjZXNcIjoga25vd25Tb3VyY2VUd2lucyB9KVxyXG4gICAgICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICAgICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihvbmVUd2luKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3TXVsdGlwbGVPYmo9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBudW1PZkVkZ2UgPSAwO1xyXG4gICAgdmFyIG51bU9mTm9kZSA9IDA7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyPT1udWxsKSByZXR1cm47XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIG51bU9mRWRnZSsrXHJcbiAgICAgICAgZWxzZSBudW1PZk5vZGUrK1xyXG4gICAgfSk7XHJcbiAgICB2YXIgdGV4dERpdj0kKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6MTBweCc+PC9sYWJlbD5cIilcclxuICAgIHRleHREaXYudGV4dChudW1PZk5vZGUrIFwiIG5vZGVcIisoKG51bU9mTm9kZTw9MSk/XCJcIjpcInNcIikrXCIsIFwiK251bU9mRWRnZStcIiByZWxhdGlvbnNoaXBcIisoKG51bU9mRWRnZTw9MSk/XCJcIjpcInNcIikpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGV4dERpdilcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3U3RhdGljSW5mbz1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8scGFkZGluZ1RvcCxmb250U2l6ZSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjojZjZmNmY2O2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBrZXlEaXYuY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiZGFya0dyYXlcIn0pXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIscGFkZGluZ1RvcClcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8oY29udGVudERPTSxqc29uSW5mb1tpbmRdLFwiLjVlbVwiLGZvbnRTaXplKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjJlbVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpmb250U2l6ZSxcImNvbG9yXCI6XCJibGFja1wifSlcclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0VkaXRhYmxlPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyKXtcclxuICAgIGlmKGpzb25JbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtOyBmb250LXdlaWdodDpib2xkO2NvbG9yOmJsYWNrJz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIFxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjNlbVwiKSBcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0ncGFkZGluZy10b3A6LjJlbSc+PC9sYWJlbD5cIilcclxuICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RHJvcGRvd25PcHRpb24oY29udGVudERPTSxuZXdQYXRoLGpzb25JbmZvW2luZF0sb3JpZ2luRWxlbWVudEluZm8pXHJcbiAgICAgICAgfWVsc2UgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUoY29udGVudERPTSxqc29uSW5mb1tpbmRdLG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwicGFkZGluZzoycHg7d2lkdGg6NTAlO291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwidHlwZTogJytqc29uSW5mb1tpbmRdKydcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICBcclxuICAgICAgICAgICAgY29udGVudERPTS5hcHBlbmQoYUlucHV0KVxyXG4gICAgICAgICAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICAgICAgaWYodmFsIT1udWxsKSBhSW5wdXQudmFsKHZhbClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwiZGF0YVR5cGVcIiwganNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgYUlucHV0LmNoYW5nZSgoZSk9PntcclxuICAgICAgICAgICAgICAgIHRoaXMuZWRpdERUUHJvcGVydHkob3JpZ2luRWxlbWVudEluZm8sJChlLnRhcmdldCkuZGF0YShcInBhdGhcIiksJChlLnRhcmdldCkudmFsKCksJChlLnRhcmdldCkuZGF0YShcImRhdGFUeXBlXCIpKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0Ryb3Bkb3duT3B0aW9uPWZ1bmN0aW9uKGNvbnRlbnRET00sbmV3UGF0aCx2YWx1ZUFycixvcmlnaW5FbGVtZW50SW5mbyl7XHJcbiAgICB2YXIgYVNlbGVjdE1lbnU9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIix7YnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjRweCAxNnB4XCJ9fSlcclxuICAgIGNvbnRlbnRET00uYXBwZW5kKGFTZWxlY3RNZW51LkRPTSlcclxuICAgIGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgdmFsdWVBcnIuZm9yRWFjaCgob25lT3B0aW9uKT0+e1xyXG4gICAgICAgIHZhciBzdHIgPW9uZU9wdGlvbltcImRpc3BsYXlOYW1lXCJdICB8fCBvbmVPcHRpb25bXCJlbnVtVmFsdWVcIl0gXHJcbiAgICAgICAgYVNlbGVjdE1lbnUuYWRkT3B0aW9uKHN0cilcclxuICAgIH0pXHJcbiAgICBhU2VsZWN0TWVudS5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayk9PntcclxuICAgICAgICBhU2VsZWN0TWVudS5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIHRoaXMuZWRpdERUUHJvcGVydHkob3JpZ2luRWxlbWVudEluZm8sYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIpLG9wdGlvblZhbHVlLFwic3RyaW5nXCIpXHJcbiAgICB9XHJcbiAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgIGlmKHZhbCE9bnVsbCl7XHJcbiAgICAgICAgYVNlbGVjdE1lbnUudHJpZ2dlck9wdGlvblZhbHVlKHZhbClcclxuICAgIH0gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZWRpdERUUHJvcGVydHk9YXN5bmMgZnVuY3Rpb24ob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwsZGF0YVR5cGUpe1xyXG4gICAgaWYoW1wiZG91YmxlXCIsXCJib29sZWFuXCIsXCJmbG9hdFwiLFwiaW50ZWdlclwiLFwibG9uZ1wiXS5pbmNsdWRlcyhkYXRhVHlwZSkpIG5ld1ZhbD1OdW1iZXIobmV3VmFsKVxyXG5cclxuICAgIC8veyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBcIi94XCIsIFwidmFsdWVcIjogMzAgfVxyXG4gICAgaWYocGF0aC5sZW5ndGg9PTEpe1xyXG4gICAgICAgIHZhciBzdHI9XCJcIlxyXG4gICAgICAgIHBhdGguZm9yRWFjaChzZWdtZW50PT57c3RyKz1cIi9cIitzZWdtZW50fSlcclxuICAgICAgICB2YXIganNvblBhdGNoPVsgeyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBzdHIsIFwidmFsdWVcIjogbmV3VmFsfSBdXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICAvL2l0IGlzIGEgcHJvcGVydHkgaW5zaWRlIGEgb2JqZWN0IHR5cGUgb2Ygcm9vdCBwcm9wZXJ0eSx1cGRhdGUgdGhlIHdob2xlIHJvb3QgcHJvcGVydHlcclxuICAgICAgICB2YXIgcm9vdFByb3BlcnR5PXBhdGhbMF1cclxuICAgICAgICB2YXIgcGF0Y2hWYWx1ZT0gb3JpZ2luRWxlbWVudEluZm9bcm9vdFByb3BlcnR5XVxyXG4gICAgICAgIGlmKHBhdGNoVmFsdWU9PW51bGwpIHBhdGNoVmFsdWU9e31cclxuICAgICAgICBlbHNlIHBhdGNoVmFsdWU9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwYXRjaFZhbHVlKSkgLy9tYWtlIGEgY29weVxyXG4gICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUocGF0Y2hWYWx1ZSxwYXRoLnNsaWNlKDEpLG5ld1ZhbClcclxuICAgICAgICBcclxuICAgICAgICB2YXIganNvblBhdGNoPVsgeyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBcIi9cIityb290UHJvcGVydHksIFwidmFsdWVcIjogcGF0Y2hWYWx1ZX0gXVxyXG4gICAgfVxyXG5cclxuICAgIGlmKG9yaWdpbkVsZW1lbnRJbmZvW1wiJGR0SWRcIl0peyAvL2VkaXQgYSBub2RlIHByb3BlcnR5XHJcbiAgICAgICAgdmFyIHR3aW5JRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICB2YXIgcGF5TG9hZD17XCJqc29uUGF0Y2hcIjpKU09OLnN0cmluZ2lmeShqc29uUGF0Y2gpLFwidHdpbklEXCI6dHdpbklEfVxyXG4gICAgfWVsc2UgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl0peyAvL2VkaXQgYSByZWxhdGlvbnNoaXAgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl1cclxuICAgICAgICB2YXIgcmVsYXRpb25zaGlwSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUQsXCJyZWxhdGlvbnNoaXBJRFwiOnJlbGF0aW9uc2hpcElEfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIHRyeXtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9jaGFuZ2VBdHRyaWJ1dGVcIiwgXCJQT1NUXCIsIHBheUxvYWQpXHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlPWZ1bmN0aW9uKG5vZGVJbmZvLHBhdGhBcnIsbmV3VmFsKXtcclxuICAgIGlmKHBhdGhBcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgdGhlSnNvbj1ub2RlSW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG5cclxuICAgICAgICBpZihpPT1wYXRoQXJyLmxlbmd0aC0xKXtcclxuICAgICAgICAgICAgdGhlSnNvbltrZXldPW5ld1ZhbFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGVKc29uW2tleV09PW51bGwpIHRoZUpzb25ba2V5XT17fVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICB9XHJcbiAgICByZXR1cm5cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zZWFyY2hWYWx1ZT1mdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyKXtcclxuICAgIGlmKHBhdGhBcnIubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciB0aGVKc29uPW9yaWdpbkVsZW1lbnRJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgICAgICBpZih0aGVKc29uPT1udWxsKSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGVKc29uIC8vaXQgc2hvdWxkIGJlIHRoZSBmaW5hbCB2YWx1ZVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBpbmZvUGFuZWwoKTsiLCJjb25zdCBzdGFydFNlbGVjdGlvbkRpYWxvZyA9IHJlcXVpcmUoXCIuL3N0YXJ0U2VsZWN0aW9uRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgZWRpdExheW91dERpYWxvZz0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtb2R1bGVTd2l0Y2hEaWFsb2c9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZHVsZVN3aXRjaERpYWxvZ1wiKVxyXG5cclxuZnVuY3Rpb24gbWFpblRvb2xiYXIoKSB7XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFkZENsYXNzKFwidzMtYmFyIHczLXJlZFwiKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5jc3Moe1wiei1pbmRleFwiOjEwMCxcIm92ZXJmbG93XCI6XCJ2aXNpYmxlXCJ9KVxyXG5cclxuICAgIHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPlNvdXJjZTwvYT4nKVxyXG4gICAgdGhpcy5tb2RlbElPQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Nb2RlbHM8L2E+JylcclxuICAgIHRoaXMuc2hvd0ZvcmdlVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5Gb3JnZVZpZXc8L2E+JylcclxuICAgIHRoaXMuc2hvd0dJU1ZpZXdCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItbm9uZSB3My10ZXh0LWxpZ2h0LWdyZXkgdzMtaG92ZXItdGV4dC1saWdodC1ncmV5XCIgc3R5bGU9XCJvcGFjaXR5Oi4zNVwiIGhyZWY9XCIjXCI+R0lTVmlldzwvYT4nKVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLWVkaXRcIj48L2k+PC9hPicpXHJcblxyXG4gICAgdGhpcy50ZXN0U2lnbmFsUkJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1hbWJlclwiIGhyZWY9XCIjXCI+VGVzdCBTaWduYWxSPC9hPicpXHJcbiAgICB0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1hbWJlclwiIGhyZWY9XCIjXCI+c2VuZCBTaWduYWxSIG1lc3NhZ2U8L2E+JylcclxuXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIkxheW91dFwiKVxyXG5cclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuZW1wdHkoKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5hcHBlbmQobW9kdWxlU3dpdGNoRGlhbG9nLm1vZHVsZXNTaWRlYmFyKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5hcHBlbmQobW9kdWxlU3dpdGNoRGlhbG9nLm1vZHVsZXNTd2l0Y2hCdXR0b24sIHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG4sdGhpcy5tb2RlbElPQnRuLHRoaXMuc2hvd0ZvcmdlVmlld0J0bix0aGlzLnNob3dHSVNWaWV3QnRuXHJcbiAgICAgICAgLHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuRE9NLHRoaXMuZWRpdExheW91dEJ0bilcclxuICAgICAgICAvLyx0aGlzLnRlc3RTaWduYWxSQnRuLHRoaXMudGVzdFNlbmRTaWduYWxSQnRuXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnsgc3RhcnRTZWxlY3Rpb25EaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5tb2RlbElPQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBtb2RlbE1hbmFnZXJEaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBlZGl0TGF5b3V0RGlhbG9nLnBvcHVwKCkgfSlcclxuXHJcblxyXG4gICAgdGhpcy50ZXN0U2VuZFNpZ25hbFJCdG4ub24oXCJjbGlja1wiLGFzeW5jICgpPT57XHJcbiAgICAgICAgY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG4gICAgICAgIHZhciByZSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZShcIm1lc3NhZ2VzXCIsXCJQT1NUXCIse1xyXG4gICAgICAgICAgICByZWNpcGllbnQ6IFwiNWViODFmNWYtZmQ5ZS00ODFkLTk5NmItNGQwYjk1MzZmNDc3XCIsXHJcbiAgICAgICAgICAgIHRleHQ6IFwiaG93IGRvIHlvdSBkb1wiXHJcbiAgICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHRoaXMudGVzdFNpZ25hbFJCdG4ub24oXCJjbGlja1wiLGFzeW5jICgpPT57XHJcbiAgICAgICAgY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG4gICAgICAgIHZhciBzaWduYWxSSW5mbyA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZShcIm5lZ290aWF0ZT9uYW1lPWZmXCIsXCJHRVRcIilcclxuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gbmV3IHNpZ25hbFIuSHViQ29ubmVjdGlvbkJ1aWxkZXIoKVxyXG4gICAgICAgIC53aXRoVXJsKHNpZ25hbFJJbmZvLnVybCwge2FjY2Vzc1Rva2VuRmFjdG9yeTogKCkgPT4gc2lnbmFsUkluZm8uYWNjZXNzVG9rZW59KVxyXG4gICAgICAgIC8vLmNvbmZpZ3VyZUxvZ2dpbmcoc2lnbmFsUi5Mb2dMZXZlbC5JbmZvcm1hdGlvbilcclxuICAgICAgICAuY29uZmlndXJlTG9nZ2luZyhzaWduYWxSLkxvZ0xldmVsLldhcm5pbmcpXHJcbiAgICAgICAgLmJ1aWxkKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coc2lnbmFsUkluZm8uYWNjZXNzVG9rZW4pXHJcblxyXG4gICAgICAgIGNvbm5lY3Rpb24ub24oJ25ld01lc3NhZ2UnLCAobWVzc2FnZSk9PntcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSlcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25uZWN0aW9uLm9uY2xvc2UoKCkgPT4gY29uc29sZS5sb2coJ2Rpc2Nvbm5lY3RlZCcpKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGluZy4uLicpO1xyXG4gICAgICAgIGNvbm5lY3Rpb24uc3RhcnQoKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ2Nvbm5lY3RlZCEnKSlcclxuICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICAgIH0pXHJcblxyXG5cclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWU9b3B0aW9uVmFsdWVcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRDaGFuZ2VcIn0pXHJcbiAgICAgICAgaWYob3B0aW9uVmFsdWU9PVwiW05BXVwiKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXRcIixcIlwiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0OlwiLG9wdGlvblRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS51cGRhdGVMYXlvdXRTZWxlY3RvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjdXJTZWxlY3Q9dGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWxcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKCdbTm8gTGF5b3V0IFNwZWNpZmllZF0nLCdbTkFdJylcclxuXHJcbiAgICBmb3IgKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikge1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxuXHJcbiAgICBpZihjdXJTZWxlY3QhPW51bGwgJiYgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5maW5kT3B0aW9uKGN1clNlbGVjdCk9PW51bGwpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibGF5b3V0c1VwZGF0ZWRcIikge1xyXG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0U2VsZWN0b3IoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVG9vbGJhcigpOyIsImNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBzdGFydFNlbGVjdGlvbkRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY2NXB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+U2VsZWN0IFR3aW5zPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG5cclxuICAgIHRoaXMuYnV0dG9uSG9sZGVyID0gJChcIjxkaXYgc3R5bGU9J2hlaWdodDoxMDAlJz48L2Rpdj5cIilcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHRoaXMuYnV0dG9uSG9sZGVyKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcImFwcGVuZFwiKVxyXG4gICAgICAgIHRoaXMuY2xvc2VEaWFsb2coKSBcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJlcGxhY2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlOyBtYXJnaW4tcmlnaHQ6OHB4XCI+UmVwbGFjZSBBbGwgRGF0YTwvYnV0dG9uPicpXHJcbiAgICB2YXIgYXBwZW5kQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkFwcGVuZCBEYXRhPC9idXR0b24+JylcclxuXHJcbiAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwicmVwbGFjZVwiKSB9KVxyXG4gICAgYXBwZW5kQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwiYXBwZW5kXCIpIH0pXHJcbiAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQocmVwbGFjZUJ1dHRvbiwgYXBwZW5kQnV0dG9uKVxyXG5cclxuICAgIHZhciBwYW5lbEhlaWdodD00NTBcclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBzdHlsZT1cInBhZGRpbmc6NXB4O3dpZHRoOjIzMHB4O3BhZGRpbmctcmlnaHQ6NXB4O292ZXJmbG93OmhpZGRlblwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIHRoaXMubGVmdFNwYW49bGVmdFNwYW5cclxuXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiIHN0eWxlPVwicGFkZGluZy10b3A6MTBweDtcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jYXJkXCIgc3R5bGU9XCJjb2xvcjpncmF5O2hlaWdodDonKyhwYW5lbEhlaWdodC0xMCkrJ3B4O292ZXJmbG93OmF1dG87d2lkdGg6NDEwcHg7XCI+PC9kaXY+JykpXHJcbiAgICB2YXIgc2VsZWN0ZWRUd2luc0RPTT0kKFwiPHRhYmxlIHN0eWxlPSd3aWR0aDoxMDAlJz48L3RhYmxlPlwiKVxyXG4gICAgc2VsZWN0ZWRUd2luc0RPTS5jc3Moe1wiYm9yZGVyLWNvbGxhcHNlXCI6XCJjb2xsYXBzZVwifSlcclxuICAgIHJpZ2h0U3Bhbi5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHNlbGVjdGVkVHdpbnNET00pXHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET009c2VsZWN0ZWRUd2luc0RPTSBcclxuXHJcbiAgICB0aGlzLmxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlNlbGVjdCBUd2lucyBmcm9tPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7Zm9udC13ZWlnaHQ6bm9ybWFsO3RvcDotMTBweDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPmNob29zZSBvbmUgb3IgbW9yZSBtb2RlbHM8L3A+PC9kaXY+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzPSQoJzxmb3JtIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWJvcmRlclwiIHN0eWxlPVwiaGVpZ2h0OicrKHBhbmVsSGVpZ2h0LTQwKSsncHg7b3ZlcmZsb3c6YXV0b1wiPjwvZm9ybT4nKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKHRoaXMubW9kZWxzQ2hlY2tCb3hlcylcclxuICAgIHRoaXMuZmlsbEF2YWlsYWJsZU1vZGVscygpXHJcblxyXG4gICAgdGhpcy5saXN0VHdpbnMoKVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2xvc2VEaWFsb2c9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCJ9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZmlsbEF2YWlsYWJsZU1vZGVscyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmFwcGVuZCgnPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBpZD1cIkFMTFwiPjxsYWJlbCBzdHlsZT1cInBhZGRpbmctbGVmdDo1cHhcIj48Yj5BTEw8L2I+PC9sYWJlbD48cC8+JylcclxuICAgIGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmZvckVhY2gob25lTW9kZWw9PntcclxuICAgICAgICB2YXIgbW9kZWxOYW1lPW9uZU1vZGVsW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICB2YXIgbW9kZWxJRD1vbmVNb2RlbFtcImlkXCJdXHJcbiAgICAgICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmFwcGVuZChgPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBpZD1cIiR7bW9kZWxJRH1cIj48bGFiZWwgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4XCI+JHttb2RlbE5hbWV9PC9sYWJlbD48cC8+YClcclxuICAgIH0pXHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMub24oXCJjaGFuZ2VcIiwoZXZ0KT0+e1xyXG4gICAgICAgIGlmKCQoZXZ0LnRhcmdldCkuYXR0cihcImlkXCIpPT1cIkFMTFwiKXtcclxuICAgICAgICAgICAgLy9zZWxlY3QgYWxsIHRoZSBvdGhlciBpbnB1dFxyXG4gICAgICAgICAgICB2YXIgdmFsPSQoZXZ0LnRhcmdldCkucHJvcChcImNoZWNrZWRcIilcclxuICAgICAgICAgICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmNoaWxkcmVuKCdpbnB1dCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5wcm9wKFwiY2hlY2tlZFwiLHZhbClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGlzdFR3aW5zKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5nZXRTZWxlY3RlZFR3aW5zPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcmVBcnI9W11cclxuICAgIHZhciBjaG9zZW5Nb2RlbHM9e31cclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5jaGlsZHJlbignaW5wdXQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZighJCh0aGlzKS5wcm9wKFwiY2hlY2tlZFwiKSkgcmV0dXJuO1xyXG4gICAgICAgIGlmKCQodGhpcykuYXR0cihcImlkXCIpPT1cIkFMTFwiKSByZXR1cm47XHJcbiAgICAgICAgY2hvc2VuTW9kZWxzWyQodGhpcykuYXR0cihcImlkXCIpXT0xXHJcbiAgICB9KTtcclxuICAgIGdsb2JhbENhY2hlLkRCVHdpbnNBcnIuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgIGlmKGNob3Nlbk1vZGVsc1thVHdpbltcIm1vZGVsSURcIl1dKSAgcmVBcnIucHVzaChhVHdpbilcclxuICAgIH0pXHJcbiAgICByZXR1cm4gcmVBcnI7XHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5saXN0VHdpbnM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5lbXB0eSgpXHJcbiAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+SUQ8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+TU9ERUw8L3RkPjwvdHI+JylcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5hcHBlbmQodHIpXHJcblxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnM9dGhpcy5nZXRTZWxlY3RlZFR3aW5zKClcclxuICAgIHNlbGVjdGVkVHdpbnMuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiYm9yZGVyLXJpZ2h0OnNvbGlkIDFweCBsaWdodGdyZXk7Ym9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+JythVHdpbltcImRpc3BsYXlOYW1lXCJdKyc8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrYVR3aW5bJ21vZGVsSUQnXSsnPC90ZD48L3RyPicpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NLmFwcGVuZCh0cilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RlZFR3aW5zLmxlbmd0aD09MCl7XHJcbiAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJjb2xvcjpncmF5XCI+emVybyByZWNvcmQ8L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgICAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uYXBwZW5kKHRyKSAgICBcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS51c2VTdGFydFNlbGVjdGlvbj1mdW5jdGlvbihhY3Rpb24pe1xyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnM9dGhpcy5nZXRTZWxlY3RlZFR3aW5zKClcclxuICAgIHZhciB0d2luSURzPVtdXHJcbiAgICBzZWxlY3RlZFR3aW5zLmZvckVhY2goYVR3aW49Pnt0d2luSURzLnB1c2goYVR3aW5bXCJpZFwiXSl9KVxyXG5cclxuICAgIHZhciBtb2RlbElEcz1bXVxyXG4gICAgZ2xvYmFsQ2FjaGUuREJNb2RlbHNBcnIuZm9yRWFjaChvbmVNb2RlbD0+e21vZGVsSURzLnB1c2gob25lTW9kZWxbXCJpZFwiXSl9KVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInN0YXJ0U2VsZWN0aW9uX1wiK2FjdGlvbiwgXCJ0d2luSURzXCI6IHR3aW5JRHMsXCJtb2RlbElEc1wiOm1vZGVsSURzIH0pXHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgc3RhcnRTZWxlY3Rpb25EaWFsb2coKTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsQW5hbHl6ZXJcIik7XHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gdG9wb2xvZ3lET00oRE9NKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5kZWZhdWx0Tm9kZVNpemU9MzBcclxuICAgIHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpbz17fVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaW5pdD1mdW5jdGlvbigpe1xyXG4gICAgY3l0b3NjYXBlLndhcm5pbmdzKGZhbHNlKSAgXHJcbiAgICB0aGlzLmNvcmUgPSBjeXRvc2NhcGUoe1xyXG4gICAgICAgIGNvbnRhaW5lcjogIHRoaXMuRE9NWzBdLCAvLyBjb250YWluZXIgdG8gcmVuZGVyIGluXHJcblxyXG4gICAgICAgIC8vIGluaXRpYWwgdmlld3BvcnQgc3RhdGU6XHJcbiAgICAgICAgem9vbTogMSxcclxuICAgICAgICBwYW46IHsgeDogMCwgeTogMCB9LFxyXG5cclxuICAgICAgICAvLyBpbnRlcmFjdGlvbiBvcHRpb25zOlxyXG4gICAgICAgIG1pblpvb206IDAuMSxcclxuICAgICAgICBtYXhab29tOiAxMCxcclxuICAgICAgICB6b29taW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB1c2VyWm9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgcGFubmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGJveFNlbGVjdGlvbkVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0aW9uVHlwZTogJ3NpbmdsZScsXHJcbiAgICAgICAgdG91Y2hUYXBUaHJlc2hvbGQ6IDgsXHJcbiAgICAgICAgZGVza3RvcFRhcFRocmVzaG9sZDogNCxcclxuICAgICAgICBhdXRvbG9jazogZmFsc2UsXHJcbiAgICAgICAgYXV0b3VuZ3JhYmlmeTogZmFsc2UsXHJcbiAgICAgICAgYXV0b3Vuc2VsZWN0aWZ5OiBmYWxzZSxcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyaW5nIG9wdGlvbnM6XHJcbiAgICAgICAgaGVhZGxlc3M6IGZhbHNlLFxyXG4gICAgICAgIHN0eWxlRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBoaWRlRWRnZXNPblZpZXdwb3J0OiBmYWxzZSxcclxuICAgICAgICB0ZXh0dXJlT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgbW90aW9uQmx1cjogZmFsc2UsXHJcbiAgICAgICAgbW90aW9uQmx1ck9wYWNpdHk6IDAuMixcclxuICAgICAgICB3aGVlbFNlbnNpdGl2aXR5OiAwLjMsXHJcbiAgICAgICAgcGl4ZWxSYXRpbzogJ2F1dG8nLFxyXG5cclxuICAgICAgICBlbGVtZW50czogW10sIC8vIGxpc3Qgb2YgZ3JhcGggZWxlbWVudHMgdG8gc3RhcnQgd2l0aFxyXG5cclxuICAgICAgICBzdHlsZTogWyAvLyB0aGUgc3R5bGVzaGVldCBmb3IgdGhlIGdyYXBoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIFwid2lkdGhcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcImhlaWdodFwiOnRoaXMuZGVmYXVsdE5vZGVTaXplLFxyXG4gICAgICAgICAgICAgICAgICAgICdsYWJlbCc6ICdkYXRhKGlkKScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ29wYWNpdHknOjAuOSxcclxuICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplJzpcIjEycHhcIixcclxuICAgICAgICAgICAgICAgICAgICAnZm9udC1mYW1pbHknOidHZW5ldmEsIEFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYnXHJcbiAgICAgICAgICAgICAgICAgICAgLy8sJ2JhY2tncm91bmQtaW1hZ2UnOiBmdW5jdGlvbihlbGUpeyByZXR1cm4gXCJpbWFnZXMvY2F0LnBuZ1wiOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8sJ2JhY2tncm91bmQtZml0JzonY29udGFpbicgLy9jb3ZlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vJ2JhY2tncm91bmQtY29sb3InOiBmdW5jdGlvbiggZWxlICl7IHJldHVybiBlbGUuZGF0YSgnYmcnKSB9XHJcbiAgICAgICAgICAgICAgICAgICAgLCdiYWNrZ3JvdW5kLXdpZHRoJzonNzAlJ1xyXG4gICAgICAgICAgICAgICAgICAgICwnYmFja2dyb3VuZC1oZWlnaHQnOic3MCUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6MixcclxuICAgICAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICcjODg4JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyM1NTUnLFxyXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctc2hhcGUnOiAndHJpYW5nbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICdjdXJ2ZS1zdHlsZSc6ICdiZXppZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICdhcnJvdy1zY2FsZSc6MC42XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2VkZ2U6c2VsZWN0ZWQnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogMyxcclxuICAgICAgICAgICAgICAgICdsaW5lLWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1maWxsJzpcImxpbmVhci1ncmFkaWVudFwiLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZ3JhZGllbnQtc3RvcC1jb2xvcnMnOlsnY3lhbicsICdtYWdlbnRhJywgJ3llbGxvdyddLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZ3JhZGllbnQtc3RvcC1wb3NpdGlvbnMnOlsnMCUnLCc3MCUnLCcxMDAlJ11cclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGU6c2VsZWN0ZWQnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci1jb2xvcic6XCJyZWRcIixcclxuICAgICAgICAgICAgICAgICdib3JkZXItd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1maWxsJzoncmFkaWFsLWdyYWRpZW50JyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWdyYWRpZW50LXN0b3AtY29sb3JzJzpbJ2N5YW4nLCAnbWFnZW50YScsICd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWdyYWRpZW50LXN0b3AtcG9zaXRpb25zJzpbJzAlJywnNTAlJywnNjAlJ11cclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGUuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmxhY2tlbic6MC41XHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAse3NlbGVjdG9yOiAnZWRnZS5ob3ZlcicsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOjVcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy9jeXRvc2NhcGUgZWRnZSBlZGl0aW5nIHBsdWctaW5cclxuICAgIHRoaXMuY29yZS5lZGdlRWRpdGluZyh7XHJcbiAgICAgICAgdW5kb2FibGU6IHRydWUsXHJcbiAgICAgICAgYmVuZFJlbW92YWxTZW5zaXRpdml0eTogMTYsXHJcbiAgICAgICAgZW5hYmxlTXVsdGlwbGVBbmNob3JSZW1vdmFsT3B0aW9uOiB0cnVlLFxyXG4gICAgICAgIHN0aWNreUFuY2hvclRvbGVyZW5jZTogMjAsXHJcbiAgICAgICAgYW5jaG9yU2hhcGVTaXplRmFjdG9yOiA1LFxyXG4gICAgICAgIGVuYWJsZUFuY2hvclNpemVOb3RJbXBhY3RCeVpvb206dHJ1ZSxcclxuICAgICAgICBlbmFibGVSZW1vdmVBbmNob3JNaWRPZk5lYXJMaW5lOmZhbHNlLFxyXG4gICAgICAgIGVuYWJsZUNyZWF0ZUFuY2hvck9uRHJhZzpmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmNvcmUuYm94U2VsZWN0aW9uRW5hYmxlZCh0cnVlKVxyXG5cclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ3RhcHNlbGVjdCcsICgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSk7XHJcbiAgICB0aGlzLmNvcmUub24oJ3RhcHVuc2VsZWN0JywgKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KTtcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ2JveGVuZCcsKGUpPT57Ly9wdXQgaW5zaWRlIGJveGVuZCBldmVudCB0byB0cmlnZ2VyIG9ubHkgb25lIHRpbWUsIGFuZCByZXBsZWF0bHkgYWZ0ZXIgZWFjaCBib3ggc2VsZWN0XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uZSgnYm94c2VsZWN0JywoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29yZS5vbignY3h0dGFwJywoZSk9PntcclxuICAgICAgICB0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKClcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdtb3VzZW92ZXInLGU9PntcclxuXHJcbiAgICAgICAgdGhpcy5tb3VzZU92ZXJGdW5jdGlvbihlKVxyXG4gICAgfSlcclxuICAgIHRoaXMuY29yZS5vbignbW91c2VvdXQnLGU9PntcclxuICAgICAgICB0aGlzLm1vdXNlT3V0RnVuY3Rpb24oZSlcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHRoaXMuY29yZS5vbignem9vbScsKGUpPT57XHJcbiAgICAgICAgdmFyIGZzPXRoaXMuZ2V0Rm9udFNpemVJbkN1cnJlbnRab29tKCk7XHJcbiAgICAgICAgdmFyIGRpbWVuc2lvbj10aGlzLmdldE5vZGVTaXplSW5DdXJyZW50Wm9vbSgpO1xyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZScpXHJcbiAgICAgICAgICAgIC5zdHlsZSh7ICdmb250LXNpemUnOiBmcywgd2lkdGg6IGRpbWVuc2lvbiwgaGVpZ2h0OiBkaW1lbnNpb24gfSlcclxuICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW8pIHtcclxuICAgICAgICAgICAgdmFyIG5ld0RpbWVuc2lvbiA9IE1hdGguY2VpbCh0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW9bbW9kZWxJRF0gKiBkaW1lbnNpb24pXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyArIG1vZGVsSUQgKyAnXCJdJylcclxuICAgICAgICAgICAgICAgIC5zdHlsZSh7IHdpZHRoOiBuZXdEaW1lbnNpb24sIGhlaWdodDogbmV3RGltZW5zaW9uIH0pXHJcbiAgICAgICAgICAgICAgICAudXBkYXRlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAgICAgLnNlbGVjdG9yKCdub2RlOnNlbGVjdGVkJylcclxuICAgICAgICAgICAgLnN0eWxlKHsgJ2JvcmRlci13aWR0aCc6IE1hdGguY2VpbChkaW1lbnNpb24gLyAxNSkgfSlcclxuICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICB2YXIgdGFwZHJhZ0hhbmRsZXI9KGUpID0+IHtcclxuICAgICAgICBpbnN0YW5jZS5rZWVwQW5jaG9yc0Fic29sdXRlUG9zaXRpb25EdXJpbmdNb3ZpbmcoKVxyXG4gICAgICAgIGlmKGUudGFyZ2V0LmlzTm9kZSAmJiBlLnRhcmdldC5pc05vZGUoKSkgdGhpcy5kcmFnZ2luZ05vZGU9ZS50YXJnZXRcclxuICAgICAgICB0aGlzLnNtYXJ0UG9zaXRpb25Ob2RlKGUucG9zaXRpb24pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUdyYWIgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJncmFiXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBkcmFnZ2luZ05vZGVzID0gdGhpcy5jb3JlLmNvbGxlY3Rpb24oKVxyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQuaXNOb2RlKCkpIGRyYWdnaW5nTm9kZXMubWVyZ2UoZS50YXJnZXQpXHJcbiAgICAgICAgICAgIHZhciBhcnIgPSB0aGlzLmNvcmUuJChcIjpzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgICBhcnIuZm9yRWFjaCgoZWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlLmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGVsZSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgaW5zdGFuY2Uuc3RvcmVBbmNob3JzQWJzb2x1dGVQb3NpdGlvbihkcmFnZ2luZ05vZGVzKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUub24oXCJ0YXBkcmFnXCIsdGFwZHJhZ0hhbmRsZXIgKVxyXG4gICAgICAgICAgICBzZXRPbmVUaW1lRnJlZSgpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIHZhciBzZXRPbmVUaW1lRnJlZSA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvcmUub25jZShcImZyZWVcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKCdnZXQnKTtcclxuICAgICAgICAgICAgaW5zdGFuY2UucmVzZXRBbmNob3JzQWJzb2x1dGVQb3NpdGlvbigpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlPW51bGxcclxuICAgICAgICAgICAgc2V0T25lVGltZUdyYWIoKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUucmVtb3ZlTGlzdGVuZXIoXCJ0YXBkcmFnXCIsdGFwZHJhZ0hhbmRsZXIpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIHNldE9uZVRpbWVHcmFiKClcclxuICAgIHRoaXMuY29yZS50cmlnZ2VyKFwiem9vbVwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc21hcnRQb3NpdGlvbk5vZGUgPSBmdW5jdGlvbiAobW91c2VQb3NpdGlvbikge1xyXG4gICAgdmFyIHpvb21MZXZlbD10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZighdGhpcy5kcmFnZ2luZ05vZGUpIHJldHVyblxyXG4gICAgLy9jb21wYXJpbmcgbm9kZXMgc2V0OiBpdHMgY29ubmVjdGZyb20gbm9kZXMgYW5kIHRoZWlyIGNvbm5lY3R0byBub2RlcywgaXRzIGNvbm5lY3R0byBub2RlcyBhbmQgdGhlaXIgY29ubmVjdGZyb20gbm9kZXNcclxuICAgIHZhciBpbmNvbWVycz10aGlzLmRyYWdnaW5nTm9kZS5pbmNvbWVycygpXHJcbiAgICB2YXIgb3V0ZXJGcm9tSW5jb209IGluY29tZXJzLm91dGdvZXJzKClcclxuICAgIHZhciBvdXRlcj10aGlzLmRyYWdnaW5nTm9kZS5vdXRnb2VycygpXHJcbiAgICB2YXIgaW5jb21Gcm9tT3V0ZXI9b3V0ZXIuaW5jb21lcnMoKVxyXG4gICAgdmFyIG1vbml0b3JTZXQ9aW5jb21lcnMudW5pb24ob3V0ZXJGcm9tSW5jb20pLnVuaW9uKG91dGVyKS51bmlvbihpbmNvbUZyb21PdXRlcikuZmlsdGVyKCdub2RlJykudW5tZXJnZSh0aGlzLmRyYWdnaW5nTm9kZSlcclxuXHJcbiAgICB2YXIgcmV0dXJuRXhwZWN0ZWRQb3M9KGRpZmZBcnIscG9zQXJyKT0+e1xyXG4gICAgICAgIHZhciBtaW5EaXN0YW5jZT1NYXRoLm1pbiguLi5kaWZmQXJyKVxyXG4gICAgICAgIGlmKG1pbkRpc3RhbmNlKnpvb21MZXZlbCA8IDEwKSAgcmV0dXJuIHBvc0FycltkaWZmQXJyLmluZGV4T2YobWluRGlzdGFuY2UpXVxyXG4gICAgICAgIGVsc2UgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHhEaWZmPVtdXHJcbiAgICB2YXIgeFBvcz1bXVxyXG4gICAgdmFyIHlEaWZmPVtdXHJcbiAgICB2YXIgeVBvcz1bXVxyXG4gICAgbW9uaXRvclNldC5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgeERpZmYucHVzaChNYXRoLmFicyhlbGUucG9zaXRpb24oKS54LW1vdXNlUG9zaXRpb24ueCkpXHJcbiAgICAgICAgeFBvcy5wdXNoKGVsZS5wb3NpdGlvbigpLngpXHJcbiAgICAgICAgeURpZmYucHVzaChNYXRoLmFicyhlbGUucG9zaXRpb24oKS55LW1vdXNlUG9zaXRpb24ueSkpXHJcbiAgICAgICAgeVBvcy5wdXNoKGVsZS5wb3NpdGlvbigpLnkpXHJcbiAgICB9KVxyXG4gICAgdmFyIHByZWZYPXJldHVybkV4cGVjdGVkUG9zKHhEaWZmLHhQb3MpXHJcbiAgICB2YXIgcHJlZlk9cmV0dXJuRXhwZWN0ZWRQb3MoeURpZmYseVBvcylcclxuICAgIGlmKHByZWZYIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3gnLCBwcmVmWCk7XHJcbiAgICB9XHJcbiAgICBpZihwcmVmWSE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlLnBvc2l0aW9uKCd5JywgcHJlZlkpO1xyXG4gICAgfVxyXG4gICAgLy9jb25zb2xlLmxvZyhcIi0tLS1cIilcclxuICAgIC8vbW9uaXRvclNldC5mb3JFYWNoKChlbGUpPT57Y29uc29sZS5sb2coZWxlLmlkKCkpfSlcclxuICAgIC8vY29uc29sZS5sb2cobW9uaXRvclNldC5zaXplKCkpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU92ZXJGdW5jdGlvbj0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmKCFlLnRhcmdldC5kYXRhKSByZXR1cm5cclxuICAgIFxyXG4gICAgdmFyIGluZm89ZS50YXJnZXQuZGF0YSgpLm9yaWdpbmFsSW5mb1xyXG4gICAgaWYoaW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgaWYodGhpcy5sYXN0SG92ZXJUYXJnZXQpIHRoaXMubGFzdEhvdmVyVGFyZ2V0LnJlbW92ZUNsYXNzKFwiaG92ZXJcIilcclxuICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PWUudGFyZ2V0XHJcbiAgICBlLnRhcmdldC5hZGRDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgXCJpbmZvXCI6IFtpbmZvXSB9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubW91c2VPdXRGdW5jdGlvbj0gZnVuY3Rpb24gKGUpIHtcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG4gICAgaWYodGhpcy5sYXN0SG92ZXJUYXJnZXQpe1xyXG4gICAgICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0LnJlbW92ZUNsYXNzKFwiaG92ZXJcIilcclxuICAgICAgICB0aGlzLmxhc3RIb3ZlclRhcmdldD1udWxsO1xyXG4gICAgfSBcclxuXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RGdW5jdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhcnIgPSB0aGlzLmNvcmUuJChcIjpzZWxlY3RlZFwiKVxyXG4gICAgdmFyIHJlID0gW11cclxuICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHsgcmUucHVzaChlbGUuZGF0YSgpLm9yaWdpbmFsSW5mbykgfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOiByZSB9KVxyXG5cclxuICAgIC8vZm9yIGRlYnVnZ2luZyBwdXJwb3NlXHJcbiAgICAvL2Fyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAvLyAgY29uc29sZS5sb2coXCJcIilcclxuICAgIC8vfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGN1clpvb209dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoY3VyWm9vbT4xKXtcclxuICAgICAgICB2YXIgbWF4RlM9MTJcclxuICAgICAgICB2YXIgbWluRlM9NVxyXG4gICAgICAgIHZhciByYXRpbz0gKG1heEZTL21pbkZTLTEpLzkqKGN1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWF4RlMvcmF0aW8pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgbWF4RlM9MTIwXHJcbiAgICAgICAgdmFyIG1pbkZTPTEyXHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooMS9jdXJab29tLTEpKzFcclxuICAgICAgICB2YXIgZnM9TWF0aC5jZWlsKG1pbkZTKnJhdGlvKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZzO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpey8vc2NhbGUgdXAgYnV0IG5vdCB0b28gbXVjaFxyXG4gICAgICAgIHZhciByYXRpbz0gKGN1clpvb20tMSkqKDItMSkvOSsxXHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh0aGlzLmRlZmF1bHROb2RlU2l6ZS9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciByYXRpbz0gKDEvY3VyWm9vbS0xKSooNC0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplKnJhdGlvKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsQXZhcnRhPWZ1bmN0aW9uKG1vZGVsSUQsZGF0YVVybCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKCkgXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydiYWNrZ3JvdW5kLWltYWdlJzogZGF0YVVybH0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luQ29sb3I9ZnVuY3Rpb24obW9kZWxJRCxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtY29sb3InOiBjb2xvckNvZGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luU2hhcGU9ZnVuY3Rpb24obW9kZWxJRCxzaGFwZSl7XHJcbiAgICBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydzaGFwZSc6ICdwb2x5Z29uJywnc2hhcGUtcG9seWdvbi1wb2ludHMnOlswLC0xLDAuODY2LC0wLjUsMC44NjYsMC41LDAsMSwtMC44NjYsMC41LC0wLjg2NiwtMC41XX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnc2hhcGUnOiBzaGFwZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uPWZ1bmN0aW9uKG1vZGVsSUQsZGltZW5zaW9uUmF0aW8pe1xyXG4gICAgdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdPXBhcnNlRmxvYXQoZGltZW5zaW9uUmF0aW8pXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydsaW5lLWNvbG9yJzogY29sb3JDb2RlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxzaGFwZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2xpbmUtc3R5bGUnOiBzaGFwZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxlZGdlV2lkdGgpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlOnNlbGVjdGVkW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKSsxLCdsaW5lLWNvbG9yJzogJ3JlZCd9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2UuaG92ZXJbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpKzN9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9ucyl7XHJcbiAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbltcInNyY0lEXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uSUQ9b25lUmVsYXRpb25bXCJyZWxJRFwiXVxyXG4gICAgICAgIHZhciB0aGVOb2RlTmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NyY0lEXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJyt0aGVOb2RlTmFtZSsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbklEKXtcclxuICAgICAgICAgICAgICAgIGFuRWRnZS5yZW1vdmUoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pICAgXHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHZhciB0d2luRGlzcGxheU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVt0d2luSURdXHJcbiAgICAgICAgdGhpcy5jb3JlLiQoJ1tpZCA9IFwiJyt0d2luRGlzcGxheU5hbWUrJ1wiXScpLnJlbW92ZSgpXHJcbiAgICB9KSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYW5pbWF0ZUFOb2RlPWZ1bmN0aW9uKHR3aW4pe1xyXG4gICAgdmFyIGN1ckRpbWVuc2lvbj0gdHdpbi53aWR0aCgpXHJcbiAgICB0d2luLmFuaW1hdGUoe1xyXG4gICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24qMiwnd2lkdGgnOiBjdXJEaW1lbnNpb24qMiB9LFxyXG4gICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoKCk9PntcclxuICAgICAgICB0d2luLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICBzdHlsZTogeyAnaGVpZ2h0JzogY3VyRGltZW5zaW9uLCd3aWR0aCc6IGN1ckRpbWVuc2lvbiB9LFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogMjAwXHJcbiAgICAgICAgICAgICxjb21wbGV0ZTooKT0+e1xyXG4gICAgICAgICAgICAgICAgdHdpbi5yZW1vdmVTdHlsZSgpIC8vbXVzdCByZW1vdmUgdGhlIHN0eWxlIGFmdGVyIGFuaW1hdGlvbiwgb3RoZXJ3aXNlIHRoZXkgd2lsbCBoYXZlIHRoZWlyIG93biBzdHlsZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LDIwMClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2lucz1mdW5jdGlvbih0d2luc0RhdGEsYW5pbWF0aW9uKXtcclxuICAgIHZhciBhcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8dHdpbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89dHdpbnNEYXRhW2ldO1xyXG4gICAgICAgIHZhciBuZXdOb2RlPXtkYXRhOnt9LGdyb3VwOlwibm9kZXNcIn1cclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJvcmlnaW5hbEluZm9cIl09IG9yaWdpbmFsSW5mbztcclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJpZFwiXT1vcmlnaW5hbEluZm9bJ2Rpc3BsYXlOYW1lJ11cclxuICAgICAgICB2YXIgbW9kZWxJRD1vcmlnaW5hbEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm1vZGVsSURcIl09bW9kZWxJRFxyXG4gICAgICAgIGFyci5wdXNoKG5ld05vZGUpXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGVsZXMgPSB0aGlzLmNvcmUuYWRkKGFycilcclxuICAgIGlmKGVsZXMuc2l6ZSgpPT0wKSByZXR1cm4gZWxlc1xyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2dyaWQoZWxlcylcclxuICAgIGlmKGFuaW1hdGlvbil7XHJcbiAgICAgICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2lmIHRoZXJlIGlzIGN1cnJlbnRseSBhIGxheW91dCB0aGVyZSwgYXBwbHkgaXRcclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXQoKVxyXG5cclxuICAgIHJldHVybiBlbGVzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3UmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgdmFyIHJlbGF0aW9uSW5mb0Fycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTxyZWxhdGlvbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89cmVsYXRpb25zRGF0YVtpXTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGhlSUQ9b3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwTmFtZSddK1wiX1wiK29yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcElkJ11cclxuICAgICAgICB2YXIgYVJlbGF0aW9uPXtkYXRhOnt9LGdyb3VwOlwiZWRnZXNcIn1cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT1vcmlnaW5hbEluZm9cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcImlkXCJdPXRoZUlEXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl09Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvcmlnaW5hbEluZm9bJyRzb3VyY2VJZCddXVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb3JpZ2luYWxJbmZvWyckdGFyZ2V0SWQnXV1cclxuXHJcblxyXG4gICAgICAgIGlmKHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdKS5sZW5ndGg9PTAgfHwgdGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl0pLmxlbmd0aD09MCkgY29udGludWVcclxuICAgICAgICB2YXIgc291cmNlTm9kZT10aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSlcclxuICAgICAgICB2YXIgc291cmNlTW9kZWw9c291cmNlTm9kZVswXS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBcclxuICAgICAgICAvL2FkZCBhZGRpdGlvbmFsIHNvdXJjZSBub2RlIGluZm9ybWF0aW9uIHRvIHRoZSBvcmlnaW5hbCByZWxhdGlvbnNoaXAgaW5mb3JtYXRpb25cclxuICAgICAgICBvcmlnaW5hbEluZm9bJ3NvdXJjZU1vZGVsJ109c291cmNlTW9kZWxcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZU1vZGVsXCJdPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJyZWxhdGlvbnNoaXBOYW1lXCJdPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXVxyXG5cclxuICAgICAgICB2YXIgZXhpc3RFZGdlPXRoaXMuY29yZS4kKCdlZGdlW2lkID0gXCInK3RoZUlEKydcIl0nKVxyXG4gICAgICAgIGlmKGV4aXN0RWRnZS5zaXplKCk+MCkge1xyXG4gICAgICAgICAgICBleGlzdEVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiLG9yaWdpbmFsSW5mbylcclxuICAgICAgICAgICAgY29udGludWU7ICAvL25vIG5lZWQgdG8gZHJhdyBpdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVsYXRpb25JbmZvQXJyLnB1c2goYVJlbGF0aW9uKVxyXG4gICAgfVxyXG4gICAgaWYocmVsYXRpb25JbmZvQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgdmFyIGVkZ2VzPXRoaXMuY29yZS5hZGQocmVsYXRpb25JbmZvQXJyKVxyXG4gICAgcmV0dXJuIGVkZ2VzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3PWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NoZWNrIHRoZSBzdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMgYWdhaW4gYW5kIG1heWJlIHNvbWUgb2YgdGhlbSBjYW4gYmUgZHJhd24gbm93IHNpbmNlIHRhcmdldE5vZGUgaXMgYXZhaWxhYmxlXHJcbiAgICB2YXIgc3RvcmVkUmVsYXRpb25BcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgc3RvcmVkUmVsYXRpb25BcnI9c3RvcmVkUmVsYXRpb25BcnIuY29uY2F0KGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdKVxyXG4gICAgfVxyXG4gICAgdGhpcy5kcmF3UmVsYXRpb25zKHN0b3JlZFJlbGF0aW9uQXJyKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPWZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5zQW5kUmVsYXRpb25zPWRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9uc1xyXG5cclxuICAgIC8vZHJhdyB0aG9zZSBuZXcgdHdpbnMgZmlyc3RcclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHR3aW5JbmZvQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpIHR3aW5JbmZvQXJyLnB1c2gob25lU2V0LmNoaWxkVHdpbnNbaW5kXSlcclxuICAgICAgICB2YXIgZWxlcz10aGlzLmRyYXdUd2lucyh0d2luSW5mb0FycixcImFuaW1hdGlvblwiKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2RyYXcgdGhvc2Uga25vd24gdHdpbnMgZnJvbSB0aGUgcmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHR3aW5zSW5mbz17fVxyXG4gICAgdHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0aGlzLmRyYXdUd2lucyh0bXBBcnIpXHJcblxyXG4gICAgLy90aGVuIGNoZWNrIGFsbCBzdG9yZWQgcmVsYXRpb25zaGlwcyBhbmQgZHJhdyBpZiBpdCBjYW4gYmUgZHJhd25cclxuICAgIHRoaXMucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdygpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseVZpc3VhbERlZmluaXRpb249ZnVuY3Rpb24oKXtcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICBpZih2aXN1YWxKc29uPT1udWxsKSByZXR1cm47XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdmlzdWFsSnNvbil7XHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgdGhpcy51cGRhdGVNb2RlbFR3aW5Db2xvcihtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkRpbWVuc2lvbihtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5yZWxzKXtcclxuICAgICAgICAgICAgZm9yKHZhciByZWxhdGlvbnNoaXBOYW1lIGluIHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5jb2xvcil7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcihtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3IpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5zaGFwZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZShtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5lZGdlV2lkdGgpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwV2lkdGgobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmVkZ2VXaWR0aClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9yZXBsYWNlXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVwbGFjZUFsbFR3aW5zXCIpIHtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS5yZW1vdmUoKVxyXG4gICAgICAgIHZhciBlbGVzPSB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICAgICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25SZWZyZXNoXCIpIHtcclxuICAgICAgICB0aGlzLmFwcGx5VmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYXBwZW5kQWxsVHdpbnNcIikge1xyXG4gICAgICAgIHZhciBlbGVzPSB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLmluZm8sXCJhbmltYXRlXCIpXHJcbiAgICAgICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG4gICAgICAgIHRoaXMucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdygpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd0FsbFJlbGF0aW9uc1wiKXtcclxuICAgICAgICB2YXIgZWRnZXM9IHRoaXMuZHJhd1JlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICAgICAgaWYoZWRnZXMhPW51bGwpIHtcclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWU9PW51bGwpICB0aGlzLm5vUG9zaXRpb25fY29zZSgpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5cIikge1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMoW21zZ1BheWxvYWQudHdpbkluZm9dLFwiYW5pbWF0aW9uXCIpXHJcbiAgICAgICAgdmFyIG5vZGVJbmZvPSBtc2dQYXlsb2FkLnR3aW5JbmZvO1xyXG4gICAgICAgIHZhciBub2RlTmFtZT0gZ2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtub2RlSW5mb1tcIiRkdElkXCJdXVxyXG4gICAgICAgIHZhciB0b3BvTm9kZT0gdGhpcy5jb3JlLm5vZGVzKFwiI1wiK25vZGVOYW1lKVxyXG4gICAgICAgIGlmKHRvcG9Ob2RlKXtcclxuICAgICAgICAgICAgdmFyIHBvc2l0aW9uPXRvcG9Ob2RlLnJlbmRlcmVkUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUucGFuQnkoe3g6LXBvc2l0aW9uLngrMjAwLHk6LXBvc2l0aW9uLnkrNTB9KVxyXG4gICAgICAgICAgICB0b3BvTm9kZS5zZWxlY3QoKVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQudHdpbnNJbmZvLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIpIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiKXsgLy9mcm9tIHNlbGVjdGluZyB0d2lucyBpbiB0aGUgdHdpbnRyZWVcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIHZhciBtb3VzZUNsaWNrRGV0YWlsPW1zZ1BheWxvYWQubW91c2VDbGlja0RldGFpbDtcclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgdmFyIGFUd2luPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrZWxlbWVudFsnZGlzcGxheU5hbWUnXSlcclxuICAgICAgICAgICAgYVR3aW4uc2VsZWN0KClcclxuICAgICAgICAgICAgaWYobW91c2VDbGlja0RldGFpbCE9MikgdGhpcy5hbmltYXRlQU5vZGUoYVR3aW4pIC8vaWdub3JlIGRvdWJsZSBjbGljayBzZWNvbmQgY2xpY2tcclxuICAgICAgICB9KTtcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJQYW5Ub05vZGVcIil7XHJcbiAgICAgICAgdmFyIG5vZGVJbmZvPSBtc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPSBnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW25vZGVJbmZvW1wiJGR0SWRcIl1dXHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZU5hbWUpXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB0aGlzLmNvcmUuY2VudGVyKHRvcG9Ob2RlKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCl7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuc2hhcGUpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLnNoYXBlKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuZWRnZVdpZHRoKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5lZGdlV2lkdGgpXHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICBpZihtc2dQYXlsb2FkLmNvbG9yKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkNvbG9yKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuc2hhcGUpIHRoaXMudXBkYXRlTW9kZWxUd2luU2hhcGUobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuc2hhcGUpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5hdmFydGEpIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuYXZhcnRhKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQubm9BdmFydGEpICB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1zZ1BheWxvYWQubW9kZWxJRCxudWxsKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuZGltZW5zaW9uUmF0aW8pICB0aGlzLnVwZGF0ZU1vZGVsVHdpbkRpbWVuc2lvbihtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICB9IFxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVsYXRpb25zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVJlbGF0aW9ucyhtc2dQYXlsb2FkLnJlbGF0aW9ucylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImNvbm5lY3RUb1wiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdFRvXCIpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdEZyb21cIil7IHRoaXMuc3RhcnRUYXJnZXROb2RlTW9kZShcImNvbm5lY3RGcm9tXCIpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkU2VsZWN0T3V0Ym91bmRcIil7IHRoaXMuc2VsZWN0T3V0Ym91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkU2VsZWN0SW5ib3VuZFwiKXsgdGhpcy5zZWxlY3RJbmJvdW5kTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImhpZGVTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLmhpZGVTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJDT1NFU2VsZWN0ZWROb2Rlc1wiKXsgdGhpcy5DT1NFU2VsZWN0ZWROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2F2ZUxheW91dFwiKXsgdGhpcy5zYXZlTGF5b3V0KG1zZ1BheWxvYWQubGF5b3V0TmFtZSkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRDaGFuZ2VcIil7IHRoaXMuYXBwbHlOZXdMYXlvdXQoKSAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5TmV3TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGxheW91dE5hbWU9Z2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWVcclxuICAgIFxyXG4gICAgdmFyIGxheW91dERldGFpbD0gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgXHJcbiAgICAvL3JlbW92ZSBhbGwgYmVuZGluZyBlZGdlIFxyXG4gICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMnKVxyXG4gICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJylcclxuICAgIH0pXHJcbiAgICBcclxuICAgIGlmKGxheW91dERldGFpbD09bnVsbCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICB2YXIgc3RvcmVkUG9zaXRpb25zPXt9XHJcbiAgICBmb3IodmFyIGluZCBpbiBsYXlvdXREZXRhaWwpe1xyXG4gICAgICAgIHN0b3JlZFBvc2l0aW9uc1tpbmRdPXtcclxuICAgICAgICAgICAgeDpsYXlvdXREZXRhaWxbaW5kXVswXVxyXG4gICAgICAgICAgICAseTpsYXlvdXREZXRhaWxbaW5kXVsxXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBuZXdMYXlvdXQ9dGhpcy5jb3JlLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldCcsXHJcbiAgICAgICAgcG9zaXRpb25zOnN0b3JlZFBvc2l0aW9ucyxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgYW5pbWF0ZTogdHJ1ZSxcclxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogMzAwLFxyXG4gICAgfSlcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG5cclxuICAgIC8vcmVzdG9yZSBlZGdlcyBiZW5kaW5nIG9yIGNvbnRyb2wgcG9pbnRzXHJcbiAgICB2YXIgZWRnZVBvaW50c0RpY3Q9bGF5b3V0RGV0YWlsW1wiZWRnZXNcIl1cclxuICAgIGlmKGVkZ2VQb2ludHNEaWN0PT1udWxsKXJldHVybjtcclxuICAgIGZvcih2YXIgc3JjSUQgaW4gZWRnZVBvaW50c0RpY3Qpe1xyXG4gICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwSUQgaW4gZWRnZVBvaW50c0RpY3Rbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIG9iaj1lZGdlUG9pbnRzRGljdFtzcmNJRF1bcmVsYXRpb25zaGlwSURdXHJcbiAgICAgICAgICAgIHRoaXMuYXBwbHlFZGdlQmVuZGNvbnRyb2xQb2ludHMoc3JjSUQscmVsYXRpb25zaGlwSUQsb2JqW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdXHJcbiAgICAgICAgICAgICxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIl0sb2JqW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlFZGdlQmVuZGNvbnRyb2xQb2ludHMgPSBmdW5jdGlvbiAoc3JjSUQscmVsYXRpb25zaGlwSURcclxuICAgICxjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMsY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMsY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKSB7XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbc3JjSURdXHJcbiAgICAgICAgdmFyIHRoZU5vZGU9dGhpcy5jb3JlLmZpbHRlcignW2lkID0gXCInK25vZGVOYW1lKydcIl0nKTtcclxuICAgICAgICB2YXIgZWRnZXM9dGhlTm9kZS5jb25uZWN0ZWRFZGdlcygpLnRvQXJyYXkoKVxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8ZWRnZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciBhbkVkZ2U9ZWRnZXNbaV1cclxuICAgICAgICAgICAgaWYoYW5FZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl09PXJlbGF0aW9uc2hpcElEKXtcclxuICAgICAgICAgICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5hZGRDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5hZGRDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxufVxyXG5cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2F2ZUxheW91dCA9IGFzeW5jIGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICB2YXIgbGF5b3V0RGljdD1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICBpZighbGF5b3V0RGljdCl7XHJcbiAgICAgICAgbGF5b3V0RGljdD1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdPXt9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmKHRoaXMuY29yZS5ub2RlcygpLnNpemUoKT09MCkgcmV0dXJuO1xyXG5cclxuICAgIC8vc3RvcmUgbm9kZXMgcG9zaXRpb25cclxuICAgIHRoaXMuY29yZS5ub2RlcygpLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBwb3NpdGlvbj1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICBsYXlvdXREaWN0W29uZU5vZGUuaWQoKV09W3RoaXMubnVtYmVyUHJlY2lzaW9uKHBvc2l0aW9uWyd4J10pLHRoaXMubnVtYmVyUHJlY2lzaW9uKHBvc2l0aW9uWyd5J10pXVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3N0b3JlIGFueSBlZGdlIGJlbmRpbmcgcG9pbnRzIG9yIGNvbnRyb2xpbmcgcG9pbnRzXHJcblxyXG4gICAgaWYobGF5b3V0RGljdC5lZGdlcz09bnVsbCkgbGF5b3V0RGljdC5lZGdlcz17fVxyXG4gICAgdmFyIGVkZ2VFZGl0SW5zdGFuY2U9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHNvdXJjZUlkXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcElEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgIHZhciBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzJylcclxuICAgICAgICB2YXIgY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgaWYoIWN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiAhY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmKGxheW91dERpY3QuZWRnZXNbc3JjSURdPT1udWxsKWxheW91dERpY3QuZWRnZXNbc3JjSURdPXt9XHJcbiAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdPXt9XHJcbiAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzICYmIGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cy5sZW5ndGg+MCkge1xyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzICYmIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cy5sZW5ndGg+MCkge1xyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBzYXZlTGF5b3V0T2JqPXtcImxheW91dHNcIjp7fX1cclxuICAgIHNhdmVMYXlvdXRPYmpbXCJsYXlvdXRzXCJdW2xheW91dE5hbWVdPUpTT04uc3RyaW5naWZ5KGxheW91dERpY3QpXHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vc2F2ZUxheW91dFwiLCBcIlBPU1RcIiwgc2F2ZUxheW91dE9iailcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwiLFwibGF5b3V0TmFtZVwiOmxheW91dE5hbWV9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubnVtYmVyUHJlY2lzaW9uID0gZnVuY3Rpb24gKG51bWJlcikge1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShudW1iZXIpKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPG51bWJlci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbnVtYmVyW2ldID0gdGhpcy5udW1iZXJQcmVjaXNpb24obnVtYmVyW2ldKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVtYmVyXHJcbiAgICB9ZWxzZVxyXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQobnVtYmVyLnRvRml4ZWQoMykpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5DT1NFU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZD10aGlzLmNvcmUuJCgnOnNlbGVjdGVkJylcclxuICAgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKHNlbGVjdGVkKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaGlkZVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBzZWxlY3RlZE5vZGVzLnJlbW92ZSgpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RJbmJvdW5kTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICB2YXIgZWxlcz10aGlzLmNvcmUubm9kZXMoKS5lZGdlc1RvKHNlbGVjdGVkTm9kZXMpLnNvdXJjZXMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0T3V0Ym91bmROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHZhciBlbGVzPXNlbGVjdGVkTm9kZXMuZWRnZXNUbyh0aGlzLmNvcmUubm9kZXMoKSkudGFyZ2V0cygpXHJcbiAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgZWxlcy5zZWxlY3QoKVxyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hZGRDb25uZWN0aW9ucyA9IGZ1bmN0aW9uICh0YXJnZXROb2RlKSB7XHJcbiAgICB2YXIgdGhlQ29ubmVjdE1vZGU9dGhpcy50YXJnZXROb2RlTW9kZVxyXG4gICAgdmFyIHNyY05vZGVBcnI9dGhpcy5jb3JlLm5vZGVzKFwiOnNlbGVjdGVkXCIpXHJcblxyXG4gICAgdmFyIHByZXBhcmF0aW9uSW5mbz1bXVxyXG5cclxuICAgIHNyY05vZGVBcnIuZm9yRWFjaCh0aGVOb2RlPT57XHJcbiAgICAgICAgdmFyIGNvbm5lY3Rpb25UeXBlc1xyXG4gICAgICAgIGlmKHRoZUNvbm5lY3RNb2RlPT1cImNvbm5lY3RUb1wiKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcz10aGlzLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUodGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSx0YXJnZXROb2RlLmRhdGEoXCJtb2RlbElEXCIpKVxyXG4gICAgICAgICAgICBwcmVwYXJhdGlvbkluZm8ucHVzaCh7ZnJvbTp0aGVOb2RlLHRvOnRhcmdldE5vZGUsY29ubmVjdDpjb25uZWN0aW9uVHlwZXN9KVxyXG4gICAgICAgIH1lbHNlIGlmKHRoZUNvbm5lY3RNb2RlPT1cImNvbm5lY3RGcm9tXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0YXJnZXROb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRoZU5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHt0bzp0aGVOb2RlLGZyb206dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vVE9ETzogY2hlY2sgaWYgaXQgaXMgbmVlZGVkIHRvIHBvcHVwIGRpYWxvZywgaWYgYWxsIGNvbm5lY3Rpb24gaXMgZG9hYmxlIGFuZCBvbmx5IG9uZSB0eXBlIHRvIHVzZSwgbm8gbmVlZCB0byBzaG93IGRpYWxvZ1xyXG4gICAgdGhpcy5zaG93Q29ubmVjdGlvbkRpYWxvZyhwcmVwYXJhdGlvbkluZm8pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zaG93Q29ubmVjdGlvbkRpYWxvZyA9IGZ1bmN0aW9uIChwcmVwYXJhdGlvbkluZm8pIHtcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgdmFyIHJlc3VsdEFjdGlvbnM9W11cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjQ1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkZCBjb25uZWN0aW9uc1wiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJcIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9ucyhyZXN1bHRBY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuZW1wdHkoKVxyXG4gICAgcHJlcGFyYXRpb25JbmZvLmZvckVhY2goKG9uZVJvdyxpbmRleCk9PntcclxuICAgICAgICByZXN1bHRBY3Rpb25zLnB1c2godGhpcy5jcmVhdGVPbmVDb25uZWN0aW9uQWRqdXN0Um93KG9uZVJvdyxjb25maXJtRGlhbG9nRGl2KSlcclxuICAgIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVPbmVDb25uZWN0aW9uQWRqdXN0Um93ID0gZnVuY3Rpb24gKG9uZVJvdyxjb25maXJtRGlhbG9nRGl2KSB7XHJcbiAgICB2YXIgcmV0dXJuT2JqPXt9XHJcbiAgICB2YXIgZnJvbU5vZGU9b25lUm93LmZyb21cclxuICAgIHZhciB0b05vZGU9b25lUm93LnRvXHJcbiAgICB2YXIgY29ubmVjdGlvblR5cGVzPW9uZVJvdy5jb25uZWN0XHJcbiAgICB2YXIgbGFiZWw9JCgnPGxhYmVsIHN0eWxlPVwiZGlzcGxheTpibG9jazttYXJnaW4tYm90dG9tOjJweFwiPjwvbGFiZWw+JylcclxuICAgIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJyZWRcIilcclxuICAgICAgICBsYWJlbC5odG1sKFwiTm8gdXNhYmxlIGNvbm5lY3Rpb24gdHlwZSBmcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKVxyXG4gICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD4xKXsgXHJcbiAgICAgICAgbGFiZWwuaHRtbChcIkZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgICAgIHZhciBzd2l0Y2hUeXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIpXHJcbiAgICAgICAgbGFiZWwucHJlcGVuZChzd2l0Y2hUeXBlU2VsZWN0b3IuRE9NKVxyXG4gICAgICAgIGNvbm5lY3Rpb25UeXBlcy5mb3JFYWNoKG9uZVR5cGU9PntcclxuICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmFkZE9wdGlvbihvbmVUeXBlKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiZnJvbVwiXT1mcm9tTm9kZS5pZCgpXHJcbiAgICAgICAgcmV0dXJuT2JqW1widG9cIl09dG9Ob2RlLmlkKClcclxuICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPWNvbm5lY3Rpb25UeXBlc1swXVxyXG4gICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgIH1lbHNlIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg9PTEpe1xyXG4gICAgICAgIHJldHVybk9ialtcImZyb21cIl09ZnJvbU5vZGUuaWQoKVxyXG4gICAgICAgIHJldHVybk9ialtcInRvXCJdPXRvTm9kZS5pZCgpXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1jb25uZWN0aW9uVHlwZXNbMF1cclxuICAgICAgICBsYWJlbC5jc3MoXCJjb2xvclwiLFwiZ3JlZW5cIilcclxuICAgICAgICBsYWJlbC5odG1sKFwiQWRkIDxiPlwiK2Nvbm5lY3Rpb25UeXBlc1swXStcIjwvYj4gY29ubmVjdGlvbiBmcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKSBcclxuICAgIH1cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuZGlhbG9nRGl2LmFwcGVuZChsYWJlbClcclxuICAgIHJldHVybiByZXR1cm5PYmo7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9ucyA9IGFzeW5jIGZ1bmN0aW9uIChyZXN1bHRBY3Rpb25zKSB7XHJcbiAgICAvLyBmb3IgZWFjaCByZXN1bHRBY3Rpb25zLCBjYWxjdWxhdGUgdGhlIGFwcGVuZGl4IGluZGV4LCB0byBhdm9pZCBzYW1lIElEIGlzIHVzZWQgZm9yIGV4aXN0ZWQgY29ubmVjdGlvbnNcclxuICAgIGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgICAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZmluYWxBY3Rpb25zPVtdXHJcbiAgICByZXN1bHRBY3Rpb25zLmZvckVhY2gob25lQWN0aW9uPT57XHJcbiAgICAgICAgdmFyIG9uZUZpbmFsQWN0aW9uPXt9XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkc3JjSWRcIl09b25lQWN0aW9uW1wiZnJvbVwiXVxyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wiJHJlbGF0aW9uc2hpcElkXCJdPXV1aWR2NCgpO1xyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wib2JqXCJdPXtcclxuICAgICAgICAgICAgXCIkdGFyZ2V0SWRcIjogb25lQWN0aW9uW1widG9cIl0sXHJcbiAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjogb25lQWN0aW9uW1wiY29ubmVjdFwiXVxyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbEFjdGlvbnMucHVzaChvbmVGaW5hbEFjdGlvbilcclxuICAgIH0pXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9jcmVhdGVSZWxhdGlvbnNcIiwgXCJQT1NUXCIsICB7YWN0aW9uczpKU09OLnN0cmluZ2lmeShmaW5hbEFjdGlvbnMpfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kKGRhdGEpXHJcbiAgICB0aGlzLmRyYXdSZWxhdGlvbnMoZGF0YSlcclxufVxyXG5cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSA9IGZ1bmN0aW9uIChmcm9tTm9kZU1vZGVsLHRvTm9kZU1vZGVsKSB7XHJcbiAgICB2YXIgcmU9W11cclxuICAgIHZhciB2YWxpZFJlbGF0aW9uc2hpcHM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW2Zyb21Ob2RlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHRvTm9kZUJhc2VDbGFzc2VzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0b05vZGVNb2RlbF0uYWxsQmFzZUNsYXNzZXNcclxuICAgIGlmKHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbk5hbWUgaW4gdmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICAgICAgdmFyIHRoZVJlbGF0aW9uVHlwZT12YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25OYW1lXVxyXG4gICAgICAgICAgICBpZih0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT1udWxsXHJcbiAgICAgICAgICAgICAgICAgfHwgdGhlUmVsYXRpb25UeXBlLnRhcmdldD09dG9Ob2RlTW9kZWxcclxuICAgICAgICAgICAgICAgICB8fHRvTm9kZUJhc2VDbGFzc2VzW3RoZVJlbGF0aW9uVHlwZS50YXJnZXRdIT1udWxsKSByZS5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zdGFydFRhcmdldE5vZGVNb2RlID0gZnVuY3Rpb24gKG1vZGUpIHtcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIHRydWUgKTtcclxuICAgIHRoaXMuY29yZS5jb250YWluZXIoKS5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJztcclxuICAgIHRoaXMudGFyZ2V0Tm9kZU1vZGU9bW9kZTtcclxuICAgICQoZG9jdW1lbnQpLmtleWRvd24oKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT0gMjcpIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub24oJ2NsaWNrJywgKGUpPT57XHJcbiAgICAgICAgdmFyIGNsaWNrZWROb2RlID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdGhpcy5hZGRDb25uZWN0aW9ucyhjbGlja2VkTm9kZSlcclxuICAgICAgICAvL2RlbGF5IGEgc2hvcnQgd2hpbGUgc28gbm9kZSBzZWxlY3Rpb24gd2lsbCBub3QgYmUgY2hhbmdlZCB0byB0aGUgY2xpY2tlZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCk9Pnt0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKCl9LDUwKVxyXG5cclxuICAgIH0pO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2FuY2VsVGFyZ2V0Tm9kZU1vZGU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMudGFyZ2V0Tm9kZU1vZGU9bnVsbDtcclxuICAgIHRoaXMuY29yZS5jb250YWluZXIoKS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2tleWRvd24nKTtcclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9mZihcImNsaWNrXCIpXHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCBmYWxzZSApO1xyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fZ3JpZD1mdW5jdGlvbihlbGVzKXtcclxuICAgIHZhciBuZXdMYXlvdXQgPSBlbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29zZT1mdW5jdGlvbihlbGVzKXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2Nvc2UnLFxyXG4gICAgICAgIGFuaW1hdGU6IHRydWUsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlXHJcbiAgICAgICAgLGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxuICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29uY2VudHJpYz1mdW5jdGlvbihlbGVzLGJveCl7XHJcbiAgICBpZihlbGVzPT1udWxsKSBlbGVzPXRoaXMuY29yZS5lbGVtZW50cygpXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2NvbmNlbnRyaWMnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBtaW5Ob2RlU3BhY2luZzo2MCxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYm91bmRpbmdCb3g6Ym94XHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubGF5b3V0V2l0aE5vZGVQb3NpdGlvbj1mdW5jdGlvbihub2RlUG9zaXRpb24pe1xyXG4gICAgdmFyIG5ld0xheW91dCA9IHRoaXMuY29yZS5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdwcmVzZXQnLFxyXG4gICAgICAgIHBvc2l0aW9uczogbm9kZVBvc2l0aW9uLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLCAvLyB3aGV0aGVyIHRvIHRyYW5zaXRpb24gdGhlIG5vZGUgcG9zaXRpb25zXHJcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDUwMCwgLy8gZHVyYXRpb24gb2YgYW5pbWF0aW9uIGluIG1zIGlmIGVuYWJsZWRcclxuICAgIH0pXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHRvcG9sb2d5RE9NOyIsImNvbnN0IHNpbXBsZVRyZWU9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVRyZWVcIilcclxuY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBtc2FsSGVscGVyID0gcmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbmV3VHdpbkRpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbmV3VHdpbkRpYWxvZ1wiKTtcclxuXHJcbmZ1bmN0aW9uIHR3aW5zVHJlZShET00sIHNlYXJjaERPTSkge1xyXG4gICAgdGhpcy50cmVlPW5ldyBzaW1wbGVUcmVlKERPTSx7XCJsZWFmTmFtZVByb3BlcnR5XCI6XCJkaXNwbGF5TmFtZVwifSlcclxuXHJcbiAgICB0aGlzLnRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYz0oZ24pPT57XHJcbiAgICAgICAgdmFyIG1vZGVsQ2xhc3M9Z24uaW5mb1tcIkBpZFwiXVxyXG4gICAgICAgIHZhciBkYk1vZGVsSW5mbz1nbG9iYWxDYWNoZS5nZXRTaW5nbGVEQk1vZGVsQnlJRChtb2RlbENsYXNzKVxyXG4gICAgICAgIHZhciBjb2xvckNvZGU9XCJkYXJrR3JheVwiXHJcbiAgICAgICAgdmFyIHNoYXBlPVwiZWxsaXBzZVwiXHJcbiAgICAgICAgdmFyIGF2YXJ0YT1udWxsXHJcbiAgICAgICAgdmFyIGRpbWVuc2lvbj0yMDtcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbENsYXNzXSl7XHJcbiAgICAgICAgICAgIHZhciB2aXN1YWxKc29uID1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbENsYXNzXVxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlPSB2aXN1YWxKc29uLmNvbG9yIHx8IFwiZGFya0dyYXlcIlxyXG4gICAgICAgICAgICB2YXIgc2hhcGU9ICB2aXN1YWxKc29uLnNoYXBlIHx8IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgIHZhciBhdmFydGE9IHZpc3VhbEpzb24uYXZhcnRhIFxyXG4gICAgICAgICAgICBpZih2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKSBkaW1lbnNpb24qPXBhcnNlRmxvYXQodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpY29uRE9NPSQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpcIitkaW1lbnNpb24rXCJweDtoZWlnaHQ6XCIrZGltZW5zaW9uK1wicHg7ZmxvYXQ6bGVmdDtwb3NpdGlvbjpyZWxhdGl2ZTtwYWRkaW5nLXRvcDoycHgnPjwvZGl2PlwiKVxyXG4gICAgICAgIGlmKGRiTW9kZWxJbmZvLmlzSW9URGV2aWNlTW9kZWwpe1xyXG4gICAgICAgICAgICB2YXIgaW90RGl2PSQoXCI8ZGl2IGNsYXNzPSd3My1ib3JkZXInIHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDotNXB4O3BhZGRpbmc6MHB4IDJweDt0b3A6LTdweDtib3JkZXItcmFkaXVzOiAzcHg7Zm9udC1zaXplOjdweCc+SW9UPC9kaXY+XCIpXHJcbiAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGlvdERpdilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpbWdTcmM9ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc2hhcGVTdmcoc2hhcGUsY29sb3JDb2RlKSlcclxuICAgICAgICBpY29uRE9NLmFwcGVuZCgkKFwiPGltZyBzcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LFwiK2ltZ1NyYytcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgIGlmKGF2YXJ0YSl7XHJcbiAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGF2YXJ0YWltZylcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyA9IChnbikgPT4ge1xyXG4gICAgICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4IDhweDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2hlaWdodDoyN3B4OyByaWdodDoxMHB4O3RyYW5zZm9ybTp0cmFuc2xhdGVZKC01MCUpXCI+KzwvYnV0dG9uPicpXHJcbiAgICAgICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICAgICAgbmV3VHdpbkRpYWxvZy5wb3B1cCh7XHJcbiAgICAgICAgICAgICAgICBcIiRtZXRhZGF0YVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCIkbW9kZWxcIjogZ24uaW5mb1tcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiBhZGRCdXR0b247XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXM9KG5vZGVzQXJyLG1vdXNlQ2xpY2tEZXRhaWwpPT57XHJcbiAgICAgICAgdmFyIGluZm9BcnI9W11cclxuICAgICAgICBub2Rlc0Fyci5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT57XHJcbiAgICAgICAgICAgIGluZm9BcnIucHVzaChpdGVtLmxlYWZJbmZvKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOmluZm9BcnIsIFwibW91c2VDbGlja0RldGFpbFwiOm1vdXNlQ2xpY2tEZXRhaWx9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZT0odGhlTm9kZSk9PntcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJQYW5Ub05vZGVcIiwgaW5mbzp0aGVOb2RlLmxlYWZJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNlYXJjaEJveD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiAgcGxhY2Vob2xkZXI9XCJzZWFyY2guLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dFwiKTtcclxuICAgIHRoaXMuc2VhcmNoQm94LmNzcyh7XCJvdXRsaW5lXCI6XCJub25lXCIsXCJoZWlnaHRcIjpcIjEwMCVcIixcIndpZHRoXCI6XCIxMDAlXCJ9KSBcclxuICAgIHNlYXJjaERPTS5hcHBlbmQodGhpcy5zZWFyY2hCb3gpXHJcbiAgICB2YXIgaGlkZU9yU2hvd0VtcHR5R3JvdXA9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoyMHB4O2JvcmRlcjpub25lO3BhZGRpbmctbGVmdDoycHhcIiBjbGFzcz1cInczLWJsb2NrIHczLXRpbnkgdzMtaG92ZXItcmVkIHczLWFtYmVyXCI+SGlkZSBFbXB0eSBNb2RlbHM8L2J1dHRvbj4nKVxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZChoaWRlT3JTaG93RW1wdHlHcm91cClcclxuICAgIERPTS5jc3MoXCJ0b3BcIixcIjUwcHhcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIik9PVwic2hvd1wiKXtcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwiaGlkZVwiKVxyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC50ZXh0KFwiU2hvdyBFbXB0eSBNb2RlbHNcIilcclxuICAgICAgICAgICAgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXA9dHJ1ZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJzaG93XCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJIaWRlIEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpfSlcclxuICAgIH0pXHJcbiAgICB0aGlzLnNlYXJjaEJveC5rZXl1cCgoZSk9PntcclxuICAgICAgICBpZihlLmtleUNvZGUgPT0gMTMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgYU5vZGUgPSB0aGlzLnRyZWUuc2VhcmNoVGV4dCgkKGUudGFyZ2V0KS52YWwoKSlcclxuICAgICAgICAgICAgaWYoYU5vZGUhPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgYU5vZGUucGFyZW50R3JvdXBOb2RlLmV4cGFuZCgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUuc2VsZWN0TGVhZk5vZGUoYU5vZGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUuc2Nyb2xsVG9MZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnNoYXBlU3ZnPWZ1bmN0aW9uKHNoYXBlLGNvbG9yKXtcclxuICAgIGlmKHNoYXBlPT1cImVsbGlwc2VcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48Y2lyY2xlIGN4PVwiNTBcIiBjeT1cIjUwXCIgcj1cIjUwXCIgIGZpbGw9XCInK2NvbG9yKydcIi8+PC9zdmc+J1xyXG4gICAgfWVsc2UgaWYoc2hhcGU9PVwiaGV4YWdvblwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxwb2x5Z29uIHBvaW50cz1cIjUwIDAsIDkzLjMgMjUsIDkzLjMgNzUsIDUwIDEwMCwgNi43IDc1LCA2LjcgMjVcIiAgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfWVsc2UgaWYoc2hhcGU9PVwicm91bmQtcmVjdGFuZ2xlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHJlY3QgeD1cIjEwXCIgeT1cIjEwXCIgcng9XCIxMFwiIHJ5PVwiMTBcIiB3aWR0aD1cIjgwXCIgaGVpZ2h0PVwiODBcIiBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9yZXBsYWNlXCIpIHRoaXMubG9hZFN0YXJ0U2VsZWN0aW9uKG1zZ1BheWxvYWQudHdpbklEcyxtc2dQYXlsb2FkLm1vZGVsSURzLFwicmVwbGFjZVwiKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25fYXBwZW5kXCIpIHRoaXMubG9hZFN0YXJ0U2VsZWN0aW9uKG1zZ1BheWxvYWQudHdpbklEcyxtc2dQYXlsb2FkLm1vZGVsSURzLFwiYXBwZW5kXCIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURUTW9kZWxzQ2hhbmdlXCIpIHRoaXMucmVmcmVzaE1vZGVscygpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luXCIpIHRoaXMuZHJhd09uZVR3aW4obXNnUGF5bG9hZC50d2luSW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5zXCIpIHtcclxuICAgICAgICBtc2dQYXlsb2FkLnR3aW5zSW5mby5mb3JFYWNoKG9uZVR3aW5JbmZvPT57dGhpcy5kcmF3T25lVHdpbihvbmVUd2luSW5mbyl9KVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKCFtc2dQYXlsb2FkLnNyY01vZGVsSUQpeyAvLyBjaGFuZ2UgbW9kZWwgY2xhc3MgdmlzdWFsaXphdGlvblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57Z24ucmVmcmVzaE5hbWUoKX0pXHJcbiAgICAgICAgfSBcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kZWxldGVUd2lucz1mdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgdHdpbklEQXJyLmZvckVhY2godHdpbklEPT57XHJcbiAgICAgICAgdmFyIHR3aW5EaXNwbGF5TmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3R3aW5JRF1cclxuICAgICAgICB0aGlzLnRyZWUuZGVsZXRlTGVhZk5vZGUodHdpbkRpc3BsYXlOYW1lKVxyXG4gICAgfSlcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxzPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgbW9kZWxzRGF0YT17fVxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIG9uZU1vZGVsPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIG1vZGVsc0RhdGFbb25lTW9kZWxbXCJkaXNwbGF5TmFtZVwiXV0gPSBvbmVNb2RlbFxyXG4gICAgfVxyXG4gICAgLy9kZWxldGUgYWxsIGdyb3VwIG5vZGVzIG9mIGRlbGV0ZWQgbW9kZWxzXHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnbm9kZSk9PntcclxuICAgICAgICBpZihtb2RlbHNEYXRhW2dub2RlLm5hbWVdPT1udWxsKXtcclxuICAgICAgICAgICAgLy9kZWxldGUgdGhpcyBncm91cCBub2RlXHJcbiAgICAgICAgICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy90aGVuIGFkZCBhbGwgZ3JvdXAgbm9kZXMgdGhhdCB0byBiZSBhZGRlZFxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbE5hbWVBcnI9W11cclxuICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdub2RlKT0+e2N1cnJlbnRNb2RlbE5hbWVBcnIucHVzaChnbm9kZS5uYW1lKX0pXHJcblxyXG4gICAgdmFyIGFjdHVhbE1vZGVsTmFtZUFycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbW9kZWxzRGF0YSkgYWN0dWFsTW9kZWxOYW1lQXJyLnB1c2goaW5kKVxyXG4gICAgYWN0dWFsTW9kZWxOYW1lQXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcblxyXG4gICAgZm9yKHZhciBpPTA7aTxhY3R1YWxNb2RlbE5hbWVBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgaWYoaTxjdXJyZW50TW9kZWxOYW1lQXJyLmxlbmd0aCAmJiBjdXJyZW50TW9kZWxOYW1lQXJyW2ldPT1hY3R1YWxNb2RlbE5hbWVBcnJbaV0pIGNvbnRpbnVlXHJcbiAgICAgICAgLy9vdGhlcndpc2UgYWRkIHRoaXMgZ3JvdXAgdG8gdGhlIHRyZWVcclxuICAgICAgICB2YXIgbmV3R3JvdXA9dGhpcy50cmVlLmluc2VydEdyb3VwTm9kZShtb2RlbHNEYXRhW2FjdHVhbE1vZGVsTmFtZUFycltpXV0saSlcclxuICAgICAgICBuZXdHcm91cC5zaHJpbmsoKVxyXG4gICAgICAgIGN1cnJlbnRNb2RlbE5hbWVBcnIuc3BsaWNlKGksIDAsIGFjdHVhbE1vZGVsTmFtZUFycltpXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmxvYWRTdGFydFNlbGVjdGlvbj1hc3luYyBmdW5jdGlvbih0d2luSURzLG1vZGVsSURzLHJlcGxhY2VPckFwcGVuZCl7XHJcbiAgICBpZihyZXBsYWNlT3JBcHBlbmQ9PVwicmVwbGFjZVwiKSB0aGlzLnRyZWUuY2xlYXJBbGxMZWFmTm9kZXMoKVxyXG5cclxuICAgIFxyXG4gICAgdGhpcy5yZWZyZXNoTW9kZWxzKClcclxuICAgIFxyXG4gICAgLy9hZGQgbmV3IHR3aW5zIHVuZGVyIHRoZSBtb2RlbCBncm91cCBub2RlXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHR3aW5zZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2xpc3RUd2luc0ZvcklEc1wiLCBcIlBPU1RcIiwgdHdpbklEcylcclxuICAgICAgICB2YXIgdHdpbklEQXJyID0gW11cclxuICAgICAgICAvL2NoZWNrIGlmIGFueSBjdXJyZW50IGxlYWYgbm9kZSBkb2VzIG5vdCBoYXZlIHN0b3JlZCBvdXRib3VuZCByZWxhdGlvbnNoaXAgZGF0YSB5ZXRcclxuICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSkgPT4ge1xyXG4gICAgICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGxlYWZOb2RlID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBub2RlSWQgPSBsZWFmTm9kZS5sZWFmSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW25vZGVJZF0gPT0gbnVsbCkgdHdpbklEQXJyLnB1c2gobm9kZUlkKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlQURUVHdpbnModHdpbnNkYXRhKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHdpbnNkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBncm91cE5hbWUgPSBnbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW3R3aW5zZGF0YVtpXVtcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXV1cclxuICAgICAgICAgICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsIHR3aW5zZGF0YVtpXSwgXCJza2lwUmVwZWF0XCIpXHJcbiAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKHR3aW5zZGF0YVtpXVtcIiRkdElkXCJdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihyZXBsYWNlT3JBcHBlbmQ9PVwicmVwbGFjZVwiKSB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyZXBsYWNlQWxsVHdpbnNcIiwgaW5mbzogdHdpbnNkYXRhIH0pXHJcbiAgICAgICAgZWxzZSB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhcHBlbmRBbGxUd2luc1wiLCBpbmZvOiB0d2luc2RhdGEgfSlcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgdGhpcy5mZXRjaEFsbFJlbGF0aW9uc2hpcHModHdpbklEQXJyKVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPSBmdW5jdGlvbihkYXRhKXtcclxuICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNJbmZvPW9uZVNldFtcInJlbGF0aW9uc2hpcHNcIl1cclxuICAgICAgICByZWxhdGlvbnNJbmZvLmZvckVhY2goKG9uZVJlbGF0aW9uKT0+e1xyXG4gICAgICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3NyY0lEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bdGFyZ2V0SURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICAgIFxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRtcEFycj1bXVxyXG4gICAgZm9yKHZhciB0d2luSUQgaW4gdHdpbnNJbmZvKSB0bXBBcnIucHVzaCh0d2luc0luZm9bdHdpbklEXSlcclxuICAgIHRtcEFyci5mb3JFYWNoKG9uZVR3aW49Pnt0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW4pfSlcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3T25lVHdpbj0gZnVuY3Rpb24odHdpbkluZm8pe1xyXG4gICAgdmFyIGdyb3VwTmFtZT1nbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW3R3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsdHdpbkluZm8sXCJza2lwUmVwZWF0XCIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzPSBhc3luYyBmdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZ2V0UmVsYXRpb25zaGlwc0Zyb21Ud2luSURzXCIsIFwiUE9TVFwiLCBzbWFsbEFycilcclxuICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgY29udGludWU7XHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YSkgLy9zdG9yZSB0aGVtIGluIGdsb2JhbCBhdmFpbGFibGUgYXJyYXlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd0FsbFJlbGF0aW9uc1wiLCBpbmZvOiBkYXRhIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHR3aW5zVHJlZTsiLCJjb25zdCBzaWdudXBzaWduaW5uYW1lPVwiQjJDXzFfc2luZ3Vwc2lnbmluX3NwYWFwcDFcIlxyXG5jb25zdCBiMmNUZW5hbnROYW1lPVwiYXp1cmVpb3RiMmNcIlxyXG5cclxuY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcblxyXG52YXIgc3RyQXJyPXdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiP1wiKVxyXG52YXIgaXNMb2NhbFRlc3Q9KHN0ckFyci5pbmRleE9mKFwidGVzdD0xXCIpIT0tMSlcclxuXHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXtcclxuICAgIFwiYjJjU2lnblVwU2lnbkluTmFtZVwiOiBzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgXCJiMmNTY29wZV90YXNrbWFzdGVyXCI6XCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL3Rhc2ttYXN0ZXJtb2R1bGUvb3BlcmF0aW9uXCIsXHJcbiAgICBcImIyY1Njb3BlX2Z1bmN0aW9uc1wiOlwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS9henVyZWlvdHJvY2tzZnVuY3Rpb25zL2Jhc2ljXCIsXHJcbiAgICBcImxvZ291dFJlZGlyZWN0VXJpXCI6IHVybC5vcmlnaW4rXCIvc3BhaW5kZXguaHRtbFwiLFxyXG4gICAgXCJtc2FsQ29uZmlnXCI6e1xyXG4gICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgY2xpZW50SWQ6IFwiZjQ2OTNiZTUtNjAxYi00ZDBlLTkyMDgtYzM1ZDlhZDYyMzg3XCIsXHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogXCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL1wiK3NpZ251cHNpZ25pbm5hbWUsXHJcbiAgICAgICAgICAgIGtub3duQXV0aG9yaXRpZXM6IFtiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbVwiXSxcclxuICAgICAgICAgICAgcmVkaXJlY3RVcmk6IHdpbmRvdy5sb2NhdGlvbi5ocmVmXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWNoZToge1xyXG4gICAgICAgICAgICBjYWNoZUxvY2F0aW9uOiBcInNlc3Npb25TdG9yYWdlXCIsIFxyXG4gICAgICAgICAgICBzdG9yZUF1dGhTdGF0ZUluQ29va2llOiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3lzdGVtOiB7XHJcbiAgICAgICAgICAgIGxvZ2dlck9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlckNhbGxiYWNrOiAobGV2ZWwsIG1lc3NhZ2UsIGNvbnRhaW5zUGlpKSA9PiB7fVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiaXNMb2NhbFRlc3RcIjppc0xvY2FsVGVzdCxcclxuICAgIFwidGFza01hc3RlckFQSVVSSVwiOigoaXNMb2NhbFRlc3QpP1wiaHR0cDovL2xvY2FsaG9zdDo1MDAyL1wiOlwiaHR0cHM6Ly9henVyZWlvdHJvY2tzdGFza21hc3Rlcm1vZHVsZS5henVyZXdlYnNpdGVzLm5ldC9cIiksXHJcbiAgICBcImZ1bmN0aW9uc0FQSVVSSVwiOlwiaHR0cHM6Ly9henVyZWlvdHJvY2tzZnVuY3Rpb25zLmF6dXJld2Vic2l0ZXMubmV0L2FwaS9cIlxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdsb2JhbEFwcFNldHRpbmdzOyIsImNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXJlcXVpcmUoXCIuL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcblxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOltdICB9KSAvL2dsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3Blc1xyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBY2NvdW50KHJlc3BvbnNlLmFjY291bnQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hY2NvdW50XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlICByZXR1cm4gdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNldEFjY291bnQ9ZnVuY3Rpb24odGhlQWNjb3VudCl7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsKXJldHVybjtcclxuICAgIHRoaXMuYWNjb3VudElkID0gdGhlQWNjb3VudC5ob21lQWNjb3VudElkO1xyXG4gICAgdGhpcy5hY2NvdW50TmFtZSA9IHRoZUFjY291bnQudXNlcm5hbWU7XHJcbiAgICB0aGlzLnVzZXJOYW1lPXRoZUFjY291bnQubmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2lnblVwU2lnbkluTmFtZS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5pc3MudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGgua25vd25BdXRob3JpdGllc1swXS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5hdWQgPT09IGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5jbGllbnRJZFxyXG4gICAgICAgICl7XHJcbiAgICAgICAgICAgIGZvdW5kQWNjb3VudD0gYW5BY2NvdW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc2V0QWNjb3VudChmb3VuZEFjY291bnQpXHJcbiAgICByZXR1cm4gZm91bmRBY2NvdW50O1xyXG59XHJcblxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZT1hc3luYyBmdW5jdGlvbihBUElTdHJpbmcsUkVTVE1ldGhvZCxwYXlsb2FkKXtcclxuICAgIHZhciBoZWFkZXJzT2JqPXt9XHJcbiAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV9mdW5jdGlvbnMpXHJcbiAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLmZ1bmN0aW9uc0FQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5wYXJzZUpXVD1mdW5jdGlvbih0b2tlbil7XHJcbiAgICB2YXIgYmFzZTY0VXJsID0gdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgIHZhciBiYXNlNjQgPSBiYXNlNjRVcmwucmVwbGFjZSgvLS9nLCAnKycpLnJlcGxhY2UoL18vZywgJy8nKTtcclxuICAgIGJhc2U2ND0gQnVmZmVyLmZyb20oYmFzZTY0LCAnYmFzZTY0JykudG9TdHJpbmcoKTtcclxuICAgIHZhciBqc29uUGF5bG9hZCA9IGRlY29kZVVSSUNvbXBvbmVudChiYXNlNjQuc3BsaXQoJycpLm1hcChmdW5jdGlvbihjKSB7XHJcbiAgICAgICAgcmV0dXJuICclJyArICgnMDAnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTIpO1xyXG4gICAgfSkuam9pbignJykpO1xyXG5cclxuICAgIHJldHVybiBKU09OLnBhcnNlKGpzb25QYXlsb2FkKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUucmVsb2FkVXNlckFjY291bnREYXRhPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlcz1hd2FpdCB0aGlzLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9mZXRjaFVzZXJEYXRhXCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuXHJcblxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVVc2VyRGF0YShyZXMpXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmNhbGxBUEk9YXN5bmMgZnVuY3Rpb24oQVBJU3RyaW5nLFJFU1RNZXRob2QscGF5bG9hZCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgaWYoIWdsb2JhbEFwcFNldHRpbmdzLmlzTG9jYWxUZXN0KXtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciB0b2tlbj1hd2FpdCB0aGlzLmdldFRva2VuKGdsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3BlX3Rhc2ttYXN0ZXIpXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICB3aW5kb3cub3BlbihnbG9iYWxBcHBTZXR0aW5ncy5sb2dvdXRSZWRpcmVjdFVyaSxcIl9zZWxmXCIpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGhlYWRlcnNPYmpbXCJBdXRob3JpemF0aW9uXCJdPWBCZWFyZXIgJHt0b2tlbn1gXHJcblxyXG4gICAgICAgIC8vaW4gY2FzZSBqb2luZWQgcHJvamVjdHMgSldUIGlzIGdvaW5nIHRvIGV4cGlyZSwgcmVuZXcgYW5vdGhlciBvbmVcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5qb2luZWRQcm9qZWN0c1Rva2VuKSB7XHJcbiAgICAgICAgICAgIHZhciBleHBUUz10aGlzLnBhcnNlSldUKGdsb2JhbENhY2hlLmpvaW5lZFByb2plY3RzVG9rZW4pLmV4cFxyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWU9cGFyc2VJbnQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcclxuICAgICAgICAgICAgaWYoZXhwVFMtY3VyclRpbWU8MzApeyAvL2ZldGNoIGEgbmV3IHByb2plY3RzIEpXVCB0b2tlbiBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVsb2FkIHVzZXIgYWNjb3VudCBkYXRhXCIpXHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbG9hZFVzZXJBY2NvdW50RGF0YSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vaWYgdGhlIEFQSSBuZWVkIHRvIHVzZSBwcm9qZWN0IElELCBtdXN0IGFkZCBhIGhlYWRlciBcInByb2plY3RzXCIgand0IHRva2VuIHNvIHNlcnZlciBzaWRlIHdpbGwgdmVyaWZ5XHJcbiAgICAgICAgaWYocGF5bG9hZCAmJiBwYXlsb2FkLnByb2plY3RJRCAmJiBnbG9iYWxDYWNoZS5qb2luZWRQcm9qZWN0c1Rva2VuKXtcclxuICAgICAgICAgICAgaGVhZGVyc09ialtcInByb2plY3RzXCJdPWdsb2JhbENhY2hlLmpvaW5lZFByb2plY3RzVG9rZW5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdmFyIGFqYXhDb250ZW50PXtcclxuICAgICAgICAgICAgdHlwZTogUkVTVE1ldGhvZCB8fCAnR0VUJyxcclxuICAgICAgICAgICAgXCJoZWFkZXJzXCI6aGVhZGVyc09iaixcclxuICAgICAgICAgICAgdXJsOiBnbG9iYWxBcHBTZXR0aW5ncy50YXNrTWFzdGVyQVBJVVJJK0FQSVN0cmluZyxcclxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoUkVTVE1ldGhvZD09XCJQT1NUXCIpIGFqYXhDb250ZW50LmRhdGE9IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXHJcbiAgICAgICAgJC5hamF4KGFqYXhDb250ZW50KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmdldFRva2VuPWFzeW5jIGZ1bmN0aW9uKGIyY1Njb3BlKXtcclxuICAgIHRyeXtcclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuPT1udWxsKSB0aGlzLnN0b3JlZFRva2VuPXt9XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0hPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWU9cGFyc2VJbnQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcclxuICAgICAgICAgICAgaWYoY3VyclRpbWUrNjAgPCB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5leHBpcmUpIHJldHVybiB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5hY2Nlc3NUb2tlblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdG9rZW5SZXF1ZXN0PXtcclxuICAgICAgICAgICAgc2NvcGVzOiBbYjJjU2NvcGVdLFxyXG4gICAgICAgICAgICBmb3JjZVJlZnJlc2g6IGZhbHNlLCAvLyBTZXQgdGhpcyB0byBcInRydWVcIiB0byBza2lwIGEgY2FjaGVkIHRva2VuIGFuZCBnbyB0byB0aGUgc2VydmVyIHRvIGdldCBhIG5ldyB0b2tlblxyXG4gICAgICAgICAgICBhY2NvdW50OiB0aGlzLm15TVNBTE9iai5nZXRBY2NvdW50QnlIb21lSWQodGhpcy5hY2NvdW50SWQpXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdClcclxuICAgICAgICBpZiAoIXJlc3BvbnNlLmFjY2Vzc1Rva2VuIHx8IHJlc3BvbnNlLmFjY2Vzc1Rva2VuID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdPXtcImFjY2Vzc1Rva2VuXCI6cmVzcG9uc2UuYWNjZXNzVG9rZW4sXCJleHBpcmVcIjpyZXNwb25zZS5pZFRva2VuQ2xhaW1zLmV4cH1cclxuICAgIH1jYXRjaChlcnJvcil7XHJcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIGludGVyYWN0aW9uIHdoZW4gc2lsZW50IGNhbGwgZmFpbHNcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlPWF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblBvcHVwKHRva2VuUmVxdWVzdClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmFjY2Vzc1Rva2VuO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtc2FsSGVscGVyKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcblxyXG5mdW5jdGlvbiBnbG9iYWxDYWNoZSgpe1xyXG4gICAgdGhpcy5hY2NvdW50SW5mbz1udWxsO1xyXG4gICAgdGhpcy5qb2luZWRQcm9qZWN0c1Rva2VuPW51bGw7XHJcbiAgICAvL1RPRE86IGdvaW5nIHRvIGJlIGNoYW5nYWJsZVxyXG4gICAgdGhpcy5jaGFuZ2VDdXJyZW50UHJvamVjdChcIjFmYWVkZTE4LWM2YTAtNDg0Yi04NDNhLTcxMDViMTY4NTY4ZlwiKVxyXG59XHJcblxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmNoYW5nZUN1cnJlbnRQcm9qZWN0ID0gZnVuY3Rpb24gKG5ld1Byb2plY3RJRCkge1xyXG4gICAgaWYobmV3UHJvamVjdElEPT10aGlzLmN1cnJlbnRQcm9qZWN0SUQpIHJldHVybjtcclxuICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzID0ge31cclxuICAgIHRoaXMuc3RvcmVkVHdpbnMgPSB7fVxyXG4gICAgLy9zdG9yZWQgZGF0YSwgc2VwZXJhdGVseSBmcm9tIEFEVCBzZXJ2aWNlIGFuZCBmcm9tIGNvc21vc0RCIHNlcnZpY2VcclxuICAgIHRoaXMuREJNb2RlbHNBcnIgPSBbXVxyXG4gICAgdGhpcy5tb2RlbElETWFwVG9OYW1lPXt9XHJcbiAgICB0aGlzLm1vZGVsTmFtZU1hcFRvSUQ9e31cclxuXHJcbiAgICB0aGlzLkRCVHdpbnNBcnIgPSBbXVxyXG4gICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lPXt9XHJcblxyXG4gICAgdGhpcy5jdXJyZW50TGF5b3V0TmFtZT1udWxsXHJcbiAgICB0aGlzLmxheW91dEpTT049e31cclxuXHJcbiAgICB0aGlzLnZpc3VhbERlZmluaXRpb249e1wiZGVmYXVsdFwiOnt9fVxyXG4gICAgdGhpcy5jdXJyZW50UHJvamVjdElEPW5ld1Byb2plY3RJRFxyXG59XHJcblxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlQURUVHdpbnM9ZnVuY3Rpb24odHdpbnNEYXRhKXtcclxuICAgIHR3aW5zRGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e3RoaXMuc3RvcmVTaW5nbGVBRFRUd2luKG9uZU5vZGUpfSk7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZUFEVFR3aW49ZnVuY3Rpb24ob25lTm9kZSl7XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zW29uZU5vZGVbXCIkZHRJZFwiXV0gPSBvbmVOb2RlXHJcbiAgICBvbmVOb2RlW1wiZGlzcGxheU5hbWVcIl09IHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvbmVOb2RlW1wiJGR0SWRcIl1dXHJcbn1cclxuXHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVTaW5nbGVEQlR3aW49ZnVuY3Rpb24oREJUd2luKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQlR3aW5zQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvbmVEQlR3aW49dGhpcy5EQlR3aW5zQXJyW2ldXHJcbiAgICAgICAgaWYob25lREJUd2luW1wiaWRcIl09PURCVHdpbltcImlkXCJdKXtcclxuICAgICAgICAgICAgdGhpcy5EQlR3aW5zQXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuREJUd2luc0Fyci5wdXNoKERCVHdpbilcclxuXHJcbiAgICB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbREJUd2luW1wiaWRcIl1dPURCVHdpbltcImRpc3BsYXlOYW1lXCJdXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZURCVHdpbnNBcnI9ZnVuY3Rpb24oREJUd2luc0Fycil7XHJcbiAgICB0aGlzLkRCVHdpbnNBcnIubGVuZ3RoPTBcclxuICAgIHRoaXMuREJUd2luc0Fycj10aGlzLkRCVHdpbnNBcnIuY29uY2F0KERCVHdpbnNBcnIpXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWUpIGRlbGV0ZSB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbaW5kXVxyXG4gICAgdGhpcy5EQlR3aW5zQXJyLmZvckVhY2gob25lREJUd2luPT57XHJcbiAgICAgICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29uZURCVHdpbltcImlkXCJdXT1vbmVEQlR3aW5bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLm1lcmdlREJUd2luc0Fycj1mdW5jdGlvbihEQlR3aW5zQXJyKXtcclxuICAgIHZhciBpZExpc3Q9e31cclxuICAgIHZhciBhcnI9W10uY29uY2F0KERCVHdpbnNBcnIpXHJcbiAgICBhcnIuZm9yRWFjaChhREJUd2luPT57XHJcbiAgICAgICAgaWRMaXN0W2FEQlR3aW4uaWRdPTFcclxuICAgIH0pXHJcbiAgICB0aGlzLkRCVHdpbnNBcnIuZm9yRWFjaChhREJUd2luPT57XHJcbiAgICAgICAgaWYoaWRMaXN0W2FEQlR3aW4uaWRdKSByZXR1cm47XHJcbiAgICAgICAgYXJyLnB1c2goYURCVHdpbilcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5zdG9yZURCVHdpbnNBcnIoYXJyKVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVVc2VyRGF0YT1mdW5jdGlvbihyZXMpe1xyXG4gICAgcmVzLmZvckVhY2gob25lUmVzcG9uc2U9PntcclxuICAgICAgICBpZihvbmVSZXNwb25zZS50eXBlPT1cImpvaW5lZFByb2plY3RzVG9rZW5cIikgdGhpcy5qb2luZWRQcm9qZWN0c1Rva2VuPW9uZVJlc3BvbnNlLmp3dDtcclxuICAgICAgICBlbHNlIGlmKG9uZVJlc3BvbnNlLnR5cGU9PVwidXNlclwiKSB0aGlzLmFjY291bnRJbmZvPW9uZVJlc3BvbnNlXHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVQcm9qZWN0TW9kZWxzRGF0YT1mdW5jdGlvbihEQk1vZGVscyxhZHRNb2RlbHMpe1xyXG4gICAgdGhpcy5zdG9yZURCTW9kZWxzQXJyKERCTW9kZWxzKVxyXG5cclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMubW9kZWxJRE1hcFRvTmFtZSkgZGVsZXRlIHRoaXMubW9kZWxJRE1hcFRvTmFtZVtpbmRdXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLm1vZGVsTmFtZU1hcFRvSUQpIGRlbGV0ZSB0aGlzLm1vZGVsTmFtZU1hcFRvSURbaW5kXVxyXG5cclxuICAgIHZhciB0bXBOYW1lVG9PYmogPSB7fVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhZHRNb2RlbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAoYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0gPT0gbnVsbCkgYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0gPSBhZHRNb2RlbHNbaV1bXCJAaWRcIl1cclxuICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdKSkge1xyXG4gICAgICAgICAgICBpZiAoYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1bXCJlblwiXSkgYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0gPSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdXHJcbiAgICAgICAgICAgIGVsc2UgYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0gPSBKU09OLnN0cmluZ2lmeShhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRtcE5hbWVUb09ialthZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXV0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvL3JlcGVhdGVkIG1vZGVsIGRpc3BsYXkgbmFtZVxyXG4gICAgICAgICAgICBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGFkdE1vZGVsc1tpXVtcIkBpZFwiXVxyXG4gICAgICAgIH1cclxuICAgICAgICB0bXBOYW1lVG9PYmpbYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1dID0gMVxyXG5cclxuICAgICAgICB0aGlzLm1vZGVsSURNYXBUb05hbWVbYWR0TW9kZWxzW2ldW1wiQGlkXCJdXSA9IGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgdGhpcy5tb2RlbE5hbWVNYXBUb0lEW2FkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdXSA9IGFkdE1vZGVsc1tpXVtcIkBpZFwiXVxyXG4gICAgfVxyXG4gICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMoYWR0TW9kZWxzKVxyXG4gICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbn1cclxuXHJcbi8qXHJcbnZhciBkYnR3aW5zPVtdXHJcbiAgICB2YXIgZGJtb2RlbHM9W11cclxuICAgIERCTW9kZWxzLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudC50eXBlPT1cInZpc3VhbFNjaGVtYVwiKSB7XHJcbiAgICAgICAgICAgIC8vVE9ETzogbm93IHRoZXJlIGlzIG9ubHkgb25lIFwiZGVmYXVsdFwiIHNjaGVtYSB0byB1c2VcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltlbGVtZW50Lm5hbWVdPWVsZW1lbnQuZGV0YWlsXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIlRvcG9sb2d5XCIpIHtcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltlbGVtZW50Lm5hbWVdPWVsZW1lbnQuZGV0YWlsXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIkRUTW9kZWxcIikgZGJtb2RlbHMucHVzaChlbGVtZW50KVxyXG4gICAgICAgIGVsc2UgaWYoZWxlbWVudC50eXBlPT1cIkRUVHdpblwiKSBkYnR3aW5zLnB1c2goZWxlbWVudClcclxuICAgIH0pO1xyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVEQlR3aW5zQXJyKGRidHdpbnMpXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZURCTW9kZWxzQXJyKGRibW9kZWxzKVxyXG4qL1xyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmdldERCVHdpbnNCeU1vZGVsSUQ9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgcmVzdWx0QXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJUd2luc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EQlR3aW5zQXJyW2ldXHJcbiAgICAgICAgaWYoZWxlLm1vZGVsSUQ9PW1vZGVsSUQpe1xyXG4gICAgICAgICAgICByZXN1bHRBcnIucHVzaChlbGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdEFycjtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmdldFNpbmdsZURCVHdpbkJ5SUQ9ZnVuY3Rpb24odHdpbklEKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQlR3aW5zQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRCVHdpbnNBcnJbaV1cclxuICAgICAgICBpZihlbGUuaWQ9PXR3aW5JRCl7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmdldFNpbmdsZURCTW9kZWxCeUlEPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCTW9kZWxzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRCTW9kZWxzQXJyW2ldXHJcbiAgICAgICAgaWYoZWxlLmlkPT1tb2RlbElEKXtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVTaW5nbGVEQk1vZGVsPWZ1bmN0aW9uKHNpbmdsZURCTW9kZWxJbmZvKXtcclxuICAgIHZhciBtb2RlbElEID0gc2luZ2xlREJNb2RlbEluZm8uaWRcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQk1vZGVsc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EQk1vZGVsc0FycltpXVxyXG4gICAgICAgIGlmKGVsZS5pZD09bW9kZWxJRCl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIGVsZSkgZGVsZXRlIGVsZVtpbmRdXHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIHNpbmdsZURCTW9kZWxJbmZvKSBlbGVbaW5kXT1zaW5nbGVEQk1vZGVsSW5mb1tpbmRdXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL2l0IGlzIGEgbmV3IHNpbmdsZSBtb2RlbCBpZiBjb2RlIHJlYWNoZXMgaGVyZVxyXG4gICAgdGhpcy5EQk1vZGVsc0Fyci5wdXNoKHNpbmdsZURCTW9kZWxJbmZvKVxyXG4gICAgdGhpcy5zb3J0REJNb2RlbHNBcnIoKVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVEQk1vZGVsc0Fycj1mdW5jdGlvbihEQk1vZGVsc0Fycil7XHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLmxlbmd0aD0wXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyPXRoaXMuREJNb2RlbHNBcnIuY29uY2F0KERCTW9kZWxzQXJyKVxyXG4gICAgdGhpcy5zb3J0REJNb2RlbHNBcnIoKVxyXG4gICAgXHJcbn1cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnNvcnREQk1vZGVsc0Fycj1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5EQk1vZGVsc0Fyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IFxyXG4gICAgICAgIHZhciBhTmFtZT1hLmRpc3BsYXlOYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICB2YXIgYk5hbWU9Yi5kaXNwbGF5TmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgcmV0dXJuIGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpIFxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcz1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciB0d2luSUQ9b25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXVxyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF09W11cclxuICAgIH0pXHJcblxyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0ucHVzaChvbmVSZWxhdGlvbnNoaXApXHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQ9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICBpZighdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0pXHJcbiAgICAgICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dPVtdXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0ucHVzaChvbmVSZWxhdGlvbnNoaXApXHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19yZW1vdmU9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25zaGlwW1wic3JjSURcIl1cclxuICAgICAgICBpZih0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF0pe1xyXG4gICAgICAgICAgICB2YXIgYXJyPXRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXVxyXG4gICAgICAgICAgICBmb3IodmFyIGk9MDtpPGFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgIGlmKGFycltpXVsnJHJlbGF0aW9uc2hpcElkJ109PW9uZVJlbGF0aW9uc2hpcFtcInJlbElEXCJdKXtcclxuICAgICAgICAgICAgICAgICAgICBhcnIuc3BsaWNlKGksMSlcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGdsb2JhbENhY2hlKCk7IiwiLy9UaGlzIGlzIGEgc2luZ2xldG9uIGNsYXNzXHJcblxyXG5mdW5jdGlvbiBtb2RlbEFuYWx5emVyKCl7XHJcbiAgICB0aGlzLkRURExNb2RlbHM9e31cclxuICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXM9e31cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuY2xlYXJBbGxNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIC8vY29uc29sZS5sb2coXCJjbGVhciBhbGwgbW9kZWwgaW5mb1wiKVxyXG4gICAgZm9yKHZhciBpZCBpbiB0aGlzLkRURExNb2RlbHMpIGRlbGV0ZSB0aGlzLkRURExNb2RlbHNbaWRdXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlc2V0QWxsTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIganNvblN0cj10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1KU09OLnBhcnNlKGpzb25TdHIpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl09anNvblN0clxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYWRkTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHZhciBtb2RlbElEPSBlbGVbXCJAaWRcIl1cclxuICAgICAgICBlbGVbXCJvcmlnaW5hbFwiXT1KU09OLnN0cmluZ2lmeShlbGUpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPWVsZVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlY29yZEFsbEJhc2VDbGFzc2VzPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIHBhcmVudE9ialtiYXNlQ2xhc3NJRF09MVxyXG5cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSBwYXJlbnRPYmpbaW5kXSA9IGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXNbaW5kXVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICAgICAgaWYocGFyZW50T2JqW2luZF09PW51bGwpIHBhcmVudE9ialtpbmRdID0gdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpbmRdW2Jhc2VDbGFzc0lEXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHBhcmVudE9iaixkYXRhSW5mbyxlbWJlZGRlZFNjaGVtYSl7XHJcbiAgICBkYXRhSW5mby5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuO1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgfHwoQXJyYXkuaXNBcnJheShvbmVDb250ZW50W1wiQHR5cGVcIl0pICYmIG9uZUNvbnRlbnRbXCJAdHlwZVwiXS5pbmNsdWRlcyhcIlByb3BlcnR5XCIpKVxyXG4gICAgICAgIHx8IG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09bnVsbCkge1xyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcgJiYgZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV0hPW51bGwpIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl09ZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQYXJlbnQ9e31cclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09bmV3UGFyZW50XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhuZXdQYXJlbnQsb25lQ29udGVudFtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgfWVsc2UgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFuYWx5emU9ZnVuY3Rpb24oKXtcclxuICAgIC8vY29uc29sZS5sb2coXCJhbmFseXplIG1vZGVsIGluZm9cIilcclxuICAgIC8vYW5hbHl6ZSBhbGwgcmVsYXRpb25zaGlwIHR5cGVzXHJcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKSBkZWxldGUgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpZF1cclxuICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKSB7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYSA9IHt9XHJcbiAgICAgICAgaWYgKGVsZS5zY2hlbWFzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnIgPSBlbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnIgPSBbZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dID0gZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY29udGVudEFyciA9IGVsZS5jb250ZW50c1xyXG4gICAgICAgIGlmICghY29udGVudEFycikgY29udGludWU7XHJcbiAgICAgICAgY29udGVudEFyci5mb3JFYWNoKChvbmVDb250ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChvbmVDb250ZW50W1wiQHR5cGVcIl0gPT0gXCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dKSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT0ge31cclxuICAgICAgICAgICAgICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdID0gb25lQ29udGVudFxyXG4gICAgICAgICAgICAgICAgb25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMgPSB7fVxyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob25lQ29udGVudC5wcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBvbmVDb250ZW50LnByb3BlcnRpZXMsIGVtYmVkZGVkU2NoZW1hKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2FuYWx5emUgZWFjaCBtb2RlbCdzIHByb3BlcnR5IHRoYXQgY2FuIGJlIGVkaXRlZFxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7IC8vZXhwYW5kIHBvc3NpYmxlIGVtYmVkZGVkIHNjaGVtYSB0byBlZGl0YWJsZVByb3BlcnRpZXMsIGFsc28gZXh0cmFjdCBwb3NzaWJsZSByZWxhdGlvbnNoaXAgdHlwZXMgZm9yIHRoaXMgbW9kZWxcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYT17fVxyXG4gICAgICAgIGlmKGVsZS5zY2hlbWFzKXtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyPWVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFycj1bZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXT1lbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllcz17fVxyXG4gICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHM9e31cclxuICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzPVtdXHJcbiAgICAgICAgZWxlLmFsbEJhc2VDbGFzc2VzPXt9XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlbGUuY29udGVudHMsZW1iZWRkZWRTY2hlbWEpXHJcblxyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHNbb25lQ29udGVudFtcIm5hbWVcIl1dPXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGNvbXBvbmVudCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaChvbmVDb250ZW50PT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiQ29tcG9uZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnROYW1lPW9uZUNvbnRlbnRbXCJuYW1lXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudENsYXNzPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV0sY29tcG9uZW50Q2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudE5hbWUpXHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBiYXNlIGNsYXNzIHByb3BlcnRpZXMgdG8gZWRpdGFibGVQcm9wZXJ0aWVzIGFuZCB2YWxpZCByZWxhdGlvbnNoaXAgdHlwZXMgdG8gdmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgYmFzZUNsYXNzSURzPWVsZS5leHRlbmRzO1xyXG4gICAgICAgIGlmKGJhc2VDbGFzc0lEcz09bnVsbCkgY29udGludWU7XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShiYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWJhc2VDbGFzc0lEc1xyXG4gICAgICAgIGVsc2UgdG1wQXJyPVtiYXNlQ2xhc3NJRHNdXHJcbiAgICAgICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKGVsZS5hbGxCYXNlQ2xhc3NlcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MoZWxlLnZhbGlkUmVsYXRpb25zaGlwcyxlYWNoQmFzZSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vY29uc29sZS5sb2codGhpcy5EVERMTW9kZWxzKVxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxBbmFseXplcigpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxFZGl0b3JEaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMFwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjY1cHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gTW9kZWwgRWRpdG9yPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBidXR0b25Sb3c9JCgnPGRpdiAgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoYnV0dG9uUm93KVxyXG4gICAgdmFyIGltcG9ydEJ1dHRvbiA9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuIHczLXJpZ2h0XCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGltcG9ydEJ1dHRvbilcclxuXHJcbiAgICBpbXBvcnRCdXR0b24ub24oXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdmFyIG1vZGVsVG9CZUltcG9ydGVkID0gW3RoaXMuZHRkbG9ial1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHsgXCJtb2RlbHNcIjogSlNPTi5zdHJpbmdpZnkobW9kZWxUb0JlSW1wb3J0ZWQpIH0pXHJcblxyXG4gICAgICAgICAgICBhbGVydChcIk1vZGVsIFxcXCJcIiArIHRoaXMuZHRkbG9ialtcImRpc3BsYXlOYW1lXCJdICsgXCJcXFwiIGlzIGNyZWF0ZWQhXCIpXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsRWRpdGVkXCIgfSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMobW9kZWxUb0JlSW1wb3J0ZWQpIC8vYWRkIHNvIGltbWVkaWF0bGV5IHRoZSBsaXN0IGNhbiBzaG93IHRoZSBuZXcgbW9kZWxzXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAoKSAvL3JlZnJlc2ggY29udGVudFxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH0gICAgICAgIFxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O2ZvbnQtc2l6ZToxLjJlbTtcIj5Nb2RlbCBUZW1wbGF0ZTwvZGl2PicpXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGxhYmxlKVxyXG4gICAgdmFyIG1vZGVsVGVtcGxhdGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMS4yZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDB9KVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChtb2RlbFRlbXBsYXRlU2VsZWN0b3IuRE9NKVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgdGhpcy5jaG9vc2VUZW1wbGF0ZShvcHRpb25WYWx1ZSlcclxuICAgIH1cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24oXCJOZXcgTW9kZWwuLi5cIixcIk5ld1wiKVxyXG4gICAgZm9yKHZhciBtb2RlbE5hbWUgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKXtcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKG1vZGVsTmFtZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcGFuZWxIZWlnaHQ9XCI0NTBweFwiXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIiBzdHlsZT1cIm1hcmdpbjoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwYWRkaW5nOjVweDt3aWR0aDozMzBweDtwYWRkaW5nLXJpZ2h0OjVweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICB0aGlzLmxlZnRTcGFuPWxlZnRTcGFuXHJcblxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBkdGRsU2NyaXB0UGFuZWw9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwib3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweDt3aWR0aDozMTBweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnXCI+PC9kaXY+JylcclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQoZHRkbFNjcmlwdFBhbmVsKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWw9ZHRkbFNjcmlwdFBhbmVsXHJcblxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUuY2hvb3NlVGVtcGxhdGU9ZnVuY3Rpb24odGVtcGFsdGVOYW1lKXtcclxuICAgIGlmKHRlbXBhbHRlTmFtZSE9XCJOZXdcIil7XHJcbiAgICAgICAgdGhpcy5kdGRsb2JqPUpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RlbXBhbHRlTmFtZV1bXCJvcmlnaW5hbFwiXSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaiA9IHtcclxuICAgICAgICAgICAgXCJAaWRcIjogXCJkdG1pOmFOYW1lU3BhY2U6YU1vZGVsSUQ7MVwiLFxyXG4gICAgICAgICAgICBcIkBjb250ZXh0XCI6IFtcImR0bWk6ZHRkbDpjb250ZXh0OzJcIl0sXHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJJbnRlcmZhY2VcIixcclxuICAgICAgICAgICAgXCJkaXNwbGF5TmFtZVwiOiBcIk5ldyBNb2RlbFwiLFxyXG4gICAgICAgICAgICBcImNvbnRlbnRzXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJhdHRyaWJ1dGUxXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgICAgICAgICAgfSx7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImxpbmtcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5yZWZyZXNoRFRETCgpXHJcbiAgICB0aGlzLmxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPk1vZGVsIElEICYgTmFtZTxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQtd2VpZ2h0Om5vcm1hbDt0b3A6LTEwcHg7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5tb2RlbCBJRCBjb250YWlucyBuYW1lc3BhY2UsIGEgbW9kZWwgc3RyaW5nIGFuZCBhIHZlcnNpb24gbnVtYmVyPC9wPjwvZGl2PjwvZGl2PicpKVxyXG4gICAgbmV3IGlkUm93KHRoaXMuZHRkbG9iaix0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuICAgIG5ldyBkaXNwbGF5TmFtZVJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdKXRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdPVtdXHJcbiAgICBuZXcgcGFyYW1ldGVyc1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSx0aGlzLkRPTS5vZmZzZXQoKSlcclxuICAgIG5ldyByZWxhdGlvbnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgY29tcG9uZW50c1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuXHJcbiAgICBpZighdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXSl0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdPVtdXHJcbiAgICBuZXcgYmFzZUNsYXNzZXNSb3codGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnJlZnJlc2hEVERMPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5lbXB0eSgpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDoyMHB4O3dpZHRoOjEwMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtZ3JheVwiPkdlbmVyYXRlZCBEVERMPC9kaXY+JykpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPHByZSBzdHlsZT1cImNvbG9yOmdyYXlcIj4nK0pTT04uc3RyaW5naWZ5KHRoaXMuZHRkbG9iaixudWxsLDIpKyc8L3ByZT4nKSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxFZGl0b3JEaWFsb2coKTtcclxuXHJcblxyXG5mdW5jdGlvbiBiYXNlQ2xhc3Nlc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5CYXNlIENsYXNzZXM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+QmFzZSBjbGFzcyBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhbmQgcmVsYXRpb25zaGlwIHR5cGUgYXJlIGluaGVyaXRlZDwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0gXCJ1bmtub3duXCJcclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQmFzZWNsYXNzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGJhc2VDbGFzc05hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoyMjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImJhc2UgbW9kZWwgaWRcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChiYXNlQ2xhc3NOYW1lSW5wdXQscmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQudmFsKGR0ZGxPYmopXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqW2ldPWJhc2VDbGFzc05hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXBvbmVudHNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+Q29tcG9uZW50czxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5Db21wb25lbnQgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYXJlIGVtYmVkZGVkIHVuZGVyIGEgbmFtZTwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJTb21lQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6XCJkdG1pOnNvbWVDb21wb25lbnRNb2RlbDsxXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJDb21wb25lbnRcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQ29tcG9uZW50Um93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGNvbXBvbmVudE5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHNjaGVtYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG1vZGVsIGlkLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoY29tcG9uZW50TmFtZUlucHV0LHNjaGVtYUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBzY2hlbWFJbnB1dC52YWwoZHRkbE9ialtcInNjaGVtYVwiXXx8XCJcIilcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPWNvbXBvbmVudE5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgc2NoZW1hSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl09c2NoZW1hSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsYXRpb25zUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlJlbGF0aW9uc2hpcCBUeXBlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5SZWxhdGlvbnNoaXAgY2FuIGhhdmUgaXRzIG93biBwYXJhbWV0ZXJzPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJyZWxhdGlvbjFcIixcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUmVsYXRpb25UeXBlUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciByZWxhdGlvbk5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo5MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicmVsYXRpb24gbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB0YXJnZXRNb2RlbElEPSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiKG9wdGlvbmFsKXRhcmdldCBtb2RlbFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQocmVsYXRpb25OYW1lSW5wdXQsdGFyZ2V0TW9kZWxJRCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHRhcmdldE1vZGVsSUQudmFsKGR0ZGxPYmpbXCJ0YXJnZXRcIl18fFwiXCIpXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInByb3BlcnRpZXNcIl0pIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1yZWxhdGlvbk5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgdGFyZ2V0TW9kZWxJRC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgaWYodGFyZ2V0TW9kZWxJRC52YWwoKT09XCJcIikgZGVsZXRlIGR0ZGxPYmpbXCJ0YXJnZXRcIl1cclxuICAgICAgICBlbHNlIGR0ZGxPYmpbXCJ0YXJnZXRcIl09dGFyZ2V0TW9kZWxJRC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYoZHRkbE9ialtcInByb3BlcnRpZXNcIl0gJiYgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzPWR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdXHJcbiAgICAgICAgcHJvcGVydGllcy5mb3JFYWNoKG9uZVByb3BlcnR5PT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lUHJvcGVydHksY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyYW1ldGVyc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UGFyYW1ldGVyczwvZGl2PjwvZGl2PicpXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlByb3BlcnR5XCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLFwidG9wTGV2ZWxcIixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUGFyYW1ldGVyUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLHRvcExldmVsLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBwYXJhbWV0ZXJOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJwYXJhbWV0ZXIgbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBlbnVtVmFsdWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInN0cjEsc3RyMiwuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1wbHVzIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHB0eXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5IHczLWJhci1pdGVtXCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjRweCA1cHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwLFwiaXNDbGlja2FibGVcIjoxLFwib3B0aW9uTGlzdE1hcmdpblRvcFwiOi0xNTAsXCJvcHRpb25MaXN0TWFyZ2luTGVmdFwiOjYwLFxyXG4gICAgXCJhZGp1c3RQb3NpdGlvbkFuY2hvclwiOmRpYWxvZ09mZnNldH0pXHJcbiAgICBwdHlwZVNlbGVjdG9yLmFkZE9wdGlvbkFycihbXCJFbnVtXCIsXCJPYmplY3RcIixcImJvb2xlYW5cIixcImRhdGVcIixcImRhdGVUaW1lXCIsXCJkb3VibGVcIixcImR1cmF0aW9uXCIsXCJmbG9hdFwiLFwiaW50ZWdlclwiLFwibG9uZ1wiLFwic3RyaW5nXCIsXCJ0aW1lXCJdKVxyXG4gICAgRE9NLmFwcGVuZChwYXJhbWV0ZXJOYW1lSW5wdXQscHR5cGVTZWxlY3Rvci5ET00sZW51bVZhbHVlSW5wdXQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHB0eXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgcHR5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgY29udGVudERPTS5lbXB0eSgpLy9jbGVhciBhbGwgY29udGVudCBkb20gY29udGVudFxyXG4gICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKXtcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gZHRkbE9iaikgZGVsZXRlIGR0ZGxPYmpbaW5kXSAgICAvL2NsZWFyIGFsbCBvYmplY3QgY29udGVudFxyXG4gICAgICAgICAgICBpZih0b3BMZXZlbCkgZHRkbE9ialtcIkB0eXBlXCJdPVwiUHJvcGVydHlcIlxyXG4gICAgICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGlmKG9wdGlvblRleHQ9PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnNob3coKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIkVudW1cIixcInZhbHVlU2NoZW1hXCI6IFwic3RyaW5nXCJ9XHJcbiAgICAgICAgfWVsc2UgaWYob3B0aW9uVGV4dD09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLnNob3coKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIk9iamVjdFwifVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSkgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGVudW1WYWx1ZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICB2YXIgdmFsdWVBcnI9ZW51bVZhbHVlSW5wdXQudmFsKCkuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl09W11cclxuICAgICAgICB2YWx1ZUFyci5mb3JFYWNoKGFWYWw9PntcclxuICAgICAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl0ucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogYVZhbC5yZXBsYWNlKFwiIFwiLFwiXCIpLCAvL3JlbW92ZSBhbGwgdGhlIHNwYWNlIGluIG5hbWVcclxuICAgICAgICAgICAgICAgIFwiZW51bVZhbHVlXCI6IGFWYWxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBpZih0eXBlb2YoZHRkbE9ialtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcpIHZhciBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVxyXG4gICAgZWxzZSBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVtcIkB0eXBlXCJdXHJcbiAgICBwdHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShzY2hlbWEpXHJcbiAgICBpZihzY2hlbWE9PVwiRW51bVwiKXtcclxuICAgICAgICB2YXIgZW51bUFycj1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgIGlmKGVudW1BcnIhPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgaW5wdXRTdHI9XCJcIlxyXG4gICAgICAgICAgICBlbnVtQXJyLmZvckVhY2gob25lRW51bVZhbHVlPT57aW5wdXRTdHIrPW9uZUVudW1WYWx1ZS5lbnVtVmFsdWUrXCIsXCJ9KVxyXG4gICAgICAgICAgICBpbnB1dFN0cj1pbnB1dFN0ci5zbGljZSgwLCAtMSkvL3JlbW92ZSB0aGUgbGFzdCBcIixcIlxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoaW5wdXRTdHIpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYoc2NoZW1hPT1cIk9iamVjdFwiKXtcclxuICAgICAgICB2YXIgZmllbGRzPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl1cclxuICAgICAgICBmaWVsZHMuZm9yRWFjaChvbmVGaWVsZD0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZUZpZWxkLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGlkUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+ZHRtaTo8L2Rpdj4nKVxyXG4gICAgdmFyIGRvbWFpbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjgwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJOYW1lc3BhY2VcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgbW9kZWxJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB2ZXJzaW9uSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6NjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInZlcnNpb25cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxkb21haW5JbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj46PC9kaXY+JyksbW9kZWxJRElucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjs8L2Rpdj4nKSx2ZXJzaW9uSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICB2YXIgc3RyPWBkdG1pOiR7ZG9tYWluSW5wdXQudmFsKCl9OiR7bW9kZWxJRElucHV0LnZhbCgpfTske3ZlcnNpb25JbnB1dC52YWwoKX1gXHJcbiAgICAgICAgZHRkbE9ialtcIkBpZFwiXT1zdHJcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgZG9tYWluSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIG1vZGVsSURJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmVyc2lvbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcblxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiQGlkXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKXtcclxuICAgICAgICB2YXIgYXJyMT1zdHIuc3BsaXQoXCI7XCIpXHJcbiAgICAgICAgaWYoYXJyMS5sZW5ndGghPTIpIHJldHVybjtcclxuICAgICAgICB2ZXJzaW9uSW5wdXQudmFsKGFycjFbMV0pXHJcbiAgICAgICAgdmFyIGFycjI9YXJyMVswXS5zcGxpdChcIjpcIilcclxuICAgICAgICBkb21haW5JbnB1dC52YWwoYXJyMlsxXSlcclxuICAgICAgICBhcnIyLnNoaWZ0KCk7IGFycjIuc2hpZnQoKVxyXG4gICAgICAgIG1vZGVsSURJbnB1dC52YWwoYXJyMi5qb2luKFwiOlwiKSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGxheU5hbWVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5EaXNwbGF5IE5hbWU6PC9kaXY+JylcclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTUwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsbmFtZUlucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICBkdGRsT2JqW1wiZGlzcGxheU5hbWVcIl09bmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIG5hbWVJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpIG5hbWVJbnB1dC52YWwoc3RyKVxyXG59IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVRyZWU9IHJlcXVpcmUoXCIuL3NpbXBsZVRyZWVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsTWFuYWdlckRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxuICAgIHRoaXMuc2hvd1JlbGF0aW9uVmlzdWFsaXphdGlvblNldHRpbmdzPXRydWU7XHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2NTBweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBNb2RlbHM8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIGltcG9ydE1vZGVsc0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydE1vZGVsc0J0biA9JCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cIm1vZGVsRmlsZXNcIiBtdWx0aXBsZT1cIm11bHRpcGxlXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgbW9kZWxFZGl0b3JCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+Q3JlYXRlIE1vZGVsPC9idXR0b24+JylcclxuICAgIHZhciBleHBvcnRNb2RlbEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5FeHBvcnQgQWxsIE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChpbXBvcnRNb2RlbHNCdG4sYWN0dWFsSW1wb3J0TW9kZWxzQnRuLCBtb2RlbEVkaXRvckJ0bixleHBvcnRNb2RlbEJ0bilcclxuICAgIGltcG9ydE1vZGVsc0J0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRNb2RlbEZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG4gICAgbW9kZWxFZGl0b3JCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgbW9kZWxFZGl0b3JEaWFsb2cucG9wdXAoKVxyXG4gICAgfSlcclxuICAgIGV4cG9ydE1vZGVsQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHZhciBtb2RlbEFycj1bXVxyXG4gICAgICAgIGZvcih2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIG1vZGVsQXJyLnB1c2goSlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXSkpXHJcbiAgICAgICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICAgICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShtb2RlbEFycikpKTtcclxuICAgICAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydE1vZGVscy5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsXCIgc3R5bGU9XCJ3aWR0aDoyNDBweDtwYWRkaW5nLXJpZ2h0OjVweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIGxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjMwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cIlwiPk1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgXHJcbiAgICB2YXIgbW9kZWxMaXN0ID0gJCgnPHVsIGNsYXNzPVwidzMtdWwgdzMtaG92ZXJhYmxlXCI+JylcclxuICAgIG1vZGVsTGlzdC5jc3Moe1wib3ZlcmZsb3cteFwiOlwiaGlkZGVuXCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJoZWlnaHRcIjpcIjQyMHB4XCIsIFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRncmF5XCJ9KVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKG1vZGVsTGlzdClcclxuICAgIHRoaXMubW9kZWxMaXN0ID0gbW9kZWxMaXN0O1xyXG4gICAgXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiIHN0eWxlPVwicGFkZGluZzowcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBwYW5lbENhcmRPdXQ9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwiaGVpZ2h0OjM1cHhcIj48L2Rpdj4nKVxyXG4gICAgcGFuZWxDYXJkT3V0LmFwcGVuZCh0aGlzLm1vZGVsQnV0dG9uQmFyKVxyXG5cclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQocGFuZWxDYXJkT3V0KVxyXG4gICAgdmFyIHBhbmVsQ2FyZD0kKCc8ZGl2IHN0eWxlPVwid2lkdGg6NDEwcHg7aGVpZ2h0OjQxMnB4O292ZXJmbG93OmF1dG87bWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgcGFuZWxDYXJkT3V0LmFwcGVuZChwYW5lbENhcmQpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZD1wYW5lbENhcmQ7XHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcbiAgICBwYW5lbENhcmQuaHRtbChcIjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy1sZWZ0OjVweCc+Q2hvb3NlIGEgbW9kZWwgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT5cIilcclxuXHJcbiAgICB0aGlzLmxpc3RNb2RlbHMoKVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlc2l6ZUltZ0ZpbGUgPSBhc3luYyBmdW5jdGlvbih0aGVGaWxlLG1heF9zaXplKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICB2YXIgdG1wSW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0bXBJbWcub25sb2FkID0gICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IHRtcEltZy53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSB0bXBJbWcuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IGhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPiBtYXhfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICo9IG1heF9zaXplIC8gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IG1heF9zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCAqPSBtYXhfc2l6ZSAvIGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IG1heF9zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKHRtcEltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGFVcmwgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGFVcmwpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gcmVhZGVyLnJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCh0aGVGaWxlKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJpZ2h0U3Bhbj1hc3luYyBmdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuZW1wdHkoKVxyXG5cclxuICAgIHZhciBkZWxCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwibWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+RGVsZXRlIE1vZGVsPC9idXR0b24+JylcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuYXBwZW5kKGRlbEJ0bilcclxuXHJcblxyXG4gICAgdmFyIGltcG9ydFBpY0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5VcGxvYWQgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRQaWNCdG4gPSAkKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwiaW1nXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgY2xlYXJBdmFydGFCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5DbGVhciBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5hcHBlbmQoaW1wb3J0UGljQnRuLCBhY3R1YWxJbXBvcnRQaWNCdG4sIGNsZWFyQXZhcnRhQnRuKVxyXG4gICAgaW1wb3J0UGljQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIGFjdHVhbEltcG9ydFBpY0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYWN0dWFsSW1wb3J0UGljQnRuLmNoYW5nZShhc3luYyAoZXZ0KSA9PiB7XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgdmFyIHRoZUZpbGUgPSBmaWxlc1swXVxyXG5cclxuICAgICAgICBpZiAodGhlRmlsZS50eXBlID09IFwiaW1hZ2Uvc3ZnK3htbFwiKSB7XHJcbiAgICAgICAgICAgIHZhciBzdHIgPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKHRoZUZpbGUpXHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LCcgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRoZUZpbGUudHlwZS5tYXRjaCgnaW1hZ2UuKicpKSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsID0gYXdhaXQgdGhpcy5yZXNpemVJbWdGaWxlKHRoZUZpbGUsIDcwKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coeyB3aWR0aDogXCIyMDBweFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiTm90ZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBpbXBvcnQgaW1hZ2UgZmlsZSAocG5nLGpwZyxzdmcgYW5kIHNvIG9uKVwiXHJcbiAgICAgICAgICAgICAgICAgICAgLCBidXR0b25zOiBbeyBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJPa1wiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7IGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKSB9IH1dXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhcnRhSW1nKSB0aGlzLmF2YXJ0YUltZy5hdHRyKFwic3JjXCIsIGRhdGFVcmwpXHJcblxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgICAgICBpZiAoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF0gPSB7fVxyXG4gICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhID0gZGF0YVVybFxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6IG1vZGVsSUQsIFwiYXZhcnRhXCI6IGRhdGFVcmwgfSlcclxuICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuXHJcbiAgICBjbGVhckF2YXJ0YUJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF0pIGRlbGV0ZSB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YVxyXG4gICAgICAgIGlmICh0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcucmVtb3ZlQXR0cignc3JjJyk7XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjogbW9kZWxJRCwgXCJub0F2YXJ0YVwiOiB0cnVlIH0pXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcbiAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgICAgIC8vY2hlY2sgaG93IG1hbnkgdHdpbnMgYXJlIHVuZGVyIHRoaXMgbW9kZWwgSURcclxuICAgICAgICB2YXIgbnVtYmVyT2ZUd2lucz0wXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuREJUd2luc0Fyci5mb3JFYWNoKG9uZURCVHdpbj0+e1xyXG4gICAgICAgICAgICBpZihvbmVEQlR3aW5bXCJtb2RlbElEXCJdPT1tb2RlbElEKSBudW1iZXJPZlR3aW5zKytcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB2YXIgY29udGVudFN0cj1cIlRoaXMgd2lsbCBERUxFVEUgbW9kZWwgXFxcIlwiICsgbW9kZWxJRCArIFwiXFxcIi4gXCJcclxuICAgICAgICBjb250ZW50U3RyKz1cIihUaGVyZSBcIisoKG51bWJlck9mVHdpbnM+MSk/KFwiYXJlIFwiK251bWJlck9mVHdpbnMrXCIgdHdpbnNcIik6KFwiaXMgXCIrbnVtYmVyT2ZUd2lucytcIiB0d2luXCIpICkgKyBcIiBvZiB0aGlzIG1vZGVsLlwiXHJcbiAgICAgICAgaWYobnVtYmVyT2ZUd2lucz4wKSBjb250ZW50U3RyKz1cIiBZb3UgbWF5IHN0aWxsIGRlbGV0ZSB0aGUgbW9kZWwsIGJ1dCBwbGVhc2UgaW1wb3J0IGEgbW9kZWwgd2l0aCB0aGlzIG1vZGVsSUQgdG8gZW5zdXJlIG5vcm1hbCBvcGVyYXRpb24pXCJcclxuICAgICAgICBlbHNlIGNvbnRlbnRTdHIrPVwiKVwiXHJcbiAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiV2FybmluZ1wiXHJcbiAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IGNvbnRlbnRTdHJcclxuICAgICAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZU1vZGVsXCIsIFwiUE9TVFwiLCB7IFwibW9kZWxcIjogbW9kZWxJRCB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyZWUuZGVsZXRlTGVhZk5vZGUoZ2xvYmFsQ2FjaGUubW9kZWxJRE1hcFRvTmFtZVttb2RlbElEXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIn0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vVE9ETzogY2xlYXIgdGhlIHZpc3VhbGl6YXRpb24gc2V0dGluZyBvZiB0aGlzIGRlbGV0ZWQgbW9kZWxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbElEXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1bbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIFxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIFZpc3VhbGl6YXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiVmlzdWFsaXphdGlvblwiKVxyXG4gICAgdmFyIGVkaXRhYmxlUHJvcGVydGllc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJFZGl0YWJsZSBQcm9wZXJ0aWVzIEFuZCBSZWxhdGlvbnNoaXBzXCIpXHJcbiAgICB2YXIgYmFzZUNsYXNzZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiQmFzZSBDbGFzc2VzXCIpXHJcbiAgICB2YXIgb3JpZ2luYWxEZWZpbml0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIk9yaWdpbmFsIERlZmluaXRpb25cIilcclxuXHJcbiAgICB2YXIgc3RyPUpTT04uc3RyaW5naWZ5KEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pLG51bGwsMilcclxuICAgIG9yaWdpbmFsRGVmaW5pdGlvbkRPTS5hcHBlbmQoJCgnPHByZSBpZD1cImpzb25cIj4nK3N0cisnPC9wcmU+JykpXHJcblxyXG4gICAgdmFyIGVkaXR0YWJsZVByb3BlcnRpZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmVkaXRhYmxlUHJvcGVydGllc1xyXG4gICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGVkaXR0YWJsZVByb3BlcnRpZXMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB0aGlzLmZpbGxSZWxhdGlvbnNoaXBJbmZvKHZhbGlkUmVsYXRpb25zaGlwcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcblxyXG4gICAgdGhpcy5maWxsVmlzdWFsaXphdGlvbihtb2RlbElELFZpc3VhbGl6YXRpb25ET00pXHJcblxyXG4gICAgdGhpcy5maWxsQmFzZUNsYXNzZXMobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmFsbEJhc2VDbGFzc2VzLGJhc2VDbGFzc2VzRE9NKSBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxUcmVlTGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzLmxlbmd0aD4wKSB0aGlzLnRyZWUuc2VsZWN0ZWROb2Rlc1swXS5yZWRyYXdMYWJlbCgpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEJhc2VDbGFzc2VzPWZ1bmN0aW9uKGJhc2VDbGFzc2VzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBiYXNlQ2xhc3Nlcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jaztwYWRkaW5nOi4xZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFZpc3VhbGl6YXRpb249ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20pe1xyXG4gICAgdmFyIG1vZGVsSnNvbj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF07XHJcbiAgICB2YXIgYVRhYmxlPSQoXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPjwvdGFibGU+XCIpXHJcbiAgICBhVGFibGUuaHRtbCgnPHRyPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgIHBhcmVudERvbS5hcHBlbmQoYVRhYmxlKSBcclxuXHJcbiAgICB2YXIgbGVmdFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpmaXJzdFwiKVxyXG4gICAgdmFyIHJpZ2h0UGFydD1hVGFibGUuZmluZChcInRkOm50aC1jaGlsZCgyKVwiKVxyXG4gICAgcmlnaHRQYXJ0LmNzcyh7XCJ3aWR0aFwiOlwiNTBweFwiLFwiaGVpZ2h0XCI6XCI1MHB4XCIsXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodEdyYXlcIn0pXHJcbiAgICBcclxuICAgIHZhciBhdmFydGFJbWc9JChcIjxpbWcgc3R5bGU9J2hlaWdodDo0NXB4Jz48L2ltZz5cIilcclxuICAgIHJpZ2h0UGFydC5hcHBlbmQoYXZhcnRhSW1nKVxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgIGlmKHZpc3VhbEpzb24gJiYgdmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSkgYXZhcnRhSW1nLmF0dHIoJ3NyYycsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICB0aGlzLmF2YXJ0YUltZz1hdmFydGFJbWc7XHJcbiAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydClcclxuXHJcbiAgICBpZih0aGlzLnNob3dSZWxhdGlvblZpc3VhbGl6YXRpb25TZXR0aW5ncyl7XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gbW9kZWxKc29uLnZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0LGluZClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5hZGRPbmVWaXN1YWxpemF0aW9uUm93PWZ1bmN0aW9uKG1vZGVsSUQscGFyZW50RG9tLHJlbGF0aW5zaGlwTmFtZSl7XHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpIHZhciBuYW1lU3RyPVwi4pevXCIgLy92aXN1YWwgZm9yIG5vZGVcclxuICAgIGVsc2UgbmFtZVN0cj1cIuKfnCBcIityZWxhdGluc2hpcE5hbWVcclxuICAgIHZhciBjb250YWluZXJEaXY9JChcIjxkaXYgc3R5bGU9J3BhZGRpbmctYm90dG9tOjhweCc+PC9kaXY+XCIpXHJcbiAgICBwYXJlbnREb20uYXBwZW5kKGNvbnRhaW5lckRpdilcclxuICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J21hcmdpbi1yaWdodDoxMHB4Jz5cIituYW1lU3RyK1wiPC9sYWJlbD5cIilcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICB2YXIgZGVmaW5lZENvbG9yPW51bGxcclxuICAgIHZhciBkZWZpbmVkU2hhcGU9bnVsbFxyXG4gICAgdmFyIGRlZmluZWREaW1lbnNpb25SYXRpbz1udWxsXHJcbiAgICB2YXIgZGVmaW5lZEVkZ2VXaWR0aD1udWxsXHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIGRlZmluZWRDb2xvcj12aXN1YWxKc29uW21vZGVsSURdLmNvbG9yXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKSBkZWZpbmVkU2hhcGU9dmlzdWFsSnNvblttb2RlbElEXS5zaGFwZVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbykgZGVmaW5lZERpbWVuc2lvblJhdGlvPXZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW9cclxuICAgIH1lbHNle1xyXG4gICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdICYmIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHtcclxuICAgICAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3IpIGRlZmluZWRDb2xvciA9IHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3JcclxuICAgICAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGUpIGRlZmluZWRTaGFwZSA9IHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGVcclxuICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGgpIGRlZmluZWRFZGdlV2lkdGg9dmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGhcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNvbG9yU2VsZWN0b3I9JCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lO3dpZHRoOjc1cHhcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChjb2xvclNlbGVjdG9yKVxyXG4gICAgdmFyIGNvbG9yQXJyPVtcImRhcmtHcmF5XCIsXCJCbGFja1wiLFwiTGlnaHRHcmF5XCIsXCJSZWRcIixcIkdyZWVuXCIsXCJCbHVlXCIsXCJCaXNxdWVcIixcIkJyb3duXCIsXCJDb3JhbFwiLFwiQ3JpbXNvblwiLFwiRG9kZ2VyQmx1ZVwiLFwiR29sZFwiXVxyXG4gICAgY29sb3JBcnIuZm9yRWFjaCgob25lQ29sb3JDb2RlKT0+e1xyXG4gICAgICAgIHZhciBhbk9wdGlvbj0kKFwiPG9wdGlvbiB2YWx1ZT0nXCIrb25lQ29sb3JDb2RlK1wiJz5cIitvbmVDb2xvckNvZGUrXCLilqc8L29wdGlvbj5cIilcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmFwcGVuZChhbk9wdGlvbilcclxuICAgICAgICBhbk9wdGlvbi5jc3MoXCJjb2xvclwiLG9uZUNvbG9yQ29kZSlcclxuICAgIH0pXHJcbiAgICBpZihkZWZpbmVkQ29sb3IhPW51bGwpIHtcclxuICAgICAgICBjb2xvclNlbGVjdG9yLnZhbChkZWZpbmVkQ29sb3IpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLGRlZmluZWRDb2xvcilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixcImRhcmtHcmF5XCIpXHJcbiAgICB9XHJcbiAgICBjb2xvclNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RDb2xvckNvZGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixzZWxlY3RDb2xvckNvZGUpXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiY29sb3JcIjpzZWxlY3RDb2xvckNvZGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG4gICAgdmFyIHNoYXBlU2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaGFwZVNlbGVjdG9yKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZWxsaXBzZSc+4pevPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdyb3VuZC1yZWN0YW5nbGUnIHN0eWxlPSdmb250LXNpemU6MTIwJSc+4paiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdoZXhhZ29uJyBzdHlsZT0nZm9udC1zaXplOjEzMCUnPuKsoTwvb3B0aW9uPlwiKSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdzb2xpZCc+4oaSPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdkb3R0ZWQnPuKHojwvb3B0aW9uPlwiKSlcclxuICAgIH1cclxuICAgIGlmKGRlZmluZWRTaGFwZSE9bnVsbCkge1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IudmFsKGRlZmluZWRTaGFwZSlcclxuICAgIH1cclxuICAgIHNoYXBlU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdFNoYXBlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlPXNlbGVjdFNoYXBlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGU9c2VsZWN0U2hhcGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBzaXplQWRqdXN0U2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6MTEwcHhcIj48L3NlbGVjdD4nKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGY9MC4yO2Y8MjtmKz0wLjIpe1xyXG4gICAgICAgICAgICB2YXIgdmFsPWYudG9GaXhlZCgxKStcIlwiXHJcbiAgICAgICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9XCIrdmFsK1wiPmRpbWVuc2lvbipcIit2YWwrXCI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRlZmluZWREaW1lbnNpb25SYXRpbyE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMS4wXCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuY3NzKFwid2lkdGhcIixcIjgwcHhcIilcclxuICAgICAgICBmb3IodmFyIGY9MC41O2Y8PTQ7Zis9MC41KXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj53aWR0aCAqXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRWRnZVdpZHRoIT1udWxsKSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKGRlZmluZWRFZGdlV2lkdGgpXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMi4wXCIpXHJcbiAgICB9XHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKHNpemVBZGp1c3RTZWxlY3RvcilcclxuXHJcbiAgICBcclxuICAgIHNpemVBZGp1c3RTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgY2hvb3NlVmFsPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbz1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwiZGltZW5zaW9uUmF0aW9cIjpjaG9vc2VWYWwgfSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aD1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImVkZ2VXaWR0aFwiOmNob29zZVZhbCB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcbiAgICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zYXZlVmlzdWFsRGVmaW5pdGlvbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NhdmVWaXN1YWxEZWZpbml0aW9uXCIsIFwiUE9TVFwiLCB7XCJ2aXN1YWxEZWZpbml0aW9uSnNvblwiOkpTT04uc3RyaW5naWZ5KGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJlbGF0aW9uc2hpcEluZm89ZnVuY3Rpb24odmFsaWRSZWxhdGlvbnNoaXBzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuICAgICAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBjbGFzcz0ndzMtbGltZScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgbGFiZWwudGV4dChcIlJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQobGFiZWwpXHJcbiAgICAgICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KXtcclxuICAgICAgICAgICAgdmFyIGxhYmVsMT0kKFwiPGxhYmVsIGNsYXNzPSd3My1saW1lJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweDttYXJnaW4tbGVmdDoycHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGxhYmVsMS50ZXh0KHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLnRhcmdldClcclxuICAgICAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXModmFsaWRSZWxhdGlvbnNoaXBzW2luZF0uZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24oanNvbkluZm8scGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcblxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJlbnVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICAgICAgICAgIHZhciB2YWx1ZUFycj1bXVxyXG4gICAgICAgICAgICBqc29uSW5mb1tpbmRdLmZvckVhY2goZWxlPT57dmFsdWVBcnIucHVzaChlbGUuZW51bVZhbHVlKX0pXHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLmNzcyh7XCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCcsXCJtYXJnaW4tbGVmdFwiOlwiMnB4XCJ9KVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWx1ZUFyci5qb2luKCkpXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZEFQYXJ0SW5SaWdodFNwYW49ZnVuY3Rpb24ocGFydE5hbWUpe1xyXG4gICAgdmFyIGhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnblwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZFwiPjwvYnV0dG9uPicpXHJcbiAgICBoZWFkZXJET00udGV4dChwYXJ0TmFtZSlcclxuICAgIHZhciBsaXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXIgdzMtc2hvd1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp3aGl0ZVwiPjwvZGl2PicpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5hcHBlbmQoaGVhZGVyRE9NLGxpc3RET00pXHJcblxyXG4gICAgaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZihsaXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgbGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIGxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGxpc3RET007XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIC8vIGZpbGVzIGlzIGEgRmlsZUxpc3Qgb2YgRmlsZSBvYmplY3RzLiBMaXN0IHNvbWUgcHJvcGVydGllcy5cclxuICAgIHZhciBmaWxlQ29udGVudEFycj1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGY7IGYgPSBmaWxlc1tpXTsgaSsrKSB7XHJcbiAgICAgICAgLy8gT25seSBwcm9jZXNzIGpzb24gZmlsZXMuXHJcbiAgICAgICAgaWYgKGYudHlwZSE9XCJhcHBsaWNhdGlvbi9qc29uXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICB2YXIgb2JqPUpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KG9iaikpIGZpbGVDb250ZW50QXJyPWZpbGVDb250ZW50QXJyLmNvbmNhdChvYmopXHJcbiAgICAgICAgICAgIGVsc2UgZmlsZUNvbnRlbnRBcnIucHVzaChvYmopXHJcbiAgICAgICAgfWNhdGNoKGVycil7XHJcbiAgICAgICAgICAgIGFsZXJ0KGVycilcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihmaWxlQ29udGVudEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vaW1wb3J0TW9kZWxzXCIsIFwiUE9TVFwiLCB7XCJtb2RlbHNcIjpKU09OLnN0cmluZ2lmeShmaWxlQ29udGVudEFycil9KVxyXG4gICAgICAgIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkQ2FzdFwiKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfSAgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5saXN0TW9kZWxzPWFzeW5jIGZ1bmN0aW9uKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICB0aGlzLm1vZGVsTGlzdC5lbXB0eSgpXHJcbiAgICBhd2FpdCBnbG9iYWxDYWNoZS5sb2FkVXNlckRhdGEoKVxyXG5cclxuICAgIGlmKGpRdWVyeS5pc0VtcHR5T2JqZWN0KG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykpe1xyXG4gICAgICAgIHZhciB6ZXJvTW9kZWxJdGVtPSQoJzxsaSBzdHlsZT1cImZvbnQtc2l6ZTowLjllbVwiPnplcm8gbW9kZWwgcmVjb3JkLiBQbGVhc2UgaW1wb3J0Li4uPC9saT4nKVxyXG4gICAgICAgIHRoaXMubW9kZWxMaXN0LmFwcGVuZCh6ZXJvTW9kZWxJdGVtKVxyXG4gICAgICAgIHplcm9Nb2RlbEl0ZW0uY3NzKFwiY3Vyc29yXCIsXCJkZWZhdWx0XCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLnRyZWUgPSBuZXcgc2ltcGxlVHJlZSh0aGlzLm1vZGVsTGlzdCwge1xyXG4gICAgICAgICAgICBcImxlYWZOYW1lUHJvcGVydHlcIjogXCJkaXNwbGF5TmFtZVwiXHJcbiAgICAgICAgICAgICwgXCJub011bHRpcGxlU2VsZWN0QWxsb3dlZFwiOiB0cnVlLCBcImhpZGVFbXB0eUdyb3VwXCI6IHRydWVcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jID0gKGxuKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBtb2RlbENsYXNzID0gbG4ubGVhZkluZm9bXCJAaWRcIl1cclxuICAgICAgICAgICAgdmFyIGRiTW9kZWxJbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCTW9kZWxCeUlEKG1vZGVsQ2xhc3MpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgIHZhciBzaGFwZSA9IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgIHZhciBhdmFydGEgPSBudWxsXHJcbiAgICAgICAgICAgIHZhciBkaW1lbnNpb249MjA7XHJcbiAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbENsYXNzXSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbENsYXNzXVxyXG4gICAgICAgICAgICAgICAgdmFyIGNvbG9yQ29kZSA9IHZpc3VhbEpzb24uY29sb3IgfHwgXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgICAgICB2YXIgc2hhcGUgPSB2aXN1YWxKc29uLnNoYXBlIHx8IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgICAgICB2YXIgYXZhcnRhID0gdmlzdWFsSnNvbi5hdmFydGFcclxuICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pIGRpbWVuc2lvbio9cGFyc2VGbG9hdCh2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaWNvbkRPTT0kKFwiPGRpdiBzdHlsZT0nd2lkdGg6XCIrZGltZW5zaW9uK1wicHg7aGVpZ2h0OlwiK2RpbWVuc2lvbitcInB4O2Zsb2F0OmxlZnQ7cG9zaXRpb246cmVsYXRpdmUnPjwvZGl2PlwiKVxyXG4gICAgICAgICAgICBpZihkYk1vZGVsSW5mby5pc0lvVERldmljZU1vZGVsKXtcclxuICAgICAgICAgICAgICAgIHZhciBpb3REaXY9JChcIjxkaXYgY2xhc3M9J3czLWJvcmRlcicgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0Oi01cHg7cGFkZGluZzowcHggMnB4O3RvcDotOXB4O2JvcmRlci1yYWRpdXM6IDNweDtmb250LXNpemU6N3B4Jz5Jb1Q8L2Rpdj5cIilcclxuICAgICAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGlvdERpdilcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIHZhciBpbWdTcmM9ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc2hhcGVTdmcoc2hhcGUsY29sb3JDb2RlKSlcclxuICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIitpbWdTcmMrXCInPjwvaW1nPlwiKSlcclxuICAgICAgICAgICAgaWYoYXZhcnRhKXtcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzID0gKG5vZGVzQXJyLCBtb3VzZUNsaWNrRGV0YWlsKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0aGVOb2RlID0gbm9kZXNBcnJbMF1cclxuICAgICAgICAgICAgdGhpcy5maWxsUmlnaHRTcGFuKHRoZU5vZGUubGVhZkluZm9bXCJAaWRcIl0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZ3JvdXBOYW1lTGlzdCA9IHt9XHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIGdyb3VwTmFtZUxpc3RbdGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKV0gPSAxXHJcbiAgICAgICAgdmFyIG1vZGVsZ3JvdXBTb3J0QXJyID0gT2JqZWN0LmtleXMoZ3JvdXBOYW1lTGlzdClcclxuICAgICAgICBtb2RlbGdyb3VwU29ydEFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLmZvckVhY2gob25lR3JvdXBOYW1lID0+IHtcclxuICAgICAgICAgICAgdmFyIGduPXRoaXMudHJlZS5hZGRHcm91cE5vZGUoeyBkaXNwbGF5TmFtZTogb25lR3JvdXBOYW1lIH0pXHJcbiAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIHtcclxuICAgICAgICAgICAgdmFyIGduID0gdGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGduLCBKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5zb3J0QWxsTGVhdmVzKClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoc2hvdWxkQnJvYWRjYXN0KSB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIn0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2hhcGVTdmc9ZnVuY3Rpb24oc2hhcGUsY29sb3Ipe1xyXG4gICAgaWYoc2hhcGU9PVwiZWxsaXBzZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxjaXJjbGUgY3g9XCI1MFwiIGN5PVwiNTBcIiByPVwiNTBcIiAgZmlsbD1cIicrY29sb3IrJ1wiLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHBvbHlnb24gcG9pbnRzPVwiNTAgMCwgOTMuMyAyNSwgOTMuMyA3NSwgNTAgMTAwLCA2LjcgNzUsIDYuNyAyNVwiICBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJyb3VuZC1yZWN0YW5nbGVcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cmVjdCB4PVwiMTBcIiB5PVwiMTBcIiByeD1cIjEwXCIgcnk9XCIxMFwiIHdpZHRoPVwiODBcIiBoZWlnaHQ9XCI4MFwiIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImZ1bmN0aW9uIG1vZHVsZVN3aXRjaERpYWxvZygpe1xyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtc2lkZWJhciB3My1iYXItYmxvY2sgdzMtd2hpdGUgdzMtYW5pbWF0ZS1sZWZ0IHczLWNhcmQtNFwiIHN0eWxlPVwiZGlzcGxheTpub25lO2hlaWdodDoxNjBweDt3aWR0aDoyNDBweDtvdmVyZmxvdzpoaWRkZW5cIj48ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWxlZnQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4O3dpZHRoOjU1cHhcIj7imLA8L2J1dHRvbj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbTt3aWR0aDo3MHB4O2Zsb2F0OmxlZnQ7Y3Vyc29yOmRlZmF1bHRcIj5PcGVuPC9kaXY+PC9kaXY+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25pb3RodWIuaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RGV2aWNlIE1hbmFnZW1lbnQ8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25kaWdpdGFsdHdpbi5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5EaWdpdGFsIFR3aW48L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25ldmVudGxvZy5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5FdmVudCBMb2c8L2E+PC9kaXY+JylcclxuICAgIFxyXG4gICAgdGhpcy5tb2R1bGVzU3dpdGNoQnV0dG9uPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj7imLA8L2E+JylcclxuICAgIFxyXG4gICAgdGhpcy5tb2R1bGVzU3dpdGNoQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+eyB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpIH0pXHJcbiAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNoaWxkcmVuKCc6Zmlyc3QnKS5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIil9KVxyXG4gICAgXHJcbiAgICB2YXIgYWxsTW9kZXVscz10aGlzLm1vZHVsZXNTaWRlYmFyLmNoaWxkcmVuKFwiYVwiKVxyXG4gICAgJChhbGxNb2RldWxzWzBdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImRldmljZW1hbmFnZW1lbnQuaHRtbFwiLCBcIl9ibGFua1wiKVxyXG4gICAgICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKVxyXG4gICAgfSlcclxuICAgICQoYWxsTW9kZXVsc1sxXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJkaWdpdGFsdHdpbm1vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpXHJcbiAgICB9KVxyXG4gICAgJChhbGxNb2RldWxzWzJdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImV2ZW50bG9nbW9kdWxlLmh0bWxcIiwgXCJfYmxhbmtcIilcclxuICAgICAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZHVsZVN3aXRjaERpYWxvZygpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIG5ld1R3aW5EaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbih0d2luSW5mbykge1xyXG4gICAgdGhpcy5vcmlnaW5hbFR3aW5JbmZvPUpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodHdpbkluZm8pKVxyXG4gICAgdGhpcy50d2luSW5mbz10d2luSW5mb1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NTIwcHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gRWRpdG9yPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+QWRkPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsIGFzeW5jICgpID0+IHsgdGhpcy5hZGROZXdUd2luKCkgfSlcclxuICAgIFxyXG4gICAgdmFyIGFkZEFuZENsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTttYXJnaW4tbGVmdDo1cHhcIj5BZGQgJiBDbG9zZTwvYnV0dG9uPicpICAgIFxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoYWRkQW5kQ2xvc2VCdXR0b24pXHJcbiAgICBhZGRBbmRDbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsIGFzeW5jICgpID0+IHt0aGlzLmFkZE5ld1R3aW4oXCJDbG9zZURpYWxvZ1wiKX0pXHJcbiAgICAgICAgXHJcbiAgICB2YXIgSURMYWJsZURpdj0gJChcIjxkaXYgY2xhc3M9J3czLXBhZGRpbmcnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXdlaWdodDpib2xkO2NvbG9yOmJsYWNrJz5Ud2luIElEPC9kaXY+XCIpXHJcbiAgICB2YXIgSURJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm1hcmdpbjo4cHggMDtwYWRkaW5nOjJweDt3aWR0aDoxNTBweDtvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmVcIiBwbGFjZWhvbGRlcj1cIklEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdGhpcy5JRElucHV0PUlESW5wdXQgXHJcbiAgICB2YXIgbW9kZWxJRD10d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXVxyXG4gICAgdmFyIG1vZGVsTGFibGVEaXY9ICQoXCI8ZGl2IGNsYXNzPSd3My1wYWRkaW5nJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpibGFjayc+TW9kZWw8L2Rpdj5cIilcclxuICAgIHZhciBtb2RlbElucHV0PSQoJzxkaXYgdHlwZT1cInRleHRcIiBzdHlsZT1cIm1hcmdpbjo4cHggMDtwYWRkaW5nOjJweDtkaXNwbGF5OmlubGluZVwiLz4nKS50ZXh0KG1vZGVsSUQpOyAgXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoXCI8ZGl2Lz5cIikuYXBwZW5kKElETGFibGVEaXYsSURJbnB1dCkpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoXCI8ZGl2IHN0eWxlPSdwYWRkaW5nOjhweCAwcHgnLz5cIikuYXBwZW5kKG1vZGVsTGFibGVEaXYsbW9kZWxJbnB1dCkpXHJcbiAgICBJRElucHV0LmNoYW5nZSgoZSk9PntcclxuICAgICAgICB0aGlzLnR3aW5JbmZvW1wiJGR0SWRcIl09JChlLnRhcmdldCkudmFsKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGRpYWxvZ0RPTT0kKCc8ZGl2IC8+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoZGlhbG9nRE9NKSAgICBcclxuICAgIHZhciB0aXRsZVRhYmxlPSQoJzx0YWJsZSBzdHlsZT1cIndpZHRoOjEwMCVcIiBjZWxsc3BhY2luZz1cIjBweFwiIGNlbGxwYWRkaW5nPVwiMHB4XCI+PC90YWJsZT4nKVxyXG4gICAgdGl0bGVUYWJsZS5hcHBlbmQoJCgnPHRyPjx0ZCBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGRcIj5Qcm9wZXJ0aWVzIFRyZWU8L3RkPjwvdHI+JykpXHJcbiAgICBkaWFsb2dET00uYXBwZW5kKCQoXCI8ZGl2IGNsYXNzPSd3My1jb250YWluZXInLz5cIikuYXBwZW5kKHRpdGxlVGFibGUpKVxyXG5cclxuICAgIHZhciBzZXR0aW5nc0Rpdj0kKFwiPGRpdiBjbGFzcz0ndzMtY29udGFpbmVyIHczLWJvcmRlcicgc3R5bGU9J3dpZHRoOjEwMCU7bWF4LWhlaWdodDozMTBweDtvdmVyZmxvdzphdXRvJz48L2Rpdj5cIilcclxuICAgIHRoaXMuc2V0dGluZ3NEaXY9c2V0dGluZ3NEaXZcclxuICAgIGRpYWxvZ0RPTS5hcHBlbmQoc2V0dGluZ3NEaXYpXHJcbiAgICB0aGlzLmRyYXdNb2RlbFNldHRpbmdzKClcclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUuYWRkTmV3VHdpbiA9IGFzeW5jIGZ1bmN0aW9uKGNsb3NlRGlhbG9nKSB7XHJcbiAgICB2YXIgbW9kZWxJRD10aGlzLnR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXHJcbiAgICB2YXIgREJNb2RlbEluZm89Z2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJNb2RlbEJ5SUQobW9kZWxJRClcclxuXHJcbiAgICBpZighdGhpcy50d2luSW5mb1tcIiRkdElkXCJdfHx0aGlzLnR3aW5JbmZvW1wiJGR0SWRcIl09PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gbmFtZSBmb3IgdGhlIG5ldyBkaWdpdGFsIHR3aW5cIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgY29tcG9uZW50c05hbWVBcnI9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmluY2x1ZGVkQ29tcG9uZW50c1xyXG4gICAgY29tcG9uZW50c05hbWVBcnIuZm9yRWFjaChvbmVDb21wb25lbnROYW1lPT57IC8vYWR0IHNlcnZpY2UgcmVxdWVzdGluZyBhbGwgY29tcG9uZW50IGFwcGVhciBieSBtYW5kYXRvcnlcclxuICAgICAgICBpZih0aGlzLnR3aW5JbmZvW29uZUNvbXBvbmVudE5hbWVdPT1udWxsKXRoaXMudHdpbkluZm9bb25lQ29tcG9uZW50TmFtZV09e31cclxuICAgICAgICB0aGlzLnR3aW5JbmZvW29uZUNvbXBvbmVudE5hbWVdW1wiJG1ldGFkYXRhXCJdPSB7fVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2FzayB0YXNrbWFzdGVyIHRvIGFkZCB0aGUgdHdpblxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciBwb3N0Qm9keT0ge1wibmV3VHdpbkpzb25cIjpKU09OLnN0cmluZ2lmeSh0aGlzLnR3aW5JbmZvKX1cclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3Vwc2VydERpZ2l0YWxUd2luXCIsIFwiUE9TVFwiLCBwb3N0Qm9keSApXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcblxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVEQlR3aW4oZGF0YS5EQlR3aW4pICAgIFxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKGRhdGEuQURUVHdpbilcclxuXHJcblxyXG4gICAgLy9hc2sgdGFza21hc3RlciB0byBwcm92aXNpb24gdGhlIHR3aW4gdG8gaW90IGh1YiBpZiB0aGUgbW9kZWwgaXMgYSBpb3QgZGV2aWNlIG1vZGVsXHJcbiAgICBpZihEQk1vZGVsSW5mby5pc0lvVERldmljZU1vZGVsKXtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBwb3N0Qm9keT0ge1wiREJUd2luXCI6ZGF0YS5EQlR3aW4sXCJkZXNpcmVkSW5EZXZpY2VUd2luXCI6e319XHJcbiAgICAgICAgICAgIERCTW9kZWxJbmZvLmRlc2lyZWRQcm9wZXJ0aWVzLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlOYW1lPWVsZS5wYXRoW2VsZS5wYXRoLmxlbmd0aC0xXVxyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5U2FtcGxlVj0gXCJcIlxyXG4gICAgICAgICAgICAgICAgcG9zdEJvZHkuZGVzaXJlZEluRGV2aWNlVHdpbltwcm9wZXJ0eU5hbWVdPXByb3BlcnR5U2FtcGxlVlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB2YXIgcHJvdmlzaW9uZWREb2N1bWVudCA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRldmljZW1hbmFnZW1lbnQvcHJvdmlzaW9uSW9URGV2aWNlVHdpblwiLCBcIlBPU1RcIiwgcG9zdEJvZHkgKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBkYXRhLkRCVHdpbj1wcm92aXNpb25lZERvY3VtZW50XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVEQlR3aW4ocHJvdmlzaW9uZWREb2N1bWVudCkgICBcclxuICAgIH1cclxuXHJcbiAgICAvL2l0IHNob3VsZCBzZWxlY3QgdGhlIG5ldyBub2RlIGluIHRoZSB0cmVlLCBhbmQgbW92ZSB0b3BvbG9neSB2aWV3IHRvIHNob3cgdGhlIG5ldyBub2RlIChub3RlIHBhbiB0byBhIHBsYWNlIHRoYXQgaXMgbm90IGJsb2NrZWQgYnkgdGhlIGRpYWxvZyBpdHNlbGYpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luXCIsIFwidHdpbkluZm9cIjogZGF0YS5BRFRUd2luLCBcIkRCVHdpbkluZm9cIjpkYXRhLkRCVHdpbn0pXHJcblxyXG4gICAgaWYoY2xvc2VEaWFsb2cpdGhpcy5ET00uaGlkZSgpXHJcbiAgICBlbHNle1xyXG4gICAgICAgIC8vY2xlYXIgdGhlIGlucHV0IGVkaXRib3hcclxuICAgICAgICB0aGlzLnBvcHVwKHRoaXMub3JpZ2luYWxUd2luSW5mbylcclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUuZHJhd01vZGVsU2V0dGluZ3MgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHZhciBtb2RlbElEPXRoaXMudHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1cclxuICAgIHZhciBtb2RlbERldGFpbD0gbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICB2YXIgY29weU1vZGVsRWRpdGFibGVQcm9wZXJ0eT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1vZGVsRGV0YWlsLmVkaXRhYmxlUHJvcGVydGllcykpXHJcbiAgICBcclxuICAgIGlmKCQuaXNFbXB0eU9iamVjdChjb3B5TW9kZWxFZGl0YWJsZVByb3BlcnR5KSl7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5nc0Rpdi50ZXh0KFwiVGhlcmUgaXMgbm8gZWRpdGFibGUgcHJvcGVydHlcIilcclxuICAgICAgICB0aGlzLnNldHRpbmdzRGl2LmFkZENsYXNzKFwidzMtdGV4dC1ncmF5XCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfSAgIFxyXG5cclxuICAgIHZhciBzZXR0aW5nc1RhYmxlPSQoJzx0YWJsZSBzdHlsZT1cIndpZHRoOjEwMCVcIiBjZWxsc3BhY2luZz1cIjBweFwiIGNlbGxwYWRkaW5nPVwiMHB4XCI+PC90YWJsZT4nKVxyXG4gICAgdGhpcy5zZXR0aW5nc0Rpdi5hcHBlbmQoc2V0dGluZ3NUYWJsZSlcclxuXHJcbiAgICB2YXIgaW5pdGlhbFBhdGhBcnI9W11cclxuICAgIHZhciBsYXN0Um9vdE5vZGVSZWNvcmQ9W11cclxuICAgIHRoaXMuZHJhd0VkaXRhYmxlKHNldHRpbmdzVGFibGUsY29weU1vZGVsRWRpdGFibGVQcm9wZXJ0eSxpbml0aWFsUGF0aEFycixsYXN0Um9vdE5vZGVSZWNvcmQpXHJcbn1cclxuXHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5kcmF3RWRpdGFibGUgPSBhc3luYyBmdW5jdGlvbihwYXJlbnRUYWJsZSxqc29uSW5mbyxwYXRoQXJyLGxhc3RSb290Tm9kZVJlY29yZCkge1xyXG4gICAgaWYoanNvbkluZm89PW51bGwpIHJldHVybjtcclxuICAgIHZhciBhcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKSBhcnIucHVzaChpbmQpXHJcblxyXG4gICAgZm9yKHZhciB0aGVJbmRleD0wO3RoZUluZGV4PGFyci5sZW5ndGg7dGhlSW5kZXgrKyl7XHJcbiAgICAgICAgaWYodGhlSW5kZXg9PWFyci5sZW5ndGgtMSkgbGFzdFJvb3ROb2RlUmVjb3JkW3BhdGhBcnIubGVuZ3RoXSA9dHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5kID0gYXJyW3RoZUluZGV4XVxyXG4gICAgICAgIHZhciB0cj0kKFwiPHRyLz5cIilcclxuICAgICAgICB2YXIgcmlnaHRURD0kKFwiPHRkIHN0eWxlPSdoZWlnaHQ6MzBweCcvPlwiKVxyXG4gICAgICAgIHRyLmFwcGVuZChyaWdodFREKVxyXG4gICAgICAgIHBhcmVudFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICBcclxuICAgICAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGlmKCFsYXN0Um9vdE5vZGVSZWNvcmRbaV0pIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoMikpXHJcbiAgICAgICAgICAgIGVsc2UgcmlnaHRURC5hcHBlbmQodGhpcy50cmVlTGluZURpdig0KSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoZUluZGV4PT1hcnIubGVuZ3RoLTEpIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoMykpXHJcbiAgICAgICAgZWxzZSByaWdodFRELmFwcGVuZCh0aGlzLnRyZWVMaW5lRGl2KDEpKVxyXG5cclxuICAgICAgICB2YXIgcE5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Zsb2F0OmxlZnQ7bGluZS1oZWlnaHQ6MjhweDttYXJnaW4tbGVmdDozcHgnPlwiK2luZCtcIjwvZGl2PlwiKVxyXG4gICAgICAgIHJpZ2h0VEQuYXBwZW5kKHBOYW1lRGl2KVxyXG4gICAgICAgIHZhciBuZXdQYXRoPXBhdGhBcnIuY29uY2F0KFtpbmRdKVxyXG5cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSkgeyAvL2l0IGlzIGEgZW51bWVyYXRvclxyXG4gICAgICAgICAgICB0aGlzLmRyYXdEcm9wRG93bkJveChyaWdodFRELG5ld1BhdGgsanNvbkluZm9baW5kXSlcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHBhcmVudFRhYmxlLGpzb25JbmZvW2luZF0sbmV3UGF0aCxsYXN0Um9vdE5vZGVSZWNvcmQpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luLWxlZnQ6NXB4O3BhZGRpbmc6MnB4O3dpZHRoOjIwMHB4O291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwidHlwZTogJytqc29uSW5mb1tpbmRdKydcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICBcclxuICAgICAgICAgICAgcmlnaHRURC5hcHBlbmQoYUlucHV0KVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBhSW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZSgkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwkKGUudGFyZ2V0KS52YWwoKSwkKGUudGFyZ2V0KS5kYXRhKFwiZGF0YVR5cGVcIikpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBcclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUuZHJhd0Ryb3BEb3duQm94PWZ1bmN0aW9uKHJpZ2h0VEQsbmV3UGF0aCx2YWx1ZUFycil7XHJcbiAgICB2YXIgYVNlbGVjdE1lbnUgPSBuZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiXHJcbiAgICAgICAgLCB7IHdpZHRoOiBcIjIwMFwiIFxyXG4gICAgICAgICAgICAsYnV0dG9uQ1NTOiB7IFwicGFkZGluZ1wiOiBcIjRweCAxNnB4XCJ9XHJcbiAgICAgICAgICAgICwgXCJvcHRpb25MaXN0TWFyZ2luVG9wXCI6IDI1Ly8sXCJvcHRpb25MaXN0TWFyZ2luTGVmdFwiOjIxMFxyXG4gICAgICAgICAgICAsIFwiYWRqdXN0UG9zaXRpb25BbmNob3JcIjogdGhpcy5ET00ub2Zmc2V0KClcclxuICAgICAgICB9KVxyXG5cclxuXHJcbiAgICByaWdodFRELmFwcGVuZChhU2VsZWN0TWVudS5yb3dET00pICAvL3VzZSByb3dET00gaW5zdGVhZCBvZiBET00gdG8gYWxsb3cgc2VsZWN0IG9wdGlvbiB3aW5kb3cgZmxvYXQgYWJvdmUgZGlhbG9nXHJcbiAgICBhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgIHZhbHVlQXJyLmZvckVhY2goKG9uZU9wdGlvbikgPT4ge1xyXG4gICAgICAgIHZhciBzdHIgPSBvbmVPcHRpb25bXCJkaXNwbGF5TmFtZVwiXSB8fCBvbmVPcHRpb25bXCJlbnVtVmFsdWVcIl1cclxuICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24oc3RyKVxyXG4gICAgfSlcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uID0gKG9wdGlvblRleHQsIG9wdGlvblZhbHVlLCByZWFsTW91c2VDbGljaykgPT4ge1xyXG4gICAgICAgIGFTZWxlY3RNZW51LmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZiAocmVhbE1vdXNlQ2xpY2spIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUoYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIpLCBvcHRpb25WYWx1ZSwgXCJzdHJpbmdcIilcclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWU9ZnVuY3Rpb24ocGF0aEFycixuZXdWYWwsZGF0YVR5cGUpe1xyXG4gICAgaWYoW1wiZG91YmxlXCIsXCJib29sZWFuXCIsXCJmbG9hdFwiLFwiaW50ZWdlclwiLFwibG9uZ1wiXS5pbmNsdWRlcyhkYXRhVHlwZSkpIG5ld1ZhbD1OdW1iZXIobmV3VmFsKVxyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0aGVKc29uPXRoaXMudHdpbkluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuXHJcbiAgICAgICAgaWYoaT09cGF0aEFyci5sZW5ndGgtMSl7XHJcbiAgICAgICAgICAgIHRoZUpzb25ba2V5XT1uZXdWYWxcclxuICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhlSnNvbltrZXldPT1udWxsKSB0aGVKc29uW2tleV09e31cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS50cmVlTGluZURpdiA9IGZ1bmN0aW9uKHR5cGVOdW1iZXIpIHtcclxuICAgIHZhciByZURpdj0kKCc8ZGl2IHN0eWxlPVwibWFyZ2luLWxlZnQ6MTBweDt3aWR0aDoxNXB4O2hlaWdodDogMTAwJTtmbG9hdDogbGVmdFwiPjwvZGl2PicpXHJcbiAgICBpZih0eXBlTnVtYmVyPT0xKXtcclxuICAgICAgICByZURpdi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJvcmRlci1ib3R0b20gdzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj48L2Rpdj48ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj48L2Rpdj4nKSlcclxuICAgIH1lbHNlIGlmKHR5cGVOdW1iZXI9PTIpe1xyXG4gICAgICAgIHJlRGl2LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj48L2Rpdj48ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj48L2Rpdj4nKSlcclxuICAgIH1lbHNlIGlmKHR5cGVOdW1iZXI9PTMpe1xyXG4gICAgICAgIHJlRGl2LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWJvdHRvbSB3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPicpKVxyXG4gICAgfWVsc2UgaWYodHlwZU51bWJlcj09NCl7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVEaXZcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbmV3VHdpbkRpYWxvZygpOyIsImZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIC8vdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5zaG93PWZ1bmN0aW9uKGNzc09wdGlvbnMsb3RoZXJPcHRpb25zKXtcclxuICAgIHRoaXMuRE9NLmNzcyhjc3NPcHRpb25zKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+JyArIG90aGVyT3B0aW9ucy50aXRsZSArICc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCkgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXJnaW4tYm90dG9tOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgZGlhbG9nRGl2LnRleHQob3RoZXJPcHRpb25zLmNvbnRlbnQpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoZGlhbG9nRGl2KVxyXG4gICAgdGhpcy5kaWFsb2dEaXY9ZGlhbG9nRGl2XHJcblxyXG4gICAgdGhpcy5ib3R0b21CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5ib3R0b21CYXIpXHJcblxyXG4gICAgb3RoZXJPcHRpb25zLmJ1dHRvbnMuZm9yRWFjaChidG49PntcclxuICAgICAgICB2YXIgYUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJpZ2h0ICcrKGJ0bi5jb2xvckNsYXNzfHxcIlwiKSsnXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MnB4O21hcmdpbi1sZWZ0OjJweFwiPicrYnRuLnRleHQrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgYUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IGJ0bi5jbGlja0Z1bmMoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyLmFwcGVuZChhQnV0dG9uKSAgICBcclxuICAgIH0pXHJcbiAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLmNsb3NlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUNvbmZpcm1EaWFsb2c7IiwiZnVuY3Rpb24gc2ltcGxlU2VsZWN0TWVudShidXR0b25OYW1lLG9wdGlvbnMpe1xyXG4gICAgb3B0aW9ucz1vcHRpb25zfHx7fSAvL3tpc0NsaWNrYWJsZToxLHdpdGhCb3JkZXI6MSxmb250U2l6ZTpcIlwiLGNvbG9yQ2xhc3M6XCJcIixidXR0b25DU1M6XCJcIn1cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuaXNDbGlja2FibGU9dHJ1ZVxyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jbGlja1wiPjwvZGl2PicpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24taG92ZXIgXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5vbihcIm1vdXNlb3ZlclwiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vaXQgc2VlbXMgdGhhdCB0aGUgc2VsZWN0IG1lbnUgb25seSBjYW4gc2hvdyBvdXRzaWRlIG9mIGEgcGFyZW50IHNjcm9sbGFibGUgZG9tIHdoZW4gaXQgaXMgaW5zaWRlIGEgdzMtYmFyIGl0ZW0uLi4gbm90IHZlcnkgc3VyZSBhYm91dCB3aHkgXHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrO21hcmdpbi1sZWZ0OjVweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uY3NzKFwid2lkdGhcIiwob3B0aW9ucy53aWR0aHx8MTAwKStcInB4XCIpXHJcbiAgICB0aGlzLnJvd0RPTT1yb3dET01cclxuICAgIHRoaXMucm93RE9NLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgIFxyXG4gICAgdGhpcy5idXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvblwiIHN0eWxlPVwib3V0bGluZTogbm9uZTtcIj48YT4nK2J1dHRvbk5hbWUrJzwvYT48YSBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGQ7cGFkZGluZy1sZWZ0OjJweFwiPjwvYT48aSBjbGFzcz1cImZhIGZhLWNhcmV0LWRvd25cIiBzdHlsZT1cInBhZGRpbmctbGVmdDozcHhcIj48L2k+PC9idXR0b24+JylcclxuICAgIGlmKG9wdGlvbnMud2l0aEJvcmRlcikgdGhpcy5idXR0b24uYWRkQ2xhc3MoXCJ3My1ib3JkZXJcIilcclxuICAgIGlmKG9wdGlvbnMuZm9udFNpemUpIHRoaXMuRE9NLmNzcyhcImZvbnQtc2l6ZVwiLG9wdGlvbnMuZm9udFNpemUpXHJcbiAgICBpZihvcHRpb25zLmNvbG9yQ2xhc3MpIHRoaXMuYnV0dG9uLmFkZENsYXNzKG9wdGlvbnMuY29sb3JDbGFzcylcclxuICAgIGlmKG9wdGlvbnMud2lkdGgpIHRoaXMuYnV0dG9uLmNzcyhcIndpZHRoXCIsb3B0aW9ucy53aWR0aClcclxuICAgIGlmKG9wdGlvbnMuYnV0dG9uQ1NTKSB0aGlzLmJ1dHRvbi5jc3Mob3B0aW9ucy5idXR0b25DU1MpXHJcbiAgICBpZihvcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yKSB0aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yPW9wdGlvbnMuYWRqdXN0UG9zaXRpb25BbmNob3JcclxuXHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWNvbnRlbnQgdzMtYmFyLWJsb2NrIHczLWNhcmQtNFwiPjwvZGl2PicpXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RIZWlnaHQpIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe2hlaWdodDpvcHRpb25zLm9wdGlvbkxpc3RIZWlnaHQrXCJweFwiLFwib3ZlcmZsb3cteVwiOlwiYXV0b1wiLFwib3ZlcmZsb3cteFwiOlwidmlzaWJsZVwifSlcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tdG9wXCI6b3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luVG9wK1wicHhcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5MZWZ0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcIm1hcmdpbi1sZWZ0XCI6b3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCtcInB4XCJ9KVxyXG4gICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5idXR0b24sdGhpcy5vcHRpb25Db250ZW50RE9NKVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuXHJcbiAgICBpZihvcHRpb25zLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICB0aGlzLmJ1dHRvbi5vbihcImNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0RHJvcERvd25Qb3NpdGlvbigpXHJcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9uQ29udGVudERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxCYWNrX2JlZm9yZUNsaWNrRXhwYW5kKClcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5zaHJpbms9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMub3B0aW9uQ29udGVudERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkanVzdERyb3BEb3duUG9zaXRpb249ZnVuY3Rpb24oKXtcclxuICAgIGlmKCF0aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yKSByZXR1cm47XHJcbiAgICB2YXIgb2Zmc2V0PXRoaXMuRE9NLm9mZnNldCgpXHJcbiAgICB2YXIgbmV3VG9wPW9mZnNldC50b3AtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci50b3BcclxuICAgIHZhciBuZXdMZWZ0PW9mZnNldC5sZWZ0LXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IubGVmdFxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJ0b3BcIjpuZXdUb3ArXCJweFwiLFwibGVmdFwiOm5ld0xlZnQrXCJweFwifSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuZmluZE9wdGlvbj1mdW5jdGlvbihvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgb3B0aW9ucz10aGlzLm9wdGlvbkNvbnRlbnRET00uY2hpbGRyZW4oKVxyXG4gICAgZm9yKHZhciBpPTA7aTxvcHRpb25zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbk9wdGlvbj0kKG9wdGlvbnNbaV0pXHJcbiAgICAgICAgaWYob3B0aW9uVmFsdWU9PWFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSl7XHJcbiAgICAgICAgICAgIHJldHVybiB7XCJ0ZXh0XCI6YW5PcHRpb24udGV4dCgpLFwidmFsdWVcIjphbk9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIiksXCJjb2xvckNsYXNzXCI6YW5PcHRpb24uZGF0YShcIm9wdGlvbkNvbG9yQ2xhc3NcIil9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb25BcnI9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIHRoaXMuYWRkT3B0aW9uKGVsZW1lbnQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRkT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblRleHQsb3B0aW9uVmFsdWUsY29sb3JDbGFzcyl7XHJcbiAgICB2YXIgb3B0aW9uSXRlbT0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+JytvcHRpb25UZXh0Kyc8L2E+JylcclxuICAgIGlmKGNvbG9yQ2xhc3MpIG9wdGlvbkl0ZW0uYWRkQ2xhc3MoY29sb3JDbGFzcylcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5hcHBlbmQob3B0aW9uSXRlbSlcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIsb3B0aW9uVmFsdWV8fG9wdGlvblRleHQpXHJcbiAgICBvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25Db2xvckNsYXNzXCIsY29sb3JDbGFzcylcclxuICAgIG9wdGlvbkl0ZW0ub24oJ2NsaWNrJywoZSk9PntcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1vcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiKVxyXG4gICAgICAgIGlmKHRoaXMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKCd3My1kcm9wZG93bi1ob3ZlcicpXHJcbiAgICAgICAgICAgIHRoaXMuRE9NLmFkZENsYXNzKCd3My1kcm9wZG93bi1jbGljaycpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyAvL3RoaXMgaXMgdG8gaGlkZSB0aGUgZHJvcCBkb3duIG1lbnUgYWZ0ZXIgY2xpY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLmFkZENsYXNzKCd3My1kcm9wZG93bi1ob3ZlcicpXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICB9LCAxMDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG9wdGlvblRleHQsb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIiksXCJyZWFsTW91c2VDbGlja1wiLG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvbkNvbG9yQ2xhc3NcIikpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jaGFuZ2VOYW1lPWZ1bmN0aW9uKG5hbWVTdHIxLG5hbWVTdHIyKXtcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKFwiOmZpcnN0XCIpLnRleHQobmFtZVN0cjEpXHJcbiAgICB0aGlzLmJ1dHRvbi5jaGlsZHJlbigpLmVxKDEpLnRleHQobmFtZVN0cjIpXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLnRyaWdnZXJPcHRpb25JbmRleD1mdW5jdGlvbihvcHRpb25JbmRleCl7XHJcbiAgICB2YXIgdGhlT3B0aW9uPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpLmVxKG9wdGlvbkluZGV4KVxyXG4gICAgaWYodGhlT3B0aW9uLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9dGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKVxyXG4gICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbih0aGVPcHRpb24udGV4dCgpLHRoZU9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIiksbnVsbCx0aGVPcHRpb24uZGF0YShcIm9wdGlvbkNvbG9yQ2xhc3NcIikpXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLnRyaWdnZXJPcHRpb25WYWx1ZT1mdW5jdGlvbihvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgcmU9dGhpcy5maW5kT3B0aW9uKG9wdGlvblZhbHVlKVxyXG4gICAgaWYocmU9PW51bGwpe1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGxcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPXJlLnZhbHVlXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihyZS50ZXh0LHJlLnZhbHVlLG51bGwscmUuY29sb3JDbGFzcylcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNsZWFyT3B0aW9ucz1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19jbGlja09wdGlvbj1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2FsbEJhY2tfYmVmb3JlQ2xpY2tFeHBhbmQ9ZnVuY3Rpb24ob3B0aW9udGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayl7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZVNlbGVjdE1lbnU7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gc2ltcGxlVHJlZShET00sb3B0aW9ucyl7XHJcbiAgICB0aGlzLkRPTT1ET01cclxuICAgIHRoaXMuZ3JvdXBOb2Rlcz1bXSAvL2VhY2ggZ3JvdXAgaGVhZGVyIGlzIG9uZSBub2RlXHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXM9W107XHJcbiAgICB0aGlzLm9wdGlvbnM9b3B0aW9ucyB8fCB7fVxyXG5cclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGw7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNjcm9sbFRvTGVhZk5vZGU9ZnVuY3Rpb24oYU5vZGUpe1xyXG4gICAgdmFyIHNjcm9sbFRvcD10aGlzLkRPTS5zY3JvbGxUb3AoKVxyXG4gICAgdmFyIHRyZWVIZWlnaHQ9dGhpcy5ET00uaGVpZ2h0KClcclxuICAgIHZhciBub2RlUG9zaXRpb249YU5vZGUuRE9NLnBvc2l0aW9uKCkudG9wIC8vd2hpY2ggZG9lcyBub3QgY29uc2lkZXIgcGFyZW50IERPTSdzIHNjcm9sbCBoZWlnaHRcclxuICAgIC8vY29uc29sZS5sb2coc2Nyb2xsVG9wLHRyZWVIZWlnaHQsbm9kZVBvc2l0aW9uKVxyXG4gICAgaWYodHJlZUhlaWdodC01MDxub2RlUG9zaXRpb24pe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyBub2RlUG9zaXRpb24tKHRyZWVIZWlnaHQtNTApKSBcclxuICAgIH1lbHNlIGlmKG5vZGVQb3NpdGlvbjw1MCl7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIChub2RlUG9zaXRpb24tNTApKSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuY2xlYXJBbGxMZWFmTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5saXN0RE9NLmVtcHR5KClcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9MFxyXG4gICAgICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpcnN0TGVhZk5vZGU9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGZpcnN0TGVhZk5vZGU9bnVsbDtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihmaXJzdExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgZmlyc3RMZWFmTm9kZT1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiBmaXJzdExlYWZOb2RlXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRHcm91cE5vZGU9ZnVuY3Rpb24oYUdyb3VwTm9kZSl7XHJcbiAgICBpZihhR3JvdXBOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgaW5kZXg9dGhpcy5ncm91cE5vZGVzLmluZGV4T2YoYUdyb3VwTm9kZSlcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7IC8vcm90YXRlIGJhY2t3YXJkIHRvIGZpcnN0IGdyb3VwIG5vZGVcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzWzBdIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0TGVhZk5vZGU9ZnVuY3Rpb24oYUxlYWZOb2RlKXtcclxuICAgIGlmKGFMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGFHcm91cE5vZGU9YUxlYWZOb2RlLnBhcmVudEdyb3VwTm9kZVxyXG4gICAgdmFyIGluZGV4PWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZihhTGVhZk5vZGUpXHJcbiAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICAvL25leHQgbm9kZSBpcyBpbiBzYW1lIGdyb3VwXHJcbiAgICAgICAgcmV0dXJuIGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vZmluZCBuZXh0IGdyb3VwIGZpcnN0IG5vZGVcclxuICAgICAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICAgICAgdmFyIG5leHRHcm91cE5vZGUgPSB0aGlzLm5leHRHcm91cE5vZGUoYUdyb3VwTm9kZSlcclxuICAgICAgICAgICAgaWYobmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAgICAgYUdyb3VwTm9kZT1uZXh0R3JvdXBOb2RlXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VhcmNoVGV4dD1mdW5jdGlvbihzdHIpe1xyXG4gICAgaWYoc3RyPT1cIlwiKSByZXR1cm4gbnVsbDtcclxuICAgIC8vc2VhcmNoIGZyb20gY3VycmVudCBzZWxlY3QgaXRlbSB0aGUgbmV4dCBsZWFmIGl0ZW0gY29udGFpbnMgdGhlIHRleHRcclxuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoc3RyLCAnaScpO1xyXG4gICAgdmFyIHN0YXJ0Tm9kZVxyXG4gICAgaWYodGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHN0YXJ0Tm9kZT10aGlzLmZpcnN0TGVhZk5vZGUoKVxyXG4gICAgICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0aGVTdHI9c3RhcnROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYodGhlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZSBcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0Tm9kZVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIHN0YXJ0Tm9kZT10aGlzLnNlbGVjdGVkTm9kZXNbMF1cclxuXHJcbiAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgXHJcbiAgICB2YXIgZnJvbU5vZGU9c3RhcnROb2RlO1xyXG4gICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgdmFyIG5leHROb2RlPXRoaXMubmV4dExlYWZOb2RlKGZyb21Ob2RlKVxyXG4gICAgICAgIGlmKG5leHROb2RlPT1zdGFydE5vZGUpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZVN0cj1uZXh0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKG5leHROb2RlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dE5vZGVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZnJvbU5vZGU9bmV4dE5vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZ2V0QWxsTGVhZk5vZGVBcnI9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBhbGxMZWFmPVtdXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChnbj0+e1xyXG4gICAgICAgIGFsbExlYWY9YWxsTGVhZi5jb25jYXQoZ24uY2hpbGRMZWFmTm9kZXMpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIGFsbExlYWY7XHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGRMZWFmbm9kZVRvR3JvdXA9ZnVuY3Rpb24oZ3JvdXBOYW1lLG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciBhR3JvdXBOb2RlPXRoaXMuZmluZEdyb3VwTm9kZShncm91cE5hbWUpXHJcbiAgICBpZihhR3JvdXBOb2RlID09IG51bGwpIHJldHVybjtcclxuICAgIGFHcm91cE5vZGUuYWRkTm9kZShvYmosc2tpcFJlcGVhdClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUucmVtb3ZlQWxsTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmluZEdyb3VwTm9kZT1mdW5jdGlvbihncm91cE5hbWUpe1xyXG4gICAgdmFyIGZvdW5kR3JvdXBOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihhR3JvdXBOb2RlLm5hbWU9PWdyb3VwTmFtZSl7XHJcbiAgICAgICAgICAgIGZvdW5kR3JvdXBOb2RlPWFHcm91cE5vZGVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICByZXR1cm4gZm91bmRHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRlbEdyb3VwTm9kZT1mdW5jdGlvbihnbm9kZSl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICBnbm9kZS5kZWxldGVTZWxmKClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsZXRlTGVhZk5vZGU9ZnVuY3Rpb24obm9kZU5hbWUpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdmFyIGZpbmRMZWFmTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpPT57XHJcbiAgICAgICAgaWYoZmluZExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaCgoYUxlYWYpPT57XHJcbiAgICAgICAgICAgIGlmKGFMZWFmLm5hbWU9PW5vZGVOYW1lKXtcclxuICAgICAgICAgICAgICAgIGZpbmRMZWFmTm9kZT1hTGVhZlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICBpZihmaW5kTGVhZk5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIGZpbmRMZWFmTm9kZS5kZWxldGVTZWxmKClcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmluc2VydEdyb3VwTm9kZT1mdW5jdGlvbihvYmosaW5kZXgpe1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuc3BsaWNlKGluZGV4LCAwLCBhTmV3R3JvdXBOb2RlKTtcclxuXHJcbiAgICBpZihpbmRleD09MCl7XHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcHJldkdyb3VwTm9kZT10aGlzLmdyb3VwTm9kZXNbaW5kZXgtMV1cclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmhlYWRlckRPTS5pbnNlcnRBZnRlcihwcmV2R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICAgICAgYU5ld0dyb3VwTm9kZS5saXN0RE9NLmluc2VydEFmdGVyKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhTmV3R3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGRHcm91cE5vZGU9ZnVuY3Rpb24ob2JqKXtcclxuICAgIHZhciBhTmV3R3JvdXBOb2RlID0gbmV3IHNpbXBsZVRyZWVHcm91cE5vZGUodGhpcyxvYmopXHJcbiAgICB2YXIgZXhpc3RHcm91cE5vZGU9IHRoaXMuZmluZEdyb3VwTm9kZShhTmV3R3JvdXBOb2RlLm5hbWUpXHJcbiAgICBpZihleGlzdEdyb3VwTm9kZSE9bnVsbCkgcmV0dXJuIGV4aXN0R3JvdXBOb2RlO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLnB1c2goYU5ld0dyb3VwTm9kZSk7XHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlPWZ1bmN0aW9uKGxlYWZOb2RlLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihbbGVhZk5vZGVdLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbj1mdW5jdGlvbihsZWFmTm9kZSl7XHJcbiAgICB2YXIgbmV3QXJyPVtdLmNvbmNhdCh0aGlzLnNlbGVjdGVkTm9kZXMpXHJcbiAgICBuZXdBcnIucHVzaChsZWFmTm9kZSlcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIobmV3QXJyKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGROb2RlQXJyYXlUb1NlbGVjdGlvbj1mdW5jdGlvbihhcnIpe1xyXG4gICAgdmFyIG5ld0FyciA9IHRoaXMuc2VsZWN0ZWROb2Rlc1xyXG4gICAgdmFyIGZpbHRlckFycj1hcnIuZmlsdGVyKChpdGVtKSA9PiBuZXdBcnIuaW5kZXhPZihpdGVtKSA8IDApXHJcbiAgICBuZXdBcnIgPSBuZXdBcnIuY29uY2F0KGZpbHRlckFycilcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIobmV3QXJyKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RHcm91cE5vZGU9ZnVuY3Rpb24oZ3JvdXBOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUoZ3JvdXBOb2RlLmluZm8pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlQXJyPWZ1bmN0aW9uKGxlYWZOb2RlQXJyLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmRpbSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXM9dGhpcy5zZWxlY3RlZE5vZGVzLmNvbmNhdChsZWFmTm9kZUFycilcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5oaWdobGlnaHQoKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2RlcykgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKHRoaXMuc2VsZWN0ZWROb2Rlcyxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kYmxDbGlja05vZGU9ZnVuY3Rpb24odGhlTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKHRoZU5vZGUpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNvcnRBbGxMZWF2ZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKG9uZUdyb3VwTm9kZT0+e29uZUdyb3VwTm9kZS5zb3J0Tm9kZXNCeU5hbWUoKX0pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgZ3JvdXAgbm9kZS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlR3JvdXBOb2RlKHBhcmVudFRyZWUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50VHJlZT1wYXJlbnRUcmVlXHJcbiAgICB0aGlzLmluZm89b2JqXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzPVtdIC8vaXQncyBjaGlsZCBsZWFmIG5vZGVzIGFycmF5XHJcbiAgICB0aGlzLm5hbWU9b2JqLmRpc3BsYXlOYW1lO1xyXG4gICAgdGhpcy5jcmVhdGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5yZWZyZXNoTmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5oZWFkZXJET00uZW1wdHkoKVxyXG4gICAgdmFyIG5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmctbGVmdDo1cHg7cGFkZGluZy1yaWdodDozcHg7dmVydGljYWwtYWxpZ246bWlkZGxlJz48L2Rpdj5cIilcclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcbiAgICBcclxuICAgIGlmKHRoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPjApIGxibENvbG9yPVwidzMtbGltZVwiXHJcbiAgICBlbHNlIHZhciBsYmxDb2xvcj1cInczLWdyYXlcIiBcclxuICAgIHRoaXMuaGVhZGVyRE9NLmNzcyhcImZvbnQtd2VpZ2h0XCIsXCJib2xkXCIpXHJcblxyXG4gICAgXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyl7XHJcbiAgICAgICAgdmFyIGljb25MYWJlbD10aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChpY29uTGFiZWwpXHJcbiAgICAgICAgdmFyIHJvd0hlaWdodD1pY29uTGFiZWwuaGVpZ2h0KClcclxuICAgICAgICBuYW1lRGl2LmNzcyhcImxpbmUtaGVpZ2h0XCIscm93SGVpZ2h0K1wicHhcIilcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J1wiK2xibENvbG9yK1wiJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3RoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoK1wiPC9sYWJlbD5cIilcclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsKVxyXG5cclxuXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyl7XHJcbiAgICAgICAgdmFyIHRhaWxCdXR0b249dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlVGFpbEJ1dHRvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQodGFpbEJ1dHRvbilcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKVxyXG5cclxufVxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwPWZ1bmN0aW9uKCl7XHJcbiAgICBpZiAodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXAgJiYgdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRoaXMuc2hyaW5rKClcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5oaWRlKClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uaGlkZSgpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLnNob3coKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5zaG93KClcclxuICAgIH1cclxuXHJcbn1cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuaGVhZGVyRE9NLnJlbW92ZSgpXHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlKClcclxuICAgIHZhciBwYXJlbnRBcnIgPSB0aGlzLnBhcmVudFRyZWUuZ3JvdXBOb2Rlc1xyXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnRBcnIuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBwYXJlbnRBcnIuc3BsaWNlKGluZGV4LCAxKTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY3JlYXRlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnbiB3My1ib3JkZXItYm90dG9tXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyIHczLXBhZGRpbmctMTZcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMuaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZih0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50VHJlZS5zZWxlY3RHcm91cE5vZGUodGhpcykgICAgXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmlzT3Blbj1mdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuICB0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5leHBhbmQ9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zaHJpbms9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zb3J0Tm9kZXNCeU5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IFxyXG4gICAgICAgIHZhciBhTmFtZT1hLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHZhciBiTmFtZT1iLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHJldHVybiBhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSBcclxuICAgIH0pO1xyXG4gICAgLy90aGlzLmxpc3RET00uZW1wdHkoKSAvL05PVEU6IENhbiBub3QgZGVsZXRlIHRob3NlIGxlYWYgbm9kZSBvdGhlcndpc2UgdGhlIGV2ZW50IGhhbmRsZSBpcyBsb3N0XHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gob25lTGVhZj0+e3RoaXMubGlzdERPTS5hcHBlbmQob25lTGVhZi5ET00pfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuYWRkTm9kZT1mdW5jdGlvbihvYmosc2tpcFJlcGVhdCl7XHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHZhciBsZWFmTmFtZVByb3BlcnR5PXRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHlcclxuICAgIGVsc2UgbGVhZk5hbWVQcm9wZXJ0eT1cIiRkdElkXCJcclxuXHJcbiAgICBpZihza2lwUmVwZWF0KXtcclxuICAgICAgICB2YXIgZm91bmRSZXBlYXQ9ZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGFOb2RlPT57XHJcbiAgICAgICAgICAgIGlmKGFOb2RlLm5hbWU9PW9ialtsZWFmTmFtZVByb3BlcnR5XSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRSZXBlYXQ9dHJ1ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZihmb3VuZFJlcGVhdCkgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhTmV3Tm9kZSA9IG5ldyBzaW1wbGVUcmVlTGVhZk5vZGUodGhpcyxvYmopXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnB1c2goYU5ld05vZGUpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTS5hcHBlbmQoYU5ld05vZGUuRE9NKVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGxlYWYgbm9kZS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlTGVhZk5vZGUocGFyZW50R3JvdXBOb2RlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZT1wYXJlbnRHcm91cE5vZGVcclxuICAgIHRoaXMubGVhZkluZm89b2JqO1xyXG5cclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW3RyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHldXHJcbiAgICBlbHNlIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuXHJcbiAgICB0aGlzLmNyZWF0ZUxlYWZOb2RlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlKClcclxuICAgIHZhciBnTm9kZSA9IHRoaXMucGFyZW50R3JvdXBOb2RlXHJcbiAgICBjb25zdCBpbmRleCA9IGdOb2RlLmNoaWxkTGVhZk5vZGVzLmluZGV4T2YodGhpcyk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkgZ05vZGUuY2hpbGRMZWFmTm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jbGlja1NlbGY9ZnVuY3Rpb24obW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT10aGlzO1xyXG4gICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5zZWxlY3RMZWFmTm9kZSh0aGlzLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuY3JlYXRlTGVhZk5vZGVET009ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtd2hpdGVcIiBzdHlsZT1cImRpc3BsYXk6YmxvY2s7dGV4dC1hbGlnbjpsZWZ0O3dpZHRoOjk4JVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZHJhd0xhYmVsKClcclxuXHJcblxyXG4gICAgdmFyIGNsaWNrRj0oZSk9PntcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodCgpO1xyXG4gICAgICAgIHZhciBjbGlja0RldGFpbD1lLmRldGFpbFxyXG4gICAgICAgIGlmIChlLmN0cmxLZXkpIHtcclxuICAgICAgICAgICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmFwcGVuZExlYWZOb2RlVG9TZWxlY3Rpb24odGhpcylcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGU9dGhpcztcclxuICAgICAgICB9ZWxzZSBpZihlLnNoaWZ0S2V5KXtcclxuICAgICAgICAgICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT09bnVsbCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbExlYWZOb2RlQXJyPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZ2V0QWxsTGVhZk5vZGVBcnIoKVxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4MSA9IGFsbExlYWZOb2RlQXJyLmluZGV4T2YodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGUpXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXgyID0gYWxsTGVhZk5vZGVBcnIuaW5kZXhPZih0aGlzKVxyXG4gICAgICAgICAgICAgICAgaWYoaW5kZXgxPT0tMSB8fCBpbmRleDI9PS0xKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGVjdCBhbGwgbGVhZiBiZXR3ZWVuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvd2VyST0gTWF0aC5taW4oaW5kZXgxLGluZGV4MilcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGlnaGVyST0gTWF0aC5tYXgoaW5kZXgxLGluZGV4MilcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWlkZGxlQXJyPWFsbExlYWZOb2RlQXJyLnNsaWNlKGxvd2VySSxoaWdoZXJJKSAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIG1pZGRsZUFyci5wdXNoKGFsbExlYWZOb2RlQXJyW2hpZ2hlckldKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYWRkTm9kZUFycmF5VG9TZWxlY3Rpb24obWlkZGxlQXJyKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKGNsaWNrRGV0YWlsKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuRE9NLm9uKFwiY2xpY2tcIiwoZSk9PntjbGlja0YoZSl9KVxyXG5cclxuICAgIHRoaXMuRE9NLm9uKFwiZGJsY2xpY2tcIiwoZSk9PntcclxuICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmRibENsaWNrTm9kZSh0aGlzKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5yZWRyYXdMYWJlbD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG5cclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nLWxlZnQ6NXB4O3BhZGRpbmctcmlnaHQ6M3B4O3ZlcnRpY2FsLWFsaWduOm1pZGRsZSc+PC9kaXY+XCIpXHJcbiAgICBuYW1lRGl2LnRleHQodGhpcy5uYW1lKVxyXG5cclxuICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jKXtcclxuICAgICAgICB2YXIgaWNvbkxhYmVsPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jKHRoaXMpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGljb25MYWJlbClcclxuICAgICAgICB2YXIgcm93SGVpZ2h0PWljb25MYWJlbC5oZWlnaHQoKVxyXG4gICAgICAgIG5hbWVEaXYuY3NzKFwibGluZS1oZWlnaHRcIixyb3dIZWlnaHQrXCJweFwiKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZURpdilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmhpZ2hsaWdodD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRpbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlVHJlZTsiXX0=
