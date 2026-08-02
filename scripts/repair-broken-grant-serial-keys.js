#!/usr/bin/env node
/**
 * Repara Serial Keys de concessão avulsa (origin: 'admin' + grant, ex.: entrega
 * de material por formulário/"prêmio") que foram corrompidas por um bug de
 * roteamento: o endpoint de ativação tratava qualquer key com origin !==
 * 'purchase' como key legada (trial/premium de /admin/keys), então a ativação
 * caiu no fluxo antigo — marcou a key como `used: true` mas NUNCA concedeu o
 * material de verdade (grantSerialKeyProduct nunca rodou).
 *
 * Sintomas para o usuário: a key aparece como "já ativada", mas o material
 * nunca chegou na conta, e reativar dá "já foi ativada em outra conta".
 *
 * Este script identifica essas keys (grant presente + used=true + status
 * ainda não 'activated') e:
 *   - se sabemos quem "usou" a key (usedBy), concede o material a essa conta
 *     agora e marca a key corretamente como ativada;
 *   - caso contrário, reseta a key para 'unactivated' para o usuário poder
 *     tentar de novo pelo link de ativação.
 *
 * Uso:
 *   node scripts/repair-broken-grant-serial-keys.js --dry-run   # só relata
 *   node scripts/repair-broken-grant-serial-keys.js             # aplica
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

const { MongoClient, ObjectId } = require('mongodb')

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI não definido.')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || undefined)

  console.log(DRY_RUN ? '── SIMULAÇÃO (nada será gravado) ──\n' : '── REPARO de Serial Keys quebradas ──\n')

  const keysCol = db.collection('serial_keys')
  const usersCol = db.collection('users')
  const purchasesCol = db.collection('material_purchases')

  const broken = await keysCol.find({
    grant: { $exists: true, $ne: null },
    used: true,
    status: { $ne: 'activated' },
  }).toArray()

  console.log(`Keys afetadas encontradas: ${broken.length}\n`)

  let grantedCount = 0
  let resetCount = 0
  let skippedCount = 0

  for (const serial of broken) {
    const label = `${serial.key} (${serial.productTitle || serial.productType || 'produto'}) — comprador: ${serial.buyerEmail || '—'}`

    if (serial.usedBy) {
      let user = null
      try {
        user = await usersCol.findOne({ _id: new ObjectId(String(serial.usedBy)) })
      } catch {}

      if (!user) {
        console.log(`[RESET] ${label} — usedBy=${serial.usedBy} não encontrado, resetando para reativação manual.`)
        resetCount++
        if (!DRY_RUN) {
          await keysCol.updateOne(
            { _id: serial._id },
            { $set: { used: false, status: 'unactivated' }, $unset: { usedBy: '', usedByName: '', usedAt: '' } }
          )
        }
        continue
      }

      const grant = serial.grant || {}
      if (grant.productType === 'material' || grant.productType === 'flashcard' || grant.productType === 'package') {
        const itemType = grant.itemType || (grant.productType === 'package' ? 'package' : 'material')
        const itemId = String(grant.itemId || serial.productId || '')
        if (!itemId) {
          console.log(`[SKIP] ${label} — grant sem itemId, requer revisão manual.`)
          skippedCount++
          continue
        }
        console.log(`[GRANT] ${label} — concedendo "${grant.itemTitle || serial.productTitle}" à conta ${user.email || user._id}.`)
        grantedCount++
        if (!DRY_RUN) {
          await purchasesCol.updateOne(
            { userId: String(user._id), itemType, itemId, status: 'completed' },
            {
              $set: {
                userId: String(user._id),
                userName: user.name || '',
                userEmail: user.email || '',
                itemType,
                itemId,
                itemTitle: grant.itemTitle || serial.productTitle || 'Material',
                price: serial.amount || 0,
                provider: 'mercado_pago',
                status: 'completed',
                purchasedAt: new Date(),
              },
            },
            { upsert: true }
          )
          await keysCol.updateOne(
            { _id: serial._id },
            {
              $set: {
                used: true,
                status: 'activated',
                usedBy: String(user._id),
                usedByName: user.name || '',
                usedAt: serial.usedAt || new Date(),
                activatedByUserId: String(user._id),
                activatedByEmail: user.email || '',
                activatedAt: new Date(),
              },
            }
          )
        }
      } else {
        console.log(`[SKIP] ${label} — productType "${grant.productType}" não suportado por este script, requer revisão manual.`)
        skippedCount++
      }
    } else {
      console.log(`[RESET] ${label} — sem usedBy, resetando para reativação manual.`)
      resetCount++
      if (!DRY_RUN) {
        await keysCol.updateOne(
          { _id: serial._id },
          { $set: { used: false, status: 'unactivated' } }
        )
      }
    }
  }

  console.log('\n── Resumo ──')
  console.log(`  ${String(grantedCount).padStart(6)}  material concedido agora`)
  console.log(`  ${String(resetCount).padStart(6)}  resetadas p/ nova tentativa de ativação`)
  console.log(`  ${String(skippedCount).padStart(6)}  puladas (revisão manual)`)
  console.log(DRY_RUN ? '\nSimulação concluída — nada foi gravado.' : '\nReparo concluído.')

  await client.close()
}

main().catch(err => {
  console.error('Falha no reparo:', err)
  process.exit(1)
})
