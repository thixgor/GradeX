import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TextoDoDom } from '@/components/dom/texto-do-dom'

const html = (texto: string) => renderToStaticMarkup(createElement(TextoDoDom, { texto })).replace(/<\/?span[^>]*>/g, '')

describe('fórmulas nas respostas do Dom', () => {
  it('íons com a letrinha em cima', () => {
    expect(html('A bomba $H^+/K^+$ ATPase')).toBe('<p>A bomba H<sup>+</sup>/K<sup>+</sup> ATPase</p>')
    expect(html('$Ca^{2+}$ e $HCO_3^-$')).toBe('<p>Ca<sup>2+</sup> e HCO<sub>3</sub><sup>−</sup></p>')
  })
  it('índices, setas, gregas e \\ce', () => {
    expect(html('$CO_2 + H_2O \\rightleftharpoons H_2CO_3$')).toBe('<p>CO<sub>2</sub> + H<sub>2</sub>O ⇌ H<sub>2</sub>CO<sub>3</sub></p>')
    expect(html('receptor $\\beta_1$ e $\\Delta G$')).toBe('<p>receptor β<sub>1</sub> e ΔG</p>')
    expect(html('\\ce{Na2CO3}')).toBe('<p>Na<sub>2</sub>CO<sub>3</sub></p>')
    expect(html('$\\frac{1}{2}$ e \\(\\text{pH} < 7\\)')).toBe('<p>1/2 e pH &lt; 7</p>')
  })
  it('expoente esquecido sem cifrão também sobe', () => {
    expect(html('bomba Na^+/K^+ e Ca^{2+}')).toBe('<p>bomba Na<sup>+</sup>/K<sup>+</sup> e Ca<sup>2+</sup></p>')
  })
  it('preço em reais não vira fórmula', () => {
    expect(html('Sai por R$ 29,90 ou R$ 49,90 no anual')).toBe('<p>Sai por R$ 29,90 ou R$ 49,90 no anual</p>')
  })
  it('fórmula convive com negrito e itálico (e o "_" da fórmula não vira itálico)', () => {
    expect(html('**A $Na^+/K^+$ ATPase** gasta ATP')).toBe('<p><strong>A Na<sup>+</sup>/K<sup>+</sup> ATPase</strong> gasta ATP</p>')
    expect(html('$CO_2$ e $H_2O$ viram _ácido_')).toBe('<p>CO<sub>2</sub> e H<sub>2</sub>O viram <em>ácido</em></p>')
  })
  it('nada de HTML injetado', () => {
    expect(html('$<img src=x onerror=alert(1)>$')).not.toContain('<img')
  })
})
