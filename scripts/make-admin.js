const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
const readline = require('readline')

/**
 * Promove uma conta JÁ EXISTENTE a administrador (role: 'admin') pelo email.
 * Se a conta não existir, oferece criá-la na hora.
 *
 * Uso:
 *   npm run make-admin -- email@exemplo.com
 *   npm run make-admin                 (pergunta o email interativamente)
 */

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function makeAdmin() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gradex'
  const client = new MongoClient(uri)

  try {
    console.log('🚀 GradeX - Promover Conta a Administrador\n')

    // Email pode vir por argumento (npm run make-admin -- email@x.com) ou ser perguntado
    let email = process.argv[2]
    if (!email) {
      email = await question('Email da conta: ')
    }
    email = (email || '').trim().toLowerCase()

    if (!email) {
      console.log('❌ Erro: Email não informado.')
      return
    }

    await client.connect()
    const db = client.db('gradex')
    const usersCollection = db.collection('users')

    // Busca case-insensitive para evitar problemas de maiúsculas/minúsculas
    const existingUser = await usersCollection.findOne({
      email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    })

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`ℹ️  A conta ${existingUser.email} já é administradora. Nada a fazer.`)
        return
      }

      await usersCollection.updateOne(
        { _id: existingUser._id },
        { $set: { role: 'admin', updatedAt: new Date() } }
      )

      console.log('✅ Conta promovida a administrador com sucesso!')
      console.log(`ID: ${existingUser._id}`)
      console.log(`Nome: ${existingUser.name || '(sem nome)'}`)
      console.log(`Email: ${existingUser.email}`)
      console.log('\n⚠️  Se a pessoa estiver logada, peça para deslogar e logar de novo')
      console.log('    (o cargo é lido do token; pode levar até ~1min pelo cache de sessão).')
      return
    }

    // Conta não existe — oferece criar
    console.log(`\n⚠️  Nenhuma conta encontrada com o email "${email}".`)
    const create = (await question('Deseja CRIAR essa conta como admin agora? (s/N): ')).trim().toLowerCase()
    if (create !== 's' && create !== 'sim') {
      console.log('Operação cancelada.')
      return
    }

    const name = await question('Nome completo: ')
    const password = await question('Senha: ')
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      createdAt: new Date(),
    })

    console.log('\n✅ Usuário administrador criado com sucesso!')
    console.log(`ID: ${result.insertedId}`)
    console.log(`Nome: ${name}`)
    console.log(`Email: ${email}`)
  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.close()
    rl.close()
  }
}

makeAdmin()
