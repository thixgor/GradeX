export const CAPITULOS_WEBPATH_UTAH_CARREGADORES: Record<
  string,
  () => Promise<{ default: unknown }>
> = {
  'aterosclerose-trombose': () =>
    import('@/data/histopatologia/webpath-utah/aterosclerose-trombose.json'),
  'lesao-celular': () => import('@/data/histopatologia/webpath-utah/lesao-celular.json'),
  'patologia-forense': () =>
    import('@/data/histopatologia/webpath-utah/patologia-forense.json'),
  imunopatologia: () => import('@/data/histopatologia/webpath-utah/imunopatologia.json'),
  infeccao: () => import('@/data/histopatologia/webpath-utah/infeccao.json'),
  inflamacao: () => import('@/data/histopatologia/webpath-utah/inflamacao.json'),
  neoplasia: () => import('@/data/histopatologia/webpath-utah/neoplasia.json'),
  'pediatrica-perinatal': () =>
    import('@/data/histopatologia/webpath-utah/pediatrica-perinatal.json'),
  placenta: () => import('@/data/histopatologia/webpath-utah/placenta.json'),
  cardiovascular: () => import('@/data/histopatologia/webpath-utah/cardiovascular.json'),
  'sistema-nervoso-central': () =>
    import('@/data/histopatologia/webpath-utah/sistema-nervoso-central.json'),
  endocrina: () => import('@/data/histopatologia/webpath-utah/endocrina.json'),
  'genital-feminino': () =>
    import('@/data/histopatologia/webpath-utah/genital-feminino.json'),
  gastrointestinal: () => import('@/data/histopatologia/webpath-utah/gastrointestinal.json'),
  hematopatologia: () => import('@/data/histopatologia/webpath-utah/hematopatologia.json'),
  hepatica: () => import('@/data/histopatologia/webpath-utah/hepatica.json'),
  'genital-masculino': () =>
    import('@/data/histopatologia/webpath-utah/genital-masculino.json'),
  pulmonar: () => import('@/data/histopatologia/webpath-utah/pulmonar.json'),
  renal: () => import('@/data/histopatologia/webpath-utah/renal.json'),
}
