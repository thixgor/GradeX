# Configuração de Chaves de IA por Seção

## Visão Geral

O sistema agora suporta diferentes API keys de IA para cada seção da aplicação, permitindo distribuir a carga e evitar limites de RPM (Requests Per Minute).

## Seções Disponíveis

### 1. **Provas Gerais** (`generalExams`)
- **Localização**: `/admin/exams/create`
- **Uso**: Criação de provas gerais/públicas pelo admin
- **Descrição**: Gera questões para provas que serão disponibilizadas para múltiplos usuários

### 2. **Provas Pessoais** (`personalExams`)
- **Localização**: `/exams/personal/[id]/generate-questions`
- **Uso**: Geração de questões para provas pessoais do usuário
- **Descrição**: Gera questões customizadas para provas criadas por usuários individuais

### 3. **Flashcards** (`flashcards`)
- **Localização**: `/flashcards`
- **Uso**: Geração de flashcards com IA
- **Descrição**: Cria decks de flashcards automaticamente

## Como Configurar

### Passo 1: Acessar Configurações
1. Vá para `/admin/settings`
2. Role até a seção **"Configurações de Chaves de IA"**

### Passo 2: Adicionar Chaves
Para cada seção, você pode configurar uma API key diferente:

```
API Key para Provas Gerais:     sk-xxxxxxxxxxxxx
API Key para Provas Pessoais:   sk-yyyyyyyyyyyyy
API Key para Flashcards:        sk-zzzzzzzzzzzzz
```

### Passo 3: Salvar
Clique em **"Salvar Chaves de IA"** para aplicar as configurações.

## Fallback

Se você deixar uma chave em branco, o sistema usará automaticamente:
1. A chave padrão do banco de dados (se configurada)
2. A variável de ambiente `OPENAI_API_KEY`

## Benefícios

✅ **Distribuição de Carga**: Cada seção usa sua própria quota de RPM
✅ **Melhor Performance**: Reduz contenção entre diferentes tipos de requisições
✅ **Flexibilidade**: Pode usar diferentes provedores ou contas
✅ **Fallback Automático**: Continua funcionando se uma chave falhar

## Exemplo de Uso

### Cenário 1: Usar chaves diferentes
```
Provas Gerais:   sk-proj-admin-key-xxxxx (chave de admin)
Provas Pessoais: sk-proj-user-key-yyyyy  (chave de usuário)
Flashcards:      sk-proj-flash-key-zzzz  (chave dedicada)
```

### Cenário 2: Usar chave padrão para tudo
```
Deixe todos os campos em branco
Sistema usará a chave padrão do ambiente
```

### Cenário 3: Usar chaves específicas com fallback
```
Provas Gerais:   sk-proj-admin-key-xxxxx
Provas Pessoais: (deixar em branco - usa padrão)
Flashcards:      sk-proj-flash-key-zzzz
```

## Implementação Técnica

### Arquivo: `lib/ai-keys.ts`
Contém funções para obter chaves por seção:
- `getAIKey(section)` - Obtém chave para uma seção específica
- `getAllAIKeys()` - Obtém todas as chaves configuradas

### Arquivo: `lib/question-generator.ts`
Funções para gerenciar a seção atual:
- `setAIKeySection(section)` - Define qual seção usar
- `getAIKeySection()` - Obtém a seção atual

### Uso em APIs

```typescript
// Em /app/api/exams/[id]/generate-questions/route.ts
import { setAIKeySection } from '@/lib/question-generator'

// Definir seção para Provas Pessoais
setAIKeySection('personalExams')

// Gerar questões (usará a chave configurada)
const question = await generateMultipleChoiceQuestion(params)
```

## Monitoramento

Para monitorar o uso de cada chave:
1. Acesse o dashboard do seu provedor de IA
2. Verifique o uso por chave/projeto
3. Ajuste as configurações conforme necessário

## Troubleshooting

### Erro: "API Key não configurada"
- Verifique se a chave está corretamente configurada em `/admin/settings`
- Confirme que a chave é válida e ativa no provedor

### Erro: "Limite de RPM atingido"
- Distribua as requisições entre diferentes chaves
- Aumente o limite de RPM no provedor
- Implemente rate limiting no cliente

### Chave não está sendo usada
- Confirme que `setAIKeySection()` foi chamado antes de gerar questões
- Verifique se a chave está configurada em `/admin/settings`
- Consulte os logs para ver qual chave está sendo usada
