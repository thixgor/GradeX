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

// Quizzes de identificação escritos pela edição a partir das lâminas. Mapa
// separado porque a origem é outra — e porque `obterQuiz` decide por ele se o
// texto passa pelo dicionário de tradução, que só vale para o que veio em
// inglês.
export const QUIZZES_PROPRIOS: Record<string, Carregador> = {
  "laminas-divisao-celular-meiose": () => import('@/data/histologia/quizzes-proprios/laminas-divisao-celular-meiose.json'),
  "laminas-divisao-celular-mitose": () => import('@/data/histologia/quizzes-proprios/laminas-divisao-celular-mitose.json'),
  "laminas-estruturas-centrioles": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-centrioles.json'),
  "laminas-estruturas-cytoskeleton": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-cytoskeleton.json'),
  "laminas-estruturas-endoplasmic-reticulum": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-endoplasmic-reticulum.json'),
  "laminas-estruturas-glycogen": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-glycogen.json'),
  "laminas-estruturas-golgi": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-golgi.json'),
  "laminas-estruturas-lipid": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-lipid.json'),
  "laminas-estruturas-membranas": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-membranas.json'),
  "laminas-estruturas-mitochondria": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-mitochondria.json'),
  "laminas-estruturas-nucleo": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-nucleo.json'),
  "laminas-estruturas-secretory-granules": () => import('@/data/histologia/quizzes-proprios/laminas-estruturas-secretory-granules.json'),
  "laminas-fundamentos-da-celula-shapes": () => import('@/data/histologia/quizzes-proprios/laminas-fundamentos-da-celula-shapes.json'),
  "laminas-corantes": () => import('@/data/histologia/quizzes-proprios/laminas-corantes.json'),
  "laminas-preparacao-do-tecido": () => import('@/data/histologia/quizzes-proprios/laminas-preparacao-do-tecido.json'),
  "laminas-conceitos-gerais-membranas": () => import('@/data/histologia/quizzes-proprios/laminas-conceitos-gerais-membranas.json'),
  "laminas-conceitos-gerais-stroma-and-parenchyma": () => import('@/data/histologia/quizzes-proprios/laminas-conceitos-gerais-stroma-and-parenchyma.json'),
  "laminas-olho-eyelid": () => import('@/data/histologia/quizzes-proprios/laminas-olho-eyelid.json'),
  "laminas-olho-globe": () => import('@/data/histologia/quizzes-proprios/laminas-olho-globe.json'),
  "laminas-olho-retina": () => import('@/data/histologia/quizzes-proprios/laminas-olho-retina.json'),
  "laminas-ouvido-external-ear": () => import('@/data/histologia/quizzes-proprios/laminas-ouvido-external-ear.json'),
  "laminas-ouvido-inner-ear": () => import('@/data/histologia/quizzes-proprios/laminas-ouvido-inner-ear.json'),
  "laminas-ouvido-middle-ear": () => import('@/data/histologia/quizzes-proprios/laminas-ouvido-middle-ear.json'),
  "laminas-pele-associated-structures": () => import('@/data/histologia/quizzes-proprios/laminas-pele-associated-structures.json'),
  "laminas-pele-dermis": () => import('@/data/histologia/quizzes-proprios/laminas-pele-dermis.json'),
  "laminas-pele-epidermis": () => import('@/data/histologia/quizzes-proprios/laminas-pele-epidermis.json'),
  "laminas-pele-receptors": () => import('@/data/histologia/quizzes-proprios/laminas-pele-receptors.json'),
  "laminas-pele-visao-geral": () => import('@/data/histologia/quizzes-proprios/laminas-pele-visao-geral.json'),
  "laminas-sistema-cardiovascular-heart": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-cardiovascular-heart.json'),
  "laminas-sistema-cardiovascular-vessels": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-cardiovascular-vessels.json'),
  "laminas-sistema-digestorio-major-glands": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-digestorio-major-glands.json'),
  "laminas-sistema-digestorio-oral-cavity": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-digestorio-oral-cavity.json'),
  "laminas-sistema-digestorio-tubular-digestive-system": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-digestorio-tubular-digestive-system.json'),
  "laminas-sistema-endocrino-cells-and-clusters": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-endocrino-cells-and-clusters.json'),
  "laminas-sistema-endocrino-organs": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-endocrino-organs.json'),
  "laminas-sistema-endocrino-overview-of-endocrine-organs": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-endocrino-overview-of-endocrine-organs.json'),
  "laminas-sistema-linfoide-organs": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-linfoide-organs.json'),
  "laminas-sistema-linfoide-overview-of-lymphoid-tissues-and-organs": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-linfoide-overview-of-lymphoid-tissues-and-organs.json'),
  "laminas-sistema-linfoide-tecidos": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-linfoide-tecidos.json'),
  "laminas-sistema-reprodutor-feminino": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-reprodutor-feminino.json'),
  "laminas-sistema-reprodutor-masculino": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-reprodutor-masculino.json'),
  "laminas-sistema-respiratorio-blood-supply": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-respiratorio-blood-supply.json'),
  "laminas-sistema-respiratorio-extrapulmonary-passages": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-respiratorio-extrapulmonary-passages.json'),
  "laminas-sistema-respiratorio-intrapulmonary-passageways": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-respiratorio-intrapulmonary-passageways.json'),
  "laminas-sistema-respiratorio-overview-of-the-respiratory-system": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-respiratorio-overview-of-the-respiratory-system.json'),
  "laminas-sistema-urinario-excretory-passageways": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-urinario-excretory-passageways.json'),
  "laminas-sistema-urinario-overview-of-the-urinary-system": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-urinario-overview-of-the-urinary-system.json'),
  "laminas-sistema-urinario-renal-corpuscle": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-urinario-renal-corpuscle.json'),
  "laminas-sistema-urinario-tubules-and-collecting-system": () => import('@/data/histologia/quizzes-proprios/laminas-sistema-urinario-tubules-and-collecting-system.json'),
  "laminas-epitelio-glandular": () => import('@/data/histologia/quizzes-proprios/laminas-epitelio-glandular.json'),
  "laminas-epitelio-revestimento": () => import('@/data/histologia/quizzes-proprios/laminas-epitelio-revestimento.json'),
  "laminas-fundamentos-dos-tecidos": () => import('@/data/histologia/quizzes-proprios/laminas-fundamentos-dos-tecidos.json'),
  "laminas-tecido-conjuntivo-blood-and-hemopoiesis": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-conjuntivo-blood-and-hemopoiesis.json'),
  "laminas-tecido-conjuntivo-bone": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-conjuntivo-bone.json'),
  "laminas-tecido-conjuntivo-cartilage": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-conjuntivo-cartilage.json'),
  "laminas-tecido-conjuntivo-special": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-conjuntivo-special.json'),
  "laminas-tecido-conjuntivo-tecido-conjuntivo-propriamente-dito": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-conjuntivo-tecido-conjuntivo-propriamente-dito.json'),
  "laminas-tecido-muscular-cardiac": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-muscular-cardiac.json'),
  "laminas-tecido-muscular-skeletal": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-muscular-skeletal.json'),
  "laminas-tecido-muscular-smooth": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-muscular-smooth.json'),
  "laminas-tecido-nervoso-neuron-types": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-nervoso-neuron-types.json'),
  "laminas-tecido-nervoso-peripheral-nerve": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-nervoso-peripheral-nerve.json'),
  "laminas-tecido-nervoso-receptors-and-terminals": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-nervoso-receptors-and-terminals.json'),
  "laminas-tecido-nervoso-supporting-cells": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-nervoso-supporting-cells.json'),
  "laminas-tecido-nervoso-visao-geral": () => import('@/data/histologia/quizzes-proprios/laminas-tecido-nervoso-visao-geral.json'),
}
