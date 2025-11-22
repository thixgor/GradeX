# GradeX - Plataforma de Provas

Plataforma completa para criação e realização de provas de múltipla escolha com suporte a **TRI (Teoria de Resposta ao Item)**.

## 🚀 Funcionalidades

### Para Administradores
- ✅ Criar provas de múltipla escolha personalizadas
- ✅ Configurar número de questões e alternativas (2 a 5 alternativas)
- ✅ Dois métodos de pontuação:
  - **Normal**: Pontuação personalizada baseada em acertos
  - **TRI**: Sistema avançado com parâmetros de discriminação, dificuldade e acerto ao acaso
- ✅ Adicionar frase-tema para transcrição
- ✅ Upload de capa e anexo de PDF da prova
- ✅ Definir horários de abertura/fechamento e início/término
- ✅ Gerenciar provas (editar, deletar, ocultar)
- ✅ Gerar gabarito em PDF automaticamente

### Para Usuários
- ✅ Visualizar provas disponíveis
- ✅ Realizar provas com interface intuitiva
- ✅ Marcar alternativas e "cortar" opções erradas
- ✅ Transcrever frase-tema em caixa estilizada
- ✅ Receber nota imediata (método normal) ou após término (TRI)
- ✅ Visualizar ranking e resultados
- ✅ Baixar gabarito e PDF da prova

### Design
- 🎨 Interface moderna e responsiva
- 📱 Otimizado para mobile, tablet e desktop
- 🌓 Modo claro e escuro
- ⚡ Animações suaves e transições

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: MongoDB
- **Autenticação**: JWT com cookies httpOnly
- **PDF**: jsPDF
- **UI Components**: Componentes customizados com Tailwind

## 📋 Pré-requisitos

- Node.js 18+
- MongoDB (local ou Atlas)
- npm ou yarn

## ⚙️ Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd GradeX
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/gradex
JWT_SECRET=sua-chave-secreta-super-segura
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Inicie o MongoDB (se estiver rodando localmente):
```bash
mongod
```

5. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

6. Acesse a aplicação:
```
http://localhost:3000
```

## 👤 Primeiro Acesso

Na primeira vez que acessar a plataforma:

1. Vá para `/auth/login`
2. Clique em "Criar conta"
3. Preencha os dados
4. Selecione "Administrador" como tipo de conta
5. Crie sua conta

## 📚 Como Usar

### Criando uma Prova (Admin)

1. Faça login como administrador
2. Clique em "Nova Prova" no header
3. Preencha as informações básicas:
   - Título e descrição
   - Número de questões e alternativas
   - Método de pontuação (Normal ou TRI)
   - Horários de início e término
4. Configure cada questão:
   - Enunciado e comando
   - Imagens e fontes (opcional)
   - Alternativas (marque a correta)
   - Parâmetros TRI (se aplicável)
5. Salve a prova

### Realizando uma Prova (Usuário)

1. Faça login como usuário
2. Selecione uma prova disponível
3. Preencha seu nome e transcreva a frase-tema (se houver)
4. Responda as questões:
   - Clique no círculo para selecionar
   - Clique no X para "cortar" alternativas
5. Finalize a prova
6. Veja sua nota (ou aguarde o cálculo TRI)

### Visualizando Resultados

Após o término da prova:
- Acesse a prova novamente
- Clique em "Ver Resultados"
- Baixe o gabarito em PDF
- Veja o ranking dos participantes

## 🧮 Sistema TRI

O sistema TRI (Teoria de Resposta ao Item) usa a fórmula de 3 parâmetros:

```
P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
```

Onde:
- **θ (theta)**: Habilidade do aluno
- **a**: Discriminação da questão (0.5 - 2.5)
- **b**: Dificuldade da questão (-3 a +3)
- **c**: Probabilidade de acerto ao acaso (1/número de alternativas)

A nota final é convertida para escala de 0 a 1000 pontos (padrão ENEM).

## 📁 Estrutura do Projeto

```
GradeX/
├── app/
│   ├── api/              # API Routes
│   │   ├── auth/         # Autenticação
│   │   └── exams/        # Provas
│   ├── admin/            # Páginas Admin
│   ├── auth/             # Login/Registro
│   ├── exam/             # Realizar prova
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página inicial
├── components/
│   ├── ui/               # Componentes UI
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── lib/
│   ├── auth.ts           # Autenticação
│   ├── mongodb.ts        # Conexão DB
│   ├── tri-calculator.ts # Cálculo TRI
│   ├── pdf-generator.ts  # Geração de PDF
│   ├── types.ts          # Tipos TypeScript
│   └── utils.ts          # Utilitários
└── public/               # Arquivos estáticos
```

## 🔒 Segurança

- Senhas hashadas com bcrypt
- Autenticação JWT com cookies httpOnly
- Validação de permissões em todas as rotas
- Sanitização de inputs

## 🎨 Personalização

### Cores do Tema

Edite `app/globals.css` para personalizar as cores:

```css
:root {
  --primary: 262 83% 58%;  /* Roxo */
  --background: 0 0% 100%; /* Branco */
  /* ... */
}

.dark {
  --primary: 262 83% 58%;  /* Roxo */
  --background: 222.2 84% 4.9%; /* Preto azulado */
  /* ... */
}
```

## 🐛 Troubleshooting

### Erro de conexão com MongoDB
- Verifique se o MongoDB está rodando
- Confirme a string de conexão no `.env.local`

### Erro de autenticação
- Limpe os cookies do navegador
- Verifique se JWT_SECRET está configurado

### Problemas com build
```bash
rm -rf .next
npm install
npm run build
```

## 📄 Licença

Este projeto é de código aberto.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## ✨ Recursos Futuros

- [ ] Upload de imagens direto na plataforma
- [ ] Editor de texto rico para questões
- [ ] Exportação de resultados em Excel
- [ ] Sistema de notificações
- [ ] Comentários nas questões
- [ ] Análise estatística avançada
- [ ] Modo offline
- [ ] API pública

---

Desenvolvido com ❤️ para facilitar a criação e aplicação de provas educacionais.
