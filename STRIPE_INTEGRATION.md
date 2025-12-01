# Integração Stripe - DomineAqui Premium

## Status: ✅ Integração Completa

A página `/buy` foi criada com os 5 planos de pagamento e integração com Stripe:

### Planos Implementados

1. **Plano Mensal**
   - Preço: R$ 24,90/mês (de R$ 29,90)
   - ID: `monthly`

2. **Plano Trimestral**
   - Preço: R$ 69,90/3 meses (de R$ 89,70)
   - Desconto: 6% OFF (Economize R$ 18 em 3 meses)
   - ID: `quarterly`

3. **Plano Semestral** ⭐ MAIS POPULAR
   - Preço: R$ 109,90/6 meses (de R$ 179,40)
   - Desconto: 38% OFF (Pague só R$ 18,32/mês – 6 meses por preço de 4)
   - ID: `semi-annual`

4. **Plano Anual** ⭐ MELHOR VALOR
   - Preço: R$ 159,90/ano (de R$ 358,80)
   - Desconto: 55% OFF (12 meses por menos de R$ 13,33/mês - Pague 6 meses e leve 12)
   - ID: `annual`

5. **Plano Vitalício** ⭐ OFERTA LIMITADA
   - Preço: R$ 529,00 (pagamento único, de R$ 1.497,00)
   - Desconto: 65% OFF
   - Validade: Até o final do 2º semestre de 2026
   - ID: `lifetime`

## Implementação Completa

### Arquivos Criados/Modificados

1. **Frontend**
   - `/app/buy/page.tsx` - Página de planos com integração Stripe
   - `/components/premium-logo.tsx` - Logo do Premium
   - `/app/page.tsx` - Botão "Upgrade" no header principal

2. **Backend**
   - `/app/api/stripe/checkout/route.ts` - API para criar sessão de checkout
   - `/lib/stripe.ts` - Configuração do Stripe e mapeamento de preços

3. **Configuração**
   - `/next.config.js` - Adicionado domínio i.imgur.com
   - `/.env.example` - Variáveis de ambiente do Stripe

### Funcionalidades Implementadas

✅ Página `/buy` com 5 planos de pagamento
✅ Botão "Upgrade" no header principal (esquerda, bem aparente)
✅ Botão de voltar na página `/buy` (volta para home)
✅ Integração com Stripe Checkout
✅ Loading state nos botões de seleção
✅ Redirecionamento para página de pagamento do Stripe
✅ Suporte a múltiplos planos com preços diferentes
✅ Design responsivo e moderno

### Price IDs do Stripe

```
monthly: price_1SZEvMLawSqPVy6JDJk2SNcc
quarterly: price_1SZEvMLawSqPVy6JWHUgauU6
semi-annual: price_1SZEvMLawSqPVy6JzFkSv4OX
annual: price_1SZEvMLawSqPVy6JxOQ4JNxj
lifetime: price_1SZEvMLawSqPVy6Jdbl8CArd
```

### Secret Key

```
your-stripe-secret-key
```

## Próximas Etapas (Opcional)

1. Adicionar webhook para processar pagamentos bem-sucedidos
2. Atualizar banco de dados com informações de assinatura
3. Implementar sistema de renovação automática
4. Adicionar página de sucesso/cancelamento
5. Implementar verificação de assinatura ativa

## Como Usar

1. Adicionar `STRIPE_SECRET_KEY` e `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ao `.env.local`
2. Usuários clicam no botão "⭐ Upgrade" no header
3. Escolhem um plano na página `/buy`
4. Clicam em "Escolher Plano"
5. São redirecionados para o Stripe Checkout
6. Após pagamento bem-sucedido, retornam para `/buy?success=true`
