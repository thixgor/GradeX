#!/bin/sh
#
# Decide se este deploy deve ou não ser construído.
#
# `exit 0` cancela o build; `exit 1` deixa seguir. É a convenção do
# `ignoreCommand` da Vercel, e é o oposto do que a intuição sugere.
#
# Mora num arquivo e não dentro do `vercel.json` porque `ignoreCommand` aceita
# no máximo 256 caracteres — um limite que a validação do schema aplica e que
# derruba o deploy inteiro com "Configuration error", sem chegar a buildar.
# Aqui o espaço é livre, e a regra pode ser lida e testada.
#
# Qualquer falha inesperada deste script devolve código diferente de zero, e
# portanto BUILDA. É a assimetria que importa: um build a mais custa centavos,
# um deploy de produção que não sobe custa uma correção que ninguém vê no ar.

# ── 1. Preview de branch de agente não constrói ───────────────────────────────
#
# Build CPU é a maior linha da fatura. São ~2,9 pushes de produção por dia, e com
# preview ligado isso dobra: metade do maior custo do projeto era montar uma URL
# de preview para branch de agente, cujo trabalho é revisado no diff.
#
# `= preview` e não `!= production` de propósito. Se a variável vier vazia por
# qualquer motivo, cai fora do `if` e o build acontece.
case "$VERCEL_GIT_COMMIT_REF" in
  claude/*)
    if [ "$VERCEL_ENV" = preview ]; then
      echo "ignorado: preview de branch de agente ($VERCEL_GIT_COMMIT_REF)"
      exit 0
    fi
    ;;
esac

# ── 2. Push que só mexeu em documentação não constrói ─────────────────────────
#
# A base de comparação é `VERCEL_GIT_PREVIOUS_SHA`, o último deploy de fato — e
# não `HEAD~1`. Comparar com `HEAD~1` olhava um commit só: num push com vários
# commits, bastava o último ser `.md` para o build ser pulado e o código dos
# anteriores nunca subir.
#
# Se esse SHA existir mas não for resolvível (clone raso), constrói: não há como
# saber o que mudou, e o palpite errado aqui é o que esconde código do ar.
base="$VERCEL_GIT_PREVIOUS_SHA"
if [ -n "$base" ]; then
  git cat-file -e "$base^{commit}" 2>/dev/null || {
    echo "base $base não resolvível neste clone; construindo por segurança"
    exit 1
  }
else
  base="$(git rev-parse HEAD~1 2>/dev/null)"
fi

[ -n "$base" ] || {
  echo "sem base de comparação; construindo"
  exit 1
}

if git diff --quiet "$base" HEAD -- \
  ':(exclude)*.md' \
  ':(exclude)*.txt' \
  ':(exclude)docs' \
  ':(exclude)__tests__' \
  ':(exclude).claude' \
  ':(exclude).windsurf' \
  ':(exclude).github' \
  ':(exclude)last_commit.diff'
then
  echo "ignorado: $base..HEAD só mexeu em documentação e testes"
  exit 0
fi

echo "construindo: há mudança de código entre $base e HEAD"
exit 1
