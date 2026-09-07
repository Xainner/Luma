import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildChatPayload,
  normalizeEffort,
  resolveEffort,
  supportsThinking,
  toApiMessages,
} from '../src/chat-payload.js'
import { defaultConfig, rowToConfig } from '../src/db-shared.js'
import type { AppConfig } from '../src/db-shared.js'

const cfg = (over: Partial<AppConfig> = {}): AppConfig => ({ ...defaultConfig, ...over })

describe('toApiMessages', () => {
  it('texto simple sin system', () => {
    const out = toApiMessages([{ id: '1', role: 'user', content: 'hola', createdAt: 1 }], '')
    assert.deepEqual(out, [{ role: 'user', content: 'hola' }])
  })

  it('agrega system prompt y salta mensajes system del historial', () => {
    const out = toApiMessages(
      [
        { id: '0', role: 'system', content: 'viejo', createdAt: 0 },
        { id: '1', role: 'user', content: 'hola', createdAt: 1 },
      ],
      'sys',
    )
    assert.deepEqual(out, [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hola' },
    ])
  })

  it('videos se expanden a image_url por frame', () => {
    const out = toApiMessages(
      [
        {
          id: '1',
          role: 'user',
          content: 'mira',
          createdAt: 1,
          videos: [{ id: 'v', name: 'a.mp4', mime: 'video/mp4', frames: ['F1', 'F2'] }],
        },
      ],
      '',
    )
    assert.deepEqual(out, [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'mira' },
          { type: 'image_url', image_url: { url: 'F1' } },
          { type: 'image_url', image_url: { url: 'F2' } },
        ],
      },
    ])
  })
})

describe('thinking', () => {
  it('supportsThinking solo qwen/qwq', () => {
    assert.equal(supportsThinking('qwen3.8-27b-uncensored'), true)
    assert.equal(supportsThinking('QwQ-32B'), true)
    assert.equal(supportsThinking('gpt-4o'), false)
    assert.equal(supportsThinking(''), false)
  })

  it('resolveEffort: override por modelo gana al global', () => {
    const c = cfg({ thinkingEffort: 'low', modelThinking: { m1: 'high' } })
    assert.equal(resolveEffort(c, 'm1'), 'high')
    assert.equal(resolveEffort(c, 'otro'), 'low')
  })

  it('normalizeEffort cae a medium con basura', () => {
    assert.equal(normalizeEffort('ultra'), 'medium')
    assert.equal(normalizeEffort(undefined), 'medium')
  })

  it('off manda enable_thinking:false sin pisar max_tokens', () => {
    const { payload } = buildChatPayload([], '', {
      model: 'qwen3.8-27b-uncensored',
      temperature: 0.7,
      maxTokens: 40,
      effort: 'off',
    })
    assert.equal(payload.enable_thinking, false)
    assert.equal(payload.max_tokens, 40)
    assert.ok(!('reasoning_effort' in payload), 'nunca params desconocidos')
  })

  it('low aplica floor 1024 y enable_thinking:true', () => {
    const { payload } = buildChatPayload([], '', {
      model: 'qwen3.8-27b-uncensored',
      temperature: 0.7,
      maxTokens: 40,
      effort: 'low',
    })
    assert.equal(payload.enable_thinking, true)
    assert.equal(payload.max_tokens, 1024)
  })

  it('modelo sin soporte no recibe ningún param de thinking', () => {
    const { payload } = buildChatPayload([], '', {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 100,
      effort: 'high',
    })
    assert.ok(!('enable_thinking' in payload))
    assert.ok(!('reasoning_effort' in payload))
    assert.ok(!('thinking_budget' in payload))
  })
})

describe('rowToConfig thinking', () => {
  it('defaults cuando faltan columnas (DB vieja)', () => {
    const c = rowToConfig({ base_url: 'x' })
    assert.equal(c.thinkingEffort, 'medium')
    assert.deepEqual(c.modelThinking, {})
  })

  it('parsea model_thinking como JSON string (sqlite)', () => {
    const c = rowToConfig({ thinking_effort: 'low', model_thinking: '{"a":"high","b":"xxx"}' })
    assert.equal(c.thinkingEffort, 'low')
    assert.deepEqual(c.modelThinking, { a: 'high' })
  })
})
