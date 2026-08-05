'use client'

import React from 'react'
import type { WidgetSpec } from '@/lib/ecg/course/types'
import { WaveBuilder } from './wave-builder'
import { PacemakerLab } from './pacemaker-lab'
import { VelocityLab } from './velocity-lab'
import { RefractoryLab } from './refractory-lab'
import { TetanyLab } from './tetany-lab'
import { PaperLab } from './paper-lab'
import { IntervalLab } from './interval-lab'
import { LeadsExplorer } from './leads-explorer'
import { AxisLab } from './axis-lab'
import { HeartRateLab } from './hr-lab'
import { BlockLab } from './block-lab'
import { BbbLab } from './bbb-lab'
import { ElectrolyteLab } from './electrolyte-lab'
import { WaveDoctor } from './wave-doctor'
import { LettersLab } from './letters-lab'
import { ReadOrderLab } from './read-order-lab'

/**
 * Registro dos laboratórios interativos.
 *
 * O currículo referencia widgets por id (dado, não JSX) — este arquivo é a
 * única ponte entre os dois. Adicionar um laboratório novo é registrar aqui e
 * declarar o id em `WidgetId`.
 */
export function CourseWidget({ spec }: { spec: WidgetSpec }) {
  // Os props vêm do currículo (dados), então não há como tipá-los por widget
  // sem duplicar o registro inteiro em tipos — o `any` fica confinado aqui.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const p: any = spec.props || {}

  switch (spec.id) {
    case 'wave-builder': return <WaveBuilder />
    case 'pacemaker-lab': return <PacemakerLab mode={p.mode} />
    case 'velocity-lab': return <VelocityLab />
    case 'refractory-lab': return <RefractoryLab focus={p.focus} />
    case 'tetany-lab': return <TetanyLab />
    case 'paper-lab': return <PaperLab />
    case 'interval-lab': return <IntervalLab />
    case 'leads-explorer': return <LeadsExplorer plane={p.plane} />
    case 'axis-lab': return <AxisLab />
    case 'hr-lab': return <HeartRateLab mode={p.mode} />
    case 'block-lab': return <BlockLab />
    case 'bbb-lab': return <BbbLab />
    case 'electrolyte-lab': return <ElectrolyteLab scenario={p.scenario} />
    case 'wave-doctor': return <WaveDoctor focus={p.focus} />
    case 'letters-lab': return <LettersLab />
    case 'read-order-lab': return <ReadOrderLab />
    default: return null
  }
}
