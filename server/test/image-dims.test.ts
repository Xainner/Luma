import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dataUrlDimensions, imageDimensions } from '../src/image-dims.js'

function png(w: number, h: number): Buffer {
  const b = Buffer.alloc(33)
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13], 0)
  b.write('IHDR', 12)
  b.writeUInt32BE(w, 16)
  b.writeUInt32BE(h, 20)
  return b
}

function gif(w: number, h: number): Buffer {
  const b = Buffer.alloc(10)
  b.write('GIF89a', 0)
  b.writeUInt16LE(w, 6)
  b.writeUInt16LE(h, 8)
  return b
}

function jpeg(w: number, h: number): Buffer {
  // SOI + APP0 + SOF0(1 componente) + EOI (suficiente para el parser de headers)
  const b = Buffer.alloc(2 + 18 + 13 + 2)
  b[0] = 0xff
  b[1] = 0xd8 // SOI
  b[2] = 0xff
  b[3] = 0xe0 // APP0
  b.writeUInt16BE(16, 4)
  b[20] = 0xff
  b[21] = 0xc0 // SOF0
  b.writeUInt16BE(11, 22)
  b[24] = 8 // precisión
  b.writeUInt16BE(h, 25)
  b.writeUInt16BE(w, 27)
  b[32] = 0xff
  b[33] = 0xd9 // EOI
  return b
}

function webpX(wMinus1: number, hMinus1: number): Buffer {
  const b = Buffer.alloc(12 + 8 + 10)
  b.write('RIFF', 0)
  b.writeUInt32LE(12 + 8 + 10 - 8, 4)
  b.write('WEBP', 8)
  b.write('VP8X', 12)
  b.writeUInt32LE(10, 16)
  b[20] = 0
  b[21] = wMinus1 & 0xff
  b[22] = (wMinus1 >> 8) & 0xff
  b[23] = (wMinus1 >> 16) & 0xff
  b[24] = hMinus1 & 0xff
  b[25] = (hMinus1 >> 8) & 0xff
  b[26] = (hMinus1 >> 16) & 0xff
  return b
}

describe('imageDimensions', () => {
  it('PNG', () => assert.deepEqual(imageDimensions(png(3, 5)), { width: 3, height: 5 }))
  it('GIF', () => assert.deepEqual(imageDimensions(gif(9, 13)), { width: 9, height: 13 }))
  it('JPEG SOF0', () => assert.deepEqual(imageDimensions(jpeg(11, 7)), { width: 11, height: 7 }))
  it('WebP VP8X', () =>
    assert.deepEqual(imageDimensions(webpX(100, 200)), { width: 101, height: 201 }))
  it('basura → null', () => {
    assert.equal(imageDimensions(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])), null)
    assert.equal(imageDimensions(Buffer.alloc(0)), null)
  })
})

describe('dataUrlDimensions', () => {
  it('dataUrl PNG', () => {
    const url = 'data:image/png;base64,' + png(4, 6).toString('base64')
    assert.deepEqual(dataUrlDimensions(url), { width: 4, height: 6 })
  })
  it('sin base64 → null', () => {
    assert.equal(dataUrlDimensions('data:image/png,abc'), null)
    assert.equal(dataUrlDimensions('hola'), null)
  })
})
