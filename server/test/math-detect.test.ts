import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { containsMath } from '../../web/src/lib/math-detect.js'

describe('containsMath', () => {
  it('detecta display e inline', () => {
    assert.equal(containsMath('mira $$x^2$$ listo'), true)
    assert.equal(containsMath('sale $E=mc^2$ exacto'), true)
  })

  it('ignora escapados y precios', () => {
    assert.equal(containsMath('cuesta \\$5'), false)
    assert.equal(containsMath('hola mundo'), false)
    assert.equal(containsMath('cuesta $5'), false)
  })
})
