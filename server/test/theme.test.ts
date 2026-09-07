import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTheme, resolveTheme } from '../../web/src/lib/theme.js'

describe('theme', () => {
  it('normalizeTheme cae a system', () => {
    assert.equal(normalizeTheme('dark'), 'dark')
    assert.equal(normalizeTheme('light'), 'light')
    assert.equal(normalizeTheme('system'), 'system')
    assert.equal(normalizeTheme('rosa'), 'system')
    assert.equal(normalizeTheme(undefined), 'system')
  })

  it('resolveTheme respeta sistema', () => {
    assert.equal(resolveTheme('dark', false), 'dark')
    assert.equal(resolveTheme('light', true), 'light')
    assert.equal(resolveTheme('system', true), 'dark')
    assert.equal(resolveTheme('system', false), 'light')
  })
})
