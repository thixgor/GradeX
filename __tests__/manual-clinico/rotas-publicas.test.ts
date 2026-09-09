import { describe, it, expect } from 'vitest'
import { isManualClinicoPatologia } from '@/lib/manual-clinico-rotas'

/**
 * A prévia de uma patologia abre sem login. Esta regra é o que o middleware
 * consulta para decidir isso, então ela precisa acertar dos dois lados: deixar
 * passar a página da patologia (e a rota que a alimenta) e NÃO deixar passar
 * nenhuma seção do Manual que tem portão próprio.
 */
describe('isManualClinicoPatologia', () => {
  it('reconhece a página de uma patologia e a rota que a alimenta', () => {
    expect(isManualClinicoPatologia('/manual-clinico/insuficiencia-cardiaca')).toBe(true)
    expect(isManualClinicoPatologia('/api/manual-clinico/insuficiencia-cardiaca')).toBe(true)
    expect(isManualClinicoPatologia('/manual-clinico/dengue')).toBe(true)
  })

  it('não abre as seções do Manual, que decidem o próprio acesso', () => {
    for (const secao of [
      'checkout',
      'eletrocardiograma',
      'exames-laboratoriais',
      'farmacologia',
      'ferramentas',
      'histologia',
      'histopatologia',
      'pdf-watermark',
      'product',
      'radiologia',
      'subscription',
      'tomografia',
    ]) {
      expect(isManualClinicoPatologia(`/manual-clinico/${secao}`)).toBe(false)
      expect(isManualClinicoPatologia(`/api/manual-clinico/${secao}`)).toBe(false)
    }
  })

  it('não abre o índice do Manual nem nada abaixo do slug', () => {
    // O índice é público por outra entrada da lista; o que importa aqui é que
    // esta regra não vaze para caminhos mais fundos — as sub-rotas de uma seção
    // (ex.: o acervo da Histologia) não podem entrar por ela.
    expect(isManualClinicoPatologia('/manual-clinico')).toBe(false)
    expect(isManualClinicoPatologia('/manual-clinico/dengue/pdf')).toBe(false)
    expect(isManualClinicoPatologia('/api/manual-clinico/histologia/acervo')).toBe(false)
    expect(isManualClinicoPatologia('/api/manual-clinico')).toBe(false)
  })

  it('ignora caminhos de outra árvore e slugs fora do formato', () => {
    expect(isManualClinicoPatologia('/admin/manual-clinico/novo')).toBe(false)
    expect(isManualClinicoPatologia('/manual-clinicoX/dengue')).toBe(false)
    // Slug com maiúscula ou ponto não é slug de patologia: as páginas usam
    // minúsculas e hífen, e afrouxar aqui só ampliaria a superfície aberta.
    expect(isManualClinicoPatologia('/manual-clinico/Dengue')).toBe(false)
    expect(isManualClinicoPatologia('/manual-clinico/arquivo.json')).toBe(false)
    expect(isManualClinicoPatologia('/manual-clinico/-dengue')).toBe(false)
  })
})
