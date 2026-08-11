'use client'

import { useState } from 'react'

import type { MidiaExibivel } from '@/lib/histopatologia/esquemas'
import { ImagemHistopatologicaRemota, VisualizadorDeLamina } from './imagem-remota'

export interface EntradaDaGaleriaWebPathUtah {
  midia: MidiaExibivel
  nomeOriginal: string
  secao: string
  pontosDeObservacao: string[]
}

export function GaleriaWebPathUtah({ entradas }: { entradas: EntradaDaGaleriaWebPathUtah[] }) {
  const [aberta, setAberta] = useState<number | null>(null)
  const selecionada = aberta === null ? undefined : entradas[aberta]

  return (
    <>
      <ol className="grid gap-3 lg:grid-cols-2">
        {entradas.map((entrada, indice) => (
          <li key={entrada.midia.id}>
            <ImagemHistopatologicaRemota
              midia={entrada.midia}
              onAbrir={() => setAberta(indice)}
              nomeOriginal={entrada.nomeOriginal}
              secao={entrada.secao}
              pontosDeObservacao={entrada.pontosDeObservacao}
            />
          </li>
        ))}
      </ol>

      {selecionada && aberta !== null && (
        <VisualizadorDeLamina
          midia={selecionada.midia}
          onFechar={() => setAberta(null)}
          onAnterior={aberta > 0 ? () => setAberta(aberta - 1) : undefined}
          onProxima={aberta < entradas.length - 1 ? () => setAberta(aberta + 1) : undefined}
          posicao={`${aberta + 1} de ${entradas.length} nesta página`}
        />
      )}
    </>
  )
}
