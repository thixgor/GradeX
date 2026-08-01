import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeManualContentName } from '../normalize'

test('normalizeManualContentName remove acentos', () => {
  assert.equal(
    normalizeManualContentName('Hipertensão Arterial Sistêmica'),
    'hipertensao arterial sistemica',
  )
  assert.equal(
    normalizeManualContentName('Doença Pulmonar Obstrutiva Crônica'),
    'doenca pulmonar obstrutiva cronica',
  )
})

test('normalizeManualContentName iguala versoes com e sem acento', () => {
  assert.equal(
    normalizeManualContentName('Hipertensão Arterial Sistêmica'),
    normalizeManualContentName('Hipertensao Arterial Sistemica'),
  )
})

test('normalizeManualContentName ignora maiusculas e minusculas', () => {
  assert.equal(
    normalizeManualContentName('ACIDENTE VASCULAR CEREBRAL'),
    'acidente vascular cerebral',
  )
  assert.equal(
    normalizeManualContentName('AcIdEnTe VaScUlAr CeReBrAl'),
    normalizeManualContentName('acidente vascular cerebral'),
  )
})

test('normalizeManualContentName colapsa espacos duplicados', () => {
  assert.equal(
    normalizeManualContentName('Acidente   Vascular  Cerebral'),
    'acidente vascular cerebral',
  )
  assert.equal(
    normalizeManualContentName('  Diabetes\tMellitus\n\nTipo 2  '),
    'diabetes mellitus tipo 2',
  )
})

test('normalizeManualContentName aplica trim nas pontas', () => {
  assert.equal(normalizeManualContentName('   Asma   '), 'asma')
})

test('normalizeManualContentName preserva letras e numeros', () => {
  assert.equal(normalizeManualContentName('Diabetes Mellitus Tipo 2'), 'diabetes mellitus tipo 2')
  assert.equal(normalizeManualContentName('COVID-19'), 'covid-19')
  assert.equal(normalizeManualContentName('Hepatite B'), 'hepatite b')
})

test('normalizeManualContentName trata entradas nulas e nao textuais', () => {
  assert.equal(normalizeManualContentName(null), '')
  assert.equal(normalizeManualContentName(undefined), '')
  assert.equal(normalizeManualContentName(''), '')
  assert.equal(normalizeManualContentName('     '), '')
  assert.equal(normalizeManualContentName(42), '42')
})

test('normalizeManualContentName e estavel quando reaplicado', () => {
  const once = normalizeManualContentName('Hipertensão   ARTERIAL ')
  assert.equal(normalizeManualContentName(once), once)
})
