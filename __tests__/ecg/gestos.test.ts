import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const RAIZ = path.resolve(__dirname, '../..')

function arquivosDoModulo(): Map<string, string> {
  const saida = new Map<string, string>()
  const varrer = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const completo = path.join(dir, nome)
      if (statSync(completo).isDirectory()) varrer(completo)
      else if (/\.tsx?$/.test(nome)) saida.set(path.relative(RAIZ, completo), readFileSync(completo, 'utf8'))
    }
  }
  varrer(path.join(RAIZ, 'components/ecg'))
  return saida
}

const FONTES = arquivosDoModulo()

/**
 * O Manual do Eletro é lido de cima a baixo no celular, e o traçado ocupa a
 * largura inteira da tela.
 *
 * Os dois invólucros de traçado declaravam `touch-action: none`. Não havia
 * arrasto nenhum para proteger — a única interação é o toque que posiciona a
 * régua —, então a declaração só produzia dois efeitos, ambos ruins: passar o
 * dedo sobre o ECG não rolava a página, e a pinça não ampliava o papel
 * milimetrado, que é justamente onde ampliar faz falta.
 *
 * Este teste falha se alguém devolver a declaração sem trazer junto um gesto
 * que a justifique.
 */
describe('o dedo sobre o traçado é de quem está lendo a página', () => {
  for (const arquivo of ['components/ecg/ecg-lead-canvas.tsx', 'components/ecg/ecg-12-lead.tsx']) {
    it(`${path.basename(arquivo)} não tranca a rolagem nem a pinça`, () => {
      const fonte = FONTES.get(arquivo)!
      expect(fonte).toBeTruthy()
      expect(fonte).not.toContain("touchAction: 'none'")
      expect(fonte).not.toContain('touch-none')
    })

    /**
     * `pointerdown` dispara no instante em que o dedo encosta, antes de o
     * navegador decidir se aquilo é um toque ou o começo de uma rolagem: rolar
     * a página pelo traçado largava um cursor de régua no caminho. `click` só
     * acontece quando o gesto termina como toque de verdade.
     */
    it(`${path.basename(arquivo)} posiciona a régua no clique, não no pointerdown`, () => {
      const fonte = FONTES.get(arquivo)!
      expect(fonte).toContain('onClick={handlePointer}')
      expect(fonte).not.toContain('onPointerDown={handlePointer}')
    })
  }

  /**
   * O coração 3D gira com o dedo, e girar é gesto horizontal — é o eixo em que
   * ele tem faces diferentes para mostrar. A vertical continua sendo da página.
   */
  it('o coração 3D fica só com a horizontal', () => {
    const fonte = FONTES.get('components/ecg/heart-3d.tsx')!
    expect(fonte).toContain("el.style.touchAction = 'pan-y'")
    expect(fonte).not.toContain("touchAction = 'none'")
    // Rolagem iniciada pelo navegador cancela o ponteiro; sem tratar, o modelo
    // continuava sendo arrastado com o dedo já longe dali.
    expect(fonte).toContain("addEventListener('pointercancel', onUp)")
    expect(fonte).toContain("removeEventListener('pointercancel', onUp)")
  })

  /**
   * No laboratório de intervalos os dois cursores do paquímetro só andam na
   * horizontal, então é só a horizontal que precisa ser tirada do navegador.
   */
  it('o paquímetro do laboratório de intervalos toma um eixo só', () => {
    const fonte = FONTES.get('components/ecg/course/widgets/interval-lab.tsx')!
    expect(fonte).toContain("className={caliper ? 'touch-pan-y' : ''}")
    expect(fonte).not.toContain("caliper ? 'touch-none' : ''")
  })
})
