import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { groupChatsByDate } from '../../web/src/lib/chat-groups.js'

const NOW = new Date(2026, 8, 7, 12, 0, 0).getTime()
const H = 3_600_000
const D = 24 * H

describe('groupChatsByDate', () => {
  it('agrupa hoy/ayer/semana/mes/viejos en orden', () => {
    const chats = [
      { id: 'old', updatedAt: NOW - 60 * D },
      { id: 'now', updatedAt: NOW - H },
      { id: 'week', updatedAt: NOW - 3 * D },
      { id: 'month', updatedAt: NOW - 20 * D },
      { id: 'yesterday', updatedAt: NOW - 26 * H },
    ]
    const groups = groupChatsByDate(chats, NOW)
    assert.deepEqual(
      groups.map((g) => g.key),
      ['today', 'yesterday', 'week', 'month', 'older'],
    )
    assert.deepEqual(groups[0].items.map((c) => c.id), ['now'])
  })

  it('omite grupos vacíos', () => {
    const groups = groupChatsByDate([{ id: 'a', updatedAt: NOW }], NOW)
    assert.deepEqual(groups.map((g) => g.key), ['today'])
    assert.deepEqual(groupChatsByDate([], NOW), [])
  })
})
