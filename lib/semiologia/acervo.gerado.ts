/* eslint-disable */
// ARQUIVO GERADO — não edite à mão.
// Origem: scripts/semiologia/curar-acervo.mjs
//
// Mídia clínica real das fontes licenciadas, indexada por `janela/cena`.
//
// Está separado dos arquivos de conteúdo (`vistas.ts`, `ultrassom.ts`) de
// propósito: aqueles são prosa escrita e revisada por gente, e um script que
// reescreve prosa é um script que um dia apaga a revisão de alguém. O gerador
// só toca neste arquivo; o merge acontece em `acervo.ts`, na leitura.
//
// Nasce vazio porque a autorização diz o que podemos usar — ela não entrega os
// arquivos. Povoá-lo é curadoria: escolher o caso, conferir que ele mostra o
// achado, escrever a legenda em português. O script faz o resto (verificar,
// hashear, espelhar, gerar).

import type { MidiaClinica } from './midia'

export const ACERVO_DE_MIDIA: Record<string, MidiaClinica[]> = {}

/** Quando o acervo foi gerado pela última vez. `null` enquanto vazio. */
export const GERADO_EM: string | null = null
