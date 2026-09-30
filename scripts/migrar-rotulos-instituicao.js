/**
 * Regrava no banco os rótulos de instituição antigos (com a marca do grupo
 * mantenedor) para os nomes neutros de `lib/institution-units.ts`:
 *   - users.afyaUnit
 *   - coupons.allowedAfyaUnits
 *   - nome do ponto de retirada em shop_settings.pickupPoints
 *
 * O servidor já traduz os valores antigos ao ler (ver
 * `lib/institution-units-legacy.ts`); este script só deixa o banco limpo.
 *
 * Uso:  MONGODB_URI=... node scripts/migrar-rotulos-instituicao.js [--dry-run]
 */
const { MongoClient } = require('mongodb')

const LEGACY_TO_CURRENT = {
  "Afya Cruzeiro do Sul - Cruzeiro do Sul (AC)": "Faculdade de Ciências Médicas de Cruzeiro do Sul - Cruzeiro do Sul (AC)",
  "Afya Maceió (UNIMA) - Maceió (AL)": "Centro Universitário de Maceió (UNIMA) - Maceió (AL)",
  "Afya Itacoatiara - Itacoatiara (AM)": "Faculdade de Ciências Médicas de Itacoatiara - Itacoatiara (AM)",
  "Afya Manacapuru - Manacapuru (AM)": "Faculdade de Ciências Médicas de Manacapuru - Manacapuru (AM)",
  "Afya Barreiras - Barreiras (BA)": "Faculdade de Ciências Médicas de Barreiras - Barreiras (BA)",
  "Afya Guanambi - Guanambi (BA)": "Faculdade de Ciências Médicas de Guanambi - Guanambi (BA)",
  "Afya Itabuna - Itabuna (BA)": "Faculdade de Ciências Médicas de Itabuna - Itabuna (BA)",
  "Afya Luís Eduardo Magalhães - Luís Eduardo Magalhães (BA)": "Faculdade de Ciências Médicas de Luís Eduardo Magalhães - Luís Eduardo Magalhães (BA)",
  "Afya Ribeira do Pombal - Ribeira do Pombal (BA)": "Faculdade de Ciências Médicas de Ribeira do Pombal - Ribeira do Pombal (BA)",
  "Afya Salvador - Salvador (BA)": "Faculdade de Ciências Médicas de Salvador - Salvador (BA)",
  "Afya Vitória da Conquista - Vitória da Conquista (BA)": "Faculdade de Ciências Médicas de Vitória da Conquista - Vitória da Conquista (BA)",
  "Afya Contagem - Contagem (MG)": "Faculdade de Ciências Médicas de Contagem - Contagem (MG)",
  "Afya Ipatinga - Ipatinga (MG)": "Faculdade de Ciências Médicas de Ipatinga - Ipatinga (MG)",
  "Afya Itajubá - Itajubá (MG)": "Faculdade de Medicina de Itajubá - Itajubá (MG)",
  "Afya Montes Claros - Montes Claros (MG)": "Faculdade de Ciências Médicas de Montes Claros - Montes Claros (MG)",
  "Afya São João del-Rei (UNIPTAN) - São João del-Rei (MG)": "Centro Universitário Presidente Tancredo de Almeida Neves (UNIPTAN) - São João del-Rei (MG)",
  "Afya Sete Lagoas - Sete Lagoas (MG)": "Faculdade de Ciências Médicas de Sete Lagoas - Sete Lagoas (MG)",
  "Afya Santa Inês - Santa Inês (MA)": "Faculdade de Ciências Médicas de Santa Inês - Santa Inês (MA)",
  "Afya Abaetetuba - Abaetetuba (PA)": "Faculdade de Ciências Médicas de Abaetetuba - Abaetetuba (PA)",
  "Afya Bragança - Bragança (PA)": "Faculdade de Ciências Médicas de Bragança - Bragança (PA)",
  "Afya Cametá - Cametá (PA)": "Faculdade de Ciências Médicas de Cametá - Cametá (PA)",
  "Afya Marabá - Marabá (PA)": "Faculdade de Ciências Médicas de Marabá - Marabá (PA)",
  "Afya Redenção - Redenção (PA)": "Faculdade de Ciências Médicas de Redenção - Redenção (PA)",
  "Afya Cabedelo (Afya Paraíba) - Cabedelo (PB)": "Faculdade de Ciências Médicas da Paraíba - Cabedelo (PB)",
  "Afya Garanhuns - Garanhuns (PE)": "Faculdade de Ciências Médicas de Garanhuns (FAMEG) - Garanhuns (PE)",
  "Afya Jaboatão dos Guararapes - Jaboatão dos Guararapes (PE)": "Faculdade de Ciências Médicas de Jaboatão dos Guararapes - Jaboatão dos Guararapes (PE)",
  "Afya Parnaíba - Parnaíba (PI)": "Faculdade de Ciências Médicas de Parnaíba - Parnaíba (PI)",
  "Afya Teresina (UNINOVAFAPI) - Teresina (PI)": "Centro Universitário UNINOVAFAPI - Teresina (PI)",
  "Afya Pato Branco - Pato Branco (PR)": "Faculdade de Ciências Médicas de Pato Branco - Pato Branco (PR)",
  "Afya Itaperuna (UniRedentor) - Itaperuna (RJ)": "Centro Universitário Redentor (UniRedentor) - Itaperuna (RJ)",
  "Afya Unigranrio Barra da Tijuca - Rio de Janeiro (RJ)": "Unigranrio Barra da Tijuca - Rio de Janeiro (RJ)",
  "Afya Unigranrio Duque de Caxias - Duque de Caxias (RJ)": "Unigranrio Duque de Caxias - Duque de Caxias (RJ)",
  "Afya Unigranrio Nova Iguaçu - Nova Iguaçu (RJ)": "Unigranrio Nova Iguaçu - Nova Iguaçu (RJ)",
  "Afya Ji-Paraná - Ji-Paraná (RO)": "Faculdade de Ciências Médicas de Ji-Paraná - Ji-Paraná (RO)",
  "Afya São Lucas - Porto Velho (RO)": "Centro Universitário São Lucas - Porto Velho (RO)",
  "Afya Araguaína (UNITPAC) - Araguaína (TO)": "Centro Universitário Tocantinense Presidente Antônio Carlos (UNITPAC) - Araguaína (TO)",
  "Afya Palmas (ITPAC) - Palmas (TO)": "Instituto Tocantinense Presidente Antônio Carlos (ITPAC) - Palmas (TO)",
  "Afya Porto Nacional (FAPAC) - Porto Nacional (TO)": "Faculdade Presidente Antônio Carlos (FAPAC) - Porto Nacional (TO)",
  "Afya Unigranrio Barra": "Unigranrio Barra"
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Defina MONGODB_URI.')
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db('gradex')
  try {
    let users = 0
    for (const [antigo, novo] of Object.entries(LEGACY_TO_CURRENT)) {
      const filtro = { afyaUnit: antigo }
      if (dryRun) users += await db.collection('users').countDocuments(filtro)
      else users += (await db.collection('users').updateMany(filtro, { $set: { afyaUnit: novo } })).modifiedCount
    }

    let coupons = 0
    const cupons = await db.collection('coupons')
      .find({ allowedAfyaUnits: { $in: Object.keys(LEGACY_TO_CURRENT) } }, { projection: { allowedAfyaUnits: 1 } })
      .toArray()
    for (const cupom of cupons) {
      const unidades = Array.from(new Set(cupom.allowedAfyaUnits.map((u) => LEGACY_TO_CURRENT[u] || u)))
      coupons++
      if (!dryRun) await db.collection('coupons').updateOne({ _id: cupom._id }, { $set: { allowedAfyaUnits: unidades } })
    }

    let pontos = 0
    const settings = await db.collection('shop_settings').find({ 'pickupPoints.0': { $exists: true } }).toArray()
    for (const doc of settings) {
      let mudou = false
      const lista = doc.pickupPoints.map((p) => {
        const name = String(p.name || '').replace(/\bAfya\s+/gi, '')
        const address = String(p.address || '').replace(/\bAfya\s+/gi, '')
        if (name !== p.name || address !== p.address) { mudou = true; pontos++ }
        return { ...p, name, address }
      })
      if (mudou && !dryRun) await db.collection('shop_settings').updateOne({ _id: doc._id }, { $set: { pickupPoints: lista } })
    }

    console.log(`${dryRun ? '[dry-run] ' : ''}usuários: ${users} · cupons: ${coupons} · pontos de retirada: ${pontos}`)
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
