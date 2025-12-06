# 📺 Exemplos de Uso - VideoWatermark

## Exemplo 1: Uso Básico (Padrão)

```tsx
import { VideoWatermark } from '@/components/video-watermark'

export function MinhaAula() {
  const user = { name: 'João Silva', cpf: '123.456.789-00' }

  return (
    <VideoWatermark 
      userName={user.name} 
      userCpf={user.cpf}
    >
      <video src="/videos/aula.mp4" controls />
    </VideoWatermark>
  )
}
```

**Resultado:**
- Marca d'água com opacidade 8%
- Rotação -45°
- Nome e CPF visíveis mas discretos

---

## Exemplo 2: Com Opacidade Aumentada

```tsx
<VideoWatermark 
  userName={user.name} 
  userCpf={user.cpf}
  opacity={15}  // Mais visível
>
  <video src="/videos/aula.mp4" controls />
</VideoWatermark>
```

**Resultado:**
- Marca d'água mais destacada (15% de opacidade)
- Melhor para vídeos com fundo claro

---

## Exemplo 3: Com Rotação Customizada

```tsx
<VideoWatermark 
  userName={user.name} 
  userCpf={user.cpf}
  rotation={-30}  // Menos inclinado
>
  <video src="/videos/aula.mp4" controls />
</VideoWatermark>
```

**Resultado:**
- Marca d'água menos inclinada
- Mais fácil de ler

---

## Exemplo 4: Com Embed do YouTube

```tsx
<VideoWatermark 
  userName={user.name} 
  userCpf={user.cpf}
>
  <div dangerouslySetInnerHTML={{ 
    __html: `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` 
  }} />
</VideoWatermark>
```

**Resultado:**
- Marca d'água sobre o YouTube iframe
- Funciona com qualquer embed

---

## Exemplo 5: Com Embed do Vimeo

```tsx
<VideoWatermark 
  userName={user.name} 
  userCpf={user.cpf}
>
  <div dangerouslySetInnerHTML={{ 
    __html: `<iframe src="https://player.vimeo.com/video/123456789" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>` 
  }} />
</VideoWatermark>
```

**Resultado:**
- Marca d'água sobre o Vimeo player
- Compatível com todos os players

---

## Exemplo 6: Página Completa de Aula

```tsx
'use client'

import { useEffect, useState } from 'react'
import { VideoWatermark } from '@/components/video-watermark'

interface User {
  id: string
  name: string
  cpf?: string
  email: string
}

export default function AulaPage() {
  const [user, setUser] = useState<User | null>(null)
  const [aula, setAula] = useState<any>(null)

  useEffect(() => {
    // Carregar dados do usuário e aula
    fetchUserAndAula()
  }, [])

  async function fetchUserAndAula() {
    const userRes = await fetch('/api/auth/me')
    const userData = await userRes.json()
    setUser(userData.user)

    const aulaRes = await fetch('/api/aulas/123')
    const aulaData = await aulaRes.json()
    setAula(aulaData.aula)
  }

  if (!user || !aula) return <div>Carregando...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1>{aula.titulo}</h1>
      
      {/* Vídeo com marca d'água */}
      <VideoWatermark 
        userName={user.name} 
        userCpf={user.cpf || 'CPF não informado'}
        opacity={10}
      >
        {aula.videoEmbed.startsWith('<') ? (
          <div dangerouslySetInnerHTML={{ __html: aula.videoEmbed }} />
        ) : (
          <video src={aula.videoEmbed} controls />
        )}
      </VideoWatermark>

      <p className="mt-6">{aula.descricao}</p>
    </div>
  )
}
```

---

## Exemplo 7: Diferentes Opacidades por Tipo de Plano

```tsx
interface AulaProps {
  user: User
  aula: Aula
}

export function AulaComMarcaDagua({ user, aula }: AulaProps) {
  // Aumentar opacidade para planos gratuitos
  const opacity = aula.visibilidade === 'gratuita' ? 15 : 8

  return (
    <VideoWatermark 
      userName={user.name} 
      userCpf={user.cpf || 'CPF'}
      opacity={opacity}
    >
      <video src={aula.videoEmbed} controls />
    </VideoWatermark>
  )
}
```

**Resultado:**
- Aulas gratuitas: marca d'água mais visível (15%)
- Aulas premium: marca d'água discreta (8%)

---

## Exemplo 8: Com Fallback para CPF Não Informado

```tsx
<VideoWatermark 
  userName={user?.name || 'Usuário Anônimo'} 
  userCpf={user?.cpf || '***.***.***-**'}
>
  <video src={aula.videoEmbed} controls />
</VideoWatermark>
```

**Resultado:**
- Se CPF não estiver informado, exibe máscara
- Sempre há identificação visual

---

## Exemplo 9: Com Customização Completa

```tsx
<VideoWatermark 
  userName={user.name}
  userCpf={user.cpf}
  opacity={12}      // Moderadamente visível
  rotation={-45}    // Diagonal padrão
>
  {/* Seu vídeo aqui */}
  <video src={aula.videoEmbed} controls />
</VideoWatermark>
```

---

## Exemplo 10: Responsivo em Mobile

```tsx
// Aumentar opacidade em mobile
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
const opacity = isMobile ? 12 : 8

<VideoWatermark 
  userName={user.name} 
  userCpf={user.cpf}
  opacity={opacity}
>
  <video src={aula.videoEmbed} controls />
</VideoWatermark>
```

**Resultado:**
- Mobile: marca d'água mais visível
- Desktop: marca d'água discreta

---

## 🎯 Boas Práticas

### ✅ Faça:
- Use nomes e CPFs reais dos usuários
- Mantenha opacidade entre 5-15%
- Teste em diferentes tipos de vídeo
- Considere a experiência do usuário

### ❌ Não faça:
- Não use opacidade muito alta (prejudica visualização)
- Não use opacidade muito baixa (ineficaz)
- Não remova a marca d'água para usuários premium
- Não mude a rotação drasticamente (fica estranho)

---

## 📊 Recomendações por Contexto

| Contexto | Opacidade | Rotação | Motivo |
|----------|-----------|---------|--------|
| Aulas Premium | 8% | -45° | Discreto, não prejudica |
| Aulas Gratuitas | 12% | -45° | Mais visível, proteção |
| Conteúdo Sensível | 15% | -45° | Máxima proteção |
| Mobile | +2-3% | -45° | Telas menores |
| Vídeos Claros | +2-3% | -45° | Melhor contraste |
| Vídeos Escuros | -2% | -45° | Menos intrusivo |

---

## 🔧 Troubleshooting

### Marca d'água não aparece
- Verifique se o componente está importado
- Confirme que userName e userCpf têm valores
- Aumente a opacidade para testar

### Marca d'água muito clara/escura
- Ajuste a opacidade (0-100)
- Teste valores entre 8-15%

### Vídeo não aparece
- Verifique o src do vídeo
- Confirme que o embed é válido
- Teste com um vídeo simples primeiro

### Performance lenta
- Reduza a complexidade do grid (atualmente 3x3)
- Remova as linhas diagonais se necessário
- Use vídeos em resolução apropriada
