/* eslint-disable */
// ARQUIVO GERADO — não edite à mão.
// Origem: scripts/histologia/construir-dados.mjs
//
// Mapa literal de `import()` por fragmento e por quiz. É literal porque o
// rastreamento de arquivos da Vercel precisa enxergar cada especificador para
// incluir o JSON no bundle da função; um `import()` com caminho montado em
// variável funciona em desenvolvimento e devolve 404 em produção.
//
// Os carregadores são tipados como `unknown`: o TypeScript infere dos JSON os
// tipos literais (`tipo: string` em vez de `'lamina' | 'secao'`, por exemplo) e
// afirmar a forma aqui só produziria um `as` por linha. A garantia real vem de
// `__tests__/histologia/dados.test.ts`, que valida cada fragmento contra o
// schema Zod — verificação de valor, não de sintaxe.
type Carregador = () => Promise<{ default: unknown }>

export const FRAGMENTOS: Record<string, Carregador> = {
  "_setores": () => import('@/data/histologia/paginas/_setores.json'),
  "celulas__divisao-celular": () => import('@/data/histologia/paginas/celulas__divisao-celular.json'),
  "celulas__estruturas": () => import('@/data/histologia/paginas/celulas__estruturas.json'),
  "celulas__fundamentos-da-celula": () => import('@/data/histologia/paginas/celulas__fundamentos-da-celula.json'),
  "histologia-basica__corantes": () => import('@/data/histologia/paginas/histologia-basica__corantes.json'),
  "histologia-basica__preparacao-do-tecido": () => import('@/data/histologia/paginas/histologia-basica__preparacao-do-tecido.json'),
  "orgaos-e-sistemas__conceitos-gerais": () => import('@/data/histologia/paginas/orgaos-e-sistemas__conceitos-gerais.json'),
  "orgaos-e-sistemas__olho": () => import('@/data/histologia/paginas/orgaos-e-sistemas__olho.json'),
  "orgaos-e-sistemas__ouvido": () => import('@/data/histologia/paginas/orgaos-e-sistemas__ouvido.json'),
  "orgaos-e-sistemas__pele": () => import('@/data/histologia/paginas/orgaos-e-sistemas__pele.json'),
  "orgaos-e-sistemas__sistema-cardiovascular": () => import('@/data/histologia/paginas/orgaos-e-sistemas__sistema-cardiovascular.json'),
  "orgaos-e-sistemas__sistema-digestorio": () => import('@/data/histologia/paginas/orgaos-e-sistemas__sistema-digestorio.json'),
  "orgaos-e-sistemas__sistema-endocrino": () => import('@/data/histologia/paginas/orgaos-e-sistemas__sistema-endocrino.json'),
  "orgaos-e-sistemas__sistema-linfoide": () => import('@/data/histologia/paginas/orgaos-e-sistemas__sistema-linfoide.json'),
  "orgaos-e-sistemas__sistema-reprodutor": () => import('@/data/histologia/paginas/orgaos-e-sistemas__sistema-reprodutor.json'),
  "orgaos-e-sistemas__sistema-respiratorio": () => import('@/data/histologia/paginas/orgaos-e-sistemas__sistema-respiratorio.json'),
  "orgaos-e-sistemas__sistema-urinario": () => import('@/data/histologia/paginas/orgaos-e-sistemas__sistema-urinario.json'),
  "tecidos__epitelio": () => import('@/data/histologia/paginas/tecidos__epitelio.json'),
  "tecidos__fundamentos-dos-tecidos": () => import('@/data/histologia/paginas/tecidos__fundamentos-dos-tecidos.json'),
  "tecidos__tecido-conjuntivo": () => import('@/data/histologia/paginas/tecidos__tecido-conjuntivo.json'),
  "tecidos__tecido-muscular": () => import('@/data/histologia/paginas/tecidos__tecido-muscular.json'),
  "tecidos__tecido-nervoso": () => import('@/data/histologia/paginas/tecidos__tecido-nervoso.json'),
}

export const QUIZZES: Record<string, Carregador> = {
  "osso": () => import('@/data/histologia/quizzes/osso.json'),
  "sistema-cardiovascular": () => import('@/data/histologia/quizzes/sistema-cardiovascular.json'),
  "cartilagem": () => import('@/data/histologia/quizzes/cartilagem.json'),
  "celulas": () => import('@/data/histologia/quizzes/celulas.json'),
  "tecido-conjuntivo-propriamente-dito": () => import('@/data/histologia/quizzes/tecido-conjuntivo-propriamente-dito.json'),
  "sistema-digestorio": () => import('@/data/histologia/quizzes/sistema-digestorio.json'),
  "ouvido": () => import('@/data/histologia/quizzes/ouvido.json'),
  "sistema-endocrino": () => import('@/data/histologia/quizzes/sistema-endocrino.json'),
  "epitelios-de-revestimento": () => import('@/data/histologia/quizzes/epitelios-de-revestimento.json'),
  "epitelios-glandulares-exocrinos": () => import('@/data/histologia/quizzes/epitelios-glandulares-exocrinos.json'),
  "olho": () => import('@/data/histologia/quizzes/olho.json'),
  "sistema-reprodutor-feminino": () => import('@/data/histologia/quizzes/sistema-reprodutor-feminino.json'),
  "sistema-linfoide": () => import('@/data/histologia/quizzes/sistema-linfoide.json'),
  "sistema-reprodutor-masculino": () => import('@/data/histologia/quizzes/sistema-reprodutor-masculino.json'),
  "tecido-muscular": () => import('@/data/histologia/quizzes/tecido-muscular.json'),
  "tecido-nervoso": () => import('@/data/histologia/quizzes/tecido-nervoso.json'),
  "sistema-respiratorio": () => import('@/data/histologia/quizzes/sistema-respiratorio.json'),
  "pele": () => import('@/data/histologia/quizzes/pele.json'),
  "sistema-urinario": () => import('@/data/histologia/quizzes/sistema-urinario.json'),
}
