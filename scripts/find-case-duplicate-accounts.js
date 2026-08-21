#!/usr/bin/env node
/**
 * Encontra contas duplicadas que só diferem na capitalização do e-mail
 * (ex.: "Nome@gmail.com" e "nome@gmail.com"). Isso acontecia porque
 * /api/auth/register e /api/auth/login comparavam o e-mail exatamente como
 * foi digitado, sem normalizar — corrigido para sempre gravar/buscar o
 * e-mail em minúsculas (ver lib/auth.ts normalizeEmail).
 *
 * Este script é SOMENTE LEITURA: ele lista os grupos de contas duplicadas
 * para decisão manual de um admin (qual conta manter, o que migrar — compras,
 * progresso, assinatura). Mesclar contas automaticamente é arriscado: dados
 * de uma conta (submissions, payments, subscriptions, etc.) estão espalhados
 * por dezenas de coleções referenciando o _id do usuário, e não há uma regra
 * segura e genérica para decidir qual conta "vence" cada campo.
 *
 * Uso:
 *   node scripts/find-case-duplicate-accounts.js
 *
 * Requer MONGODB_URI no ambiente (ou .env.local).
 */

const path = require('path')
const fs = require('fs')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

const { MongoClient } = require('mongodb')

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI não definido.')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || undefined)
  const usersCol = db.collection('users')

  console.log('── Contas duplicadas por capitalização de e-mail ──\n')

  const groups = await usersCol
    .aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$email' } } },
          count: { $sum: 1 },
          accounts: {
            $push: {
              id: '$_id',
              email: '$email',
              name: '$name',
              createdAt: '$createdAt',
              lastLoginAt: '$lastLoginAt',
              role: '$role',
              banned: '$banned',
            },
          },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray()

  if (groups.length === 0) {
    console.log('Nenhuma conta duplicada encontrada.')
    await client.close()
    return
  }

  for (const group of groups) {
    console.log(`E-mail: ${group._id}  (${group.count} contas)`)
    for (const acc of group.accounts) {
      console.log(
        `  - _id=${acc.id} email="${acc.email}" nome="${acc.name}" role=${acc.role} ` +
          `banned=${!!acc.banned} criada=${acc.createdAt?.toISOString?.() ?? acc.createdAt} ` +
          `últ.login=${acc.lastLoginAt?.toISOString?.() ?? acc.lastLoginAt}`
      )
    }
    console.log('')
  }

  console.log(`Total: ${groups.length} e-mail(s) com contas duplicadas.`)
  console.log(
    '\nPróximo passo (manual): decidir, para cada grupo, qual conta manter e migrar' +
      '\no que for necessário (compras, assinatura, progresso) para ela antes de' +
      '\ndesativar/excluir a outra.'
  )

  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
