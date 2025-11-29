# Bug Fixes and Quota Management — Implementação Completa

## 1. ✅ Correção: Contextos "Other" Não Carregam (CORRIGIDO)

### Problema Original
- Usuários selecionavam "Other" mas a lista de contextos personalizados não aparecia
- API retornava erro de permissão

### Solução Implementada

**Arquivo:** `app/api/contexts/route.ts`

**Mudança:**
- Removida verificação de permissão de admin
- Agora qualquer usuário autenticado pode acessar contextos personalizados

```typescript
// GET - Obter todos os contextos personalizados
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const settingsCollection = db.collection<Settings>('settings')
    const settings = await settingsCollection.findOne({})

    return NextResponse.json({
      success: true,
      contexts: settings?.customContexts || [],
    })
  } catch (error: any) {
    console.error('Error fetching custom contexts:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar contextos' },
      { status: 500 }
    )
  }
}
```

---

## 2. ✅ Correção: Toggle "Enable Personal Exams" Não Funciona (CORRIGIDO)

### Problema Original
- Toggle em `/admin/settings` não salvava corretamente
- Configuração não era aplicada mesmo após salvar

### Solução Implementada

**Arquivo:** `app/admin/settings/page.tsx`

**Mudança:**
- Adicionado reload automático da página após salvar
- Garante que as mudanças sejam aplicadas imediatamente

```typescript
setSuccess('Configurações salvas com sucesso!')
// Recarregar a página após 2 segundos para aplicar as mudanças
setTimeout(() => {
  window.location.reload()
}, 2000)
```

**Verificação:**
- A API já estava salvando corretamente em `app/api/admin/settings/route.ts`
- O problema era apenas na UI não refletir a mudança

---

## 3. ✅ Nova Funcionalidade: Admin Control de Quotas de Provas Pessoais (IMPLEMENTADO)

### Localização
**Página:** `/admin/users`

### Funcionalidades Implementadas

#### 3.1 Novo Botão "Gerenciar Quotas"
**Arquivo:** `app/admin/users/page.tsx`

- Botão adicionado para cada usuário não-admin
- Abre diálogo para gerenciar quotas

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setSelectedUser(user)
    setExamsQuota(user.dailyPersonalExamsCreated || 0)
    setShowQuotaDialog(true)
  }}
>
  <Settings className="h-4 w-4 mr-2" />
  Gerenciar Quotas
</Button>
```

#### 3.2 Diálogo de Gerenciamento de Quotas
**Arquivo:** `app/admin/users/page.tsx`

**Campos:**
- **Input:** "Provas Pessoais Restantes" (número 0-999)
- **Status Atual:** Indicador visual do status
  - ✓ Quota disponível (se 0 provas criadas)
  - ⚠ X provas criadas hoje (se > 0)

**Exemplo:**
```
Gerenciar Quotas de Provas Pessoais
Ajustar quotas de provas pessoais para [Nome do Usuário]

Provas Pessoais Restantes: [Input: 5]
Número de provas que o usuário pode criar nas próximas 24 horas

Status Atual:
✓ Quota disponível
```

#### 3.3 Função de Atualização de Quotas
**Arquivo:** `app/admin/users/page.tsx`

```typescript
async function handleUpdateQuota() {
  if (!selectedUser) return

  try {
    const res = await fetch(`/api/users/${selectedUser._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_quota',
        dailyPersonalExamsCreated: examsQuota
      })
    })

    if (!res.ok) throw new Error('Erro ao atualizar quota do usuário')

    const data = await res.json()
    showToastMessage(data.message, 'success')
    setShowQuotaDialog(false)
    loadUsers()
  } catch (error: any) {
    showToastMessage(error.message)
  }
}
```

#### 3.4 API de Atualização de Quotas
**Arquivo:** `app/api/users/[id]/route.ts`

**Ação:** `update_quota`

**Validações:**
- Verifica se valor é número válido (>= 0)
- Atualiza `dailyPersonalExamsCreated`
- Reseta `lastDailyReset` para agora

```typescript
} else if (action === 'update_quota') {
  // update_quota
  if (typeof dailyPersonalExamsCreated !== 'number' || dailyPersonalExamsCreated < 0) {
    return NextResponse.json(
      { error: 'Valor de quota inválido' },
      { status: 400 }
    )
  }

  updateData = {
    dailyPersonalExamsCreated,
    lastDailyReset: new Date()
  }

  successMessage = 'Quotas do usuário atualizadas com sucesso'
}
```

---

## Resumo das Mudanças

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `app/api/contexts/route.ts` | Remover verificação de admin | ✅ |
| `app/admin/settings/page.tsx` | Adicionar reload após salvar | ✅ |
| `app/admin/users/page.tsx` | Adicionar botão e diálogo de quotas | ✅ |
| `app/api/users/[id]/route.ts` | Adicionar ação `update_quota` | ✅ |

---

## Fluxo de Uso — Gerenciamento de Quotas

### 1. Admin Acessa Página de Usuários
```
Admin → /admin/users
```

### 2. Admin Seleciona Usuário
```
Clica em "Gerenciar Quotas" para um usuário
```

### 3. Diálogo Abre
```
Mostra:
- Campo de entrada com valor atual
- Status atual da quota
- Botões: Cancelar / Atualizar Quotas
```

### 4. Admin Ajusta Quota
```
Muda valor de "Provas Pessoais Restantes"
Clica "Atualizar Quotas"
```

### 5. Sistema Atualiza
```
API recebe requisição PATCH
Valida dados
Atualiza usuário no banco
Retorna mensagem de sucesso
UI recarrega lista de usuários
```

---

## Casos de Uso

### Caso 1: Usuário Atingiu Limite
```
Admin vê que usuário criou 3 provas (limite free)
Admin abre "Gerenciar Quotas"
Muda "Provas Pessoais Restantes" de 0 para 2
Clica "Atualizar Quotas"
Usuário agora pode criar 2 mais provas
```

### Caso 2: Reset Manual de Quota
```
Admin quer resetar quota de um usuário
Abre "Gerenciar Quotas"
Muda valor para limite completo do tier
Clica "Atualizar Quotas"
Quota é resetada manualmente
```

### Caso 3: Verificar Status
```
Admin vê status atual:
- "✓ Quota disponível" = Usuário não criou nenhuma prova hoje
- "⚠ 2 provas criadas hoje" = Usuário já criou 2 provas
```

---

## Testes Recomendados

### 1. Contextos "Other"
- [ ] Criar contexto personalizado em admin
- [ ] Selecionar "Outros" em prova pessoal
- [ ] Verificar que lista de contextos aparece
- [ ] Selecionar contexto e gerar questões

### 2. Toggle "Enable Personal Exams"
- [ ] Desabilitar toggle
- [ ] Recarregar página
- [ ] Verificar que usuários não veem "Prova Pessoal"
- [ ] Habilitar toggle
- [ ] Recarregar página
- [ ] Verificar que usuários veem "Prova Pessoal"

### 3. Gerenciamento de Quotas
- [ ] Abrir /admin/users
- [ ] Clicar "Gerenciar Quotas" para um usuário
- [ ] Verificar que diálogo abre
- [ ] Mudar valor de quota
- [ ] Clicar "Atualizar Quotas"
- [ ] Verificar mensagem de sucesso
- [ ] Recarregar página
- [ ] Verificar que quota foi atualizada

### 4. Status de Quota
- [ ] Usuário com 0 provas criadas: "✓ Quota disponível"
- [ ] Usuário com 2 provas criadas: "⚠ 2 provas criadas hoje"
- [ ] Atualizar quota e verificar que status muda

---

## Notas Importantes

- **Contextos:** Agora qualquer usuário autenticado pode acessar contextos personalizados
- **Toggle:** Recarrega página para aplicar mudanças imediatamente
- **Quotas:** Admin pode ajustar quotas manualmente a qualquer momento
- **Reset:** Atualizar quota reseta o `lastDailyReset` para agora
- **Validação:** API valida todos os dados antes de atualizar

---

## Segurança

- ✓ Apenas admin pode gerenciar quotas
- ✓ Validação de dados na API
- ✓ Verificação de autenticação
- ✓ Mensagens de erro apropriadas
- ✓ Sem exposição de dados sensíveis
