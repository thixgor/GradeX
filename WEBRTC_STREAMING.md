# 🎥 WebRTC Streaming - Vídeo e Áudio em Tempo Real

Sistema completo de streaming de vídeo e áudio do aluno para o admin via WebRTC P2P.

---

## ✨ Funcionalidades Implementadas

### 1. **Streaming de Vídeo**
- ✅ Câmera do aluno transmitida em tempo real
- ✅ Qualidade adaptativa (640x480)
- ✅ Conexão P2P (direto, sem servidor intermediário)
- ✅ Indicador "AO VIVO" com animação
- ✅ Overlay com nome do aluno

### 2. **Streaming de Áudio**
- ✅ Áudio do microfone do aluno
- ✅ Reprodução automática no painel admin
- ✅ Indicador visual de áudio ativo
- ✅ Controle de volume do navegador

### 3. **Gerenciamento Multi-Peer**
- ✅ Múltiplos alunos simultâneos
- ✅ Um PeerConnection por aluno
- ✅ Streams organizados por userId
- ✅ Reconexão automática se desconectar

---

## 🚀 Como Funciona

### Fluxo de Conexão WebRTC:

```
ALUNO                           SERVIDOR WS                        ADMIN
  │                                   │                              │
  ├─ Inicia prova                     │                              │
  ├─ Câmera/áudio ativados            │                              │
  │                                   │                              │
  ├─ createOffer() ────────────────►  │                              │
  │   {type: 'webrtc-offer'}          │                              │
  │                                   ├─► Encaminha ────────────────►│
  │                                   │  + fromUserId                │
  │                                   │  + fromUserName              │
  │                                   │  + fromId                    │
  │                                   │                              ├─ createPeerConnection(userId)
  │                                   │                              ├─ setRemoteDescription(offer)
  │                                   │                              ├─ createAnswer()
  │                                   │                              │
  │◄────────────────────────────────  │◄──── Encaminha ──────────────┤
  │   {type: 'webrtc-answer'}         │     + targetId               │
  ├─ setRemoteDescription(answer)     │                              │
  │                                   │                              │
  ├─ ICE candidates ────────────────►│◄────── ICE candidates ───────┤
  │                                   │                              │
  ├──────────────── CONEXÃO P2P ESTABELECIDA ────────────────────────┤
  │                                                                   │
  ├─────────────── STREAM DE VÍDEO/ÁUDIO ──────────────────────────►│
  │              (direto, sem passar pelo servidor)                  │
  │                                                                   │
  │                                                                   ├─ ontrack event
  │                                                                   ├─ Armazena stream em Map
  │                                                                   ├─ Renderiza StudentStreamViewer
  │                                                                   ├─ <video> exibe vídeo
  │                                                                   └─ <audio> reproduz áudio
```

---

## 📁 Arquivos

### 1. **components/student-stream-viewer.tsx**

Componente React para exibir stream do aluno:

```tsx
<StudentStreamViewer
  stream={mediaStream}           // MediaStream do aluno
  userName="João Silva"          // Nome do aluno
  cameraEnabled={true}           // Se câmera está habilitada
  audioEnabled={true}            // Se áudio está habilitado
/>
```

**Funcionalidades**:
- ✅ Exibe vídeo se `stream` disponível
- ✅ Reproduz áudio automaticamente
- ✅ Estado de "Aguardando conexão..." se sem stream
- ✅ Indicadores visuais: AO VIVO, nome, ícones

### 2. **app/admin/proctoring/page.tsx**

Painel admin com gerenciamento de múltiplos streams:

**Estados**:
```tsx
const [studentStreams, setStudentStreams] = useState<Map<string, MediaStream>>(new Map())
const peerConnectionsRef = useRef<Map<string, PeerConnectionData>>(new Map())
```

**Funções principais**:
- `createPeerConnection(userId, userName, fromId)` - Cria PC para um aluno
- `handleWebRTCOffer(userId, userName, fromId, offer)` - Processa oferta
- `handleICECandidate(userId, candidate)` - Adiciona ICE candidate

**Renderização**:
```tsx
{sessions.map((session) => (
  <Card>
    <StudentStreamViewer
      stream={studentStreams.get(session.userId) || null}
      userName={session.userName}
      cameraEnabled={session.cameraEnabled}
      audioEnabled={session.audioEnabled}
    />
  </Card>
))}
```

---

## 🧪 Como Testar

### Passo 1: Iniciar Servidores

```bash
npm run dev:all
```

Aguarde ver:
```
[WS] Servidor WebSocket rodando na porta 3001
✓ Ready in Xms
```

### Passo 2: Abrir Admin Panel

**Aba 1 - Admin**:
```
http://localhost:3000/admin/proctoring
```

Verificar:
- 🟢 "Conectado ao servidor em tempo real"
- "Nenhuma sessão ativa no momento"

### Passo 3: Iniciar Prova como Aluno

**Aba 2 - Aluno**:
```
http://localhost:3000/exam/SEU_ID_DA_PROVA
```

1. Digite nome (ex: "João Silva")
2. Clique em "Iniciar Prova"
3. **Modal de consentimento aparece**
4. **Aceite o termo**
5. **Permita câmera E microfone** quando navegador solicitar
6. Prova inicia

### Passo 4: Ver Stream no Admin

**Volte para Aba 1 - Admin**:

Após ~5 segundos (ou clique em "Atualizar"):

✅ **Card do aluno aparece**
✅ **Vídeo da câmera do aluno aparece "AO VIVO"**
✅ **Áudio está sendo transmitido** (você pode ouvir o aluno)

**Indicadores no vídeo**:
- 🔴 "AO VIVO" (topo esquerdo, pulsando)
- 📹 Nome do aluno (baixo esquerdo)
- 🎤 Ícone de microfone (baixo direito, verde)

### Passo 5: Testar Múltiplos Alunos

1. **Abra aba anônima** ou outro navegador
2. **Repita Passo 3** com nome diferente
3. **Volte ao admin**
4. **Deve ver 2 cards, cada um com stream diferente**

---

## 📊 Console Logs (Debug)

### No Aluno (F12):

```
[WS Client] Conectando: ws://localhost:3001?userId=...&role=student
[WS Client] Conectado!
[WebRTC] Iniciando oferta WebRTC...
[WebRTC] PeerConnection criada
[WebRTC] Track adicionada: video
[WebRTC] Track adicionada: audio
[WebRTC] Oferta criada e setada como local description
[WebRTC] Oferta enviada via WebSocket
[WS Client] Mensagem recebida: webrtc-answer
[WebRTC] Answer recebido e setado como remote description
[WebRTC] ICE candidate gerado
[WS Client] Mensagem enviada: webrtc-ice-candidate
[WebRTC] Connection state: connected
```

### No Admin (F12):

```
[ADMIN WS] Mensagem recebida: Object { type: "webrtc-offer", ... }
[ADMIN WebRTC] Oferta recebida de: João Silva
[ADMIN WebRTC] Criando PeerConnection para João Silva (user123)
[ADMIN WebRTC] Oferta de João Silva setada
[ADMIN WebRTC] Answer criada para João Silva
[ADMIN WebRTC] João Silva connection state: connecting
[ADMIN WebRTC] João Silva connection state: connected
[ADMIN WebRTC] Stream recebido de João Silva: MediaStream
```

### No Servidor (Terminal):

```
[WS] Cliente conectado: student-user123-... (student)
[WS] Mensagem de student-...: webrtc-offer
[WS] Cliente conectado: admin-admin-... (admin)
[WS] Mensagem de admin-...: webrtc-answer
```

---

## 🎯 Resultado Final

**Painel Admin exibe**:

```
┌────────────────────────────────────────────┐
│ 🟢 João Silva                              │
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ 🔴 AO VIVO                             │ │
│ │                                        │ │
│ │      [VÍDEO DO ALUNO EM TEMPO REAL]   │ │
│ │                                        │ │
│ │ 📹 João Silva              🎤          │ │
│ └────────────────────────────────────────┘ │
│ [ÁUDIO REPRODUZINDO AUTOMATICAMENTE]       │
│                                            │
│ 📋 Prova: Matemática Básica               │
│ 👤 ID Aluno: user123                       │
│ 📝 Questões: 10                            │
│ ⭐ Valor Total: 100 pontos                 │
│                                            │
│ 📹 Câmera   🎤 Áudio                       │
└────────────────────────────────────────────┘
```

---

## ⚠️ Troubleshooting

### Vídeo não aparece

**Problema**: Card mostra "Aguardando conexão..."

**Verificações**:
1. Console do aluno - ver se `[WebRTC] Connection state: connected`
2. Console do admin - ver se `[ADMIN WebRTC] Stream recebido`
3. Aluno permitiu câmera? (ícone de câmera na barra do navegador)
4. Servidor WebSocket rodando? (bolinha verde no admin)

### Áudio não funciona

**Problema**: Vídeo aparece mas não ouve nada

**Verificações**:
1. Aluno permitiu microfone?
2. Volume do navegador não está no mínimo?
3. Prova tem `audioEnabled: true`?
4. Console do navegador - erro de autoplay?

**Solução para autoplay bloqueado**:
- Chrome pode bloquear autoplay de áudio
- Clique em qualquer lugar da página do admin
- Áudio deve começar a tocar

### Conexão falha (stuck em "connecting")

**Problema**: `Connection state: connecting` e nunca muda para `connected`

**Causas**:
1. Firewall bloqueando conexão P2P
2. Redes diferentes (NAT muito restritivo)
3. STUN servers indisponíveis

**Solução**:
- Testar em localhost (deve funcionar)
- Adicionar TURN server se precisar funcionar entre redes diferentes
- Verificar console se há erros de ICE candidates

---

## 🔧 Configuração Avançada

### Adicionar TURN Server (para produção):

Editar `app/admin/proctoring/page.tsx`:

```typescript
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:seu-turn-server.com:3478',
      username: 'user',
      credential: 'pass',
    },
  ],
}
```

### Ajustar Qualidade do Vídeo:

Editar `hooks/use-proctoring.ts`:

```typescript
const constraints: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },  // Aumentar resolução
    height: { ideal: 720 },
    frameRate: { ideal: 30 } // Aumentar FPS
  },
  audio: true,
}
```

---

## 📈 Performance

**Largura de Banda (por aluno)**:
- Vídeo 640x480 @ 15fps: ~500 Kbps
- Áudio: ~50 Kbps
- **Total**: ~550 Kbps por aluno

**Admin monitorando 10 alunos**:
- Download: ~5.5 Mbps
- Upload: Mínimo (só sinalização)

**Recomendação**: Conexão de 10 Mbps+ para monitorar 10+ alunos

---

## ✅ Checklist de Funcionamento

- [ ] Servidor WebSocket rodando (porta 3001)
- [ ] Next.js rodando (porta 3000)
- [ ] Admin conectado (bolinha verde)
- [ ] Aluno aceitou termo de consentimento
- [ ] Aluno permitiu câmera + microfone
- [ ] Console aluno: `Connection state: connected`
- [ ] Console admin: `Stream recebido de [Nome]`
- [ ] Vídeo aparece no card do admin
- [ ] Áudio está reproduzindo
- [ ] Indicador "AO VIVO" pulsando

**Se TODOS os itens estão ✅, sistema está 100% funcional!** 🎉

---

## 🎓 Tecnologias Utilizadas

- **WebRTC**: Conexão P2P para streaming
- **WebSocket**: Sinalização (offer/answer/ICE)
- **React**: Interface de visualização
- **MediaStream API**: Captura de câmera/áudio
- **RTCPeerConnection**: Gerenciamento de conexões P2P
- **Next.js 14**: Framework full-stack

---

**Sistema completo de streaming em tempo real implementado!** 🚀
