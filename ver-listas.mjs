import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3117'
const OUT = '/tmp/claude-0/-home-user-GradeX/868eda63-4588-54ae-9ef9-b02f44309030/scratchpad'

const listas = [
  { _id: 'l1', nome: 'Revisar antes da P1', questaoIds: ['a', 'b', 'c', 'd'], modoResposta: 'imediato', totalQuestoes: 24, totalResolvidas: 9 },
  { _id: 'l2', nome: 'Erradas de cardiologia', questaoIds: ['a'], modoResposta: 'final', totalQuestoes: 12, totalResolvidas: 12 },
  { _id: 'l3', nome: 'Simulado de sexta', questaoIds: [], modoResposta: 'final', totalQuestoes: 0, totalResolvidas: 0 },
]

const questoes = [0, 1, 2].map((i) => ({
  _id: `q${i}`,
  tipo: 'objetiva',
  enunciado: 'Homem de 68 anos com palpitações há 6 horas. ECG com ritmo irregularmente irregular. Conduta inicial?',
  alternativas: [
    { letra: 'A', texto: 'Cardioversão elétrica', correta: false },
    { letra: 'B', texto: 'Controle de frequência', correta: true },
  ],
  dificuldade: 'medio',
  moduloNome: 'Cardiologia',
  topicoNome: 'Arritmias',
}))

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

async function tela(nome, viewport, caminho) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: viewport.width < 500, hasTouch: viewport.width < 900 })
  const page = await ctx.newPage()
  const chamadas = []
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)))
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 300)) })
  await page.route('**/api/**', (r) => r.fulfill({ json: {} }))
  await page.route('**/api/bootstrap**', (r) =>
    r.fulfill({ json: { user: { id: 'u1', _id: 'u1', name: 'Aluno', email: 'a@a.com', role: 'user', accountType: 'plus' } } }))
  await page.route('**/api/banco/listas/l1', (r) => {
    if (r.request().method() === 'PUT') chamadas.push(JSON.parse(r.request().postData() || '{}'))
    return r.fulfill({ json: { lista: listas[0], questoes } })
  })
  await page.route('**/api/banco/listas', (r) => {
    if (r.request().method() === 'PUT' || r.request().method() === 'POST') chamadas.push(JSON.parse(r.request().postData() || '{}'))
    return r.fulfill({ json: { listas } })
  })

  await page.goto(`${BASE}${caminho}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3500)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log(nome, '| overflow:', overflow)
  if (process.env.DUMP) console.log('TEXTO:', (await page.locator('body').innerText()).slice(0, 400))
  await page.screenshot({ path: `${OUT}/${nome}.png` })
  return { ctx, page, chamadas }
}

// hub desktop
{
  const { ctx, page, chamadas } = await tela('listas-desktop', { width: 1280, height: 950 }, '/banco-questoes/listas')
  console.log('progresso:', await page.locator('text=de 24 resolvidas').count(), '| concluída:', await page.locator('text=Concluída').count())
  console.log('rótulos:', await page.locator('span:has-text("Continuar"), span:has-text("Refazer"), span:has-text("Abrir")').allTextContents())
  // editar salva o modo
  await page.getByRole('button', { name: /Editar Revisar antes da P1/ }).click()
  await page.waitForTimeout(400)
  await page.locator('button:has-text("Só no final")').click()
  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.waitForTimeout(600)
  console.log('payload:', JSON.stringify(chamadas[0]))
  await ctx.close()
}

// hub mobile
{
  const { ctx } = await tela('listas-mobile', { width: 390, height: 844 }, '/banco-questoes/listas')
  await ctx.close()
}

// detalhe mobile
{
  const { ctx, page } = await tela('lista-detalhe-mobile', { width: 390, height: 844 }, '/banco-questoes/listas/l1')
  console.log('modos visíveis:', await page.locator('text=Corrigir na hora').count(), await page.locator('text=Só no final').count())
  await ctx.close()
}

await browser.close()
console.log('ok')
