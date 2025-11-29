# Configuração de Cronogramas - Checklist

## ✅ Funcionalidades Implementadas

### 1. Geração de Cronograma
- [x] Função `gerarCronograma()` implementada
- [x] Coleta de módulos selecionados
- [x] Distribuição de atividades por dias da semana
- [x] Cálculo de horas totais
- [x] Envio para API POST `/api/cronogramas`

### 2. Armazenamento
- [x] Endpoint POST `/api/cronogramas` - Cria novo cronograma
- [x] Endpoint GET `/api/cronogramas` - Lista cronogramas do usuário
- [x] Endpoint GET `/api/cronogramas/[id]` - Obtém cronograma específico
- [x] Conversão de ObjectId para string

### 3. Visualização
- [x] Página `/cronogramas` - Lista todos os cronogramas
- [x] Página `/cronogramas/[id]` - Visualiza cronograma detalhado
- [x] Exibe data de criação, total de horas, dias de estudo
- [x] Badge de "Concluído" para cronogramas finalizados

### 4. Funcionalidades Adicionais
- [x] Marcar atividades como concluídas
- [x] Calcular progresso em percentual
- [x] Download em PDF (via impressão do navegador)
- [x] Marcar cronograma como concluído (quando 100% completo)
- [x] Deletar cronogramas

## 🔍 Possíveis Problemas

### Se o cronograma não aparecer após criação:

1. **Verificar console do navegador** (F12)
   - Procure por erros de rede (Network tab)
   - Verifique se a resposta do POST é 200

2. **Verificar logs do servidor**
   - Procure por erros em `/api/cronogramas`
   - Verifique se `usuarioId` está sendo salvo corretamente

3. **Verificar banco de dados**
   - Conecte ao MongoDB
   - Verifique se a coleção `cronogramas` existe
   - Verifique se há documentos com o `usuarioId` correto

4. **Verificar autenticação**
   - Confirme se `session.userId` está sendo obtido corretamente
   - Verifique se o token está sendo enviado nas requisições

## 🧪 Teste Manual

1. Acesse `/cronogramas/criar`
2. Selecione um modelo (ex: ENEM)
3. Configure tempo de estudo
4. Selecione tópicos/subtópicos/módulos
5. Insira um título
6. Clique em "Gerar Cronograma"
7. Você deve ser redirecionado para `/cronogramas`
8. O cronograma deve aparecer na lista

## 📝 Estrutura do Cronograma Salvo

```json
{
  "_id": "ObjectId",
  "usuarioId": "user-id",
  "titulo": "Cronograma ENEM 2024",
  "modelo": "enem",
  "tempoEstudo": {
    "segunda": 2,
    "terca": 2,
    ...
  },
  "config": {
    "modelo": "enem",
    "tempoEstudo": {...},
    "topicosInclusos": ["id1", "id2"],
    "subtopicosInclusos": ["id3", "id4"],
    "modulosInclusos": ["id5", "id6"]
  },
  "cronograma": [
    {
      "dia": "Segunda",
      "data": "2024-01-01",
      "horasDisponivel": 2,
      "atividades": [
        {
          "id": "act-1",
          "topico": "Português",
          "subtopico": "Gramática",
          "modulo": "Classes de palavras",
          "dificuldadeUsuario": "medio",
          "horas": 2,
          "descricao": "...",
          "concluido": false
        }
      ]
    }
  ],
  "totalHoras": 50,
  "dataCriacao": "2024-01-01T10:00:00Z",
  "dataAtualizacao": "2024-01-01T10:00:00Z"
}
```

## 🚀 Próximos Passos

- [ ] Adicionar edição de cronogramas
- [ ] Adicionar filtros na listagem
- [ ] Adicionar estatísticas de progresso
- [ ] Adicionar compartilhamento de cronogramas
- [ ] Adicionar templates pré-configurados
