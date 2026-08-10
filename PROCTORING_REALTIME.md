# 🎥 Sistema de Monitoramento em Tempo Real - Domine Aqui

Sistema completo e autoral de proctoring com WebSocket e detecção de comportamento suspeito.

## ✨ Funcionalidades Implementadas

### 1. **Servidor WebSocket** (Comunicação Bidirecional)
- ✅ Servidor Node.js puro rodando na porta 3001
- ✅ Gerenciamento de conexões de alunos e admins
- ✅ Broadcasting de alertas para todos os admins conectados
- ✅ Reconexão automática com backoff exponencial
- ✅ Suporte para sinalização WebRTC (preparado)

### 2. **Detecção de Troca de Abas/Janelas**
- ✅ Page Visibility API para detectar quando aluno sai da aba
- ✅ Contador de trocas de aba
- ✅ Medição de tempo fora da prova
- ✅ Envio automático de alertas via WebSocket

### 3. **Painel Admin com Alertas em Tempo Real**
- ✅ Indicador visual de conexão WebSocket (verde = conectado)
- ✅ Seção de alertas em tempo real com animação
- ✅ Detalhes completos: nome, hora, ação, duração, total de trocas
- ✅ Botão para marcar alertas como lidos
- ✅ Contador de alertas não lidos
- ✅ Auto-scroll para novos alertas

## 🚀 Como Usar

### Instalação

```bash
# Instalar dependências
npm install
```

### Desenvolvimento

**Opção 1: Rodar tudo junto (recomendado)**
```bash
npm run dev:all
```

**Opção 2: Rodar separadamente**

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
npm run dev:ws
```

### O que acontece:
- **Next.js**: http://localhost:3000
- **WebSocket Server**: ws://localhost:3001

## 📊 Como Funciona

### Fluxo do Aluno (Student)

1. Aluno acessa prova com proctoring habilitado
2. Aceita termo de consentimento
3. **WebSocket conecta automaticamente**
4. **Detecção de visibilidade ativada**
5. Quando troca de aba/janela:
   - Sistema detecta instantaneamente
   - Envia alerta via WebSocket
   - Conta tempo fora da prova
   - Retorna à prova → envia alerta de retorno

### Fluxo do Admin (Administrator)

1. Admin acessa `/admin/proctoring`
2. **WebSocket conecta automaticamente**
3. Vê lista de alunos fazendo provas
4. **Recebe alertas em tempo real quando aluno**:
   - Troca de aba/janela
   - Volta para a prova (com tempo que ficou fora)
5. Pode marcar alertas como lidos

## 🔧 Arquivos Criados

```
server/
├── websocket-server.ts   # TypeScript (código fonte)
└── websocket-server.js   # JavaScript (executável)

hooks/
├── use-websocket.ts          # Hook para conexão WebSocket
└── use-visibility-detection.ts  # Hook para detecção de abas

app/
├── exam/[id]/page.tsx        # Integrado: WS + detecção
└── admin/proctoring/page.tsx # Integrado: receber alertas
```

## 📡 Protocolo WebSocket

### Conexão
```
ws://localhost:3001?userId=XXX&role=student&examId=YYY&userName=João
```

### Mensagens do Aluno → Servidor

**Troca de Aba**:
```json
{
  "type": "tab-switch",
  "data": {
    "hidden": true,
    "timestamp": "2025-11-26T...",
    "examId": "exam123",
    "userName": "João Silva",
    "userId": "user123",
    "switchCount": 3
  }
}
```

### Mensagens Servidor → Admin

**Alerta de Troca de Aba**:
```json
{
  "type": "alert",
  "alertType": "tab-switch",
  "userId": "user123",
  "userName": "João Silva",
  "examId": "exam123",
  "timestamp": "2025-11-26T...",
  "data": {
    "hidden": false,
    "duration": 15000,
    "switchCount": 3
  }
}
```

## 🎯 Próximas Implementações

- [ ] WebRTC para streaming de vídeo/áudio/tela
- [ ] Detecção de múltiplas faces (IA)
- [ ] Detecção de ausência de face (IA)
- [ ] Análise de comportamento suspeito (IA)
- [ ] Gravação de sessão
- [ ] Dashboard com estatísticas

## 📝 Notas Técnicas

### Por que WebSocket em servidor separado?

Next.js 14 com App Router não suporta nativamente WebSocket em API routes. A solução foi criar um servidor HTTP+WebSocket separado na porta 3001.

### Alternativas consideradas:
- ❌ Socket.io (biblioteca externa)
- ❌ Server-Sent Events (unidirecional apenas)
- ❌ Polling (ineficiente)
- ✅ **WebSocket nativo** (escolhido - autoral, eficiente, bidirecional)

### Segurança:
- Validação de userId e role na conexão
- Mensagens JSON validadas
- Broadcasting apenas para admins
- Isolamento de sessões por examId

## 🐛 Troubleshooting

**Erro: ECONNREFUSED**
- Servidor WebSocket não está rodando
- Solução: `npm run dev:ws`

**Alertas não aparecem**
- Verificar se WebSocket está conectado (bolinha verde)
- Abrir console e ver logs `[WS]` e `[ADMIN WS]`
- Verificar se aluno está realmente trocando de aba

**WebSocket desconecta**
- Reconexão automática ativada
- Aguardar alguns segundos
- Máximo 10 tentativas de reconexão

## 👨‍💻 Desenvolvimento

### Debug Mode

Abrir console do navegador (F12) e ver logs:

**No aluno**:
```
[WS Client] Conectado!
[VISIBILITY] ⚠️ Usuário trocou de aba/janela
[WS Client] Mensagem enviada: tab-switch
```

**No admin**:
```
[ADMIN WS] Mensagem recebida: Object
[ADMIN WS] Novo alerta: tab-switch
```

**No servidor (terminal)**:
```
[WS] Cliente conectado: student-user123-1234567890 (student)
[WS] Mensagem de student-user123-1234567890: tab-switch
[WS] Broadcast para 2 admins: alert
```

---

**Sistema 100% autoral e funcional!** 🎉
