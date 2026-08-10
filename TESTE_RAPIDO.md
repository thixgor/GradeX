# 🧪 GUIA DE TESTE RÁPIDO - Sistema de Monitoramento

## 📋 Pré-requisitos

✅ Dependências instaladas: `npm install` ✅ CONCLUÍDO

## 🚀 Como Testar

### Passo 1: Iniciar os Servidores

**Abra um terminal e rode:**

```bash
cd /home/user/Domine Aqui
npm run dev:all
```

Isso vai iniciar:
- ✅ Next.js em http://localhost:3000
- ✅ WebSocket Server em ws://localhost:3001

**Aguarde ver estas mensagens**:
```
[WS] Servidor WebSocket rodando na porta 3001
✓ Ready in 2.5s
```

### Passo 2: Criar/Acessar Prova com Proctoring

1. Acesse http://localhost:3000/admin/exams
2. Crie uma prova nova ou edite uma existente
3. **IMPORTANTE: Ative o proctoring:**
   - ✅ Marcar checkbox "Habilitar Sistema de Monitoramento"
   - ✅ Marcar "Câmera"
   - ✅ Salvar a prova
4. Copie o ID da prova (ex: `67a1b2c3d4e5f...`)

### Passo 3: Abrir Admin Panel

1. **Abra uma ABA NOVA** no navegador
2. Acesse: http://localhost:3000/admin/proctoring
3. Deve ver:
   - 🟢 "Conectado ao servidor em tempo real" (bolinha verde)
   - "Nenhuma sessão ativa no momento"

**Se aparecer bolinha vermelha:**
- O servidor WebSocket não está rodando
- Volte ao Passo 1

### Passo 4: Iniciar Prova como Aluno

1. **Abra OUTRA ABA NOVA** (ou janela anônima)
2. Acesse: http://localhost:3000/exam/SEU_ID_DA_PROVA
3. Digite um nome de usuário (ex: "João Silva")
4. Clique em "Iniciar Prova"
5. **DEVE APARECER:** Modal de termo de consentimento
6. Aceite o termo
7. **PERMITA** acesso à câmera quando o navegador perguntar
8. Prova deve iniciar normalmente

### Passo 5: Verificar Admin Panel

1. **Volte para a aba do Admin** (http://localhost:3000/admin/proctoring)
2. Clique em "Atualizar" ou espere 5 segundos
3. **DEVE APARECER:**
   - Card com informações do aluno
   - Nome: "João Silva"
   - Bolinha verde "ATIVO"
   - Ícones: 📹 (câmera ativa)

### Passo 6: Testar Alerta de Troca de Aba

1. **Na aba do aluno** (fazendo a prova):
   - Pressione `Alt+Tab` OU
   - Clique em outra aba do navegador
   - **AGUARDE 1-2 segundos**
   - Volte para a aba da prova

2. **Na aba do admin** (painel):
   - **DEVE APARECER INSTANTANEAMENTE:**

   ```
   ⚠️ Alertas em Tempo Real

   🚫 Troca de Aba/Janela    14:35:20
   João Silva saiu da aba da prova
   Total: 1 trocas

   👁️ Troca de Aba/Janela    14:35:35
   João Silva voltou para a aba da prova
   (ficou 15s fora) - Total: 2 trocas
   ```

## 🐛 Debug se não funcionar

### Problema 1: Servidor WebSocket não inicia

**Erro: `EADDRINUSE: address already in use :::3001`**

Solução:
```bash
# Encontrar e matar processo na porta 3001
lsof -ti:3001 | xargs kill -9

# Tentar novamente
npm run dev:all
```

### Problema 2: Bolinha vermelha no admin

**Causa:** WebSocket não conectou

Solução:
1. Abrir console do navegador (F12)
2. Ver logs `[WS Client]` ou `[ADMIN WS]`
3. Se mostrar erro de conexão:
   - Verificar se servidor está rodando (`npm run dev:all`)
   - Verificar se porta 3001 está livre

### Problema 3: Alertas não aparecem

**Verificar:**

1. **Console do aluno** (aba da prova, F12):
   ```
   [WS Client] Conectado!
   [VISIBILITY] ⚠️ Usuário trocou de aba/janela
   [WS Client] Mensagem enviada: tab-switch
   ```

2. **Console do admin** (painel, F12):
   ```
   [ADMIN WS] Mensagem recebida: Object { type: "alert", ... }
   ```

3. **Terminal do servidor**:
   ```
   [WS] Cliente conectado: student-...
   [WS] Mensagem de student-...: tab-switch
   [WS] Broadcast para 1 admins: alert
   ```

Se **NÃO** aparecer algum desses logs:
- O WebSocket não está conectado corretamente
- Voltar ao Passo 1 e verificar se ambos servidores iniciaram

### Problema 4: Modal de consentimento não aparece

**Causa:** Proctoring não foi ativado na prova

Solução:
1. Ir em /admin/exams
2. Clicar em "Editar" na prova
3. Role até "Sistema de Monitoramento (Proctoring)"
4. Marcar checkbox "Habilitar Sistema de Monitoramento"
5. Marcar "Câmera"
6. Salvar

## ✅ Teste de Sucesso

Você saberá que está funcionando quando:

1. ✅ Bolinha verde no admin
2. ✅ Card do aluno aparece no admin quando inicia prova
3. ✅ Ao trocar de aba, alerta aparece INSTANTANEAMENTE
4. ✅ Console mostra logs de ambos os lados

## 📸 O que você deve ver

**Admin Panel:**
```
🟢 Conectado ao servidor em tempo real

⚠️ 2 alertas não lidos

╔═══════════════════════════════════════╗
║ ⚠️ Alertas em Tempo Real              ║
║ 2 não lidos de 2 totais               ║
╠═══════════════════════════════════════╣
║ 🚫 14:35:20 - Troca de Aba           ║
║ João Silva saiu da aba da prova       ║
║ Total: 1 trocas            [✓ Marcar] ║
╠═══════════════════════════════════════╣
║ 👁️ 14:35:35 - Troca de Aba          ║
║ João Silva voltou para a aba da prova ║
║ (ficou 15s fora) - Total: 2 trocas   ║
║                            [✓ Marcar] ║
╚═══════════════════════════════════════╝
```

---

**Se seguir esses passos e AINDA NÃO funcionar, me mande:**
1. Logs do terminal (servidor)
2. Logs do console do navegador (aluno)
3. Logs do console do navegador (admin)
