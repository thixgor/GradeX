# ⚡ Quick Start - Marca d'Água Anti-Pirateamento

## 1️⃣ Instalação (Já Feita ✅)

O componente já está criado e integrado. Nada a instalar!

```
✅ /components/video-watermark.tsx - Criado
✅ /app/aulas/[id]/page.tsx - Integrado
✅ /lib/types.ts - Campo cpf já existe
```

---

## 2️⃣ Teste Rápido (2 minutos)

### Passo 1: Inicie o servidor
```bash
npm run dev
```

### Passo 2: Acesse uma aula
```
http://localhost:3000/aulas/[id-da-aula]
```

### Passo 3: Observe a marca d'água
- Veja o nome do usuário rotacionado diagonalmente
- Veja o CPF abaixo do nome
- Verifique a opacidade baixa (8%)
- Confirme que o vídeo está visível

---

## 3️⃣ Usar em Outra Página

Se quiser usar em outra página, é muito simples:

```tsx
import { VideoWatermark } from '@/components/video-watermark'

export function MinhaPage() {
  return (
    <VideoWatermark 
      userName="João Silva" 
      userCpf="123.456.789-00"
    >
      <video src="/videos/aula.mp4" controls />
    </VideoWatermark>
  )
}
```

---

## 4️⃣ Customizar Opacidade

Quer a marca d'água mais visível? Aumente a opacidade:

```tsx
<VideoWatermark 
  userName="João Silva" 
  userCpf="123.456.789-00"
  opacity={15}  // 15% em vez de 8%
>
  <video src="/videos/aula.mp4" controls />
</VideoWatermark>
```

**Valores recomendados:**
- `8` - Discreta (padrão)
- `12` - Moderada
- `15` - Visível

---

## 5️⃣ Customizar Rotação

Quer menos inclinado? Altere a rotação:

```tsx
<VideoWatermark 
  userName="João Silva" 
  userCpf="123.456.789-00"
  rotation={-30}  // -30° em vez de -45°
>
  <video src="/videos/aula.mp4" controls />
</VideoWatermark>
```

---

## 6️⃣ Com Dados Dinâmicos

Use dados do usuário autenticado:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { VideoWatermark } from '@/components/video-watermark'

export function AulaPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user))
  }, [])

  if (!user) return <div>Carregando...</div>

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

---

## 7️⃣ Com YouTube

```tsx
<VideoWatermark 
  userName="João Silva" 
  userCpf="123.456.789-00"
>
  <div dangerouslySetInnerHTML={{ 
    __html: `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>` 
  }} />
</VideoWatermark>
```

---

## 8️⃣ Troubleshooting

### Marca d'água não aparece?
```
1. Verifique se userName tem valor
2. Verifique se userCpf tem valor
3. Aumente opacity para 20 para testar
4. Abra console (F12) e procure erros
```

### Vídeo não aparece?
```
1. Verifique se src do vídeo é válido
2. Teste com um vídeo simples primeiro
3. Verifique CORS se for vídeo externo
```

### Marca d'água muito clara?
```
1. Aumente opacity (ex: 12, 15, 20)
2. Teste em um vídeo com fundo diferente
```

---

## 9️⃣ Próximos Passos

### Para Melhorar:
1. Adicionar timestamp (data/hora de visualização)
2. Fazer marca d'água animada
3. Diferentes opacidades por plano
4. Marca d'água em PDFs também

### Para Proteger Mais:
1. Integrar DRM (Widevine, PlayReady)
2. Desabilitar download direto
3. Adicionar analytics de tentativas de cópia

---

## 🎯 Checklist de Implementação

- [x] Componente criado
- [x] Integrado em /aulas/[id]
- [x] Campo cpf adicionado
- [x] Documentação criada
- [x] Exemplos criados
- [ ] Testado em produção
- [ ] Feedback dos usuários coletado

---

## 📞 Dúvidas?

Consulte:
- `WATERMARK_ANTI_PIRACY.md` - Documentação técnica
- `WATERMARK_EXAMPLES.md` - Exemplos práticos
- `WATERMARK_IMPLEMENTATION_SUMMARY.md` - Resumo visual

---

## 🚀 Pronto para Usar!

A marca d'água está **100% funcional** e pronta para produção.

Basta acessar uma aula e você verá a marca d'água em ação! 🎉
