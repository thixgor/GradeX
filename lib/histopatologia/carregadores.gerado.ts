/* eslint-disable */
// ARQUIVO GERADO — não edite à mão.
// Origem: scripts/histopatologia/construir-dados.mjs
//
// Mapa literal de `import()` por doença e por sistema. É literal porque o
// rastreamento de arquivos da Vercel precisa enxergar cada especificador para
// incluir o JSON no bundle da função; um `import()` com caminho montado em
// variável funciona em desenvolvimento e devolve 404 em produção.
//
// Os carregadores são tipados como `unknown`: o TypeScript infere dos JSON
// tipos literais (`estado: string` em vez da união fechada, por exemplo) e
// afirmar a forma aqui só produziria um `as` por linha. A garantia real vem de
// `__tests__/histopatologia/dados.test.ts`, que valida cada arquivo contra o
// schema Zod — verificação de valor, não de sintaxe.
type Carregador = () => Promise<{ default: unknown }>

export const FRAGMENTOS_DE_DOENCA: Record<string, Carregador> = {
  "adenocarcinoma-colorretal": () => import('@/data/histopatologia/doencas/adenocarcinoma-colorretal.json'),
  "apendicite-aguda": () => import('@/data/histopatologia/doencas/apendicite-aguda.json'),
  "esteatose-hepatica": () => import('@/data/histopatologia/doencas/esteatose-hepatica.json'),
  "hiperplasia-nodular-da-prostata": () => import('@/data/histopatologia/doencas/hiperplasia-nodular-da-prostata.json'),
  "trombose-venosa": () => import('@/data/histopatologia/doencas/trombose-venosa.json'),
  "tuberculose-pulmonar": () => import('@/data/histopatologia/doencas/tuberculose-pulmonar.json'),
}

export const INVENTARIO_POR_SISTEMA: Record<string, Carregador> = {
  "cardiovascular": () => import('@/data/histopatologia/inventario/cardiovascular.json'),
  "endocrino": () => import('@/data/histopatologia/inventario/endocrino.json'),
  "gastrointestinal": () => import('@/data/histopatologia/inventario/gastrointestinal.json'),
  "ginecologico-placenta": () => import('@/data/histopatologia/inventario/ginecologico-placenta.json'),
  "hematolinfoide": () => import('@/data/histopatologia/inventario/hematolinfoide.json'),
  "hepatobiliopancreatico": () => import('@/data/histopatologia/inventario/hepatobiliopancreatico.json'),
  "mama": () => import('@/data/histopatologia/inventario/mama.json'),
  "nao-classificado": () => import('@/data/histopatologia/inventario/nao-classificado.json'),
  "ossos-partes-moles": () => import('@/data/histopatologia/inventario/ossos-partes-moles.json'),
  "patologia-geral": () => import('@/data/histopatologia/inventario/patologia-geral.json'),
  "pele": () => import('@/data/histopatologia/inventario/pele.json'),
  "respiratorio": () => import('@/data/histopatologia/inventario/respiratorio.json'),
  "sistema-nervoso": () => import('@/data/histopatologia/inventario/sistema-nervoso.json'),
  "urinario-genital-masculino": () => import('@/data/histopatologia/inventario/urinario-genital-masculino.json'),
}
