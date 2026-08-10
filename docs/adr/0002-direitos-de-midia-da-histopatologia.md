# ADR 0002 — Direitos de mídia e arquitetura de acervo da Histopatologia

- **Estado:** aceito — módulo publicável, mídia em estado `pendente` nas duas fontes
- **Data da decisão:** 2026-08-09
- **Decisores:** equipe editorial do GradeX
- **Depende de:** [ADR 0001](./0001-licenca-manual-histologia.md) (portão de licença do Manual da Histologia)

## Decisão registrada

Três decisões, tomadas juntas porque uma depende da outra.

### 1. Nenhuma imagem entra no projeto — em nenhuma forma

O módulo trabalha exclusivamente com **ponteiros remotos**. Não há download, não
há cópia para `public/`, `data/`, Vercel Blob ou CDN próprio, não há proxy, não
há miniatura gerada, não há passagem pelo otimizador de imagem do Next, e o
servidor do GradeX nunca busca nem processa bytes de imagem — nem em build, nem
em teste, nem em renderização.

Quando a exibição for autorizada, o `<img src="URL_REMOTA">` é montado no
navegador do aluno, com `loading="lazy"`, e o arquivo continua sendo servido
pela instituição de origem.

Aplicação técnica: `lib/histopatologia/midia.ts` monta o DTO;
`components/histopatologia/imagem-remota.tsx` é o único arquivo do módulo com um
elemento `<img>`; `__tests__/histopatologia/interface.test.ts` falha se aparecer
um segundo, se alguém importar `next/image`, ou se o pipeline ganhar um `fetch`.

### 2. Portão de direitos por escopo, independente do portão de revisão

O estado de direitos vive em `ESCOPOS_DE_DIREITOS`
(`lib/histopatologia/direitos.ts`), com quatro valores possíveis: `pendente`,
`autorizado-link-remoto`, `autorizado-incorporacao` e `bloqueado`. Cada escopo
registra titular, licença, comprovante, data de verificação, responsável e
restrições — **inclusive quando o estado é `pendente`**, porque registrar que
ninguém verificou ainda é informação, e a ausência de registro é que seria
omissão.

Escopos mais específicos (arquivo > página > coleção > domínio > fonte) vencem
os mais amplos, o que permite liberar uma coleção sem liberar a fonte inteira.

**Estado inicial: `pendente` para as duas fontes.** Consequência literal: as
URLs de mídia não saem do servidor, e a interface mostra descrição, modalidade,
coloração, crédito e um botão para a página de origem.

O portão de direitos é **independente** do portão de revisão biomédica. Uma
doença pode ter texto publicado e mídia apenas linkada; uma mídia autorizada não
valida um texto não revisado. Habilitar o módulo (`HISTOPATOLOGIA_HABILITADO=1`)
não libera imagem nenhuma.

### 3. O catálogo-fonte não é duplicado em `data/`

Os derivados em `data/histopatologia` guardam índices, contadores por entrada e
os fragmentos das doenças curadas — 2,8 MB. O inventário completo das 2.892
entradas ainda sem curadoria é lido sob demanda do próprio catálogo comprimido
em `public/patologia/catalogo`, por `lib/histopatologia/acervo.ts`, com cache LRU
de três fragmentos e `outputFileTracingIncludes` declarado em `next.config.js`.

## Contexto

### Por que a licença da Histologia normal não se aplica

O acervo do Digital Histology está sob CC BY-NC-SA 4.0 e a ADR 0001 registrou a
decisão correspondente. **Nada disso vale aqui.** As duas fontes deste módulo
são outras instituições, com outros titulares:

| Fonte | Titular | Licença declarada |
| --- | --- | --- |
| Atlas de Anatomia Patológica da Unicamp | FCM/Unicamp | nenhuma localizada |
| Histopathology Atlas | Serdar Balcı / patolojiAI e colaboradores | a verificar por coleção |

Gratuidade e acesso público não são licença. `CREDITOS_E_DIREITOS.md` é explícito
sobre isso, e o teste `direitos.test.ts` trava a propriedade: nenhum escopo pode
declarar CC BY-NC-SA por herança.

### Por que a allowlist de domínios não é formalidade

O catálogo contém 71 URLs que apontam para fora dos domínios das instituições:
`geoloc12.geovisite.ovh`, `mapmyvisitors.com`, `img.shields.io`,
`tools.applemediaservices.com`, `www.youtube.com` e outros. São selos,
contadores de visita e conteúdo de terceiros capturados junto das lâminas
durante a coleta — e vários deles são **pixels de rastreamento**. Renderizá-los
exporia a navegação do aluno a serviços de analytics alheios.

A allowlist (`hostPermitido`, em `direitos.ts`) é aplicada no pipeline e na
renderização, com a mesma implementação. As 71 URLs continuam contabilizadas na
conciliação — sumir com elas em silêncio esconderia divergência — mas ficam fora
de tudo que a interface consome.

### Por que não há `preconnect` para os atlas

No Manual da Histologia normal, o `preconnect` para `digitalhistology.org` faz
sentido: as lâminas vêm daquele host em toda página. Aqui, enquanto os direitos
estiverem pendentes, nenhuma imagem remota é requisitada — abrir conexão TLS com
`anatpat.unicamp.br` e `images.patolojiatlasi.com` em toda visita revelaria a
navegação do aluno a servidores de terceiros sem que nada fosse buscado deles.
Quando a incorporação for autorizada, o `layout.tsx` do módulo é o lugar de
acrescentar as duas linhas.

## Consequências

### Aceitas

- O módulo entra no ar como **catálogo com crédito e link**, não como galeria.
  É menos vistoso e é o que a política inicial de cada acervo autoriza.
- O inventário completo depende de leitura de arquivo em runtime, o que exige a
  declaração de tracing. Em troca, o repositório não ganha dezenas de megabytes
  de dado duplicado.
- Nenhum conteúdo é indexável enquanto nenhuma doença estiver publicada.

### Pendências que esta ADR não resolve

1. **Autorização da FCM/Unicamp** — contato formal não iniciado. Enquanto não
   houver documento arquivado, o estado permanece `pendente`.
2. **Licença por coleção do Histopathology Atlas** — o DOI identifica o depósito
   do projeto, não a licença de cada coleção; a verificação precisa ser feita
   coleção a coleção.
3. **Revisão biomédica** — as seis doenças piloto estão em `revisao-medica` e
   nenhuma pode ser publicada sem revisor identificado, registro profissional e
   data.

## Como liberar uma coleção depois

1. Arquive o documento de autorização e registre o caminho ou URL.
2. Acrescente um escopo a `ESCOPOS_DE_DIREITOS` com `escopo: 'colecao'`, o
   prefixo de URL da coleção em `alvo`, o estado adequado, titular, licença,
   comprovante, data e responsável.
3. Rode `npm test`. Os testes de direitos verificam a consistência do registro.
4. Não altere o estado da fonte inteira para destravar um caso particular.
