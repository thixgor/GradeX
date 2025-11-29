const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createAdmin() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gradex'
  const client = new MongoClient(uri)

  try {
    console.log('🚀 GradeX - Criar Usuário Administrador\n')

    const name = await question('Nome completo: ')
    const email = await question('Email: ')
    const password = await question('Senha: ')

    console.log('\n⏳ Criando usuário...\n')

    await client.connect()
    const db = client.db('gradex')
    const usersCollection = db.collection('users')

    // Verifica se o email já existe
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      console.log('❌ Erro: Email já cadastrado!')
      return
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Cria o usuário
    const result = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    })

    console.log('✅ Usuário administrador criado com sucesso!')
    console.log(`ID: ${result.insertedId}`)
    console.log(`Nome: ${name}`)
    console.log(`Email: ${email}`)
    console.log(`Função: Administrador\n`)
  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.close()
    rl.close()
  }
}

createAdmin()
