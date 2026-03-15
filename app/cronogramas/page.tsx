'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { ProgressRing } from '@/components/progress-ring'
import { LimitWarning } from '@/components/limit-warning'
import { Plus, Calendar, Download, Edit2, Trash2, Sparkles, Clock, BookOpen, Target, FileText, ChevronDown, ChevronRight, Eye, GraduationCap } from 'lucide-react'
import { CronogramaGerado, TEMPLATES, TopicItem } from '@/lib/cronograma-types'
import { AccountType } from '@/lib/types'
import { getCronogramasLimit } from '@/lib/tier-limits'
import { getMedicinaAFYATopicos } from '@/lib/medicina-afya-periodos-helper'
import { getPsicologiaAFYATopicos } from '@/lib/psicologia-afya-periodos-helper'
import { getBiomedicinaAFYATopicos } from '@/lib/biomedicina-afya-periodos-helper'
import { getOdontologiaAFYATopicos } from '@/lib/odontologia-afya-periodos-helper'

function CronogramasContent() {
  const router = useRouter()
  const { user, isAdmin, accountType: contextAccountType } = useAppShell()

  const [loading, setLoading] = useState(true)
  const [cronogramas, setCronogramas] = useState<CronogramaGerado[]>([])
  const accountType = contextAccountType as AccountType
  const userRole = isAdmin ? 'admin' : 'user'

  // Conteúdo Programático states
  type ConteudoModelo = 'medicina-afya' | 'psicologia-afya' | 'biomedicina-afya' | 'odontologia-afya' | 'enem' | 'uerj'
  const [showConteudo, setShowConteudo] = useState(false)
  const [conteudoModelo, setConteudoModelo] = useState<ConteudoModelo | null>(null)
  const [conteudoPeriodo, setConteudoPeriodo] = useState<number>(1)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCronogramas()
  }, [])

  async function loadCronogramas() {
    try {
      const res = await fetch('/api/cronogramas')
      if (res.ok) {
        const data = await res.json()
        const cronogramasData = data.cronogramas || []
        const cronogramasFormatados = cronogramasData.map((c: any) => ({
          ...c,
          _id: typeof c._id === 'string' ? c._id : c._id?.toString()
        }))
        setCronogramas(cronogramasFormatados)
      } else {
        console.error('Erro ao carregar cronogramas:', res.status)
      }
    } catch (error) {
      console.error('Erro ao carregar cronogramas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteCronograma(id: string) {
    if (!confirm('Tem certeza que deseja deletar este cronograma?')) return

    try {
      const res = await fetch(`/api/cronogramas/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCronogramas(cronogramas.filter(c => c._id !== id))
      }
    } catch (error) {
      console.error('Erro ao deletar cronograma:', error)
    }
  }

  function calculateProgress(cronograma: CronogramaGerado): number {
    if (!cronograma.cronograma || cronograma.cronograma.length === 0) {
      return 0
    }

    let totalAtividades = 0
    let atividadesCompletas = 0

    cronograma.cronograma.forEach((dia) => {
      if (dia.atividades && dia.atividades.length > 0) {
        dia.atividades.forEach((atividade) => {
          totalAtividades++
          if (atividade.concluido) {
            atividadesCompletas++
          }
        })
      }
    })

    if (totalAtividades === 0) {
      return 0
    }

    return Math.round((atividadesCompletas / totalAtividades) * 100)
  }

  function downloadPDFDiretamente(cronograma: any) {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) {
      alert('Por favor, desabilite o bloqueador de pop-ups')
      return
    }

    const atividades: any[] = []
    cronograma.cronograma?.forEach((item: any) => {
      atividades.push(...(item.atividades || []))
    })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${cronograma.titulo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #f5f5f5;
              padding: 40px 20px;
            }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #468152; padding-bottom: 20px; }
            .header h1 { color: #333; font-size: 28px; margin-bottom: 10px; }
            .header p { color: #666; font-size: 14px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { background: linear-gradient(135deg, #468152 0%, #5a9a63 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-box .label { font-size: 12px; opacity: 0.9; margin-bottom: 5px; }
            .stat-box .value { font-size: 24px; font-weight: bold; }
            .semana { margin-bottom: 30px; page-break-inside: avoid; }
            .semana-title { background: #468152; color: white; padding: 12px 15px; border-radius: 4px; margin-bottom: 15px; font-weight: 600; }
            .dias-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .dia { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; }
            .dia-header { background: #e8f5e9; padding: 10px 12px; border-radius: 4px; margin-bottom: 12px; font-weight: 600; color: #2e7d32; font-size: 13px; }
            .atividade { background: white; border-left: 4px solid #468152; padding: 12px; margin-bottom: 10px; border-radius: 4px; font-size: 13px; }
            .atividade-titulo { font-weight: 600; color: #333; margin-bottom: 4px; }
            .atividade-subtitulo { font-size: 12px; color: #666; margin-bottom: 6px; }
            .atividade-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
            .horas { background: #468152; color: white; padding: 2px 8px; border-radius: 3px; font-weight: 600; }
            .dificuldade { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
            .facil { background: #d4edda; color: #155724; }
            .medio { background: #fff3cd; color: #856404; }
            .dificil { background: #f8d7da; color: #721c24; }
            .vazio { color: #999; font-style: italic; font-size: 12px; padding: 10px; text-align: center; }
            @media print {
              body { padding: 0; background: white; }
              .container { box-shadow: none; padding: 20px; }
              .dias-grid { grid-template-columns: repeat(2, 1fr); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${cronograma.titulo}</h1>
              <p>Modelo: ${cronograma.modelo.toUpperCase()} • Total: ${cronograma.totalHoras}h</p>
            </div>

            <div class="stats">
              <div class="stat-box">
                <div class="label">Total de Horas</div>
                <div class="value">${cronograma.totalHoras}h</div>
              </div>
              <div class="stat-box">
                <div class="label">Semanas</div>
                <div class="value">${Math.ceil(cronograma.cronograma.length / 7)}</div>
              </div>
              <div class="stat-box">
                <div class="label">Atividades</div>
                <div class="value">${atividades.length}</div>
              </div>
            </div>

            ${cronograma.cronograma.map((dia: any, index: number) => {
              const semanaNum = Math.floor(index / 7) + 1
              const diaNumSemana = index % 7

              if (diaNumSemana === 0) {
                return `
                  <div class="semana">
                    <div class="semana-title">Semana ${semanaNum}</div>
                    <div class="dias-grid">
                      ${gerarDiaHTML(dia)}
                ` + (index + 1 < cronograma.cronograma.length && Math.floor((index + 1) / 7) !== semanaNum ? '</div></div>' : '')
              } else if (diaNumSemana === 6 || index === cronograma.cronograma.length - 1) {
                return `
                      ${gerarDiaHTML(dia)}
                    </div>
                  </div>
                `
              } else {
                return `${gerarDiaHTML(dia)}`
              }
            }).join('')}
          </div>
        </body>
      </html>
    `

    function gerarDiaHTML(dia: any) {
      return `
        <div class="dia">
          <div class="dia-header">${dia.dia} - ${dia.data}</div>
          ${dia.atividades.length === 0
            ? '<div class="vazio">Sem atividades</div>'
            : dia.atividades.map((ativ: any) => `
              <div class="atividade">
                <div class="atividade-titulo">${ativ.modulo}</div>
                <div class="atividade-subtitulo">${ativ.topico} • ${ativ.subtopico}</div>
                <div class="atividade-footer">
                  <span class="horas">${ativ.horas}h</span>
                  <span class="dificuldade ${ativ.dificuldadeUsuario}">${ativ.dificuldadeUsuario === 'facil' ? 'Fácil' : ativ.dificuldadeUsuario === 'medio' ? 'Médio' : 'Difícil'}</span>
                </div>
              </div>
            `).join('')
          }
        </div>
      `
    }

    printWindow.document.write(html)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  // Conteúdo Programático helpers
  const modelosConteudo = [
    { id: 'medicina-afya' as ConteudoModelo, nome: 'Medicina AFYA', periodos: [1, 2, 3, 4, 5], icon: '🩺' },
    { id: 'psicologia-afya' as ConteudoModelo, nome: 'Psicologia AFYA', periodos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], icon: '🧠' },
    { id: 'biomedicina-afya' as ConteudoModelo, nome: 'Biomedicina AFYA', periodos: [1, 2, 3, 4, 5, 6, 7], icon: '🔬' },
    { id: 'odontologia-afya' as ConteudoModelo, nome: 'Odontologia AFYA', periodos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], icon: '🦷' },
    { id: 'enem' as ConteudoModelo, nome: 'ENEM', periodos: [], icon: '📝' },
    { id: 'uerj' as ConteudoModelo, nome: 'UERJ', periodos: [], icon: '🎓' },
  ]

  function getConteudoTopicos(): TopicItem[] {
    if (!conteudoModelo) return []
    switch (conteudoModelo) {
      case 'medicina-afya': return getMedicinaAFYATopicos(conteudoPeriodo as any) as TopicItem[]
      case 'psicologia-afya': return getPsicologiaAFYATopicos(conteudoPeriodo as any) as TopicItem[]
      case 'biomedicina-afya': return getBiomedicinaAFYATopicos(conteudoPeriodo as any) as TopicItem[]
      case 'odontologia-afya': return getOdontologiaAFYATopicos(conteudoPeriodo as any) as TopicItem[]
      case 'enem': return TEMPLATES['enem'].topicos
      case 'uerj': return TEMPLATES['uerj'].topicos
      default: return []
    }
  }

  function getModeloNome(modelo: ConteudoModelo): string {
    return modelosConteudo.find(m => m.id === modelo)?.nome || modelo
  }

  function toggleTopic(id: string) {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSubtopic(id: string) {
    setExpandedSubtopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleModule(id: string) {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function expandAll() {
    const topicos = getConteudoTopicos()
    const tIds = new Set<string>()
    const sIds = new Set<string>()
    const mIds = new Set<string>()
    topicos.forEach(t => {
      tIds.add(t.id)
      t.subtopicos.forEach(s => {
        sIds.add(s.id)
        s.modulos.forEach(m => { mIds.add(m.id) })
      })
    })
    setExpandedTopics(tIds)
    setExpandedSubtopics(sIds)
    setExpandedModules(mIds)
  }

  function collapseAll() {
    setExpandedTopics(new Set())
    setExpandedSubtopics(new Set())
    setExpandedModules(new Set())
  }

  function buildConteudoPDFHTML(topicos: TopicItem[], titulo: string, forPrint: boolean): string {
    // Count stats
    let totalTopicos = topicos.length
    let totalSubtopicos = 0
    let totalModulos = 0
    let totalSubmodulos = 0
    topicos.forEach(t => {
      totalSubtopicos += t.subtopicos.length
      t.subtopicos.forEach(s => {
        totalModulos += s.modulos.length
        s.modulos.forEach(m => { totalSubmodulos += (m.submodulos?.length || 0) })
      })
    })

    // Build table of contents and content
    let tocHTML = ''
    let contentHTML = ''
    let topicIndex = 0

    topicos.forEach((topico) => {
      topicIndex++
      tocHTML += '<div class="toc-topic"><span class="toc-num">' + topicIndex + '.</span> ' + topico.nome + '</div>'

      contentHTML += '<div class="topic-section"><div class="topic-header"><span class="topic-num">' + topicIndex + '.</span> ' + topico.nome + '</div>'

      let subIndex = 0
      topico.subtopicos.forEach((sub) => {
        subIndex++
        const subNum = topicIndex + '.' + subIndex
        tocHTML += '<div class="toc-sub"><span class="toc-num">' + subNum + '</span> ' + sub.nome + '</div>'

        contentHTML += '<div class="subtopic-section"><div class="subtopic-header"><span class="sub-num">' + subNum + '</span> ' + sub.nome + '</div>'

        let modIndex = 0
        sub.modulos.forEach((mod) => {
          modIndex++
          const modNum = subNum + '.' + modIndex

          contentHTML += '<div class="module-section"><div class="module-header"><span class="mod-num">' + modNum + '</span> ' + mod.nome + '</div>'

          if (mod.submodulos && mod.submodulos.length > 0) {
            contentHTML += '<div class="submodules">'
            mod.submodulos.forEach((sm) => {
              contentHTML += '<div class="submodule-item">' + sm.nome + '</div>'
            })
            contentHTML += '</div>'
          }

          contentHTML += '</div>'
        })

        contentHTML += '</div>'
      })

      contentHTML += '</div>'
    })

    const bgBody = forPrint ? 'white' : '#0a0a0a'
    const colorBody = forPrint ? '#1a1a1a' : '#e5e5e5'
    const bgPage = forPrint ? 'white' : '#141414'
    const borderColor = forPrint ? '#e5e7eb' : '#2a2a2a'
    const statBg = forPrint ? '#f9fafb' : '#1a1a1a'
    const statLabelColor = forPrint ? '#6b7280' : '#888'
    const tocTopicColor = forPrint ? '#1a1a1a' : '#e5e5e5'
    const tocSubColor = forPrint ? '#6b7280' : '#999'
    const subtopicColor = forPrint ? '#1a472a' : '#7dcea0'
    const subtopicBg = forPrint ? '#ecfdf5' : 'rgba(70,129,82,0.12)'
    const moduleColor = forPrint ? '#374151' : '#d1d5db'
    const moduleBg = forPrint ? '#f3f4f6' : 'rgba(255,255,255,0.04)'
    const submoduleColor = forPrint ? '#6b7280' : '#9ca3af'
    const footerColor = forPrint ? '#9ca3af' : '#666'
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const dateShort = new Date().toLocaleDateString('pt-BR')

    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Conteúdo Programático — ' + titulo + '</title>' +
      '<style>' +
      "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');" +
      '* { margin: 0; padding: 0; box-sizing: border-box; }' +
      'body { font-family: "Inter", "Segoe UI", sans-serif; background: ' + bgBody + '; color: ' + colorBody + '; line-height: 1.6; }' +
      '.page { max-width: 900px; margin: 0 auto; background: ' + bgPage + '; min-height: 100vh; }' +

      '.cover { background: linear-gradient(135deg, #153D1F 0%, #1a472a 30%, #468152 100%); padding: 60px 50px 50px; position: relative; overflow: hidden; }' +
      ".cover::before { content: ''; position: absolute; top: -50%; right: -20%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(226,164,62,0.15) 0%, transparent 70%); border-radius: 50%; }" +
      ".cover::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #468152, #E2A43E, #468152); }" +
      '.cover-logo { width: 180px; margin-bottom: 30px; filter: brightness(0) invert(1); position: relative; z-index: 1; }' +
      '.cover h1 { font-size: 32px; font-weight: 800; color: white; margin-bottom: 8px; position: relative; z-index: 1; letter-spacing: -0.5px; }' +
      '.cover .subtitle { font-size: 18px; color: #E2A43E; font-weight: 600; position: relative; z-index: 1; }' +
      '.cover .date-line { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 20px; position: relative; z-index: 1; }' +

      '.stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: ' + borderColor + '; border-bottom: 1px solid ' + borderColor + '; }' +
      '.stat-item { background: ' + statBg + '; padding: 16px 20px; text-align: center; }' +
      '.stat-item .stat-value { font-size: 24px; font-weight: 800; color: #468152; }' +
      '.stat-item .stat-label { font-size: 11px; font-weight: 500; color: ' + statLabelColor + '; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }' +

      '.toc { padding: 40px 50px; border-bottom: 1px solid ' + borderColor + '; }' +
      '.toc h2 { font-size: 20px; font-weight: 700; color: #468152; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #468152; display: inline-block; }' +
      '.toc-topic { font-size: 14px; font-weight: 600; padding: 8px 0 4px; color: ' + tocTopicColor + '; }' +
      '.toc-sub { font-size: 12px; font-weight: 400; padding: 2px 0 2px 24px; color: ' + tocSubColor + '; }' +
      '.toc-num { color: #468152; font-weight: 600; min-width: 30px; display: inline-block; }' +

      '.content { padding: 40px 50px 60px; }' +
      '.content > .content-title { font-size: 20px; font-weight: 700; color: #468152; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid #468152; display: inline-block; }' +

      '.topic-section { margin-bottom: 36px; page-break-inside: avoid; }' +
      '.topic-header { font-size: 17px; font-weight: 700; color: white; background: linear-gradient(135deg, #153D1F, #1a472a); padding: 14px 20px; border-radius: 10px; margin-bottom: 16px; border-left: 4px solid #E2A43E; }' +
      '.topic-num { color: #E2A43E; margin-right: 8px; font-weight: 800; }' +

      '.subtopic-section { margin-left: 16px; margin-bottom: 20px; }' +
      '.subtopic-header { font-size: 14px; font-weight: 600; color: ' + subtopicColor + '; background: ' + subtopicBg + '; padding: 10px 16px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #468152; }' +
      '.sub-num { color: #468152; font-weight: 700; margin-right: 8px; }' +

      '.module-section { margin-left: 32px; margin-bottom: 12px; }' +
      '.module-header { font-size: 13px; font-weight: 500; color: ' + moduleColor + '; padding: 8px 14px; background: ' + moduleBg + '; border-radius: 6px; border-left: 3px solid #E2A43E; }' +
      '.mod-num { color: #E2A43E; font-weight: 600; margin-right: 6px; font-size: 12px; }' +

      '.submodules { margin-left: 20px; margin-top: 6px; margin-bottom: 8px; }' +
      '.submodule-item { font-size: 12px; color: ' + submoduleColor + '; padding: 4px 12px; position: relative; padding-left: 24px; }' +
      ".submodule-item::before { content: '\\203A'; position: absolute; left: 12px; color: #468152; font-weight: bold; }" +

      '.footer { padding: 30px 50px; border-top: 1px solid ' + borderColor + '; }' +
      '.footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; }' +
      '.footer-left { flex: 1; }' +
      '.footer-brand { font-size: 16px; font-weight: 700; color: #468152; margin-bottom: 4px; }' +
      '.footer-brand a { color: #468152; text-decoration: none; }' +
      '.footer-brand a:hover { text-decoration: underline; }' +
      '.footer-info { font-size: 11px; color: ' + footerColor + '; line-height: 1.6; }' +
      '.footer-link { color: #468152; text-decoration: none; font-weight: 500; }' +
      '.footer-link:hover { text-decoration: underline; }' +
      '.footer-qr { flex-shrink: 0; text-align: center; }' +
      '.footer-qr img { width: 80px; height: 80px; border-radius: 8px; border: 2px solid ' + (forPrint ? '#e5e7eb' : '#2a2a2a') + '; }' +
      '.footer-qr-label { font-size: 9px; color: ' + footerColor + '; margin-top: 4px; }' +
      '.footer-bar { height: 4px; background: linear-gradient(90deg, #468152, #E2A43E, #468152); }' +

      '.print-actions { position: fixed; bottom: 30px; right: 30px; display: flex; gap: 10px; z-index: 100; }' +
      '.print-btn { padding: 12px 24px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }' +
      '.print-btn-primary { background: linear-gradient(135deg, #468152, #5a9a63); color: white; }' +
      '.print-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(70,129,82,0.4); }' +

      '@media print {' +
        'body { background: white; color: #1a1a1a; }' +
        '.page { box-shadow: none; }' +
        '.print-actions { display: none !important; }' +
        '.cover, .topic-header, .stats-bar, .stat-item, .subtopic-header, .footer-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
        '.stat-item { background: #f9fafb; }' +
        '.stat-item .stat-label { color: #6b7280; }' +
        '.toc { border-bottom-color: #e5e7eb; }' +
        '.toc-sub { color: #6b7280; }' +
        '.subtopic-header { color: #1a472a; background: #ecfdf5; }' +
        '.module-header { color: #374151; background: #f3f4f6; }' +
        '.submodule-item { color: #6b7280; }' +
        '.footer { border-top-color: #e5e7eb; }' +
        '.footer-info { color: #9ca3af; }' +
        '.footer-qr img { border-color: #e5e7eb; }' +
        '.footer-qr-label { color: #9ca3af; }' +
      '}' +
      '</style></head><body>' +

      '<div class="page">' +
        '<div class="cover">' +
          '<img src="/img/logo_com_texto.svg" class="cover-logo" alt="DomineAqui" onerror="this.style.display=\'none\'" />' +
          '<h1>Conteúdo Programático</h1>' +
          '<div class="subtitle">' + titulo + '</div>' +
          '<div class="date-line">Gerado em ' + dateStr + '</div>' +
        '</div>' +

        '<div class="stats-bar">' +
          '<div class="stat-item"><div class="stat-value">' + totalTopicos + '</div><div class="stat-label">Tópicos</div></div>' +
          '<div class="stat-item"><div class="stat-value">' + totalSubtopicos + '</div><div class="stat-label">Subtópicos</div></div>' +
          '<div class="stat-item"><div class="stat-value">' + totalModulos + '</div><div class="stat-label">Módulos</div></div>' +
          '<div class="stat-item"><div class="stat-value">' + totalSubmodulos + '</div><div class="stat-label">Submódulos</div></div>' +
        '</div>' +

        '<div class="toc"><h2>Sumário</h2>' + tocHTML + '</div>' +

        '<div class="content"><div class="content-title">Ementa Detalhada</div>' + contentHTML + '</div>' +

        '<div class="footer-bar"></div>' +
        '<div class="footer">' +
          '<div class="footer-inner">' +
            '<div class="footer-left">' +
              '<div class="footer-brand"><a href="https://www.domineaqui.com.br" target="_blank">DomineAqui</a></div>' +
              '<div class="footer-info">' +
                'Conteúdo Programático • ' + titulo + '<br>' +
                'Gerado em ' + dateShort + ' • <a class="footer-link" href="https://www.domineaqui.com.br" target="_blank">www.domineaqui.com.br</a>' +
              '</div>' +
            '</div>' +
            '<div class="footer-qr">' +
              '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.domineaqui.com.br&color=468152&bgcolor=ffffff&margin=8" alt="QR Code" />' +
              '<div class="footer-qr-label">Acesse o site</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="print-actions">' +
        '<button class="print-btn print-btn-primary" onclick="window.print()">Salvar como PDF</button>' +
      '</div>' +

      '</body></html>'
  }

  function viewOrDownloadConteudoPDF(download: boolean) {
    if (!conteudoModelo) return
    const topicos = getConteudoTopicos()
    const modeloNome = getModeloNome(conteudoModelo)
    const hasPeriodo = modelosConteudo.find(m => m.id === conteudoModelo)!.periodos.length > 0
    const titulo = hasPeriodo ? modeloNome + ' — ' + conteudoPeriodo + 'º Período' : modeloNome

    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) {
      alert('Por favor, desabilite o bloqueador de pop-ups')
      return
    }

    const html = buildConteudoPDFHTML(topicos, titulo, download)
    printWindow.document.write(html)
    printWindow.document.close()

    if (download) {
      setTimeout(() => { printWindow.print() }, 500)
    }
  }

  const tierLimitExceeded = userRole !== 'admin' && accountType === 'gratuito' && cronogramas.length >= getCronogramasLimit(accountType)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
      {/* Ambient floating blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="auth-bg-blob w-[500px] h-[500px] bg-[#468152]/12 top-[-10%] left-[-10%]" />
        <div className="auth-bg-blob w-[400px] h-[400px] bg-[#E2A43E]/10 bottom-[-5%] right-[-5%]" style={{ animationDelay: '-4s' }} />
        <div className="auth-bg-blob w-[300px] h-[300px] bg-[#CE5929]/6 top-[40%] right-[20%]" style={{ animationDelay: '-8s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#468152]/10 border border-[#468152]/20 text-sm font-medium text-[#468152] dark:text-[#E2A43E]"
          >
            <Sparkles className="h-4 w-4" />
            Cronograma Inteligente
          </motion.div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold">
            Cronograma Comum Todo Mundo Tem.
          </h2>
          <p className="font-heading text-2xl md:text-3xl bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent font-bold">
            O Nosso é Feito Sob Medida Pra Te Arrancar da Mediocridade.
          </p>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Crie um cronograma personalizado baseado em suas dificuldades, disponibilidade de tempo e objetivos específicos.
          </p>
        </motion.div>

        {/* Stats Row (when cronogramas exist) */}
        {cronogramas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="glass-page-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-[#468152]" />
                <span className="text-xs font-medium text-muted-foreground">Cronogramas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{cronogramas.length}</p>
            </div>
            <div className="glass-page-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-[#E2A43E]" />
                <span className="text-xs font-medium text-muted-foreground">Horas Totais</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {cronogramas.reduce((sum, c) => sum + (c.totalHoras || 0), 0)}h
              </p>
            </div>
            <div className="glass-page-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="h-4 w-4 text-[#CE5929]" />
                <span className="text-xs font-medium text-muted-foreground">Progresso Médio</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {cronogramas.length > 0
                  ? Math.round(cronogramas.reduce((sum, c) => sum + calculateProgress(c), 0) / cronogramas.length)
                  : 0}%
              </p>
            </div>
          </motion.div>
        )}

        {/* Limit Warning for Free Users */}
        {user && userRole !== 'admin' && accountType === 'gratuito' && (
          <LimitWarning
            current={cronogramas.length}
            max={getCronogramasLimit(accountType)}
            itemName="Cronogramas"
          />
        )}

        {/* CTA Button - Grande e destacado */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col items-center mb-10"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Button
              onClick={() => router.push('/cronogramas/criar')}
              size="lg"
              disabled={tierLimitExceeded}
              className="h-14 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white shadow-xl shadow-[#468152]/20 soul-light soul-light-brand btn-brand-glow border-0"
            >
              <Plus className="mr-2 h-5 w-5" />
              Criar Novo Cronograma
            </Button>
          </motion.div>
          {tierLimitExceeded && (
            <p className="text-sm text-red-600 mt-3 font-medium">Limite de {getCronogramasLimit(accountType)} cronogramas atingido</p>
          )}
        </motion.div>

        {/* Conteúdo Programático Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-10"
        >
          <button
            onClick={() => setShowConteudo(!showConteudo)}
            className="w-full glass-page-card rounded-2xl p-5 hover-lift transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#468152]/20 to-[#E2A43E]/20 border border-[#468152]/20 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-[#468152]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Conteúdo Programático</h3>
                  <p className="text-sm text-muted-foreground">Visualize e baixe a ementa completa dos modelos</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${showConteudo ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showConteudo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-5"
            >
              {/* Model Selection */}
              <div className="glass-page-card rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Selecione o Modelo</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {modelosConteudo.map((modelo) => (
                    <button
                      key={modelo.id}
                      onClick={() => {
                        setConteudoModelo(modelo.id)
                        setConteudoPeriodo(1)
                        setExpandedTopics(new Set())
                        setExpandedSubtopics(new Set())
                        setExpandedModules(new Set())
                      }}
                      className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                        conteudoModelo === modelo.id
                          ? 'bg-[#468152]/15 border-[#468152]/40 shadow-lg shadow-[#468152]/10'
                          : 'glass-inset border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{modelo.icon}</span>
                      <span className={`text-sm font-semibold block ${conteudoModelo === modelo.id ? 'text-[#468152] dark:text-[#7dcea0]' : 'text-foreground'}`}>
                        {modelo.nome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {modelo.periodos.length > 0 ? `${modelo.periodos[0]}º ao ${modelo.periodos[modelo.periodos.length - 1]}º Período` : 'Conteúdo completo'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Period Selection (if applicable) */}
              {conteudoModelo && modelosConteudo.find(m => m.id === conteudoModelo)!.periodos.length > 0 && (
                <div className="glass-page-card rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Selecione o Período</h4>
                  <div className="flex flex-wrap gap-2">
                    {modelosConteudo.find(m => m.id === conteudoModelo)!.periodos.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setConteudoPeriodo(p)
                          setExpandedTopics(new Set())
                          setExpandedSubtopics(new Set())
                          setExpandedModules(new Set())
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          conteudoPeriodo === p
                            ? 'bg-[#468152]/20 text-[#468152] dark:text-[#7dcea0] border border-[#468152]/40 shadow-lg shadow-[#468152]/10'
                            : 'glass-inset text-muted-foreground hover:text-foreground hover:bg-white/5'
                        }`}
                      >
                        {p}º Período
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Tree View */}
              {conteudoModelo && (
                <div className="glass-page-card rounded-2xl overflow-hidden">
                  {/* Actions Header */}
                  <div className="p-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#468152]" />
                      <span className="text-sm font-semibold text-foreground">
                        {getModeloNome(conteudoModelo)}
                        {modelosConteudo.find(m => m.id === conteudoModelo)!.periodos.length > 0 && ` — ${conteudoPeriodo}º Período`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={expandAll} className="text-xs text-[#468152] hover:underline font-medium">Expandir tudo</button>
                      <span className="text-muted-foreground text-xs">|</span>
                      <button onClick={collapseAll} className="text-xs text-muted-foreground hover:underline font-medium">Recolher tudo</button>
                      <span className="text-muted-foreground text-xs">|</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewOrDownloadConteudoPDF(false)}
                        className="h-8 text-xs rounded-lg glass-button-outline"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => viewOrDownloadConteudoPDF(true)}
                        className="h-8 text-xs rounded-lg bg-gradient-to-r from-[#468152] to-[#5a9a63] hover:from-[#468152]/90 hover:to-[#5a9a63]/90 text-white border-0"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Baixar PDF
                      </Button>
                    </div>
                  </div>

                  {/* Tree Content */}
                  <div className="p-5 max-h-[600px] overflow-y-auto">
                    {getConteudoTopicos().length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">Nenhum tópico disponível</div>
                    ) : (
                      <div className="space-y-2">
                        {getConteudoTopicos().map((topico, ti) => (
                          <div key={topico.id} className="rounded-xl overflow-hidden">
                            {/* Topic */}
                            <button
                              onClick={() => toggleTopic(topico.id)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#153D1F]/80 to-[#1a472a]/80 hover:from-[#153D1F] hover:to-[#1a472a] transition-all text-left group"
                            >
                              {expandedTopics.has(topico.id) ? (
                                <ChevronDown className="h-4 w-4 text-[#E2A43E] shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[#E2A43E] shrink-0" />
                              )}
                              <span className="text-xs font-bold text-[#E2A43E] shrink-0">{ti + 1}.</span>
                              <span className="text-sm font-semibold text-white">{topico.nome}</span>
                              <span className="ml-auto text-xs text-white/40 shrink-0">{topico.subtopicos.length} subtópico(s)</span>
                            </button>

                            {expandedTopics.has(topico.id) && (
                              <div className="ml-4 mt-1 space-y-1">
                                {topico.subtopicos.map((sub, si) => (
                                  <div key={sub.id}>
                                    {/* Subtopic */}
                                    <button
                                      onClick={() => toggleSubtopic(sub.id)}
                                      className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-[#468152]/8 hover:bg-[#468152]/15 transition-all text-left"
                                    >
                                      {expandedSubtopics.has(sub.id) ? (
                                        <ChevronDown className="h-3.5 w-3.5 text-[#468152] shrink-0" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5 text-[#468152] shrink-0" />
                                      )}
                                      <span className="text-xs font-semibold text-[#468152] shrink-0">{ti + 1}.{si + 1}</span>
                                      <span className="text-sm text-foreground/90">{sub.nome}</span>
                                      <span className="ml-auto text-xs text-muted-foreground shrink-0">{sub.modulos.length} módulo(s)</span>
                                    </button>

                                    {expandedSubtopics.has(sub.id) && (
                                      <div className="ml-6 mt-1 space-y-1">
                                        {sub.modulos.map((mod, mi) => (
                                          <div key={mod.id}>
                                            {/* Module */}
                                            <button
                                              onClick={() => mod.submodulos && mod.submodulos.length > 0 ? toggleModule(mod.id) : undefined}
                                              className={`w-full flex items-center gap-2 p-2 rounded-md transition-all text-left ${
                                                mod.submodulos && mod.submodulos.length > 0
                                                  ? 'hover:bg-white/5 cursor-pointer'
                                                  : 'cursor-default'
                                              }`}
                                            >
                                              {mod.submodulos && mod.submodulos.length > 0 ? (
                                                expandedModules.has(mod.id) ? (
                                                  <ChevronDown className="h-3 w-3 text-[#E2A43E] shrink-0" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3 text-[#E2A43E] shrink-0" />
                                                )
                                              ) : (
                                                <div className="h-3 w-3 shrink-0 flex items-center justify-center">
                                                  <div className="h-1.5 w-1.5 rounded-full bg-[#E2A43E]/50" />
                                                </div>
                                              )}
                                              <span className="text-xs text-[#E2A43E]/70 shrink-0">{ti + 1}.{si + 1}.{mi + 1}</span>
                                              <span className="text-xs text-foreground/70">{mod.nome}</span>
                                            </button>

                                            {mod.submodulos && mod.submodulos.length > 0 && expandedModules.has(mod.id) && (
                                              <div className="ml-7 mt-0.5 space-y-0.5">
                                                {mod.submodulos.map((sm) => (
                                                  <div key={sm.id} className="flex items-center gap-2 px-2 py-1">
                                                    <span className="text-[#468152] text-xs">›</span>
                                                    <span className="text-xs text-muted-foreground">{sm.nome}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Cronogramas List */}
        {cronogramas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="auth-glass-card text-center py-16 px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
              className="h-20 w-20 rounded-full bg-[#468152]/10 flex items-center justify-center mx-auto mb-6"
            >
              <Calendar className="h-10 w-10 text-[#468152]" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2 text-foreground">Nenhum cronograma criado ainda</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Comece criando seu primeiro cronograma personalizado e organize seus estudos de forma inteligente.
            </p>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={() => router.push('/cronogramas/criar')}
                className="h-12 px-6 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
              >
                <Plus className="mr-2 h-5 w-5" />
                Criar Primeiro Cronograma
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="grid gap-5">
            {cronogramas.map((cronograma, index) => {
              const totalHoras = cronograma.totalHoras || 0
              const dataCriacao = new Date(cronograma.dataCriacao)
              const progress = calculateProgress(cronograma)

              return (
                <motion.div
                  key={cronograma._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.07 }}
                >
                  <div className="glass-page-card rounded-2xl soul-light hover-lift overflow-hidden">
                    {/* Progress bar at top */}
                    <div className="h-1 bg-muted/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#468152] to-[#E2A43E] rounded-full"
                      />
                    </div>

                    <div className="p-5">
                      {/* Card Header */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                              {cronograma.titulo}
                              {(cronograma as any).concluido && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#468152]/10 text-[#468152] text-xs font-semibold border border-[#468152]/20">
                                  ✓ Concluído
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Modelo: {cronograma.modelo.toUpperCase()} • {totalHoras}h total
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <ProgressRing
                              percentage={progress}
                              size={80}
                              strokeWidth={3}
                              label="Progresso"
                            />
                            <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                              <div>{dataCriacao.toLocaleDateString('pt-BR')}</div>
                              <div className="text-xs">{dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-xl p-3 border border-white/20 dark:border-white/5">
                            <p className="text-muted-foreground text-xs">Período</p>
                            <p className="font-semibold text-foreground">
                              {cronograma.config?.modelo === 'medicina-afya'
                                ? `Período ${cronograma.config?.tempoEstudo ? Object.keys(cronograma.config).length : '?'}`
                                : 'Geral'
                              }
                            </p>
                          </div>
                          <div className="backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-xl p-3 border border-white/20 dark:border-white/5">
                            <p className="text-muted-foreground text-xs">Dias de Estudo</p>
                            <p className="font-semibold text-foreground">
                              {cronograma.tempoEstudo
                                ? Object.values(cronograma.tempoEstudo).filter(h => h > 0).length
                                : 0
                              } dias/semana
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/cronogramas/${cronograma._id}`)}
                            className="soul-light rounded-xl"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadPDFDiretamente(cronograma)}
                            className="soul-light rounded-xl backdrop-blur-sm bg-white/20 dark:bg-white/5 border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteCronograma(cronograma._id!)}
                            className="soul-light rounded-xl"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Main page component - wraps content in AppShell
export default function CronogramasPage() {
  return (
    <AppShell headerTitle="Cronogramas" headerSubtitle="Organize seus estudos">
      <CronogramasContent />
    </AppShell>
  )
}
