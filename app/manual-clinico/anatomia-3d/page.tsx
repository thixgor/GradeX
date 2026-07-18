'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import {
  ArrowLeft,
  Sparkles,
  Box,
  Heart,
  Activity,
  Droplets,
  Brain,
  Bone,
  Wind,
  RotateCw,
  GraduationCap,
} from 'lucide-react'

/**
 * Modelos anatômicos 3D (embeds do Sketchfab) organizados por categoria.
 * Fonte de todos os modelos: Universidade de Dundee.
 */
interface Modelo3D {
  titulo: string
  descricao: string
  // URL do embed do Sketchfab. `null` quando o modelo não possui embed disponível.
  embedUrl: string | null
  // Sinaliza pontos que precisam de revisão posterior (ex.: URL duplicada).
  nota?: string
}

interface CategoriaAnatomia {
  titulo: string
  icon: typeof Heart
  modelos: Modelo3D[]
}

const FONTE = 'Universidade de Dundee'

const CATEGORIAS: CategoriaAnatomia[] = [
  {
    titulo: 'Coração e Sistema Cardiovascular',
    icon: Heart,
    modelos: [
      {
        titulo: 'Modelo 3D do coração humano',
        descricao:
          'Modelo rotacionável do coração humano, baseado em escaneamento 3D de um coração plastinado.',
        // ⚠️ REVISÃO: esta URL é idêntica à do card "Artérias coronárias do coração".
        // Uma das duas provavelmente está incorreta nos dados de origem — validar embeds.
        embedUrl: 'https://sketchfab.com/models/8e86582b400843eba805f5ad81747911/embed',
        nota: 'URL de embed duplicada com "Artérias coronárias do coração" — revisar.',
      },
      {
        titulo: 'Artérias coronárias do coração',
        descricao:
          'Mostra as artérias coronárias do coração humano, criado no ZBrush como recurso educacional sobre a vascularização cardíaca.',
        // ⚠️ REVISÃO: esta URL é idêntica à do card "Modelo 3D do coração humano".
        // Uma das duas provavelmente está incorreta nos dados de origem — validar embeds.
        embedUrl: 'https://sketchfab.com/models/8e86582b400843eba805f5ad81747911/embed',
        nota: 'URL de embed duplicada com "Modelo 3D do coração humano" — revisar.',
      },
      {
        titulo: 'Vista externa do coração',
        descricao:
          'Mostra a anatomia externa do coração humano, com anotações das características gerais. Criado no ZBrush.',
        embedUrl:
          'https://sketchfab.com/3d-models/cardiac-anatomy-external-view-of-human-heart-a3f0ea2030214a6bbaa97e7357eebd58/embed',
      },
      {
        titulo: 'Veias cardíacas',
        descricao: 'Mostra as veias cardíacas do coração humano. Criado no ZBrush.',
        embedUrl:
          'https://sketchfab.com/3d-models/cardiac-anatomy-cardiac-veins-of-the-heart-faa6c5b169ec4928bda1f6bf36e0fcb6/embed',
      },
      {
        titulo: 'Sistema de condução cardíaca',
        descricao:
          'Mostra os principais componentes do sistema de condução: nó SA, nó AV, feixe de His, ramos e fibras de Purkinje. Baseado em impressão 3D. Rótulos numerados em inglês.',
        embedUrl: 'https://sketchfab.com/models/20a5e36391474f2b99e1a4c94c707b47/embed',
      },
      {
        titulo: 'Fluxo sanguíneo no coração',
        descricao:
          'Mostra o percurso do sangue: desoxigenado entrando no átrio direito, indo aos pulmões, retornando oxigenado ao átrio esquerdo e sendo bombeado para a aorta. Colaboração das Universidades de Groningen, Leiden e Delft. Rótulos em inglês.',
        // NOTA: a especificação da tarefa afirma que este modelo "não tem URL de embed",
        // mas os dados fornecidos listaram a URL abaixo. Mantemos o embed funcional e
        // sinalizamos a divergência para revisão posterior.
        embedUrl: 'https://sketchfab.com/models/395666697531489aa445674a133969b9/embed',
        nota: 'A especificação indicou ausência de URL, mas os dados traziam uma — confirmar embed.',
      },
    ],
  },
  {
    titulo: 'Coração e Pulmões',
    icon: Activity,
    modelos: [
      {
        titulo: 'Coração e pulmões normais',
        descricao:
          'Mostra ventrículos esquerdo e direito, átrios, aorta, veias cavas superior e inferior, tronco e artérias pulmonares, veias pulmonares e ambos os pulmões. Colaboração das Universidades de Groningen, Leiden e Delft. Rótulos numerados em inglês.',
        embedUrl: 'https://sketchfab.com/models/5c62cd4d4ba04243be1062d2263d3ef0/embed',
      },
    ],
  },
  {
    titulo: 'Sistema Linfático',
    icon: Droplets,
    modelos: [
      {
        titulo: 'Sistema linfático',
        descricao:
          'Visão geral do sistema linfático humano. Mostra também a traqueia (branco), parte da aorta (vermelho), o esqueleto (marrom claro) e partes do sistema venoso, já que os linfáticos acompanham as veias nos membros e as artérias no tronco.',
        embedUrl: 'https://sketchfab.com/models/14800d739ecb46678d7584a401b0aa77/embed',
      },
    ],
  },
  {
    titulo: 'Cérebro e Sistema Nervoso',
    icon: Brain,
    modelos: [
      {
        titulo: 'Nervos cranianos',
        descricao:
          'Modelo do cérebro para visualizar os pontos de saída dos 12 nervos cranianos em 3D. As anotações detalham origem, saída craniana, inervação, função e tipo de nervo.',
        embedUrl: 'https://sketchfab.com/models/82d87cb89d6c48f0984a59c4f2a4cf9a/embed',
      },
      {
        titulo: 'Vista inferior do cérebro',
        descricao:
          'Vista inferior de um cérebro normal, de autópsia. Modelo de fotogrametria capturado com 123D Capture.',
        embedUrl:
          'https://sketchfab.com/3d-models/normal-brain-0de8a436e4c4411a903e35267ba1d254/embed',
      },
      {
        titulo: 'Ventrículos do cérebro',
        descricao: 'Mostra os ventrículos do cérebro e as estruturas adjacentes.',
        embedUrl:
          'https://sketchfab.com/3d-models/ventricles-a5c44ec4384a423f8df9c17d3dab43fc/embed',
      },
      {
        titulo: 'Regiões do cérebro',
        descricao: 'Destaca as diferentes regiões do cérebro.',
        embedUrl:
          'https://sketchfab.com/3d-models/regions-of-the-brain-b2aac93ee4c440ed911f5765158edc9f/embed',
      },
    ],
  },
  {
    titulo: 'Crânio e Ossos da Cabeça',
    icon: Bone,
    modelos: [
      {
        titulo: 'Ossos da órbita, incluindo ossos palatinos',
        descricao: 'Destaca os ossos da órbita, incluindo os ossos palatinos.',
        embedUrl:
          'https://sketchfab.com/3d-models/bones-of-the-orbit-including-palatine-bones-4d76805781d34070926dd9797a4e5013/embed',
      },
      {
        titulo: 'Corte sagital do crânio e mandíbula',
        descricao:
          'Ossos do crânio individualmente coloridos e anotados, usando nomenclatura em inglês. Rótulos em inglês.',
        embedUrl: 'https://sketchfab.com/models/7565dbc2297149d29ee76b7bd270e7d2/embed',
      },
    ],
  },
  {
    titulo: 'Vias Aéreas Superiores',
    icon: Wind,
    modelos: [
      {
        titulo: 'Anatomia da laringe',
        descricao: 'Mostra a anatomia da laringe. Rótulos numerados em inglês.',
        embedUrl:
          'https://sketchfab.com/3d-models/anatomy-of-the-larynx-a00bc73a303c46248db6a13a88b23404/embed',
      },
    ],
  },
]

/**
 * Embed 3D com carregamento sob demanda: até o usuário tocar/clicar no
 * placeholder, o iframe do Sketchfab NÃO é montado. Isso evita pesar a página
 * em mobile (são muitos modelos) e garante que o arraste em 360° só capture o
 * toque depois que o usuário decide interagir, sem travar o scroll vertical.
 */
function ModeloEmbed({ modelo }: { modelo: Modelo3D }) {
  const [ativo, setAtivo] = useState(false)

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-white/[0.08] bg-black/25">
      {!modelo.embedUrl ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <Box className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Modelo 3D indisponível no momento.</p>
        </div>
      ) : ativo ? (
        <iframe
          title={modelo.titulo}
          src={modelo.embedUrl}
          loading="lazy"
          frameBorder={0}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          // Prefixos de fornecedor mantidos conforme o formato de embed do Sketchfab.
          {...({ mozallowfullscreen: 'true', webkitallowfullscreen: 'true' } as any)}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAtivo(true)}
          className="group/embed absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/[0.06] to-transparent transition-colors hover:from-primary/[0.12]"
          aria-label={`Carregar modelo 3D: ${modelo.titulo}`}
        >
          <div className="rounded-full bg-primary/15 p-4 transition-transform group-hover/embed:scale-110">
            <RotateCw className="h-7 w-7 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Carregar modelo 3D</span>
          <span className="text-[11px] text-muted-foreground">Toque para girar em 360°</span>
        </button>
      )}
    </div>
  )
}

function CardModelo({ modelo }: { modelo: Modelo3D }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
      <ModeloEmbed modelo={modelo} />
      <div className="p-4">
        <h3 className="font-semibold leading-snug">{modelo.titulo}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{modelo.descricao}</p>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Fonte: {FONTE}</span>
        </div>
      </div>
    </div>
  )
}

export default function Anatomia3DPage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <Anatomia3DContent />
    </AppShell>
  )
}

function Anatomia3DContent() {
  const router = useRouter()
  const totalModelos = CATEGORIAS.reduce((n, c) => n + c.modelos.length, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/60 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-4 pt-8 pb-10 max-w-6xl">
          <button
            onClick={() => router.push('/manual-clinico')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </button>

          <div className="text-center mb-2">
            <div className="inline-flex flex-col items-center">
              <div className="inline-flex items-center gap-3 mb-3 px-5 py-2 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12]">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                  Anatomia interativa
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold font-heading bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                Anatomia 3D
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl text-base sm:text-lg leading-relaxed">
                Modelos anatômicos 3D interativos e rotacionáveis, organizados por sistema. Toque em
                cada modelo para carregá-lo e explorá-lo em 360°.
              </p>
              {totalModelos > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">
                    {totalModelos} modelos disponíveis
                  </span>
                </div>
              )}

              {/* Atribuição obrigatória, visível no topo da seção */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.1] bg-white/[0.04] text-xs font-semibold text-muted-foreground">
                <GraduationCap className="h-4 w-4 text-primary" />
                Fonte: {FONTE}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ CATEGORIAS ══════════ */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-12">
          {CATEGORIAS.map((categoria) => {
            const Icon = categoria.icon
            return (
              <section key={categoria.titulo}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{categoria.titulo}</h2>
                    <p className="text-xs text-muted-foreground">
                      {categoria.modelos.length} modelo{categoria.modelos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Mobile: 1 por linha · Tablet: 2 · Desktop: 3 */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {categoria.modelos.map((modelo) => (
                    <CardModelo key={modelo.titulo} modelo={modelo} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Atribuição também no rodapé da seção */}
        <div className="mt-12 border-t border-white/[0.06] pt-6 text-center">
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-primary" />
            Todos os modelos anatômicos têm como fonte a <strong className="font-semibold">{FONTE}</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
