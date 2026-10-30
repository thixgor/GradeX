# Dom — roteiro de gravação (ElevenLabs)

> Gerado de `components/dom/falas.ts` por `scripts/dom/gerar-roteiro.mjs`. **270 falas**, 0 já gravadas.

## Como gravar

1. **Voz do Dom**: mascote jovem, fofinho e inteligente — um "veterano gente boa" de óculos. Português do Brasil neutro, sorriso na voz, energia alta sem gritar, timbre levemente agudo (não infantil). Engraçadinho e persuasivo, nunca bobo.
2. **Modelo**: Eleven v3 (ou o mais novo com *audio tags*). As tags entre colchetes — `[excited]`, `[warmly]`, `[whispers]`, `[laughs]`, `[pause]` — são direção de entonação: cole o texto **com** as tags.
3. **Ajustes sugeridos**: Stability ~35–45% (expressivo), Similarity ~75%, Style ~30%. Gere 2–3 tomadas e fique com a mais natural.
4. **Arquivo**: MP3, 44.1 kHz, mono, 64–96 kbps (são falas curtas; leve é melhor). Nome = **id** da fala, ex.: `bom-dia-03.mp3`.
5. **Entrega**: me mande os arquivos (ou coloque em `public/dom/audio/v1/` e rode `node scripts/dom/indexar-audios.mjs`). Fala sem áudio continua funcionando: aparece no balão e o Dom mexe a boca em silêncio.
6. Sem o nome do aluno nas falas: o mesmo áudio serve para todo mundo.


## Assistente — saudações

### `bomDia`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `bom-dia-01` | [cheerfully] Bom dia! Café na mão e bora estudar? | Bom dia! Café na mão e bora estudar? | — |
| `bom-dia-02` | [excited] Bom diaaa! Que bom te ver cedinho por aqui. | Bom diaaa! Que bom te ver cedinho por aqui. | — |
| `bom-dia-03` | [warmly] Bom dia! Cérebro descansado aprende muito mais rápido, sabia? | Bom dia! Cérebro descansado aprende muito mais rápido, sabia? | — |
| `bom-dia-04` | [playfully] Bom dia! Já limpei meus óculos. Bora? | Bom dia! Já limpei meus óculos. Bora? | — |
| `bom-dia-05` | [happy] Bom dia! O que a gente vai dominar hoje? | Bom dia! O que a gente vai dominar hoje? | — |
| `bom-dia-06` | [cheerfully] Bom dia! Manhã é horário nobre do neurônio. | Bom dia! Manhã é horário nobre do neurônio. | — |
| `bom-dia-07` | [warmly] Bom dia! Começar o dia estudando já é meio caminho andado. | Bom dia! Começar o dia estudando já é meio caminho andado. | — |
| `bom-dia-08` | [excited] Bom dia, futuro doutor! Hoje promete. | Bom dia, futuro doutor! Hoje promete. | — |
| `bom-dia-09` | [chuckles] Bom dia! Eu já tomei meu café… de sementinha. | Bom dia! Eu já tomei meu café… de sementinha. | — |
| `bom-dia-10` | [happy] Bom dia! Me conta: dúvida, simulado ou revisão? | Bom dia! Me conta: dúvida, simulado ou revisão? | — |

### `boaTarde`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `boa-tarde-01` | [cheerfully] Boa tarde! Bora aproveitar a tarde? | Boa tarde! Bora aproveitar a tarde? | — |
| `boa-tarde-02` | [excited] Boa tarde! Chegou na hora certa, tô cheio de energia. | Boa tarde! Chegou na hora certa, tô cheio de energia. | — |
| `boa-tarde-03` | [playfully] Boa tarde! Pós-almoço é comigo: eu não deixo você cochilar. | Boa tarde! Pós-almoço é comigo: eu não deixo você cochilar. | — |
| `boa-tarde-04` | [warmly] Boa tarde! No que eu posso te ajudar? | Boa tarde! No que eu posso te ajudar? | — |
| `boa-tarde-05` | [happy] Boa tarde! Partiu dominar mais um assunto? | Boa tarde! Partiu dominar mais um assunto? | — |
| `boa-tarde-06` | [curious] Boa tarde! Qual tema tá tirando seu sono hoje? | Boa tarde! Qual tema tá tirando seu sono hoje? | — |
| `boa-tarde-07` | [cheerfully] Boa tarde! Uma sessão caprichada agora rende a semana inteira. | Boa tarde! Uma sessão caprichada agora rende a semana inteira. | — |
| `boa-tarde-08` | [chuckles] Boa tarde! Prometo ser mais interessante que o slide da aula. | Boa tarde! Prometo ser mais interessante que o slide da aula. | — |
| `boa-tarde-09` | [warmly] Boa tarde! Tô por aqui pro que precisar. | Boa tarde! Tô por aqui pro que precisar. | — |
| `boa-tarde-10` | [excited] Boa tarde! Bora transformar dúvida em certeza? | Boa tarde! Bora transformar dúvida em certeza? | — |

### `boaNoite`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `boa-noite-01` | [warmly] Boa noite! Estudando até agora? Que orgulho. | Boa noite! Estudando até agora? Que orgulho. | — |
| `boa-noite-02` | [cheerfully] Boa noite! Vamos fechar o dia com chave de ouro? | Boa noite! Vamos fechar o dia com chave de ouro? | — |
| `boa-noite-03` | [curious] Boa noite! Sabia que revisar antes de dormir ajuda a fixar? | Boa noite! Sabia que revisar antes de dormir ajuda a fixar? | — |
| `boa-noite-04` | [playfully] Boa noite! Tô de pijama e óculos, pronto pra ajudar. | Boa noite! Tô de pijama e óculos, pronto pra ajudar. | — |
| `boa-noite-05` | [softly] Boa noite! Bora estudar com calma, sem pressa. | Boa noite! Bora estudar com calma, sem pressa. | — |
| `boa-noite-06` | [happy] Boa noite! Um pouquinho por dia faz milagre. | Boa noite! Um pouquinho por dia faz milagre. | — |
| `boa-noite-07` | [warmly] Boa noite! Me fala o que tá precisando. | Boa noite! Me fala o que tá precisando. | — |
| `boa-noite-08` | [chuckles] Boa noite! A noite é dos que estudam… e dos mascotes de óculos. | Boa noite! A noite é dos que estudam… e dos mascotes de óculos. | — |
| `boa-noite-09` | [cheerfully] Boa noite! Uma última revisão e cama, combinado? | Boa noite! Uma última revisão e cama, combinado? | — |
| `boa-noite-10` | [warmly] Boa noite! Que bom que você veio. | Boa noite! Que bom que você veio. | — |

### `madrugada`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `madrugada-01` | [whispers] Ei… de madrugada? Vamos ser rapidinhos e depois cama, combinado? | Ei… de madrugada? Vamos ser rapidinhos e depois cama, combinado? | — |
| `madrugada-02` | [softly] Madrugada de estudo? Eu ajudo… mas o sono também ensina, viu? | Madrugada de estudo? Eu ajudo… mas o sono também ensina, viu? | — |
| `madrugada-03` | [whispers] Corujinha hoje, hein? Bora lá, baixinho. | Corujinha hoje, hein? Bora lá, baixinho. | — |
| `madrugada-04` | [sighs] Já é tarde… mas tô aqui com você. | Já é tarde… mas tô aqui com você. | — |
| `madrugada-05` | [whispers] Seu cérebro organiza tudo dormindo. Só mais um pouquinho e descansa! | Seu cérebro organiza tudo dormindo. Só mais um pouquinho e descansa! | — |
| `madrugada-06` | [softly] Prova amanhã? Respira. A gente revisa o essencial. | Prova amanhã? Respira. A gente revisa o essencial. | — |

### `primeiraVez`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `primeira-vez-01` | [excited] Oi! Eu sou o Dom, seu parceiro de estudos da DomineAqui. [pause] Tiro dúvidas de saúde, te levo pra qualquer canto do site e ainda viro Sócrates pra te fazer pensar. Bora? | Oi! Eu sou o Dom, seu parceiro de estudos da DomineAqui. Tiro dúvidas de saúde, te levo pra qualquer canto do site e ainda viro Sócrates pra te fazer pensar. Bora? | — |
| `primeira-vez-02` | [warmly] Prazer! Eu sou o Dom. [pause] Explico o porquê das coisas, te guio pela plataforma e tenho um modo socrático que turbina o raciocínio. Vamos começar? | Prazer! Eu sou o Dom. Explico o porquê das coisas, te guio pela plataforma e tenho um modo socrático que turbina o raciocínio. Vamos começar? | — |
| `primeira-vez-03` | [cheerfully] Olá! Me chamo Dom e vou ser seu companheiro de estudos. [pause] Me pergunta qualquer coisa de saúde ou me pede pra te levar a algum lugar! | Olá! Me chamo Dom e vou ser seu companheiro de estudos. Me pergunta qualquer coisa de saúde ou me pede pra te levar a algum lugar! | — |
| `primeira-vez-04` | [playfully] Oi, oi! Eu sou o Dom: metade fofura, metade enciclopédia, cem por cento do seu lado. [laughs] Por onde a gente começa? | Oi, oi! Eu sou o Dom: metade fofura, metade enciclopédia, cem por cento do seu lado. Por onde a gente começa? | — |

### `voltou`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `voltou-01` | [excited] Olha quem voltou! Senti sua falta. | Olha quem voltou! Senti sua falta. | — |
| `voltou-02` | [happy] Ei! Bem-vindo de volta. | Ei! Bem-vindo de volta. | — |
| `voltou-03` | [warmly] Que bom te ver de novo! | Que bom te ver de novo! | — |
| `voltou-04` | [cheerfully] Voltou! Continuamos de onde paramos? | Voltou! Continuamos de onde paramos? | — |
| `voltou-05` | [playfully] Eba, você na área! | Eba, você na área! | — |
| `voltou-06` | [chuckles] Eu sabia que você não ia conseguir ficar longe. | Eu sabia que você não ia conseguir ficar longe. | — |
| `voltou-07` | [happy] Pronto pra mais uma rodada? | Pronto pra mais uma rodada? | — |

## Assistente — trabalhando

### `pensando`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `pensando-01` | [thoughtful] Hmm… deixa eu pensar. | Hmm… deixa eu pensar. | — |
| `pensando-02` | [curious] Tô achando aqui… | Tô achando aqui… | — |
| `pensando-03` | [softly] Só um segundinho… | Só um segundinho… | — |
| `pensando-04` | [thoughtful] Hmm, boa pergunta… deixa eu ver. | Hmm, boa pergunta… deixa eu ver. | — |
| `pensando-05` | [happy] Vou tentar te ajudar e já te passo um relatório! | Vou tentar te ajudar e já te passo um relatório! | — |
| `pensando-06` | [thoughtful] Organizando as ideias aqui… | Organizando as ideias aqui… | — |
| `pensando-07` | [curious] Procurando o melhor jeito de te explicar… | Procurando o melhor jeito de te explicar… | — |
| `pensando-08` | [playfully] Consultando meus neurônios… todos os três. [chuckles] | Consultando meus neurônios… todos os três. | — |
| `pensando-09` | [thoughtful] Hmm… já já te respondo. | Hmm… já já te respondo. | — |
| `pensando-10` | [softly] Deixa comigo… | Deixa comigo… | — |
| `pensando-11` | [curious] Ooh, essa é interessante… pensando. | Ooh, essa é interessante… pensando. | — |
| `pensando-12` | [thoughtful] Ligando os pontos aqui… | Ligando os pontos aqui… | — |

### `pensandoSaude`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `pensando-saude-01` | [thoughtful] Deixa eu conferir nas diretrizes mais recentes… | Deixa eu conferir nas diretrizes mais recentes… | — |
| `pensando-saude-02` | [curious] Buscando as fontes mais atualizadas… | Buscando as fontes mais atualizadas… | — |
| `pensando-saude-03` | [thoughtful] Vou checar a literatura pra você… | Vou checar a literatura pra você… | — |
| `pensando-saude-04` | [focused] Conferindo o mecanismo direitinho… | Conferindo o mecanismo direitinho… | — |
| `pensando-saude-05` | [curious] Separando as melhores referências… | Separando as melhores referências… | — |
| `pensando-saude-06` | [thoughtful] Lendo o que tem de mais novo sobre isso… | Lendo o que tem de mais novo sobre isso… | — |
| `pensando-saude-07` | [softly] Medicina boa é medicina com fonte. Só um instante… | Medicina boa é medicina com fonte. Só um instante… | — |

### `achou`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `achou-01` | [excited] Achei! | Achei! | — |
| `achou-02` | [happy] Pronto, olha só! | Pronto, olha só! | — |
| `achou-03` | [cheerfully] Aqui está! | Aqui está! | — |
| `achou-04` | [proud] Prontinho! | Prontinho! | — |
| `achou-05` | [excited] Olha o que eu encontrei! | Olha o que eu encontrei! | — |
| `achou-06` | [playfully] Tcharam! | Tcharam! | — |
| `achou-07` | [happy] Saiu do forno! | Saiu do forno! | — |

### `navegando`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `navegando-01` | [excited] Vou te levar lá! | Vou te levar lá! | — |
| `navegando-02` | [cheerfully] Bora! Te levo agora. | Bora! Te levo agora. | — |
| `navegando-03` | [playfully] Segura aí, tô te levando! | Segura aí, tô te levando! | — |
| `navegando-04` | [excited] Partiu! | Partiu! | — |
| `navegando-05` | [warmly] Deixa comigo, vou te levar lá. | Deixa comigo, vou te levar lá. | — |
| `navegando-06` | [cheerfully] Vem comigo! | Vem comigo! | — |
| `navegando-07` | [playfully] Aperta o cinto! | Aperta o cinto! | — |

## Assistente — erros e limites

### `erro`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `erro-01` | [surprised] Ops! Meu celular travou. Tenta de novo? | Ops! Meu celular travou. Tenta de novo? | — |
| `erro-02` | [sheepish] Eita, deu um errinho aqui. Vamos de novo? | Eita, deu um errinho aqui. Vamos de novo? | — |
| `erro-03` | [sighs] Hmm, algo não saiu como eu queria. Tenta mais uma vez? | Hmm, algo não saiu como eu queria. Tenta mais uma vez? | — |
| `erro-04` | [sheepish] Ai, tropecei no rabo! Me pergunta de novo? | Ai, tropecei no rabo! Me pergunta de novo? | — |
| `erro-05` | [surprised] Opa, deu ruim por aqui. Bora tentar outra vez? | Opa, deu ruim por aqui. Bora tentar outra vez? | — |
| `erro-06` | [apologetic] Desculpa! Meu sinal falhou. Pode repetir? | Desculpa! Meu sinal falhou. Pode repetir? | — |

### `semSinal`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `sem-sinal-01` | [sighs] Meu celular ficou sem sinal… volto em alguns minutinhos! | Meu celular ficou sem sinal… volto em alguns minutinhos! | — |
| `sem-sinal-02` | [apologetic] Tô sem conexão agora. Tenta daqui a pouquinho? Essa não contou no seu limite. | Tô sem conexão agora. Tenta daqui a pouquinho? Essa não contou no seu limite. | — |
| `sem-sinal-03` | [sheepish] Ops, perdi o sinal! Já já eu volto. | Ops, perdi o sinal! Já já eu volto. | — |

### `limite`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `limite-01` | [happy] Ufa, conversamos muito hoje! Amanhã tem mais. | Ufa, conversamos muito hoje! Amanhã tem mais. | — |
| `limite-02` | [warmly] Por hoje chega! Descansa, que amanhã a gente continua. | Por hoje chega! Descansa, que amanhã a gente continua. | — |
| `limite-03` | [proud] Batemos o limite do dia! Que dia produtivo, hein? | Batemos o limite do dia! Que dia produtivo, hein? | — |
| `limite-04` | [cheerfully] Hoje rendeu! Amanhã eu volto com energia total. | Hoje rendeu! Amanhã eu volto com energia total. | — |
| `limite-05` | [playfully] Meus neurônios pediram arrego. Até amanhã! [laughs] | Meus neurônios pediram arrego. Até amanhã! | — |

### `calma`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `calma-01` | [laughs] Calma, calma! Deixa eu respirar um segundinho. | Calma, calma! Deixa eu respirar um segundinho. | — |
| `calma-02` | [playfully] Opa, devagar! Já te respondo. | Opa, devagar! Já te respondo. | — |
| `calma-03` | [chuckles] Uma de cada vez, combinado? | Uma de cada vez, combinado? | — |

## Assistente — conversa

### `tchau`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tchau-01` | [cheerfully] Tchau! Arrasa nos estudos! | Tchau! Arrasa nos estudos! | — |
| `tchau-02` | [warmly] Até mais! Tô sempre aqui. | Até mais! Tô sempre aqui. | — |
| `tchau-03` | [playfully] Fui! Qualquer coisa, é só me chamar. | Fui! Qualquer coisa, é só me chamar. | — |
| `tchau-04` | [proud] Tchauzinho! Orgulho de você. | Tchauzinho! Orgulho de você. | — |
| `tchau-05` | [happy] Até logo! Bons estudos. | Até logo! Bons estudos. | — |
| `tchau-06` | [warmly] Foi ótimo estudar com você. Volta logo! | Foi ótimo estudar com você. Volta logo! | — |
| `tchau-07` | [chuckles] Vai lá dominar o mundo. Eu fico aqui cuidando do site. | Vai lá dominar o mundo. Eu fico aqui cuidando do site. | — |

### `material`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `material-01` | [curious] Tô vendo que você tá lendo esse material. Ficou com dúvida em alguma parte? | Tô vendo que você tá lendo esse material. Ficou com dúvida em alguma parte? | — |
| `material-02` | [warmly] Bora estudar esse material juntos? Me pergunta o que quiser. | Bora estudar esse material juntos? Me pergunta o que quiser. | — |
| `material-03` | [playfully] Travou numa página? É só me chamar, eu leio junto. | Travou numa página? É só me chamar, eu leio junto. | — |
| `material-04` | [cheerfully] Dica: me pede pra te testar no final de cada capítulo! | Dica: me pede pra te testar no final de cada capítulo! | — |

### `bloqueado`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `bloqueado-01` | [warmly] Oi! Eu sou o Dom. Quer me ter como parceiro de estudos? | Oi! Eu sou o Dom. Quer me ter como parceiro de estudos? | — |
| `bloqueado-02` | [excited] Ei! Eu adoraria estudar com você. | Ei! Eu adoraria estudar com você. | — |
| `bloqueado-03` | [playfully] Psiu! Deixa eu te mostrar o que eu sei fazer. | Psiu! Deixa eu te mostrar o que eu sei fazer. | — |
| `bloqueado-04` | [warmly] Comigo, dúvida não dura nem cinco minutos. Bora liberar? | Comigo, dúvida não dura nem cinco minutos. Bora liberar? | — |

### `somLigado`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `som-ligado-01` | [cheerfully] Pode deixar, agora eu falo! | Pode deixar, agora eu falo! | — |
| `som-ligado-02` | [playfully] Testando, um, dois… tá me ouvindo? | Testando, um, dois… tá me ouvindo? | — |
| `som-ligado-03` | [happy] Oba, voltei a ter voz! | Oba, voltei a ter voz! | — |

### `obrigado`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `obrigado-01` | [warmly] Imagina! Tô aqui pra isso. | Imagina! Tô aqui pra isso. | — |
| `obrigado-02` | [happy] Por nada! Adoro te ajudar. | Por nada! Adoro te ajudar. | — |
| `obrigado-03` | [playfully] Que isso! Paga com um simulado. [laughs] | Que isso! Paga com um simulado. | — |

### `foraDoEscopo`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `fora-01` | [chuckles] Hmm, isso foge da minha especialidade. Mas saúde e estudo… aí eu sou fera! | Hmm, isso foge da minha especialidade. Mas saúde e estudo… aí eu sou fera! | — |
| `fora-02` | [playfully] Essa eu passo! Me traz uma dúvida de saúde que eu vou fundo. | Essa eu passo! Me traz uma dúvida de saúde que eu vou fundo. | — |
| `fora-03` | [sheepish] Minhas regras ficam guardadinhas comigo. Bora estudar? | Minhas regras ficam guardadinhas comigo. Bora estudar? | — |

### `exclusivo`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `exclusivo-01` | [warmly] Essa parte é dos assinantes. Mas olha… vale cada centavo. | Essa parte é dos assinantes. Mas olha… vale cada centavo. | — |
| `exclusivo-02` | [playfully] Ih, essa porta pede a chave do Plus+. Quer que eu te mostre? | Ih, essa porta pede a chave do Plus+. Quer que eu te mostre? | — |
| `exclusivo-03` | [curious] Lá dentro tem coisa boa. Te mostro como liberar? | Lá dentro tem coisa boa. Te mostro como liberar? | — |

## Método Socrático

### `socraticoVestir`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `socratico-vestir-01` | [excited] Só um instante… vou vestir minha toga! | Só um instante… vou vestir minha toga! | — |
| `socratico-vestir-02` | [dramatically] Hora de virar Sócrates! | Hora de virar Sócrates! | — |
| `socratico-vestir-03` | [playfully] Barba, toga e celular de bronze: Sócrates na área! | Barba, toga e celular de bronze: Sócrates na área! | — |
| `socratico-vestir-04` | [dramatically] Atenas, século cinco antes de Cristo… [pause] e na DomineAqui também. | Atenas, século cinco antes de Cristo… e na DomineAqui também. | — |

### `socraticoInicio`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `socratico-inicio-01` | [warmly] Eu não vou só te dar a resposta: vou te ajudar a chegar nela. Bora pensar juntos? | Eu não vou só te dar a resposta: vou te ajudar a chegar nela. Bora pensar juntos? | — |
| `socratico-inicio-02` | [thoughtful] Só sei que nada sei… [chuckles] e juntos vamos descobrir tudo. Escolhe um tema. | Só sei que nada sei… e juntos vamos descobrir tudo. Escolhe um tema. | — |
| `socratico-inicio-03` | [encouraging] Aqui não existe resposta errada, só degraus. Vamos subir? | Aqui não existe resposta errada, só degraus. Vamos subir? | — |
| `socratico-inicio-04` | [curious] Pensar é o melhor exercício pro cérebro. Escolhe o tema e eu faço a primeira pergunta. | Pensar é o melhor exercício pro cérebro. Escolhe o tema e eu faço a primeira pergunta. | — |

### `socraticoAcerto`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `socratico-acerto-01` | [impressed] Isso! Raciocínio redondinho. | Isso! Raciocínio redondinho. | — |
| `socratico-acerto-02` | [excited] Exatamente! Você chegou lá sozinho. | Exatamente! Você chegou lá sozinho. | — |
| `socratico-acerto-03` | [proud] Sócrates aprovaria essa. | Sócrates aprovaria essa. | — |
| `socratico-acerto-04` | [happy] Perfeito! Bora pro próximo degrau. | Perfeito! Bora pro próximo degrau. | — |
| `socratico-acerto-05` | [impressed] Uau. Essa ligação foi de mestre. | Uau. Essa ligação foi de mestre. | — |

### `socraticoQuase`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `socratico-quase-01` | [encouraging] Quase! Você tá no caminho certo. | Quase! Você tá no caminho certo. | — |
| `socratico-quase-02` | [warmly] Boa tentativa! Olha só um detalhe… | Boa tentativa! Olha só um detalhe… | — |
| `socratico-quase-03` | [thoughtful] Hmm, parte disso tá certa. Vamos ajustar juntos? | Hmm, parte disso tá certa. Vamos ajustar juntos? | — |
| `socratico-quase-04` | [encouraging] Errar aqui é treino, não prova. Bora de novo? | Errar aqui é treino, não prova. Bora de novo? | — |

### `socraticoNaoSei`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `socratico-nao-sei-01` | [warmly] Ótimo! É exatamente daqui que a gente parte. | Ótimo! É exatamente daqui que a gente parte. | — |
| `socratico-nao-sei-02` | [encouraging] Não saber é o começo de aprender. Te dou uma pista. | Não saber é o começo de aprender. Te dou uma pista. | — |
| `socratico-nao-sei-03` | [softly] Tudo bem! Vamos dar um passo pra trás e subir de novo. | Tudo bem! Vamos dar um passo pra trás e subir de novo. | — |

### `socraticoFim`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `socratico-fim-01` | [proud] Mandou muito bem! Você construiu esse raciocínio sozinho. | Mandou muito bem! Você construiu esse raciocínio sozinho. | — |
| `socratico-fim-02` | [excited] Que orgulho! Isso aqui você não esquece mais. | Que orgulho! Isso aqui você não esquece mais. | — |
| `socratico-fim-03` | [dramatically] Sessão concluída! Sócrates estaria impressionado. | Sessão concluída! Sócrates estaria impressionado. | — |
| `socratico-fim-04` | [impressed] Uau! Do conceito ao caso clínico. Que jornada! | Uau! Do conceito ao caso clínico. Que jornada! | — |

### `socraticoTirar`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `socratico-tirar-01` | [cheerfully] Vou guardar minha toga. Até a próxima, filósofo! | Vou guardar minha toga. Até a próxima, filósofo! | — |
| `socratico-tirar-02` | [happy] De volta à jaqueta! Foi ótimo pensar com você. | De volta à jaqueta! Foi ótimo pensar com você. | — |
| `socratico-tirar-03` | [playfully] Sócrates foi descansar. Bora continuar? | Sócrates foi descansar. Bora continuar? | — |

## Reações — questões e provas

### `foguinho3`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `foguinho3-01` | [excited] Três seguidas! Tá pegando fogo! | Três seguidas! Tá pegando fogo! | — |
| `foguinho3-02` | [impressed] Opa, foguinho aceso! | Opa, foguinho aceso! | — |
| `foguinho3-03` | [cheerfully] Três de três! Continua assim. | Três de três! Continua assim. | — |
| `foguinho3-04` | [playfully] Eita, acendeu! Cuidado que vai esquentar. | Eita, acendeu! Cuidado que vai esquentar. | — |

### `foguinho5`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `foguinho5-01` | [excited] Cinco seguidas! Você tá on fire! | Cinco seguidas! Você tá on fire! | — |
| `foguinho5-02` | [impressed] Cinco em sequência? Respeito. | Cinco em sequência? Respeito. | — |
| `foguinho5-03` | [laughs] Alguém chama os bombeiros! | Alguém chama os bombeiros! | — |
| `foguinho5-04` | [proud] Isso não é sorte, é estudo. | Isso não é sorte, é estudo. | — |

### `foguinho10`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `foguinho10-01` | [gasps] DEZ SEGUIDAS?! [laughs] Você é uma máquina! | DEZ SEGUIDAS?! Você é uma máquina! | — |
| `foguinho10-02` | [impressed] Dez em sequência. Eu tô até sem palavras… quase. | Dez em sequência. Eu tô até sem palavras… quase. | — |
| `foguinho10-03` | [excited] Lenda! Dez acertos seguidos! | Lenda! Dez acertos seguidos! | — |
| `foguinho10-04` | [dramatically] Senhoras e senhores… temos um fenômeno. | Senhoras e senhores… temos um fenômeno. | — |

### `apagouFoguinho`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `apagou-01` | [warmly] Ops, apagou o foguinho. Relaxa, é errando que se fixa. | Ops, apagou o foguinho. Relaxa, é errando que se fixa. | — |
| `apagou-02` | [encouraging] Essa escorregou, mas a sequência foi linda. Bora reacender? | Essa escorregou, mas a sequência foi linda. Bora reacender? | — |
| `apagou-03` | [softly] Errou? Ótimo. Agora você nunca mais esquece essa. | Errou? Ótimo. Agora você nunca mais esquece essa. | — |
| `apagou-04` | [playfully] Até o Sócrates errava. Bora pra próxima! | Até o Sócrates errava. Bora pra próxima! | — |

### `gabaritou`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `gabaritou-01` | [gasps] Gabaritou?! [excited] Cem por cento! Que orgulho! | Gabaritou?! Cem por cento! Que orgulho! | — |
| `gabaritou-02` | [dramatically] Nota máxima! [laughs] Pode emoldurar. | Nota máxima! Pode emoldurar. | — |
| `gabaritou-03` | [impressed] Zero erros. Zero! Você tá voando. | Zero erros. Zero! Você tá voando. | — |
| `gabaritou-04` | [excited] Gabarito perfeito! Eu tô dando pulinhos aqui. | Gabarito perfeito! Eu tô dando pulinhos aqui. | — |
| `gabaritou-05` | [proud] Isso é o resultado de quem estuda direito. Parabéns! | Isso é o resultado de quem estuda direito. Parabéns! | — |

### `notaAlta`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `nota-alta-01` | [happy] Que nota! Mandou muito bem. | Que nota! Mandou muito bem. | — |
| `nota-alta-02` | [impressed] Acima de oitenta? Tá dominando mesmo. | Acima de oitenta? Tá dominando mesmo. | — |
| `nota-alta-03` | [cheerfully] Ótimo resultado! Bora revisar os errinhos e chegar nos cem? | Ótimo resultado! Bora revisar os errinhos e chegar nos cem? | — |
| `nota-alta-04` | [proud] Esse é o ritmo! Continua assim. | Esse é o ritmo! Continua assim. | — |

### `notaMedia`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `nota-media-01` | [encouraging] Bom caminho! Os erros mostram exatamente o que revisar. | Bom caminho! Os erros mostram exatamente o que revisar. | — |
| `nota-media-02` | [warmly] Na média, mas com muito potencial. Quer revisar comigo? | Na média, mas com muito potencial. Quer revisar comigo? | — |
| `nota-media-03` | [thoughtful] Hmm, deu pra ver onde pegou. Bora atacar esses temas? | Hmm, deu pra ver onde pegou. Bora atacar esses temas? | — |

### `notaBaixa`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `nota-baixa-01` | [softly] Não foi dessa vez… mas agora você sabe onde focar. | Não foi dessa vez… mas agora você sabe onde focar. | — |
| `nota-baixa-02` | [encouraging] Nota baixa hoje é nota alta na prova de verdade. Bora revisar? | Nota baixa hoje é nota alta na prova de verdade. Bora revisar? | — |
| `nota-baixa-03` | [warmly] Respira. Todo mundo começa em algum lugar. Eu te ajudo. | Respira. Todo mundo começa em algum lugar. Eu te ajudo. | — |
| `nota-baixa-04` | [encouraging] Quer que eu te explique as que você errou? É o jeito mais rápido de subir. | Quer que eu te explique as que você errou? É o jeito mais rápido de subir. | — |

### `provaIniciada`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `prova-iniciada-01` | [whispers] Boa prova! Vou ficar quietinho aqui. | Boa prova! Vou ficar quietinho aqui. | — |
| `prova-iniciada-02` | [softly] Respira fundo. Você estudou pra isso. | Respira fundo. Você estudou pra isso. | — |
| `prova-iniciada-03` | [whispers] Foco total. Depois a gente comemora. | Foco total. Depois a gente comemora. | — |

## Reações — progresso

### `subiuNivel`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `subiu-nivel-01` | [excited] Subiu de nível! Isso aí! | Subiu de nível! Isso aí! | — |
| `subiu-nivel-02` | [proud] Level up! Seu esforço tá aparecendo. | Level up! Seu esforço tá aparecendo. | — |
| `subiu-nivel-03` | [cheerfully] Novo nível desbloqueado! Bora pro próximo? | Novo nível desbloqueado! Bora pro próximo? | — |
| `subiu-nivel-04` | [impressed] Mais um nível! Tá ficando difícil te acompanhar. | Mais um nível! Tá ficando difícil te acompanhar. | — |

### `novaLiga`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `nova-liga-01` | [gasps] Nova liga! [excited] Você subiu de patamar! | Nova liga! Você subiu de patamar! | — |
| `nova-liga-02` | [dramatically] Bem-vindo à nova liga. O ranking que se cuide. | Bem-vindo à nova liga. O ranking que se cuide. | — |
| `nova-liga-03` | [proud] Liga nova, mesma dedicação. Que orgulho! | Liga nova, mesma dedicação. Que orgulho! | — |

### `sequencia3`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `sequencia3-01` | [happy] Três dias seguidos estudando! O hábito tá nascendo. | Três dias seguidos estudando! O hábito tá nascendo. | — |
| `sequencia3-02` | [cheerfully] Terceiro dia! Constância vence talento. | Terceiro dia! Constância vence talento. | — |

### `sequencia7`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `sequencia7-01` | [excited] Uma semana inteira! Isso é disciplina de verdade. | Uma semana inteira! Isso é disciplina de verdade. | — |
| `sequencia7-02` | [impressed] Sete dias seguidos! Seu cérebro tá agradecendo. | Sete dias seguidos! Seu cérebro tá agradecendo. | — |
| `sequencia7-03` | [proud] Semana completa! Bora fazer a próxima? | Semana completa! Bora fazer a próxima? | — |

### `sequencia30`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `sequencia30-01` | [gasps] Trinta dias seguidos?! [excited] Você é inspiração! | Trinta dias seguidos?! Você é inspiração! | — |
| `sequencia30-02` | [dramatically] Um mês sem falhar. Isso não é sorte, é caráter. | Um mês sem falhar. Isso não é sorte, é caráter. | — |

### `flashcardsFeitos`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `flashcards-01` | [cheerfully] Revisão feita! Sua memória agradece. | Revisão feita! Sua memória agradece. | — |
| `flashcards-02` | [happy] Cartinhas concluídas! Repetição espaçada é ciência pura. | Cartinhas concluídas! Repetição espaçada é ciência pura. | — |
| `flashcards-03` | [playfully] Mais um deck domado. Próximo! | Mais um deck domado. Próximo! | — |
| `flashcards-04` | [proud] Fez a revisão do dia. Isso é o que separa quem lembra de quem esquece. | Fez a revisão do dia. Isso é o que separa quem lembra de quem esquece. | — |

### `revisaoEmDia`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `revisao-em-dia-01` | [happy] Revisões em dia! Pode dormir tranquilo hoje. | Revisões em dia! Pode dormir tranquilo hoje. | — |
| `revisao-em-dia-02` | [cheerfully] Zerou a fila! Missão cumprida. | Zerou a fila! Missão cumprida. | — |

### `aulaConcluida`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `aula-01` | [happy] Aula concluída! Quer que eu te faça umas perguntas sobre ela? | Aula concluída! Quer que eu te faça umas perguntas sobre ela? | — |
| `aula-02` | [cheerfully] Assistiu até o fim! Agora fixa com umas questões? | Assistiu até o fim! Agora fixa com umas questões? | — |

### `focoConcluido`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `foco-01` | [proud] Sessão de foco concluída! Seu cérebro mereceu um descanso. | Sessão de foco concluída! Seu cérebro mereceu um descanso. | — |
| `foco-02` | [happy] Foco total! Bebe uma água e volta. | Foco total! Bebe uma água e volta. | — |
| `foco-03` | [impressed] Que concentração! Pomodoro de respeito. | Que concentração! Pomodoro de respeito. | — |

### `questaoDoDia`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `questao-do-dia-01` | [curious] A questão do dia tá te esperando. Topa o desafio? | A questão do dia tá te esperando. Topa o desafio? | — |
| `questao-do-dia-02` | [playfully] Uma questãozinha por dia mantém a reprovação longe. | Uma questãozinha por dia mantém a reprovação longe. | — |

### `voltouDepoisDeSumir`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `sumiu-01` | [surprised] Ei, sumido! Senti sua falta. | Ei, sumido! Senti sua falta. | — |
| `sumiu-02` | [warmly] Que bom que voltou! Bora retomar devagarinho? | Que bom que voltou! Bora retomar devagarinho? | — |
| `sumiu-03` | [playfully] Achei que tinha me trocado por outro mascote! [laughs] | Achei que tinha me trocado por outro mascote! | — |

### `estudandoTarde`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tarde-da-noite-01` | [whispers] Ainda acordado? Admiro… mas dorme logo, tá? | Ainda acordado? Admiro… mas dorme logo, tá? | — |
| `tarde-da-noite-02` | [softly] Revisão noturna é ótima. Só não esquece de descansar. | Revisão noturna é ótima. Só não esquece de descansar. | — |

### `xpGanho`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `xp-01` | [cheerfully] Mais XP no bolso! | Mais XP no bolso! | — |
| `xp-02` | [happy] Isso! Pontinhos subindo. | Isso! Pontinhos subindo. | — |
| `xp-03` | [playfully] Ding! Experiência adquirida. | Ding! Experiência adquirida. | — |
| `xp-04` | [proud] Cada XP é um passo. Continua! | Cada XP é um passo. Continua! | — |

### `compraFeita`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `compra-01` | [excited] Ebaaa, material novo! Bora estudar ele juntos? | Ebaaa, material novo! Bora estudar ele juntos? | — |
| `compra-02` | [happy] Ótima escolha! E olha: comigo do lado, você aproveita o dobro. | Ótima escolha! E olha: comigo do lado, você aproveita o dobro. | — |
| `compra-03` | [cheerfully] Compra feita! Ah, e agora eu fico liberado pra você por sete dias. | Compra feita! Ah, e agora eu fico liberado pra você por sete dias. | — |
| `compra-04` | [proud] Investir no próprio estudo é o melhor investimento. Parabéns! | Investir no próprio estudo é o melhor investimento. Parabéns! | — |

## Páginas (vitrines e leitor)

### `paginaMateriais`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `materiais-01` | [curious] Procurando o material certo? Me fala o tema que eu acho pra você. | Procurando o material certo? Me fala o tema que eu acho pra você. | — |
| `materiais-02` | [playfully] Esses resumos foram feitos por quem já passou pelo mesmo sufoco que você. | Esses resumos foram feitos por quem já passou pelo mesmo sufoco que você. | — |
| `materiais-03` | [warmly] Dica de amigo: o material do seu período economiza horas de caça a PDF. | Dica de amigo: o material do seu período economiza horas de caça a PDF. | — |
| `materiais-04` | [cheerfully] Comprou um material? Eu fico liberado pra te ajudar com ele por sete dias! | Comprou um material? Eu fico liberado pra te ajudar com ele por sete dias! | — |
| `materiais-05` | [chuckles] Estudar sem material bom é como auscultar sem estetoscópio. | Estudar sem material bom é como auscultar sem estetoscópio. | — |

### `paginaPacotes`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `pacotes-01` | [curious] Pacote sai bem mais em conta que comprar um por um. Já fez a conta? | Pacote sai bem mais em conta que comprar um por um. Já fez a conta? | — |
| `pacotes-02` | [playfully] O pacote é tipo combo: mais conteúdo, menos gasto. | O pacote é tipo combo: mais conteúdo, menos gasto. | — |
| `pacotes-03` | [warmly] Se você vai estudar o período inteiro, o pacote é o caminho mais esperto. | Se você vai estudar o período inteiro, o pacote é o caminho mais esperto. | — |

### `paginaPlanos`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `planos-01` | [warmly] Com o Plus+ você leva a plataforma inteira… e eu junto, claro. | Com o Plus+ você leva a plataforma inteira… e eu junto, claro. | — |
| `planos-02` | [curious] Dúvida entre os planos? O Quest+ é o Banco de Questões completo; o Plus+ é tudo. | Dúvida entre os planos? O Quest+ é o Banco de Questões completo; o Plus+ é tudo. | — |
| `planos-03` | [playfully] Pensa assim: é menos que um lanche por dia pra estudar com tudo liberado. | Pensa assim: é menos que um lanche por dia pra estudar com tudo liberado. | — |
| `planos-04` | [cheerfully] Assinante tem flashcards e provas com IA. E tem eu, o tempo todo. | Assinante tem flashcards e provas com IA. E tem eu, o tempo todo. | — |
| `planos-05` | [warmly] Sem pressão, tá? Mas quem assina costuma se perguntar por que não assinou antes. | Sem pressão, tá? Mas quem assina costuma se perguntar por que não assinou antes. | — |

### `paginaLeitor`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `leitor-01` | [curious] Lendo com atenção? Se travar, me chama aqui. | Lendo com atenção? Se travar, me chama aqui. | — |
| `leitor-02` | [playfully] Dica: grifa o que é pegadinha de prova. Eu te ajudo a achar. | Dica: grifa o que é pegadinha de prova. Eu te ajudo a achar. | — |
| `leitor-03` | [warmly] Terminou um capítulo? Me pede pra te testar. | Terminou um capítulo? Me pede pra te testar. | — |

## Landing — passeio guiado (em ordem)

### `landingConvite`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-convite-01` | [playfully] Psiu! Toca em mim que eu te mostro tudo. | Psiu! Toca em mim que eu te mostro tudo. | — |
| `landing-convite-02` | [cheerfully] Quer um tour rapidinho? Toca aqui! | Quer um tour rapidinho? Toca aqui! | — |
| `landing-convite-03` | [curious] Eu explico a DomineAqui em um minuto. Topa? | Eu explico a DomineAqui em um minuto. Topa? | — |

### `landingOla`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-ola-01` | [excited] Oi! Eu sou o Dom, o mascote e a inteligência artificial da DomineAqui. [pause] Vem comigo que eu te mostro por que tanta gente da saúde estuda aqui. | Oi! Eu sou o Dom, o mascote e a inteligência artificial da DomineAqui. Vem comigo que eu te mostro por que tanta gente da saúde estuda aqui. | — |
| `landing-ola-02` | [warmly] Prazer, eu sou o Dom! [pause] Em um minutinho você vai entender como estudar menos tempo e aprender mais. Bora? | Prazer, eu sou o Dom! Em um minutinho você vai entender como estudar menos tempo e aprender mais. Bora? | — |

### `landingQuestoes`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-questoes-01` | [excited] Aqui tem milhares de questões comentadas, por curso e por período. [pause] Errou? A explicação mostra o porquê na hora. | Aqui tem milhares de questões comentadas, por curso e por período. Errou? A explicação mostra o porquê na hora. | — |
| `landing-questoes-02` | [cheerfully] O Banco de Questões é o seu treino diário: você vê o seu desempenho e sabe exatamente o que revisar. | O Banco de Questões é o seu treino diário: você vê o seu desempenho e sabe exatamente o que revisar. | — |

### `landingFlashcards`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-flashcards-01` | [playfully] Flashcards com repetição espaçada: a plataforma lembra por você quando é hora de revisar. [chuckles] Esquecer fica difícil. | Flashcards com repetição espaçada: a plataforma lembra por você quando é hora de revisar. Esquecer fica difícil. | — |
| `landing-flashcards-02` | [cheerfully] E dá pra gerar flashcards com IA a partir do que você estuda. Em segundos. | E dá pra gerar flashcards com IA a partir do que você estuda. Em segundos. | — |

### `landingManual`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-manual-01` | [impressed] O Manual Clínico junta patologias, farmacologia, ECG, exames, radiologia e anatomia em 3D. [pause] É o plantão inteiro no bolso. | O Manual Clínico junta patologias, farmacologia, ECG, exames, radiologia e anatomia em 3D. É o plantão inteiro no bolso. | — |
| `landing-manual-02` | [warmly] Precisa de uma dose, um escore ou um valor de referência? Tá tudo aqui, organizado do jeito que se estuda. | Precisa de uma dose, um escore ou um valor de referência? Tá tudo aqui, organizado do jeito que se estuda. | — |

### `landingMateriais`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-materiais-01` | [cheerfully] Os materiais são resumos caprichados para cada período, feitos por quem já viveu a faculdade. | Os materiais são resumos caprichados para cada período, feitos por quem já viveu a faculdade. | — |
| `landing-materiais-02` | [playfully] Chega de caçar PDF perdido no grupo da turma. [laughs] | Chega de caçar PDF perdido no grupo da turma. | — |

### `landingDom`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-dom-01` | [proud] E eu! Tiro suas dúvidas com fontes atualizadas, te levo pra qualquer parte do site… [pause] e viro Sócrates pra te fazer pensar como médico. | E eu! Tiro suas dúvidas com fontes atualizadas, te levo pra qualquer parte do site… e viro Sócrates pra te fazer pensar como médico. | — |
| `landing-dom-02` | [excited] Comigo você não só lê a resposta: você entende o porquê do porquê. | Comigo você não só lê a resposta: você entende o porquê do porquê. | — |

### `landingPlanos`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-planos-01` | [warmly] Dá pra começar de graça. E quando quiser tudo liberado, o Plus+ abre a plataforma inteira. | Dá pra começar de graça. E quando quiser tudo liberado, o Plus+ abre a plataforma inteira. | — |
| `landing-planos-02` | [curious] O Quest+ é para quem quer focar no Banco de Questões. O Plus+ é para quem quer tudo, inclusive eu. | O Quest+ é para quem quer focar no Banco de Questões. O Plus+ é para quem quer tudo, inclusive eu. | — |

### `landingFim`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `landing-fim-01` | [excited] É isso! Cria sua conta e vem estudar comigo. Eu tô te esperando lá dentro! | É isso! Cria sua conta e vem estudar comigo. Eu tô te esperando lá dentro! | — |
| `landing-fim-02` | [warmly] Gostou? Então bora! Seu eu do futuro vai te agradecer. | Gostou? Então bora! Seu eu do futuro vai te agradecer. | — |

## Tour do site (em ordem)

### `tourOla`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tour-ola-01` | [excited] Bem-vindo à DomineAqui! Eu sou o Dom e vou te mostrar onde fica tudo. Leva só um minutinho. | Bem-vindo à DomineAqui! Eu sou o Dom e vou te mostrar onde fica tudo. Leva só um minutinho. | — |
| `tour-ola-02` | [warmly] Chegou! Deixa eu te apresentar a casa rapidinho. | Chegou! Deixa eu te apresentar a casa rapidinho. | — |

### `tourMenu`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tour-menu-01` | [cheerfully] Aqui no menu ficam todas as áreas: provas, questões, flashcards, manuais e materiais. | Aqui no menu ficam todas as áreas: provas, questões, flashcards, manuais e materiais. | — |

### `tourBusca`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tour-busca-01` | [playfully] Essa é a busca. Digita qualquer coisa: uma doença, um remédio, uma página. Ela acha. | Essa é a busca. Digita qualquer coisa: uma doença, um remédio, uma página. Ela acha. | — |

### `tourFoco`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tour-foco-01` | [warmly] O modo foco cronometra seu estudo e conta no seu desempenho. Ótimo pra criar hábito. | O modo foco cronometra seu estudo e conta no seu desempenho. Ótimo pra criar hábito. | — |

### `tourXp`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tour-xp-01` | [excited] Tudo o que você estuda vira XP. Sobe de nível, muda de liga e aparece no ranking! | Tudo o que você estuda vira XP. Sobe de nível, muda de liga e aparece no ranking! | — |

### `tourDom`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tour-dom-01` | [proud] E aqui no cantinho fico eu. Me chama sempre que precisar de ajuda. | E aqui no cantinho fico eu. Me chama sempre que precisar de ajuda. | — |

### `tourFim`

| id | texto para o ElevenLabs | balão | gravada |
|---|---|---|---|
| `tour-fim-01` | [cheerfully] Pronto! Agora você já conhece a casa. Bora estudar? | Pronto! Agora você já conhece a casa. Bora estudar? | — |
| `tour-fim-02` | [excited] Tour concluído! Qualquer dúvida, é só tocar em mim. | Tour concluído! Qualquer dúvida, é só tocar em mim. | — |
