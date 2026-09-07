import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { modelBadges, shortModelName, supportsThinking, supportsVision } from '../../web/src/lib/model-capabilities.js'

describe('model-capabilities', () => {
  it('thinking solo qwen/qwq', () => {
    assert.equal(supportsThinking('qwen3.8-27b-uncensored'), true)
    assert.equal(supportsThinking('gpt-4o'), false)
  })

  it('shortModelName recorta sufijos técnicos', () => {
    assert.equal(shortModelName('Qwen3-Coder-Next-Q4_K_M'), 'Qwen3 Coder Next')
    assert.equal(shortModelName('qwen3.8-27b-uncensored'), 'qwen3.8 27b')
    assert.equal(shortModelName('org/qwen3-32b-fp8'), 'qwen3 32b')
  })

  it('badges con fallback Text', () => {
    assert.deepEqual(modelBadges('qwen3-32b'), ['Thinking', 'Vision'])
    assert.deepEqual(modelBadges('gpt-4o'), ['Text'])
    assert.equal(supportsVision('llama-3'), false)
  })
})
