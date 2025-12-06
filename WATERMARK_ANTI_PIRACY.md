# 🔒 Sistema Anti-Pirateamento com Marca d'Água

## Visão Geral

Um sistema de marca d'água (watermark) foi implementado para proteger os vídeos das aulas contra pirateamento. A marca d'água exibe o **nome do usuário** e **CPF** de forma rotacionada com opacidade baixa sobre o vídeo.

## 📋 Características

- ✅ **Nome do Usuário** - Exibido em grande destaque
- ✅ **CPF do Usuário** - Exibido abaixo do nome
- ✅ **Rotação de -45°** - Diagonal para não obstruir o vídeo
- ✅ **Opacidade Baixa** - 5-8% para não prejudicar a visualização
- ✅ **Padrão Repetido** - Marca d'água em múltiplas posições
- ✅ **Compatível com Embeds** - Funciona com iframe, vídeos HTML5 e embeds de terceiros

## 🎯 Como Funciona

### Componente: `VideoWatermark`

**Localização:** `/components/video-watermark.tsx`

**Props:**
```typescript
interface VideoWatermarkProps {
  userName: string           // Nome do usuário (ex: "João Silva") - OBRIGATÓRIO
  userCpf: string            // CPF do usuário (ex: "123.456.789-00") - OBRIGATÓRIO
  children: React.ReactNode  // Conteúdo do vídeo (iframe, video tag, etc) - OBRIGATÓRIO
  opacity?: number           // Opacidade da marca d'água (0-100), padrão: 8
  rotation?: number          // Ângulo de rotação em graus, padrão: -45
}
```

**Exemplos de Uso:**

```tsx
// Uso básico
<VideoWatermark 
  userName="João Silva" 
  userCpf="123.456.789-00"
>
  <video src="..." controls />
</VideoWatermark>

// Com opacidade customizada
<VideoWatermark 
  userName="João Silva" 
  userCpf="123.456.789-00"
  opacity={12}  // Mais visível
>
  <video src="..." controls />
</VideoWatermark>

// Com rotação customizada
<VideoWatermark 
  userName="João Silva" 
  userCpf="123.456.789-00"
  rotation={-30}  // Menos inclinado
>
  <div dangerouslySetInnerHTML={{ __html: iframeEmbed }} />
</VideoWatermark>

// Combinado
<VideoWatermark 
  userName={user?.name || 'Usuário'} 
  userCpf={user?.cpf || 'CPF'}
  opacity={10}
  rotation={-45}
>
  {/* Seu vídeo */}
</VideoWatermark>
```

### Uso na Página de Aulas

**Arquivo:** `/app/aulas/[id]/page.tsx`

```tsx
<VideoWatermark 
  userName={user?.name || 'Usuário'} 
  userCpf={user?.cpf || 'CPF'}
>
  {/* Seu vídeo aqui */}
  <video src="..." controls />
  {/* ou */}
  <div dangerouslySetInnerHTML={{ __html: iframeEmbed }} />
</VideoWatermark>
```

## 🎨 Características Visuais

### Marca d'Água Diagonal
- **Ângulo padrão:** -45° (customizável)
- **Opacidade padrão:** 8% (customizável de 0-100)
- **Cor:** Branca
- **Fonte:** Bold com text-shadow para melhor legibilidade
- **Responsividade:** Tamanho adapta-se ao viewport (clamp)

### Padrão de Repetição
- **Grid 3x3** de marca d'água pequena
- **Marca d'água central** grande e destacada
- **Linhas diagonais** decorativas (muito sutis)
- **Distribuição uniforme** cobrindo toda a área do vídeo
- **Aviso visual** no canto inferior direito (🔒 Protegido por marca d'água)

### Compatibilidade
- ✅ Vídeos HTML5 (`<video>`)
- ✅ YouTube iframe
- ✅ Vimeo
- ✅ Wistia
- ✅ Qualquer embed HTML
- ✅ Responsive em mobile e desktop

## 🔐 Segurança

### O que a marca d'água protege:
1. **Identificação do Usuário** - Qualquer cópia do vídeo terá o nome e CPF do usuário
2. **Rastreabilidade** - Facilita identificar quem compartilhou o vídeo
3. **Dissuasão** - Desestimula compartilhamento não autorizado

### Limitações:
- A marca d'água é visível mas não impede download (proteção visual)
- Para proteção total, considere usar DRM (Digital Rights Management)
- A opacidade baixa garante que não prejudica a experiência do usuário

## 📝 Implementação Técnica

### SVG Pattern
```tsx
<pattern id="watermark-pattern" patternTransform="rotate(-45)">
  <text>{userName}</text>
  <text>{userCpf}</text>
</pattern>
```

### Grid Repetido
```tsx
<div className="grid grid-cols-3 grid-rows-3">
  {/* 9 posições com marca d'água */}
</div>
```

### Blend Mode
```tsx
style={{ mixBlendMode: 'multiply' }}
```

## 🚀 Próximas Melhorias Opcionais

1. **Timestamp Dinâmico** - Adicionar data/hora de visualização
2. **Marca d'Água Animada** - Efeito de movimento sutil
3. **Diferentes Opacidades** - Configurável por tipo de plano
4. **Marca d'Água em PDFs** - Aplicar também em materiais de apoio
5. **Integração com DRM** - Usar Widevine, PlayReady, etc
6. **Analytics** - Rastrear tentativas de download/compartilhamento

## 📊 Exemplo Visual

```
┌─────────────────────────────────────┐
│                                     │
│  João Silva (rotacionado)           │
│    123.456.789-00                   │
│                                     │
│  ┌─ VÍDEO ─────────────────────┐   │
│  │                             │   │
│  │  João Silva (marca d'água)  │   │
│  │  123.456.789-00             │   │
│  │                             │   │
│  │  [Vídeo com controles]      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  João Silva (rotacionado)           │
│    123.456.789-00                   │
│                                     │
└─────────────────────────────────────┘
```

## ✅ Testes

Para testar a marca d'água:

1. Acesse uma aula gravada (`/aulas/[id]`)
2. Observe a marca d'água diagonal sobre o vídeo
3. Verifique se o nome e CPF do usuário aparecem
4. Confirme que a opacidade não prejudica a visualização

## 📞 Suporte

Para dúvidas ou melhorias, consulte:
- Componente: `/components/video-watermark.tsx`
- Integração: `/app/aulas/[id]/page.tsx`
- Tipos: `/lib/types.ts` (campo `cpf` em User)
