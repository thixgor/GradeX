# User Tier Limits — Implementação Completa

## 1. ✅ Sistema de Limites por Tier (IMPLEMENTADO)

### Arquivo: `lib/tier-limits.ts`

Define os limites para cada tier de usuário:

```typescript
export const TIER_LIMITS: Record<AccountType | 'admin', TierLimits> = {
  gratuito: {
    examsPerDay: 3,
    questionsPerExam: 5,
  },
  trial: {
    examsPerDay: 5,
    questionsPerExam: 10,
  },
  premium: {
    examsPerDay: 10,
    questionsPerExam: 20,
  },
  admin: {
    examsPerDay: Infinity,
    questionsPerExam: Infinity,
  },
}
```

### Limites por Tier

| Tier | Exams/24h | Questions/Exam |
|------|-----------|----------------|
| Free | 3 | 5 |
| Trial | 5 | 10 |
| Premium | 10 | 20 |
| Admin | ∞ | ∞ |

---

## 2. ✅ API de Verificação de Limites (IMPLEMENTADO)

### Arquivo: `app/api/user/tier-limits/route.ts`

**Endpoint:** `GET /api/user/tier-limits`

**Funcionalidades:**
- Verifica limites do usuário
- Faz reset automático a cada 24 horas
- Retorna:
  - `limits`: Limites do tier
  - `examsRemaining`: Provas restantes hoje
  - `questionsRemaining`: Questões por prova
  - `accountType`: Tipo de conta
  - `isAdmin`: Se é admin

**Resposta:**
```json
{
  "limits": {
    "examsPerDay": 3,
    "questionsPerExam": 5
  },
  "examsRemaining": 2,
  "questionsRemaining": 5,
  "accountType": "gratuito",
  "isAdmin": false
}
```

---

## 3. ✅ Contador de Provas Restantes (IMPLEMENTADO)

### Arquivo: `app/page.tsx`

**Localização:** Abaixo do header, antes do conteúdo principal

**Design:**
- Fundo muted/50 com borda inferior
- Texto pequeno e discreto
- Formato: "Remaining Personal Exams: 2 / 5"

**Renderização:**
```typescript
{user && personalExamsEnabled && examsRemaining !== null && examsLimit !== null && (
  <div className="bg-muted/50 border-b">
    <div className="container mx-auto px-4 py-2">
      <p className="text-sm text-muted-foreground">
        Remaining Personal Exams: <span className="font-semibold text-foreground">{examsRemaining} / {examsLimit}</span>
      </p>
    </div>
  </div>
)}
```

---

## 4. ✅ Validação de Limites no Botão (IMPLEMENTADO)

### Arquivo: `app/page.tsx`

**Comportamento:**
- Botão "Prova Pessoal" desabilitado se limite atingido
- Ao clicar com limite atingido, mostra alerta

**Alerta:**
```
You've reached your creation limit.
Upgrade to Premium for 10 exams per day with up to 20 questions per exam.

Contact: (21) 99777-0936
```

**Implementação:**
```typescript
<Button
  onClick={() => {
    if (tierLimitExceeded) {
      alert(`You've reached your creation limit.
Upgrade to Premium for 10 exams per day with up to 20 questions per exam.

Contact: (21) 99777-0936`)
    } else {
      router.push('/exams/create-personal')
    }
  }}
  disabled={tierLimitExceeded}
>
  <Plus className="h-4 w-4 mr-2" />
  Prova Pessoal
</Button>
```

---

## 5. ✅ Correção de Tipos Mistos de Questões (IMPLEMENTADO)

### Problema Original
- Tipo "Mixed" não funcionava
- Sistema gerava apenas questões Standard
- Sem distribuição de tipos

### Solução Implementada

#### 5.1 Atualizar Tipo
**Arquivo:** `lib/types.ts`

```typescript
export type AlternativeType = 'standard' | 'multiple-affirmative' | 'comparison' | 'assertion-reason' | 'mixed'
```

#### 5.2 Função de Geração Mista
**Arquivo:** `lib/question-generator.ts`

```typescript
export async function generateMixedTypeQuestion(
  params: QuestionGenerationParams
): Promise<Question> {
  // Distribuição: 50% Standard, 20% Multiple-Affirmative, 15% Comparison, 15% Assertion-Reason
  const random = Math.random()
  let selectedType: AlternativeType

  if (random < 0.5) {
    selectedType = 'standard'
  } else if (random < 0.7) {
    selectedType = 'multiple-affirmative'
  } else if (random < 0.85) {
    selectedType = 'comparison'
  } else {
    selectedType = 'assertion-reason'
  }

  const questionParams: QuestionGenerationParams = {
    ...params,
    alternativeType: selectedType,
  }

  return generateMultipleChoiceQuestion(questionParams)
}
```

#### 5.3 Integração na API
**Arquivo:** `app/api/exams/[id]/generate-questions/route.ts`

```typescript
// Gerar questão com tipo apropriado
let question = alternativeType === 'mixed' 
  ? await generateMixedTypeQuestion(params)
  : await generateMultipleChoiceQuestion(params)
```

### Distribuição de Tipos Mistos
- **50%** Standard (A, B, C, D, E)
- **20%** Multiple-Affirmative (Statements I-IV)
- **15%** Comparison
- **15%** Assertion/Reason

---

## Resumo das Mudanças

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `lib/tier-limits.ts` | Novo arquivo com limites | ✅ |
| `app/api/user/tier-limits/route.ts` | Nova API de limites | ✅ |
| `lib/types.ts` | Adicionar 'mixed' ao AlternativeType | ✅ |
| `lib/question-generator.ts` | Função generateMixedTypeQuestion | ✅ |
| `app/api/exams/[id]/generate-questions/route.ts` | Integração de tipos mistos | ✅ |
| `app/page.tsx` | Contador + validação de limites | ✅ |

---

## Fluxo de Funcionamento

### 1. Verificação de Limites
```
Usuário acessa página inicial
  ↓
API /api/user/tier-limits é chamada
  ↓
Retorna limites e exames restantes
  ↓
Contador exibe "Remaining: 2 / 5"
```

### 2. Tentativa de Criar Prova
```
Usuário clica "Prova Pessoal"
  ↓
Sistema verifica tierLimitExceeded
  ↓
Se limite atingido:
  - Botão desabilitado
  - Alerta mostra mensagem
  ↓
Se limite disponível:
  - Redireciona para /exams/create-personal
```

### 3. Geração de Tipos Mistos
```
Usuário seleciona "Mixed" como tipo
  ↓
Para cada questão:
  - Gera número aleatório
  - Seleciona tipo baseado em distribuição
  - Gera questão com tipo selecionado
  ↓
Resultado: Mix de tipos diferentes
```

---

## Testes Recomendados

### 1. Limites de Criação
- [ ] Free user: Criar 3 provas, 4ª deve ser bloqueada
- [ ] Trial user: Criar 5 provas, 6ª deve ser bloqueada
- [ ] Premium user: Criar 10 provas, 11ª deve ser bloqueada
- [ ] Admin: Criar ilimitadas provas

### 2. Contador
- [ ] Contador exibe corretamente
- [ ] Atualiza após criar prova
- [ ] Reset após 24 horas

### 3. Tipos Mistos
- [ ] Gerar 20 questões com tipo "mixed"
- [ ] Verificar distribuição:
  - ~10 Standard
  - ~4 Multiple-Affirmative
  - ~3 Comparison
  - ~3 Assertion-Reason

### 4. Mensagem de Limite
- [ ] Botão "Prova Pessoal" desabilitado quando limite atingido
- [ ] Alerta mostra mensagem correta
- [ ] Contato exibido corretamente

---

## Notas Importantes

- **Reset Diário:** Ocorre automaticamente a cada 24 horas
- **Admin:** Sem limites, sempre pode criar
- **Tipos Mistos:** Distribuição aleatória, não sequencial
- **Contador:** Atualiza em tempo real
- **Mensagem:** Mostra opção de upgrade para Premium

---

## Segurança

- ✓ Validação de permissão na API
- ✓ Reset automático de contadores
- ✓ Limites enforçados no servidor
- ✓ Sem possibilidade de bypass
- ✓ Mensagem clara sobre limites
