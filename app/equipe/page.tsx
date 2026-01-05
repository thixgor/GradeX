'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Linkedin, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TeamMember {
  name: string
  role: string
  image?: string
  description?: string
  imageOffsetY?: number // Offset vertical em porcentagem (0-100)
}

export default function EquipePage() {
  const router = useRouter()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [leadership, setLeadership] = useState<TeamMember[]>([
    {
      name: 'Thiago Ferreira Rodrigues',
      role: 'CEO, Fundador & Líder de Desenvolvimento',
      description: 'Visionário e desenvolvedor por trás da DomineAqui, Thiago criou toda a plataforma do zero com ideias bem fundamentadas. Jovem e extremamente obstinado, possui a capacidade única de transformar ideias simples em produtos excepcionais. Lidera a empresa com foco em inovação educacional, excelência técnica e design inteligente.',
      image: 'https://i.imgur.com/z1pX1ze.jpeg',
      imageOffsetY: 50
    },
    {
      name: 'Joaquim Henrique Soares',
      role: 'Sócio Co-Fundador',
      description: 'Estrategista e parceiro essencial no desenvolvimento e crescimento da plataforma. Trabalha lado a lado com Thiago para expandir o alcance da DomineAqui e garantir que a visão da empresa se transforme em realidade.',
      image: undefined,
      imageOffsetY: 50
    }
  ])

  const [instructors, setInstructors] = useState<TeamMember[]>([
    {
      name: 'Gisele Grubitsch Mietzsch',
      role: 'Ministrante Parceira - Nutricionista e Estudante de Medicina',
      description: 'Gisele tem 41 anos e é nutricionista pós-graduada em Metabolismo e Emagrecimento. Acredita na nutrição como ferramenta essencial para promoção, manutenção e recuperação da saúde. Atualmente cursa Medicina, buscando aprofundamento técnico-científico para oferecer o melhor cuidado aos seus pacientes. Apaixonada pelo ensino, encontra realização profissional na troca contínua de conhecimento entre quem ensina e quem aprende.',
      image: 'https://i.imgur.com/mrWGYVv.jpeg',
      imageOffsetY: 50
    },
    {
      name: 'Ronaldo Campos Rodrigues',
      role: 'Ministrante Parceiro - Mestre em Cardiologia',
      description: 'Com mais de 30 anos de atuação na medicina, Ronaldo é Mestre em Cardiologia, Especialista em Ecocardiografia e Professor apaixonado pela arte de ensinar. Domina profundamente a área cardiovascular e dedica-se a transmitir as fundamentações e integrações patológicas, demonstrando a importância vital dos fatores cardiovasculares no cotidiano médico. Sua expertise abrange medicina cardiológica atlética e disfunções patológicas. Fundador do ECO-RJ em Recreio dos Bandeirantes, ministra cursos presenciais focados na aprendizagem prática de exames cardiovasculares, incluindo rastreios, análise de ateroscleroses, danos vasculares induzidos por medicamentos e alterações morfológicas cardiovasculares congênitas ou por condicionamento.',
      image: 'https://i.imgur.com/6rs82bt.jpeg',
      imageOffsetY: 50
    },
    {
      name: 'Amanda Santiago',
      role: 'Ministrante Parceira',
      image: undefined,
      imageOffsetY: 50
    },
    {
      name: 'Maria Rita Meyer Assunção',
      role: 'Ministrante Parceira',
      image: undefined,
      imageOffsetY: 50
    },
    {
      name: 'João Henrique Pimentel',
      role: 'Ministrante Parceiro - Estudante de Medicina',
      description: 'João Henrique é um estudante profundamente vocacionado para a Medicina e para a área da Saúde. Com especial interesse em Cirurgia, Neuroanatomia e Sistema Cardiovascular, destaca-se pela postura obstinada, curiosa e rigorosa no estudo dos fundamentos científicos. Atua como monitor de Habilidades e Atitudes Médicas e é monitor vinculado à Sociedade Brasileira de Anestesiologia (SBA), demonstrando interesse precoce por áreas de alta complexidade. Reconhecido pelo comprometimento e pela constante disposição em aprender, constrói sua trajetória pautada na disciplina, respeito ao paciente e busca permanente pela evolução pessoal e profissional.',
      image: 'https://i.imgur.com/oHEjiJE.png',
      imageOffsetY: 50
    },
    {
      name: 'Gustavo Murillo Gonçalves Caúla',
      role: 'Ministrante Parceiro',
      image: undefined,
      imageOffsetY: 50
    }
  ])

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const res = await fetch('/api/admin/equipe')
      if (res.ok) {
        const data = await res.json()

        // Atualizar com dados salvos
        if (data.leadership) {
          setLeadership(prev => prev.map(member => {
            const saved = data.leadership.find((l: any) => l.name === member.name)
            return saved ? { ...member, imageOffsetY: saved.imageOffsetY } : member
          }))
        }

        if (data.instructors) {
          setInstructors(prev => prev.map(member => {
            const saved = data.instructors.find((i: any) => i.name === member.name)
            return saved ? { ...member, imageOffsetY: saved.imageOffsetY } : member
          }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  return (
    <div className="bg-gradient-to-br from-background to-muted flex flex-col flex-1">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Nossa Equipe
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Conheça as pessoas apaixonadas que transformam a educação e impulsionam o sucesso de milhares de estudantes.
              Unidos pela excelência, trabalhamos para que você seja o foco e a referência.
            </p>
          </div>

          {/* Liderança */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Liderança</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary/50 to-primary mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {leadership.map((member, index) => (
                <div
                  key={member.name}
                  className="group relative bg-card/50 backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-3"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards',
                    opacity: 0
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Animated Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Floating Glow Effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                  {/* Image Container */}
                  <div className="relative h-64 sm:h-80 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                        style={{
                          objectPosition: `50% ${member.imageOffsetY || 50}%`
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-4xl font-bold text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      </div>
                    )}

                    {/* Animated Decorative Elements */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-primary to-transparent transform scale-y-0 group-hover:scale-y-100 transition-transform duration-700 delay-100"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/30 to-transparent transform translate-x-12 -translate-y-12 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>

                    {/* Bottom Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card/90 to-transparent"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6 relative z-10">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-sm font-semibold text-primary/80 mb-3">
                      {member.role}
                    </p>
                    {member.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {member.description}
                      </p>
                    )}
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </section>

          {/* Ministrantes Parceiros */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Ministrantes Parceiros</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary/50 to-primary mx-auto rounded-full"></div>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Profissionais dedicados que compartilham conhecimento e experiência para elevar o nível de preparação dos nossos alunos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((member, index) => {
                const cardId = `instructor-${index}`
                const isExpanded = expandedCards.has(cardId)

                return (
                  <div
                    key={member.name}
                    className="group relative bg-card/50 backdrop-blur-sm rounded-xl border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                    style={{
                      animationDelay: `${(index + 2) * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    {/* Animated Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none animate-pulse"></div>

                    {/* Floating Particles Effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

                    {/* Image Container */}
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                          style={{
                            objectPosition: `50% ${member.imageOffsetY || 50}%`
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/60 to-primary/40 flex items-center justify-center text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-500">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        </div>
                      )}

                      {/* Animated Corner Accent */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/40 to-transparent transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>

                      {/* Bottom Gradient Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card/80 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="p-5 relative">
                      <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-xs text-primary/70 font-medium mb-3">
                        {member.role}
                      </p>

                      {member.description && (
                        <>
                          <p className={`text-xs text-muted-foreground leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-4'} lg:line-clamp-4 lg:group-hover:line-clamp-none`}>
                            {member.description}
                          </p>

                          {/* Mobile Expand Button - Only visible on mobile/tablet */}
                          <button
                            onClick={() => toggleCardExpansion(cardId)}
                            className="mt-3 flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors lg:hidden"
                          >
                            <span>{isExpanded ? 'Ver menos' : 'Ler mais'}</span>
                            <svg
                              className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Desktop Hover Indicator - Only visible on desktop */}
                          <div className="mt-3 hidden lg:flex items-center gap-1 text-xs text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span>Passe o mouse para ler mais</span>
                            <svg className="w-3 h-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Shine Effect on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Call to Action */}
          <div className="relative mt-16 text-center p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl border overflow-hidden group">
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Floating Particles */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse delay-300"></div>

            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Junte-se a nós
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Seja o foco. Seja a referência. Alcance seus objetivos com a melhor equipe ao seu lado.
              </p>
              <Button
                onClick={() => router.push('/buy')}
                className="relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 group/btn overflow-hidden"
              >
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                <span className="relative z-10">Começar Agora</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
