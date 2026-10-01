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

# ── 2. Commit marcado `[sem deploy]` não constrói ─────────────────────────────
#
# Build CPU é cobrado por build, e o grosso dos builds de produção vinha de
# rajadas de commits de conteúdo — 33 num dia só, um a cada 2–6 minutos, cada um
# construindo o site inteiro para publicar uma legenda de lâmina. Quem vai fazer
# vários pushes seguidos marca os intermediários com `[sem deploy]` (ou
# `[skip deploy]`) na mensagem, e só o último constrói.
#
# Nada fica para trás: a regra 4 compara com o último deploy BEM-SUCEDIDO, então
# o primeiro push sem a marca publica tudo o que os marcados trouxeram. Só a
# mensagem do commit da ponta conta: um push sem a marca no topo constrói,
# mesmo que commits anteriores dele a tenham.
if git log -1 --format=%B HEAD 2>/dev/null | grep -qiE '\[(sem deploy|skip deploy)\]'; then
  echo "ignorado: commit marcado [sem deploy]; o próximo push sem a marca publica tudo junto"
  exit 0
fi

# ── 3. Commit que já não é a ponta da branch não constrói ─────────────────────
#
# O Pro constrói um deploy por vez, e os outros esperam na fila. Numa rajada de
# pushes (em 19/09 foram 11 commits entre 12:56 e 14:08, cada um no seu push),
# cada item da fila construía produção inteira, e cada build tornava o anterior
# obsoleto minutos depois. Quando este commit chega a buildar e a branch já
# aponta para outro mais novo, o deploy desse mais novo está atrás na fila e vai
# publicar tudo isto junto.
#
# A regra 4 não esconde nada aqui: a base dela é o último deploy BEM-SUCEDIDO,
# então o commit mais novo compara contra antes deste e enxerga as mudanças dele
# também.
#
# O repositório é público, então `ls-remote` não precisa de credencial. Qualquer
# falha (rede, variável ausente, resposta vazia) cai fora do `if` e constrói.
# O limite de uma hora poupa o "Redeploy" manual de um commit antigo, que também
# não é a ponta: quem pede isso de propósito quer o build.
if [ -n "$VERCEL_GIT_REPO_OWNER" ] && [ -n "$VERCEL_GIT_REPO_SLUG" ] \
  && [ -n "$VERCEL_GIT_COMMIT_REF" ] && [ -n "$VERCEL_GIT_COMMIT_SHA" ] \
  && [ "$VERCEL_GIT_PROVIDER" = github ]; then
  idade=$(( $(date +%s) - $(git log -1 --format=%ct HEAD 2>/dev/null || echo 0) ))
  if [ "$idade" -ge 0 ] && [ "$idade" -lt 3600 ]; then
    ponta="$(GIT_TERMINAL_PROMPT=0 timeout 10 git ls-remote \
      "https://github.com/$VERCEL_GIT_REPO_OWNER/$VERCEL_GIT_REPO_SLUG.git" \
      "refs/heads/$VERCEL_GIT_COMMIT_REF" 2>/dev/null | cut -f1)"
    case "$ponta" in
      *[!0-9a-f]* | '') ;;
      "$VERCEL_GIT_COMMIT_SHA") ;;
      *)
        echo "ignorado: $VERCEL_GIT_COMMIT_REF já aponta para $ponta, que vem atrás na fila"
        exit 0
        ;;
    esac
  fi
fi

# ── 4. Push que só mexeu em documentação não constrói ─────────────────────────
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

#
# `scripts/`, `server/` e a `img/` da raiz também não entram no deploy: são
# ferramentas de curadoria e de manutenção rodadas à mão, o worker de WebSocket e
# de WhatsApp (que roda fora da Vercel) e originais de arte (o que o site serve
# está em `public/img/`). Nada no app importa essas pastas, e o `package.json`
# não tem `prebuild` nem `postinstall`. Nos últimos 60 dias, `scripts/` apareceu
# em 95 commits, e os que só mexiam ali construíam produção do zero para
# publicar exatamente o mesmo site. Os caminhos sem `*` são relativos à raiz,
# então `img` não pega `public/img`.
if git diff --quiet "$base" HEAD -- \
  ':(exclude)*.md' \
  ':(exclude)*.txt' \
  ':(exclude)*.py' \
  ':(exclude)docs' \
  ':(exclude)__tests__' \
  ':(exclude)vitest.config.ts' \
  ':(exclude)scripts' \
  ':(exclude)server' \
  ':(exclude)img' \
  ':(exclude).claude' \
  ':(exclude).windsurf' \
  ':(exclude).github' \
  ':(exclude)last_commit.diff'
then
  echo "ignorado: $base..HEAD só mexeu em documentação, testes e ferramentas fora do deploy"
  exit 0
fi

echo "construindo: há mudança de código entre $base e HEAD"
exit 1
