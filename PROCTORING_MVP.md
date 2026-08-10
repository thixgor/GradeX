# Sistema de Monitoramento de Provas (Proctoring) - MVP

## 📋 Resumo

Este documento descreve o **MVP (Minimum Viable Product)** do sistema de monitoramento de provas implementado no Domine Aqui. O sistema permite que administradores configurem monitoramento por câmera, áudio e transmissão de tela durante as provas.

---

## ✅ O que foi implementado

### 1. **Configuração de Monitoramento na Criação de Provas**
- **Arquivo**: `app/admin/exams/create/page.tsx`
- **Funcionalidades**:
  - Checkbox master para habilitar/desabilitar monitoramento
  - Opções individuais: Câmera 📹, Áudio 🎤, Transmissão de Tela 🖥️
  - Seleção do modo de captura de tela: "Apenas Janela" ou "Tela Inteira"
  - Avisos sobre detecção automática de câmera preta (150 segundos)
  - Resumo visual das configurações selecionadas

### 2. **Tipos e Estruturas de Dados**
- **Arquivo**: `lib/types.ts`
- **Interfaces criadas**:
  ```typescript
  // Modo de captura de tela
  export type ScreenCaptureMode = 'window' | 'screen'

  // Configuração de proctoring no Exam
  proctoring?: {
    enabled: boolean
    camera: boolean
    audio: boolean
    screen: boolean
    screenMode?: ScreenCaptureMode
  }

  // Interface de sessão de monitoramento
  export interface ProctoringSession {
    examId: string
    examTitle: string
    userId: string
    userName: string
    submissionId?: string
    isActive: boolean
    startedAt: Date
    endedAt?: Date
    cameraBlackWarnings: number
    cameraBlackAt?: Date
    forcedSubmit: boolean
    forcedSubmitReason?: string
    cameraEnabled: boolean
    audioEnabled: boolean
    screenEnabled: boolean
    screenMode?: ScreenCaptureMode
  }
  ```

### 3. **Componente de Termo de Consentimento**
- **Arquivo**: `components/proctoring-consent.tsx`
- **Funcionalidades**:
  - Modal explicativo sobre o monitoramento
  - Lista detalhada do que será monitorado (câmera, áudio, tela)
  - Avisos sobre permissões do navegador
  - Aviso sobre detecção automática de câmera preta
  - Checkbox de aceitação obrigatória
  - Botões "Não Aceito" e "Aceito e Continuar"
  - Callback `onAccept()` que solicita permissões de mídia

### 4. **Hook de Captura de Mídia**
- **Arquivo**: `hooks/use-proctoring.ts`
- **Funcionalidades**:
  ```typescript
  const {
    cameraStream,      // Stream da câmera
    audioStream,       // Stream do áudio
    screenStream,      // Stream da tela
    error,             // Erros de captura
    isBlackCamera,     // Flag de câmera preta detectada
    initializeMedia,   // Função para iniciar captura
    cleanup,           // Função para limpar recursos
    videoRef,          // Ref para elemento <video>
    canvasRef,         // Ref para elemento <canvas> (detecção)
  } = useProctoring({
    camera: true,
    audio: true,
    screen: true,
    screenMode: 'window',
    onCameraBlack: () => {},      // Callback quando câmera fica preta
    onCameraRestored: () => {},   // Callback quando câmera volta
  })
  ```
- **Detecção de Câmera Preta**:
  - Análise de brilho médio dos pixels a cada 2 segundos
  - Threshold: média de brilho < 10 = câmera preta
  - Callbacks automáticos para avisos

### 5. **Componente de Monitor de Câmera**
- **Arquivo**: `components/proctoring-monitor.tsx`
- **Funcionalidades**:
  - Exibição da câmera no canto superior esquerdo (fixo, z-index 50)
  - Indicador "REC" pulsante em vermelho
  - Overlay de aviso quando câmera fica preta
  - Popup modal com contador regressivo (2min30s)
  - Mensagem de aviso sobre submissão automática

### 6. **API de Sessões de Monitoramento**
- **Arquivo**: `app/api/proctoring/sessions/route.ts`
- **Endpoint**: `GET /api/proctoring/sessions`
- **Funcionalidades**:
  - Busca submissions ativas (não finalizadas)
  - Filtra apenas provas com proctoring habilitado
  - Retorna lista de sessões com informações completas
  - Apenas acessível para administradores

### 7. **Painel Administrativo de Monitoramento**
- **Arquivo**: `app/admin/proctoring/page.tsx`
- **Rota**: `/admin/proctoring`
- **Funcionalidades**:
  - **Dashboard com estatísticas**:
    - Total de sessões ativas
    - Sessões com câmera, áudio e tela
  - **Lista de sessões ativas**:
    - Nome do aluno e prova
    - IDs (aluno e prova)
    - Horário de início e duração
    - Elementos de monitoramento ativos (badges coloridos)
    - Placeholders para streams (MVP)
  - **Auto-refresh**:
    - Atualização automática a cada 5 segundos (pode ser desabilitado)
    - Botão manual de atualização
  - **Avisos de infrações**:
    - Exibe alertas de câmera preta
  - **Nota sobre MVP**:
    - Explicação clara de que streams em tempo real viriam com WebRTC

---

## 🚧 O que ainda precisa ser integrado

### Integração na Página da Prova (`app/exam/[id]/page.tsx`)

Para completar o sistema, é necessário:

1. **Verificar se a prova tem proctoring habilitado**:
   ```typescript
   const hasProctoring = exam.proctoring?.enabled
   ```

2. **Adicionar estado de proctoring**:
   ```typescript
   const [showConsentModal, setShowConsentModal] = useState(false)
   const [proctoringAccepted, setProctoringAccepted] = useState(false)
   const [blackCameraTimer, setBlackCameraTimer] = useState<number | null>(null)
   ```

3. **Usar o hook de proctoring**:
   ```typescript
   const {
     cameraStream,
     isBlackCamera,
     initializeMedia,
     cleanup,
   } = useProctoring({
     camera: exam.proctoring?.camera || false,
     audio: exam.proctoring?.audio || false,
     screen: exam.proctoring?.screen || false,
     screenMode: exam.proctoring?.screenMode,
     onCameraBlack: () => {
       // Iniciar timer de 150 segundos
       setBlackCameraTimer(150)
     },
     onCameraRestored: () => {
       // Cancelar timer
       setBlackCameraTimer(null)
     },
   })
   ```

4. **Exibir termo de consentimento antes de iniciar**:
   ```typescript
   {hasProctoring && !proctoringAccepted && !started && (
     <ProctoringConsent
       examTitle={exam.title}
       camera={exam.proctoring?.camera || false}
       audio={exam.proctoring?.audio || false}
       screen={exam.proctoring?.screen || false}
       screenMode={exam.proctoring?.screenMode}
       onAccept={async () => {
         const success = await initializeMedia()
         if (success) {
           setProctoringAccepted(true)
         }
       }}
       onReject={() => router.push('/')}
     />
   )}
   ```

5. **Exibir monitor de câmera durante a prova**:
   ```typescript
   {started && proctoringAccepted && exam.proctoring?.camera && (
     <ProctoringMonitor
       cameraStream={cameraStream}
       isBlackCamera={isBlackCamera}
       blackCameraTimeRemaining={blackCameraTimer}
     />
   )}
   ```

6. **Timer de câmera preta com auto-submit**:
   ```typescript
   useEffect(() => {
     if (blackCameraTimer === null) return
     if (blackCameraTimer <= 0) {
       // Auto-submeter prova
       handleAutoSubmit('Câmera bloqueada por mais de 2min30s')
       return
     }

     const interval = setInterval(() => {
       setBlackCameraTimer(prev => (prev || 0) - 1)
     }, 1000)

     return () => clearInterval(interval)
   }, [blackCameraTimer])
   ```

7. **Cleanup ao sair**:
   ```typescript
   useEffect(() => {
     return () => {
       cleanup()
     }
   }, [cleanup])
   ```

---

## 🎯 Funcionalidades do MVP

### Para Administradores:
✅ Configurar monitoramento na criação da prova
✅ Escolher elementos de monitoramento (câmera, áudio, tela)
✅ Ver todas as sessões ativas no painel `/admin/proctoring`
✅ Ver estatísticas em tempo real
✅ Ver quais elementos estão ativos em cada sessão

### Para Alunos (quando integrado):
✅ Aceitar termo de consentimento
✅ Conceder permissões de câmera/áudio/tela
✅ Ver câmera no canto superior esquerdo durante prova
✅ Receber aviso se câmera ficar preta
✅ Ter 2min30s para resolver problema de câmera
✅ Submissão automática após timeout

---

## 📊 Limitações do MVP

Este é um **MVP (Minimum Viable Product)** focado em demonstrar a estrutura e lógica do sistema. Em produção completa, seria necessário:

### Tecnologias Adicionais:
- **WebRTC**: Para streaming de vídeo/áudio/tela em tempo real
- **WebSocket**: Para comunicação bidirecional instantânea
- **Media Server**: Para gerenciar múltiplos streams simultâneos (Janus, Kurento, etc.)
- **Armazenamento de Vídeo**: S3, Azure Blob, etc. para gravações
- **CDN**: Para distribuição de streams

### Funcionalidades Avançadas:
- 🎥 Gravação das sessões para revisão posterior
- 🤖 Detecção de múltiplas faces ou ausência de face (IA)
- 👁️ Detecção de olhar fora da tela
- 🪟 Detecção de troca de abas/janelas
- 🔊 Análise de áudio para detectar conversas
- 📊 Análise comportamental com IA
- 🚨 Sistema de alertas em tempo real
- 📹 Replay de sessões suspeitas
- 🔐 Criptografia end-to-end dos streams

---

## 🚀 Como Testar o MVP

1. **Criar uma prova com monitoramento**:
   - Acessar `/admin/exams/create`
   - Preencher informações básicas
   - Rolar até "Sistema de Monitoramento (Proctoring)"
   - Ativar monitoramento e selecionar elementos
   - Salvar a prova

2. **Ver painel administrativo**:
   - Acessar `/admin/proctoring`
   - Ver estatísticas (inicialmente zeradas)
   - Aguardar alunos iniciarem provas

3. **Testar componentes isoladamente** (desenvolvimento):
   ```typescript
   import { ProctoringConsent } from '@/components/proctoring-consent'
   import { ProctoringMonitor } from '@/components/proctoring-monitor'
   import { useProctoring } from '@/hooks/use-proctoring'
   ```

---

## 📝 Estrutura de Arquivos

```
/home/user/Domine Aqui/
├── app/
│   ├── admin/
│   │   ├── exams/
│   │   │   └── create/
│   │   │       └── page.tsx          # ✅ Configuração de proctoring
│   │   └── proctoring/
│   │       └── page.tsx               # ✅ Painel administrativo
│   └── api/
│       └── proctoring/
│           └── sessions/
│               └── route.ts           # ✅ API de sessões
├── components/
│   ├── proctoring-consent.tsx        # ✅ Termo de consentimento
│   └── proctoring-monitor.tsx        # ✅ Monitor de câmera
├── hooks/
│   └── use-proctoring.ts             # ✅ Hook de captura de mídia
└── lib/
    └── types.ts                       # ✅ Tipos atualizados
```

---

## 🎓 Conclusão

O MVP implementado fornece a **base estrutural completa** para um sistema de monitoramento de provas:

- ✅ Configuração administrativa
- ✅ Tipos e interfaces definidos
- ✅ Componentes de UI prontos
- ✅ Lógica de captura de mídia
- ✅ Detecção de câmera preta
- ✅ Painel de monitoramento
- ✅ API de sessões

A etapa final seria **integrar esses componentes na página da prova** seguindo o guia acima. O sistema está pronto para ser expandido para produção com WebRTC, WebSocket e funcionalidades avançadas de IA.

---

**Desenvolvido como MVP para demonstração de conceito e estrutura do sistema.**
