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
  imageZoom?: number // Zoom da imagem em porcentagem (100 = normal, 150 = 1.5x zoom)
}

export default function EquipePage() {
  const router = useRouter()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [leadership, setLeadership] = useState<TeamMember[]>([])
  const [instructors, setInstructors] = useState<TeamMember[]>([])

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const res = await fetch('/api/admin/equipe')
      if (res.ok) {
        const data = await res.json()

        if (data.leadership) {
          setLeadership(data.leadership)
        }

        if (data.instructors) {
          setInstructors(data.instructors)
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

          {/* Administração */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Administração</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary/50 to-primary mx-auto rounded-full"></div>
            </div>

            <div className="space-y-8">
              {leadership.map((member, index) => (
                <div
                  key={member.name}
                  className="group relative bg-card/50 backdrop-blur-sm rounded-xl border overflow-hidden transition-all duration-500 hover:shadow-2xl"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards',
                    opacity: 0
                  }}
                >
                  {/* Animated Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Floating Glow Effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row">
                    {/* Image Container */}
                    <div className="relative w-full md:w-64 h-80 md:h-96 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:brightness-110"
                          style={{
                            objectPosition: `50% ${member.imageOffsetY || 50}%`,
                            transform: `scale(${((member.imageZoom || 100) / 100)})`
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

                      {/* Animated Corner Accent */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/40 to-transparent transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8 relative flex-1">
                      <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-sm text-primary/70 font-medium mb-4">
                        {member.role}
                      </p>

                      {member.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {member.description}
                        </p>
                      )}
                    </div>
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
                Pessoas dedicadas que compartilham conhecimento e experiência para elevar o nível de preparação dos nossos alunos.
              </p>
            </div>

            <div className="space-y-8">
              {instructors.map((member, index) => (
                <div
                  key={member.name}
                  className="group relative bg-card/50 backdrop-blur-sm rounded-xl border overflow-hidden transition-all duration-500 hover:shadow-2xl"
                  style={{
                    animationDelay: `${(index + 2) * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards',
                    opacity: 0
                  }}
                >
                  {/* Animated Gradient Border */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  {/* Floating Particles Effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row">
                    {/* Image Container */}
                    <div className="relative w-full md:w-64 h-80 md:h-96 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:brightness-110"
                          style={{
                            objectPosition: `50% ${member.imageOffsetY || 50}%`,
                            transform: `scale(${((member.imageZoom || 100) / 100)})`
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
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8 relative flex-1">
                      <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-sm text-primary/70 font-medium mb-4">
                        {member.role}
                      </p>

                      {member.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {member.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shine Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                </div>
              ))}
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
