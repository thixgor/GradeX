#!/usr/bin/env bash
#
# Decide se vale a pena gastar um build.
#
# A Vercel roda este comando antes de provisionar a máquina de build:
#   saída 0  -> ignora o commit, nenhum build acontece
#   saída 1  -> constrói
#
# Build CPU foi 69% da fatura de agosto (US$ 22,09 de US$ 31,94). O jeito mais
# barato de reduzir minuto de build é não gastar o build: um commit que só mexe
# em documentação, teste ou script de manutenção não muda um byte do que é
# servido, e mesmo assim recompilava as 835 páginas e as 429 rotas de API.
#
# Na dúvida, constrói. Um build a mais custa centavos; um deploy que não
# aconteceu custa o site desatualizado sem ninguém perceber.

set -u

# `VERCEL_GIT_COMMIT_REF` é a branch. Produção sempre constrói — nunca vale o
# risco de pular o que vai ao ar.
if [ "${VERCEL_GIT_COMMIT_REF:-}" = "master" ] || [ "${VERCEL_GIT_COMMIT_REF:-}" = "main" ]; then
  # Ainda assim pula documentação pura: nem em produção isso muda a saída.
  :
fi

# Sem histórico suficiente para comparar (clone raso de 1 commit, primeiro
# deploy do projeto) não dá para saber o que mudou. Constrói.
if ! git rev-parse HEAD~1 >/dev/null 2>&1; then
  echo "Sem commit anterior para comparar — construindo."
  exit 1
fi

ARQUIVOS="$(git diff --name-only HEAD~1 HEAD)"

if [ -z "$ARQUIVOS" ]; then
  echo "Diff vazio — construindo por precaução."
  exit 1
fi

# Caminhos que comprovadamente não entram no que é servido.
#   *.md / *.txt        documentação e anotações soltas na raiz
#   docs/               idem
#   __tests__/          já excluído pelo .vercelignore
#   scripts/            idem (exceto este arquivo, mas mexer nele exige build
#                       novo para valer, então não está na lista)
#   .claude/ .windsurf/ configuração de ferramenta de edição
#   .github/            CI, não runtime
IRRELEVANTES='(^|/)[^/]*\.(md|MD|txt)$|^docs/|^__tests__/|^\.claude/|^\.windsurf/|^\.github/|^last_commit\.diff$'

RELEVANTES="$(echo "$ARQUIVOS" | grep -Ev "$IRRELEVANTES" || true)"

if [ -z "$RELEVANTES" ]; then
  echo "Só documentação/testes mudou neste commit — build ignorado."
  echo "$ARQUIVOS" | sed 's/^/  - /'
  exit 0
fi

echo "Mudanças que afetam o deploy — construindo:"
echo "$RELEVANTES" | sed 's/^/  - /'
exit 1
