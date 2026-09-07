import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { chatBodySchema, configBodySchema, parseOr400 } from '../src/validation.js'

function fakeReply() {
  const calls: Array<{ code: number; body: unknown }> = []
  return {
    calls,
    reply: {
      code: (code: number) => ({
        send: (body: unknown) => {
          calls.push({ code, body })
        },
      }),
    } as never,
  }
}

describe('chatBodySchema', () => {
  it('acepta cuerpo válido y pone default a createdAt', () => {
    const out = chatBodySchema.parse({
      messages: [{ id: '1', role: 'user', content: 'hola' }],
      maxTokens: 100,
    })
    assert.equal(out.messages.length, 1)
    assert.equal(typeof out.messages[0].createdAt, 'number')
  })

  it('rechaza rol inválido y temperature fuera de rango', () => {
    assert.equal(
      chatBodySchema.safeParse({ messages: [{ id: '1', role: 'x', content: '' }] }).success,
      false,
    )
    assert.equal(chatBodySchema.safeParse({ messages: [], temperature: 5 }).success, false)
  })

  it('recorta claves desconocidas (previewUrl no llega al upstream)', () => {
    const out = chatBodySchema.parse({
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'x',
          videos: [{ id: 'v', name: 'a', mime: 'video/mp4', previewUrl: 'blob:1' }],
        },
      ],
    })
    assert.ok(!('previewUrl' in (out.messages[0].videos as object[])[0]))
  })
})

describe('configBodySchema', () => {
  it('acepta thinking válido y rechaza nivel inexistente', () => {
    assert.ok(configBodySchema.safeParse({ thinkingEffort: 'low' }).success)
    assert.ok(configBodySchema.safeParse({ thinkingEffort: 'ultra' }).success === false)
    assert.ok(
      configBodySchema.safeParse({ modelThinking: { m: 'high', n: 'zzz' } }).success === false,
    )
  })

  it('strict: rechaza claves desconocidas', () => {
    assert.equal(configBodySchema.safeParse({ hack: true }).success, false)
  })
})

describe('parseOr400', () => {
  it('responde 400 y devuelve null con cuerpo inválido', () => {
    const { calls, reply } = fakeReply()
    const out = parseOr400(chatBodySchema, { messages: 'no' }, reply)
    assert.equal(out, null)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].code, 400)
  })
})
