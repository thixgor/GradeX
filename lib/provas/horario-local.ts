/**
 * A tradução entre o relógio do admin e o relógio do banco.
 *
 * ## O que estava quebrado
 *
 * O formulário de prova usa `<input type="datetime-local">`. O valor dele é uma
 * hora de parede sem fuso: `"2026-05-10T14:00"`. Esse texto era enviado cru
 * para a API, que fazia `new Date(valor)` — e `new Date` de uma data-hora SEM
 * fuso é interpretada no fuso de quem executa. Quem executa é a função no
 * servidor, e o servidor roda em UTC. As 14h que o admin em Brasília digitou
 * viravam 14h UTC, ou seja, 11h para ele: **três horas antes**.
 *
 * O `endTime` escapava por acidente. Ele não era enviado como texto: a tela
 * calculava `new Date(startTime).getTime() + duração` e mandava `toISOString()`
 * — e ali o `new Date` rodava no NAVEGADOR, onde o fuso é o do admin. O
 * resultado é que `startTime` e `endTime` da mesma prova iam para o banco em
 * fusos diferentes.
 *
 * Nos portões o efeito é fatal, e é por isso que eles "não funcionavam":
 * portões das 13h30 às 14h15 viravam 10h30–11h15 no relógio do admin. Quando a
 * prova de verdade começava, `agora` já era muito depois de `gatesClose` — a
 * fase era `portao-fechado` desde antes de o primeiro aluno abrir a página, e
 * ninguém nunca entrava.
 *
 * A volta tinha o mesmo defeito espelhado: a tela de edição preenchia o campo
 * com `toISOString().slice(0, 16)`, que é UTC. Os dois erros se cancelavam num
 * ciclo abrir-e-salvar (lê 3h a mais, grava 3h a menos), o que escondeu o
 * problema por completo de quem só reabria o formulário para conferir.
 *
 * ## Como está agora
 *
 * Um par de funções, e as duas pontas passam por ele:
 *
 *  - `paraCampoLocal` — instante → texto do formulário, no fuso de QUEM OLHA.
 *  - `deCampoLocal`   — texto do formulário → ISO com fuso, no fuso de QUEM DIGITA.
 *
 * As duas rodam no navegador, que é o único lugar onde "o fuso do admin" é um
 * fato e não um palpite.
 *
 * `interpretarInstante` é a rede de segurança do lado do servidor: se um texto
 * sem fuso chegar assim mesmo (um cliente antigo, um script, um `curl`), ele é
 * lido no fuso da plataforma — não no UTC do datacenter, que não é o fuso de
 * ninguém.
 */

/**
 * Brasília, em minutos a somar ao horário local para chegar em UTC.
 *
 * Fixo, e não `Intl`: o Brasil não tem horário de verão desde 2019, e um
 * offset fixo é o que mantém a leitura estável em qualquer máquina. Se o
 * horário de verão voltar, é aqui que se mexe.
 */
export const OFFSET_DA_PLATAFORMA = '-03:00'

/** `"2026-05-10T14:00"` — hora de parede, sem fuso. */
const CAMPO_SEM_FUSO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0')
}

/**
 * O que o `<input type="datetime-local">` deve mostrar para este instante.
 *
 * Usa os getters locais (`getFullYear`, `getHours`…), não `toISOString()`:
 * o campo fala a hora de parede de quem está olhando a tela.
 */
export function paraCampoLocal(valor: Date | string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return ''
  const data = valor instanceof Date ? valor : new Date(valor)
  if (!Number.isFinite(data.getTime())) return ''

  return (
    `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}` +
    `T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`
  )
}

/**
 * O que sai do `<input type="datetime-local">` rumo à API: ISO em UTC.
 *
 * Devolve `null` para campo vazio — e `null` é significativo nas rotas de
 * prova: é assim que se TIRA um portão que existia. Não confundir com omitir o
 * campo, que é "não mexer".
 */
export function deCampoLocal(valor: string | null | undefined): string | null {
  if (!valor) return null
  const data = paraInstanteLocal(valor)
  return data ? data.toISOString() : null
}

/** O `Date` que o texto do campo representa no fuso de quem o digitou. */
export function paraInstanteLocal(valor: string | null | undefined): Date | null {
  if (!valor) return null
  // Sem fuso no texto, `new Date` usa o fuso de quem executa — e no navegador
  // esse é exatamente o fuso do admin, que é o que queremos.
  const data = new Date(valor)
  return Number.isFinite(data.getTime()) ? data : null
}

/**
 * Servidor: transforma o que chegou no corpo da requisição num instante.
 *
 * Um texto com fuso (`...Z`, `...-03:00`) é inequívoco e passa direto. Um texto
 * SEM fuso é ambíguo, e a resposta menos errada é o fuso da plataforma: o
 * datacenter em UTC não é o relógio de nenhum admin nem de nenhum aluno.
 */
export function interpretarInstante(valor: unknown): Date | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (valor instanceof Date) return Number.isFinite(valor.getTime()) ? valor : null

  if (typeof valor === 'number') {
    const data = new Date(valor)
    return Number.isFinite(data.getTime()) ? data : null
  }

  if (typeof valor !== 'string') return null

  const texto = valor.trim()
  if (!texto) return null

  const data = new Date(CAMPO_SEM_FUSO.test(texto) ? `${texto}${OFFSET_DA_PLATAFORMA}` : texto)
  return Number.isFinite(data.getTime()) ? data : null
}
