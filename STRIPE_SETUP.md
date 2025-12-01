# Configuração do Stripe

## ⚠️ Importante: Adicionar Secret Key ao .env.local

Para que o Stripe funcione, você precisa adicionar a secret key ao arquivo `.env.local`:

```bash
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Passos para Configurar

1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione as linhas acima
3. Reinicie o servidor Next.js
4. Teste o checkout novamente

## Erro Atual

Se você está vendo "Erro ao criar sessão de pagamento", é porque:
- A `STRIPE_SECRET_KEY` não está configurada
- O servidor não consegue se conectar ao Stripe

## Após Configurar

Depois de adicionar a secret key:
1. O servidor irá recompilar
2. Os botões de "Escolher Plano" funcionarão
3. Você será redirecionado para o Stripe Checkout

## Price IDs Configurados

- **Mensal**: price_1SZEvMLawSqPVy6JDJk2SNcc
- **Trimestral**: price_1SZEvMLawSqPVy6JWHUgauU6
- **Semestral**: price_1SZEvMLawSqPVy6JzFkSv4OX
- **Anual**: price_1SZEvMLawSqPVy6JxOQ4JNxj
- **Vitalício**: price_1SZEvMLawSqPVy6Jdbl8CArd
