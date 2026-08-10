# Google reCAPTCHA v3 - Guia de Implementação

## Visão Geral

Esta implementação utiliza **reCAPTCHA v3 (invisível)** para proteger os formulários de login e cadastro contra bots e abusos automatizados.

## Por que reCAPTCHA v3?

- **Invisível:** Não interrompe o fluxo do usuário com desafios ou checkboxes
- **Score-based:** Retorna um score (0.0 a 1.0) indicando a probabilidade de ser humano
- **Melhor UX:** Permite experiência de login/cadastro fluida
- **Proteção robusta:** Usa análise comportamental avançada

## Arquitetura da Implementação

### Frontend
- **Login:** `app/auth/login/page.tsx`
- **Registro:** `app/auth/register/page.tsx`
- **Biblioteca:** Script do Google reCAPTCHA v3

### Backend
- **Validação:** `lib/recaptcha.ts`
- **API Login:** `app/api/auth/login/route.ts`
- **API Registro:** `app/api/auth/register/route.ts`

## Configuração das Variáveis de Ambiente

Adicione as seguintes variáveis ao seu `.env.local`:

```env
# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

## Como Obter as Chaves do reCAPTCHA

1. Acesse [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Clique em "+" para adicionar novo site
3. Preencha:
   - **Label:** Nome do seu projeto (ex: Domine Aqui Production)
   - **reCAPTCHA type:** reCAPTCHA v3
   - **Domains:** Seu domínio (ex: gradex.com, localhost para desenvolvimento)
   - **Owners:** Seu email
4. Aceite os termos e clique em "Submit"
5. Copie:
   - **Site Key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Secret Key** → `RECAPTCHA_SECRET_KEY`

## Configuração de Score

O score mínimo está configurado em `lib/recaptcha.ts`:

```typescript
const MIN_SCORE = 0.5
```

**Interpretação do Score:**
- **1.0:** Muito provavelmente humano
- **0.5-1.0:** Aceitável (configurado atualmente)
- **0.0-0.5:** Provavelmente bot (rejeitado)
- **0.0:** Muito provavelmente bot

## Funcionamento

### Frontend

1. Script do reCAPTCHA v3 é carregado automaticamente
2. Ao submeter o formulário, um token é gerado
3. Token é enviado junto com os dados do formulário
4. Submissão é bloqueada se o token não for válido

### Backend

1. Recebe o token do reCAPTCHA
2. Valida com a API do Google
3. Verifica se o score é >= 0.5
4. Permite login/cadastro apenas se a validação for bem-sucedida
5. Retorna erro claro se a validação falhar

## Boas Práticas de Segurança

### ✅ Implementado
- Validação de token no backend
- Score mínimo configurável
- Tratamento de erros claro
- Timeout automático (tokens expiram após 2 minutos)

### 🔒 Recomendado
- Usar diferentes chaves para desenvolvimento e produção
- Monitorar scores reCAPTCHA no [Dashboard](https://www.google.com/recaptcha/admin)
- Ajustar score mínimo baseado em análise de tráfego
- Rate limiting adicional no backend
- Monitorar logs de erros de reCAPTCHA

## Exemplos de Mensagens de Erro

### Frontend
```
reCAPTCHA não carregado. Tente novamente.
Falha ao verificar reCAPTCHA. Tente novamente.
```

### Backend
```
Token do reCAPTCHA não fornecido
Configuração do reCAPTCHA inválida
Falha na verificação do reCAPTCHA
Score do reCAPTCHA muito baixo (0.23). Mínimo requerido: 0.5
```

## Troubleshooting

### Erro: "reCAPTCHA não carregado"
- Verifique se `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` está configurada
- Verifique console do navegador para erros de script
- Verifique se a site key está correta

### Erro: "Configuração do reCAPTCHA inválida"
- Verifique se `RECAPTCHA_SECRET_KEY` está configurada no backend
- Reinicie o servidor após configurar variáveis de ambiente

### Score muito baixo frequentemente
- Verifique se o domínio está configurado corretamente no console do Google
- Considere ajustar `MIN_SCORE` em `lib/recaptcha.ts`
- Verifique se há bots legítimos sendo bloqueados

## Testes

### Teste Manual
1. Preencha o formulário normalmente
2. Submeta o formulário
3. A validação deve ser transparente (reCAPTCHA v3 é invisível)

### Teste com Score Baixo
Para testar a rejeição de baixo score, você pode:
1. Usar ferramentas de automação (Selenium, Puppeteer)
2. Testar de um IP considerado suspeito pelo Google
3. Modificar temporariamente `MIN_SCORE` para 1.0

## Limitações do reCAPTCHA v3

- **Tokens expiram:** 2 minutos após geração
- **Rate limiting:** Google pode limitar requisições
- **Aprendizagem:** Pode levar tempo para ajustar corretamente o score
- **Dependência externa:** Requer conexão com servidores do Google

## Alternativas

Se o reCAPTCHA v3 não atender suas necessidades:
- **reCAPTCHA v2 Checkbox:** Mais visível, mas mais intrusivo
- **hCaptcha:** Alternativa privacy-friendly
- **Cloudflare Turnstile:** Solução moderna da Cloudflare
- **Implementação própria:** Rate limiting, honeypots, etc.

## Suporte

Para questões específicas sobre reCAPTCHA:
- [Documentação oficial](https://developers.google.com/recaptcha)
- [Dashboard administrativo](https://www.google.com/recaptcha/admin)
- [Status do sistema](https://www.google.com/recaptcha/admin)
