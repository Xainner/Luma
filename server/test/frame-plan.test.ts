import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { estimateFramesTokens, planFrameTimes } from '../../web/src/lib/frame-plan.js'
import { stripVideoEphemeral } from '../../web/src/lib/videos.js'

describe('planFrameTimes', () => {
  it('duración 0 → un frame en 0', () => {
    assert.deepEqual(planFrameTimes(0), [0])
    assert.deepEqual(planFrameTimes(-5), [0])
  })

  it('100s → tope de 12 frames uniformes', () => {
    const t = planFrameTimes(100)
    assert.equal(t.length, 12)
    assert.ok(t[0] > 0 && t[t.length - 1] < 100)
    for (let i = 1; i < t.length; i++) assert.ok(t[i] > t[i - 1])
  })

  it('video corto (5s) → mínimo 2 frames', () => {
    assert.equal(planFrameTimes(5).length, 2)
  })

  it('presupuesto de tokens recorta frames', () => {
    assert.equal(planFrameTimes(600, { maxTokens: 2200 }).length, 2)
    assert.equal(planFrameTimes(600, { maxTokens: 500 }).length, 1)
  })

  it('maxFrames optativo respeta tope', () => {
    assert.equal(planFrameTimes(600, { maxFrames: 4 }).length, 4)
  })
})

describe('estimateFramesTokens', () => {
  it('12 frames → 13200', () => {
    assert.equal(estimateFramesTokens(12), 13200)
  })
})

describe('stripVideoEphemeral', () => {
  it('quita previewUrl y conserva el resto', () => {
    const msg = {
      id: '1',
      role: 'user' as const,
      content: 'x',
      createdAt: 1,
      videos: [
        {
          id: 'v',
          name: 'a.mp4',
          mime: 'video/mp4',
          frames: ['F'],
          previewUrl: 'blob:xxx',
          uploadId: 'u1',
        },
      ],
    }
    const out = stripVideoEphemeral(msg)
    assert.ok(!('previewUrl' in (out.videos as object[])[0]))
    const v = (out.videos as Array<{ uploadId?: string; frames: string[] }>)[0]
    assert.equal(v.uploadId, 'u1')
    assert.deepEqual(v.frames, ['F'])
  })
})
