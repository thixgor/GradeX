import type { CatalogoRaioX, EstruturaResumo, EstudoResumo } from './catalogo'

/**
 * Busca do catálogo de Raio-X — a versão que roda no navegador.
 *
 * `lib/radiologia/raio-x.ts` tem funções equivalentes, mas elas leem o acervo
 * completo do escopo do módulo e por isso arrastariam os 172 KB do atlas para
 * dentro do bundle. Aqui as funções são puras: recebem o catálogo magro que o
 * servidor já enviou e não importam dado nenhum (o `import type` some na
 * compilação).
 */

export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function filtrarEstudos(catalogo: CatalogoRaioX, termo: string): EstudoResumo[] {
  const consulta = normalizar(termo.trim())
  if (!consulta) return catalogo.estudos
  return catalogo.estudos.filter((estudo) =>
    normalizar(
      [
        estudo.titulo,
        estudo.incidencia,
        estudo.camada,
        estudo.regiaoTitulo,
        estudo.resumo,
        ...estudo.estruturas.map((estrutura) => `${estrutura.nome} ${estrutura.original}`),
      ].join(' '),
    ).includes(consulta),
  )
}

export interface AchadoEstrutura {
  estudo: EstudoResumo
  estrutura: EstruturaResumo
}

/**
 * Busca no nível da estrutura, e não do exame: digitar "escafoide" leva à
 * demarcação certa em vez de devolver "Mão e punho (PA)" para caçar na lista.
 * Quem começa com o termo vem antes de quem só o contém.
 */
export function filtrarEstruturas(
  catalogo: CatalogoRaioX,
  termo: string,
  limite = 24,
): AchadoEstrutura[] {
  const consulta = normalizar(termo.trim())
  if (consulta.length < 2) return []
  const exatos: AchadoEstrutura[] = []
  const parciais: AchadoEstrutura[] = []
  for (const estudo of catalogo.estudos) {
    for (const estrutura of estudo.estruturas) {
      if (!normalizar(`${estrutura.nome} ${estrutura.original}`).includes(consulta)) continue
      const destino = normalizar(estrutura.nome).startsWith(consulta) ? exatos : parciais
      destino.push({ estudo, estrutura })
    }
  }
  return [...exatos, ...parciais].slice(0, limite)
}
