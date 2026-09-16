import type { Sinal } from './esquemas'

/**
 * Sinais neurológicos e abdominais do exame físico. Os neurológicos são quase
 * todos **manobras** — o achado é o que acontece quando se pede algo ao
 * paciente —, e a figura de cada ficha desenha a manobra, não o cérebro. Os
 * abdominais dividem-se entre os que se veem (equimoses de Grey Turner e
 * Cullen) e os que se sentem (defesa, massa, víscera abaixo do rebordo).
 */
export const SINAIS_NEURO_ABDOME: Sinal[] = [
  // ─── Neurológico ─────────────────────────────────────────────────────────

  {
    slug: 'anisocoria-nao-reativa',
    nome: 'Anisocoria com pupila não reativa',
    sinonimos: ['Pupila fixa e dilatada', 'Midríase paralítica unilateral', 'Pupila de Hutchinson'],
    sistema: 'neurologico',
    resumo: 'Uma pupila maior que a outra e que não se fecha à luz — o III nervo comprimido, e o tempo contado em minutos quando a consciência cai junto.',
    definicao:
      'Diferença de diâmetro entre as pupilas (> 1 mm) em que a pupila maior responde pouco ou nada à luz direta e consensual, enquanto a menor responde normalmente. Distingue-se da anisocoria fisiológica (diferença ≤ 1 mm, igual no claro e no escuro, ambas reativas) e da de Horner (a pupila menor é a anormal, com ptose discreta, e a diferença aumenta no escuro).',
    comoProcurar: [
      { passo: 'Meça as duas pupilas com luz ambiente, depois no escuro e depois com luz forte.', detalhe: 'Anisocoria maior no claro: a pupila grande é a doente (não contrai). Maior no escuro: a pequena é a doente (não dilata — Horner).' },
      { passo: 'Ilumine cada olho e observe a resposta direta e a consensual.', detalhe: 'Pupila que não contrai nem com luz direta nem quando o outro olho é iluminado tem a via eferente (III nervo) lesada.' },
      { passo: 'Procure ptose e desvio do olho para fora e para baixo.', detalhe: 'Ptose completa e olho "para fora e para baixo" com a pupila dilatada é paralisia completa do III nervo, com a pupila envolvida — compressiva até prova em contrário.' },
      { passo: 'Avalie o nível de consciência e pergunte sobre colírios e trauma.', detalhe: 'Coma com pupila dilatada é herniação. Paciente lúcido, sem ptose, com uma pupila enorme e nada mais, é midríase farmacológica ou pupila de Adie.' },
    ],
    mecanismo:
      'As fibras parassimpáticas que contraem a pupila viajam na periferia do III nervo, logo abaixo da tenda do cerebelo e ao lado do unco do lobo temporal. Uma massa supratentorial que se expande (hematoma, edema, tumor) empurra o unco contra o nervo, e as fibras pupilares, superficiais, são as primeiras esmagadas: a pupila dilata e para de reagir antes que a motricidade ocular se perca. Aneurisma da comunicante posterior faz o mesmo por contato direto. A isquemia microvascular do nervo (diabetes), ao contrário, atinge o centro e poupa a periferia — paralisia do III com pupila normal. É por isso que a pupila decide entre urgência e ambulatório.',
    significado:
      'Em paciente com rebaixamento da consciência ou trauma craniano, pupila dilatada e fixa unilateral é herniação uncal em curso: tomografia e neurocirurgia agora, hiperventilação e osmoterapia como ponte. Em paciente lúcido com dor de cabeça e paralisia do III nervo com pupila acometida, é aneurisma até angiotomografia negativa. Sem ptose, sem dor, sem outro achado, a causa costuma ser benigna (colírio, Adie) — mas a decisão de não investigar exige que todo o resto do exame esteja normal.',
    armadilhas: [
      'Anisocoria fisiológica (até 20% das pessoas) tem as duas pupilas reativas e a mesma diferença no claro e no escuro. Não é o sinal.',
      'Midríase por colírio (atropina, tropicamida), escopolamina transdérmica ou planta manipulada é a causa mais comum de pupila fixa em paciente lúcido. Pergunte.',
      'Prótese ocular, cirurgia de catarata e trauma de íris deixam pupilas irregulares e fixas por causa local.',
      'Horner inverte o raciocínio: a pupila anormal é a pequena. Errar o lado erra o diagnóstico inteiro.',
    ],
    causas: [
      { titulo: 'Compressão do III nervo — emergência', mecanismo: 'Fibras pupilares periféricas esmagadas primeiro.', itens: ['Herniação uncal (hematoma, edema, tumor)', 'Aneurisma da artéria comunicante posterior', 'Tumor ou lesão de seio cavernoso'] },
      { titulo: 'Causas benignas ou locais', mecanismo: 'Bloqueio farmacológico ou lesão do gânglio ciliar ou da íris.', itens: ['Midriáticos tópicos e escopolamina', 'Pupila tônica de Adie', 'Trauma da íris, cirurgia ocular', 'Glaucoma agudo (pupila média, fixa, olho vermelho e duro)'] },
    ],
    ilustracao: { id: 'pupilas', params: { cena: 'anisocoria-nao-reativa', diferenca: 4 }, alt: 'Dois pares de olhos, com a pupila esquerda dilatada e sem resposta à luz' },
    patologias: ['hemorragia-subaracnoidea', 'traumatismo-cranioencefalico'],
    referencias: ['Bradley WG et al. Neurology in Clinical Practice, 8ª ed.', 'Kawasaki A. Physiology, assessment, and disorders of the pupil. Curr Opin Ophthalmol, 1999.'],
  },
  {
    slug: 'deficit-de-campo-visual-por-confrontacao',
    nome: 'Déficit do campo visual por confrontação',
    sinonimos: ['Campimetria de confrontação alterada', 'Perda de campo visual'],
    sistema: 'neurologico',
    resumo: 'O paciente olha para o seu nariz e não vê os dedos que se mexem num canto — o exame de um minuto que localiza a lesão da retina ao lobo occipital.',
    definicao:
      'Incapacidade de perceber um estímulo (dedos que se movem, contagem de dedos ou alfinete vermelho) em um quadrante ou hemicampo, com o olhar fixo, enquanto o examinador, com o campo sobreposto, o percebe. Descreve-se por olho e por quadrante: o padrão (um olho, os dois, homônimo, heterônimo, altitudinal) é o que localiza.',
    comoProcurar: [
      { passo: 'Sente-se a um metro do paciente, olho no olho, cada um cobrindo o olho oposto.', detalhe: 'Seu campo serve de referência: o que você vê, ele deveria ver.' },
      { passo: 'Apresente os dedos nos quatro quadrantes, a meio caminho entre vocês, e peça para contar ou apontar o movimento.', detalhe: 'Comece pela periferia e traga para o centro. Teste cada olho separadamente — sem isso não se distingue lesão pré de pós-quiasmática.' },
      { passo: 'Apresente estímulos simultâneos nos dois hemicampos.', detalhe: 'Perceber cada um sozinho e não perceber o do lado quando os dois aparecem é extinção visual — lesão parietal, campo formalmente íntegro.' },
      { passo: 'Desenhe o que achou.', detalhe: 'Dois círculos, um por olho, com a área perdida sombreada. O desenho é o achado; "campo alterado" não é.' },
    ],
    mecanismo:
      'A via visual é um mapa: a retina nasal de cada olho cruza no quiasma; a temporal segue do mesmo lado. Atrás do quiasma, cada hemisfério vê o hemicampo oposto dos dois olhos. Por isso lesão de um olho ou de um nervo óptico dá defeito monocular; lesão do quiasma (adenoma de hipófise) dá perda dos dois campos temporais (heterônima bitemporal); lesão atrás do quiasma dá perda do mesmo hemicampo nos dois olhos (homônima), e a fidelidade entre os dois olhos aumenta quanto mais posterior a lesão. As fibras do quadrante superior passam pelo lobo temporal (alça de Meyer) e as do inferior pelo parietal — o quadrante localiza o lobo.',
    significado:
      'Défice homônimo de instalação súbita é AVC até prova em contrário e, com a hora do início, define elegibilidade para trombólise ou trombectomia. Perda bitemporal é tumor de hipófise. Défice monocular é olho ou nervo óptico — neurite, oclusão vascular, glaucoma, descolamento. O exame de confrontação é grosseiro, mas é o único que se faz na emergência, e um defeito que ele detecta é grande o bastante para importar: quem não vê o hemicampo esquerdo não pode dirigir e vai colidir com portas.',
    armadilhas: [
      'Testar com os dois olhos abertos esconde defeitos monoculares e confunde a localização.',
      'Paciente que move o olhar para o estímulo "vê" tudo. Mantenha a fixação no seu nariz.',
      'Negligência espacial (parietal direito) simula hemianopsia esquerda; a extinção ao estímulo duplo com campo íntegro no estímulo isolado desfaz a confusão.',
      'A confrontação perde escotomas pequenos e defeitos periféricos; se a suspeita é forte e o exame negativo, campimetria formal.',
    ],
    causas: [
      { titulo: 'Retroquiasmático (homônimo)', mecanismo: 'Lesão do trato, radiações ou córtex de um hemisfério.', itens: ['AVC de artéria cerebral posterior ou média', 'Tumor, abscesso, hematoma', 'Enxaqueca com aura (transitório)'] },
      { titulo: 'Quiasma (bitemporal)', mecanismo: 'Compressão das fibras nasais cruzadas.', itens: ['Adenoma de hipófise', 'Craniofaringioma', 'Meningioma'] },
      { titulo: 'Pré-quiasmático (monocular)', mecanismo: 'Olho ou nervo óptico.', itens: ['Neurite óptica', 'Oclusão de artéria ou veia da retina', 'Descolamento de retina', 'Glaucoma', 'Neuropatia óptica isquêmica'] },
    ],
    desempenho: [
      { alvo: 'Defeito de campo à perimetria formal', sensibilidade: '~35–70% (maior para defeitos homônimos e com estímulo vermelho)', especificidade: '~95%', leitura: 'Confrontação positiva vale; negativa não afasta escotomas pequenos.', fonte: 'Kerr NM et al. Diagnostic accuracy of confrontation visual field tests. Neurology, 2010.' },
    ],
    ilustracao: { id: 'face', params: { achado: 'campo-confrontacao', valor: 25 }, alt: 'Dois campos visuais desenhados como círculos, com um quadrante escurecido' },
    patologias: ['acidente-vascular-cerebral-isquemico'],
    referencias: ['Kerr NM et al. Neurology, 2010.', 'Campbell WW. DeJong’s The Neurologic Examination, 8ª ed.'],
  },
  {
    slug: 'hemianopsia-homonima',
    nome: 'Hemianopsia homônima',
    sinonimos: ['Perda de hemicampo', 'Hemianopsia'],
    sistema: 'neurologico',
    resumo: 'Metade do mundo desaparece nos dois olhos ao mesmo tempo — a lesão está atrás do quiasma, e quase sempre é um AVC.',
    definicao:
      'Perda de um hemicampo visual (direito ou esquerdo) em ambos os olhos, com respeito à linha vertical que passa pelo ponto de fixação. Congruente (idêntica nos dois olhos) quando a lesão é occipital; incongruente quando é do trato óptico. Pode poupar a mácula (visão central preservada) nas lesões occipitais com dupla irrigação.',
    comoProcurar: [
      { passo: 'Campimetria de confrontação, olho por olho, quadrante por quadrante.', detalhe: 'O que define hemianopsia é a perda do mesmo lado nos dois olhos. Sem testar cada olho, não se sabe se é homônima.' },
      { passo: 'Verifique o respeito ao meridiano vertical.', detalhe: 'Defeitos neurológicos param na linha vertical do centro; os de retina não respeitam meridiano nenhum.' },
      { passo: 'Observe o comportamento: esbarra em objetos de um lado? Lê só metade da linha? Deixa comida de um lado do prato?', detalhe: 'O paciente muitas vezes não sabe que perdeu o campo — atribui a "ver mal".' },
      { passo: 'Procure os vizinhos: hemiparesia, afasia, negligência.', detalhe: 'Hemianopsia com hemiparesia do mesmo lado é artéria cerebral média; isolada, é cerebral posterior.' },
    ],
    mecanismo:
      'Depois do quiasma, as fibras que carregam o hemicampo direito dos dois olhos seguem juntas pelo trato óptico esquerdo, pelo corpo geniculado, pelas radiações e até o córtex occipital esquerdo. Uma lesão em qualquer ponto desse trajeto apaga o hemicampo direito nos dois olhos. Quanto mais posterior a lesão, mais as fibras dos dois olhos estão misturadas ponto a ponto, e mais idêntico (congruente) é o defeito. A mácula ocupa metade do córtex occipital e recebe sangue também da cerebral média — daí a "poupança macular" no infarto de cerebral posterior, que a lesão do trato não tem.',
    significado:
      'Hemianopsia súbita é AVC até prova em contrário, e a hora do início conta para trombólise mesmo quando não há déficit motor. Hemianopsia isolada com poupança macular localiza na cerebral posterior; com hemiparesia e afasia, na cerebral média. Fora da urgência, hemianopsia é incapacitante: impede dirigir, atrapalha a leitura e causa quedas, e a reabilitação (treino de busca visual) precisa começar cedo. Em criança, hemianopsia progressiva é tumor.',
    armadilhas: [
      'Negligência hemiespacial imita hemianopsia esquerda; a extinção ao estímulo duplo a distingue.',
      'Lesão bilateral occipital dá cegueira cortical com pupilas normais e, às vezes, negação da cegueira (Anton). Não é "histeria".',
      'Hemianopsia pode ser o único sinal de um AVC occipital — sem hemiparesia, o paciente vai para o oftalmologista em vez da emergência.',
      'Enxaqueca com aura visual produz hemianopsia transitória de minutos; se durar mais de uma hora ou não tiver cefaleia típica, trate como AVC.',
    ],
    causas: [
      { titulo: 'Vascular', mecanismo: 'Infarto ou hemorragia na via visual retroquiasmática.', itens: ['Infarto de artéria cerebral posterior', 'Infarto de artéria cerebral média (radiações)', 'Hemorragia occipital ou temporoparietal'] },
      { titulo: 'Estrutural', mecanismo: 'Compressão ou infiltração.', itens: ['Glioma, metástase', 'Abscesso', 'Malformação arteriovenosa'] },
      { titulo: 'Transitória', mecanismo: 'Disfunção cortical reversível.', itens: ['Enxaqueca com aura', 'Crise epiléptica occipital', 'Encefalopatia posterior reversível'] },
    ],
    ilustracao: { id: 'face', params: { achado: 'hemianopsia', valor: 45 }, alt: 'Dois campos visuais com a metade direita de ambos escurecida' },
    patologias: ['acidente-vascular-cerebral-isquemico'],
    referencias: ['Zhang X et al. Homonymous hemianopias: clinical-anatomic correlations in 904 cases. Neurology, 2006.', 'Campbell WW. DeJong’s The Neurologic Examination, 8ª ed.'],
  },
  {
    slug: 'desvio-de-lingua',
    nome: 'Desvio de língua',
    sinonimos: ['Paralisia do hipoglosso', 'Lesão do XII nervo', 'Língua que aponta o lado da lesão'],
    sistema: 'neurologico',
    resumo: 'A língua sai da boca e vai para um lado — e aponta para o nervo doente. Com atrofia e fasciculações, é o nervo; sem elas, é o cérebro.',
    definicao:
      'Ao protruir a língua, a ponta se desvia da linha média para um lado, de forma consistente. Na lesão do nervo hipoglosso (periférica) há atrofia, fasciculações e desvio para o lado da lesão; na lesão do neurônio motor superior (AVC), o desvio é para o lado oposto ao hemisfério lesado, sem atrofia, e costuma vir com paralisia facial central do mesmo lado do desvio.',
    comoProcurar: [
      { passo: 'Peça para abrir a boca e olhe a língua em repouso, no assoalho.', detalhe: 'Atrofia (sulcos, metade menor) e fasciculações (ondulações finas sob a mucosa) se veem em repouso, não na protrusão — protruir gera tremor que imita fasciculação.' },
      { passo: 'Peça para colocar a língua para fora, reta.', detalhe: 'A ponta vai para o lado fraco. Use o filtro do incisivo central como referência da linha média.' },
      { passo: 'Peça para empurrar a bochecha de cada lado contra o seu dedo.', detalhe: 'Testa a força de cada metade separadamente: a língua empurra a bochecha oposta com o músculo do lado contrário.' },
      { passo: 'Some ao resto: face, fala, deglutição, membros.', detalhe: 'Desvio com paralisia facial central e hemiparesia é AVC; desvio isolado com atrofia é lesão do nervo — base do crânio, pescoço.' },
    ],
    mecanismo:
      'Cada hipoglosso inerva os músculos da metade ipsilateral da língua. O genioglosso, principal protrusor, puxa a língua para a frente e para o lado oposto ao seu próprio lado — quando os dois trabalham, a língua sai reta. Se o genioglosso de um lado está paralisado, só o outro puxa, e a ponta vai para o lado fraco. No neurônio motor superior, a inervação cortical do núcleo do XII é sobretudo cruzada: lesão do hemisfério esquerdo enfraquece a metade direita da língua, que desvia para a direita — o mesmo lado da hemiparesia. A atrofia e as fasciculações só aparecem quando o neurônio motor inferior ou o nervo estão lesados, porque dependem da perda da inervação trófica.',
    significado:
      'É um dos sinais que localizam: desvio + atrofia + fasciculações unilaterais aponta lesão do XII no seu trajeto (tumor de base de crânio, dissecção de carótida, metástase, trauma cirúrgico do pescoço); bilateral com fasciculações é doença do neurônio motor. Desvio sem atrofia com hemiparesia é AVC e faz parte da avaliação de déficit agudo. Fora do neurológico, a língua desviada explica disartria e disfagia e alerta para risco de aspiração.',
    armadilhas: [
      'Paralisia facial periférica desvia a boca e faz a língua parecer desviada. Use os incisivos, não os lábios, como linha média.',
      'Tremor da língua protruída é normal; fasciculação se vê com a língua em repouso no assoalho.',
      'Desvio discreto e inconstante em pessoa sadia não é sinal. Precisa ser reprodutível.',
      'Na paralisia bilateral a língua não desvia — não sai. É "língua presa", com disartria grave.',
    ],
    causas: [
      { titulo: 'Nervo hipoglosso (com atrofia)', mecanismo: 'Lesão do neurônio motor inferior ou do nervo.', itens: ['Tumor de base de crânio, glomo, metástase', 'Dissecção de carótida interna', 'Lesão cirúrgica (endarterectomia, esvaziamento cervical)', 'Trauma e fratura de côndilo occipital', 'Esclerose lateral amiotrófica (bilateral)'] },
      { titulo: 'Neurônio motor superior (sem atrofia)', mecanismo: 'Lesão cortical ou capsular contralateral.', itens: ['AVC de artéria cerebral média', 'Tumor hemisférico', 'Paralisia pseudobulbar (bilateral)'] },
    ],
    ilustracao: { id: 'face', params: { achado: 'desvio-lingua', valor: 15 }, alt: 'Boca aberta com a língua protruída e desviada para a direita' },
    patologias: ['acidente-vascular-cerebral-isquemico'],
    referencias: ['Campbell WW. DeJong’s The Neurologic Examination, 8ª ed.', 'Keane JR. Twelfth-nerve palsy: analysis of 100 cases. Arch Neurol, 1996.'],
  },
  {
    slug: 'pronator-drift',
    nome: 'Pronator drift (queda em pronação)',
    sinonimos: ['Sinal de Barré dos membros superiores', 'Desvio pronador', 'Prova dos braços estendidos'],
    sistema: 'neurologico',
    resumo: 'Braços estendidos, olhos fechados, e um deles gira para dentro e desce sozinho — o déficit piramidal que a força "5/5" não mostra.',
    definicao:
      'Com os braços estendidos à frente, palmas para cima e olhos fechados por 20 a 30 segundos, um braço prona (a palma gira para dentro) e desce, enquanto o outro se mantém. Pronação com queda é lesão do trato corticoespinhal; queda sem pronação ou elevação com desvio lateral sugere outra coisa (cerebelo, propriocepção, fraqueza não orgânica).',
    comoProcurar: [
      { passo: 'Braços estendidos à frente, à altura dos ombros, palmas para cima, dedos abertos.', detalhe: 'Supinação completa é o que sensibiliza: os pronadores só precisam vencer um pouco para girar a mão.' },
      { passo: 'Olhos fechados, 20 a 30 segundos.', detalhe: 'Com os olhos abertos o paciente corrige pela visão. Sem o tempo, o déficit sutil não aparece.' },
      { passo: 'Observe o que acontece primeiro: pronação ou queda.', detalhe: 'Piramidal: prona e depois cai, com flexão do cotovelo. Cerebelar: sobe e oscila. Proprioceptivo: dedos "tocam piano" (pseudoatetose).' },
      { passo: 'Bata de leve nos dois braços de cima para baixo.', detalhe: 'O braço parético afunda e volta devagar ou com oscilação; o normal volta imediato. É o "rebote" que amplia o sinal.' },
    ],
    mecanismo:
      'O trato corticoespinhal tem preferência pelos músculos que o ser humano usa contra a gravidade e com precisão: extensores e supinadores do braço, entre eles. Quando a via piramidal é parcialmente lesada, esses músculos perdem força antes dos flexores e pronadores, que têm mais entrada de outras vias (reticuloespinal) e se tornam relativamente dominantes. Sem a visão para corrigir, o braço cede no sentido em que a assimetria empurra: prona, flexiona, desce. É a mesma assimetria que, quando a lesão é maior, se torna a postura em flexão do hemiplégico.',
    significado:
      'É o teste mais sensível para fraqueza piramidal leve do membro superior — detecta déficits que a força manual gradua como normal. Faz parte da escala de AVC (NIHSS, item de deriva) e, à beira do leito, é o teste rápido para "tem lesão de hemisfério?". Positivo unilateral em quadro agudo: AVC até prova em contrário. Positivo também revela lesão estrutural em paciente com queixa vaga ("mão desajeitada") e serve para acompanhar evolução.',
    armadilhas: [
      'Queda sem pronação, ou dos dois braços, em paciente cansado ou pouco cooperativo não é o sinal.',
      'Braço que sobe e desvia para fora com os olhos fechados sugere lesão cerebelar, não piramidal.',
      'Movimentos irregulares dos dedos (pseudoatetose) são perda proprioceptiva — cordão posterior ou neuropatia grave.',
      'Ombro doloroso ou fraqueza muscular local fazem o braço cair sem pronar. A pronação é a chave.',
    ],
    causas: [
      { titulo: 'Lesão do trato corticoespinhal', mecanismo: 'Perda preferencial de extensores e supinadores.', itens: ['AVC isquêmico ou hemorrágico', 'Tumor hemisférico', 'Esclerose múltipla', 'Hematoma subdural', 'Lesão medular cervical unilateral'] },
    ],
    desempenho: [
      { alvo: 'Lesão hemisférica contralateral', sensibilidade: '~90%', especificidade: '~90%', leitura: 'Entre os testes de triagem do membro superior, é o de melhor rendimento; supera a força manual para déficits sutis.', fonte: 'Teitelbaum JS et al. Pronator drift. Neurology, 2002 (estudo de sensibilidade em lesões de hemisfério).' },
    ],
    ilustracao: { id: 'manobra-neurologica', params: { achado: 'pronator-drift', valor: 15 }, alt: 'Paciente com os braços estendidos e olhos fechados; o braço esquerdo prona e desce' },
    patologias: ['acidente-vascular-cerebral-isquemico'],
    referencias: ['Teitelbaum JS, Eliasziw M, Garner M. Tests of motor function in patients suspected of having mild unilateral cerebral lesions. Can J Neurol Sci, 2002.', 'Campbell WW. DeJong’s The Neurologic Examination, 8ª ed.'],
  },
  {
    slug: 'disartria',
    nome: 'Disartria',
    sinonimos: ['Fala pastosa', 'Fala arrastada', 'Distúrbio da articulação'],
    sistema: 'neurologico',
    resumo: 'As palavras estão certas, a frase faz sentido, mas os sons saem mal formados — o problema é o músculo, não a linguagem.',
    definicao:
      'Alteração da articulação da fala por fraqueza, lentidão, incoordenação ou alteração do tônus dos músculos da fonação, com linguagem preservada: o paciente escolhe as palavras certas, compreende, lê e escreve normalmente. Distingue-se da afasia (erro de linguagem) e da disfonia (alteração da voz na laringe). Classifica-se pelo mecanismo: flácida, espástica, atáxica, hipocinética, hipercinética.',
    comoProcurar: [
      { passo: 'Converse e ouça: a articulação está pastosa? O ritmo está lento, explosivo, monótono?', detalhe: 'Descreva o que ouve antes de rotular. "Fala arrastada com voz nasal" já aponta um tipo.' },
      { passo: 'Peça para repetir frases com consoantes difíceis ("pa-ta-ka" rápido; "o rato roeu a roupa do rei de Roma").', detalhe: 'Testa lábios, língua e palato em sequência. Lentidão e irregularidade aparecem aqui.' },
      { passo: 'Confirme que a linguagem está intacta: nomeação, compreensão de comandos, escrita.', detalhe: 'Se escreve normalmente e obedece a ordens complexas, não é afasia. Este passo é o que separa as duas.' },
      { passo: 'Examine língua, palato, face e reflexo de vômito.', detalhe: 'Atrofia e fasciculação: flácida (neurônio motor inferior). Reflexos exaltados, riso e choro fáceis: espástica (pseudobulbar). Fala escandida e tremor: atáxica.' },
    ],
    mecanismo:
      'Falar exige que lábios, língua, palato, laringe e diafragma se coordenem em milissegundos. Qualquer lesão nesse comando — o neurônio motor inferior (nervos IX, X, XII), a via corticobulbar (bilateralmente, pois os núcleos recebem dos dois hemisférios), o cerebelo (que cronometra) ou os núcleos da base (que graduam) — degrada a execução sem tocar no conteúdo. Por isso a disartria por AVC unilateral costuma ser leve e transitória (o outro hemisfério compensa), e a disartria grave e persistente exige lesão bilateral ou de tronco.',
    significado:
      'Disartria súbita é sintoma de AVC (item da NIHSS) e, isolada ou com "mão desajeitada", localiza lacuna na cápsula interna ou na ponte. Disartria progressiva com fasciculações de língua é doença do neurônio motor; com fala escandida, cerebelo; com voz baixa e monótona, Parkinson. Separá-la da afasia importa para a localização (afasia é cortical, do hemisfério dominante) e para o prognóstico: o disártrico entende tudo e sofre quando tratado como se não entendesse.',
    armadilhas: [
      'Chamar de afasia. O teste é a escrita: o disártrico escreve bem.',
      'Prótese dentária mal ajustada, boca seca, sedação e álcool causam disartria sem lesão. Pergunte e olhe a boca.',
      'Disfonia (voz rouca, soprosa) é laringe — paralisia de prega vocal, não disartria.',
      'Disartria leve por AVC unilateral melhora em dias; sua persistência ou piora pede reavaliação.',
    ],
    causas: [
      { titulo: 'Aguda', mecanismo: 'Lesão vascular ou tóxica do comando motor da fala.', itens: ['AVC (cápsula, ponte, cerebelo, córtex motor)', 'Intoxicação (álcool, benzodiazepínico, fenitoína, lítio)', 'Miastenia gravis (piora com o uso)', 'Botulismo'] },
      { titulo: 'Progressiva', mecanismo: 'Degeneração de neurônio motor, cerebelo ou núcleos da base.', itens: ['Esclerose lateral amiotrófica', 'Doença de Parkinson', 'Ataxias hereditárias', 'Esclerose múltipla', 'Paralisia pseudobulbar vascular'] },
    ],
    ilustracao: { id: 'manobra-neurologica', params: { achado: 'disartria', valor: 50 }, alt: 'Traçado de fala irregular com inteligibilidade parcial; linguagem preservada' },
    patologias: ['acidente-vascular-cerebral-isquemico'],
    referencias: ['Duffy JR. Motor Speech Disorders, 4ª ed.', 'Campbell WW. DeJong’s The Neurologic Examination, 8ª ed.'],
  },
  {
    slug: 'afasia',
    nome: 'Afasia',
    sinonimos: ['Disfasia', 'Distúrbio da linguagem'],
    sistema: 'neurologico',
    resumo: 'O paciente não encontra as palavras, ou fala fluente e sem sentido, ou não entende o que se pede — a linguagem falhou, e o hemisfério dominante é o lugar.',
    definicao:
      'Alteração adquirida da linguagem — produção, compreensão, nomeação, repetição, leitura ou escrita — por lesão cerebral, com aparelho fonador íntegro. Não fluente (de Broca): fala esforçada, telegráfica, compreensão relativamente preservada, o paciente sabe que erra. Fluente (de Wernicke): fala abundante e vazia, com parafasias e neologismos, compreensão ruim, o paciente não sabe que erra. Global: as duas. Anômica: só a nomeação. A repetição separa as corticais (alterada) das transcorticais (preservada).',
    comoProcurar: [
      { passo: 'Ouça a fala espontânea: é fluente? Tem esforço? As palavras existem?', detalhe: 'Fluência é o primeiro eixo. Frases longas e gramaticais com palavras erradas são fluentes; frases de duas palavras com esforço, não fluentes.' },
      { passo: 'Dê comandos de um, dois e três passos ("feche os olhos", "aponte o teto e depois a porta").', detalhe: 'Compreensão é o segundo eixo. Cuidado com comandos que o paciente adivinha pelo contexto.' },
      { passo: 'Peça para nomear objetos comuns e partes deles (relógio, pulseira, ponteiro).', detalhe: 'Nomeação falha em quase toda afasia; as partes menos frequentes falham primeiro.' },
      { passo: 'Peça para repetir uma frase ("nem aqui, nem ali, nem lá").', detalhe: 'Repetição alterada: lesão perissilviana. Preservada: transcortical — a zona da linguagem está isolada, não destruída.' },
      { passo: 'Peça para escrever uma frase e ler uma.', detalhe: 'Afasia afeta a escrita; disartria não. É o teste que separa as duas.' },
    ],
    mecanismo:
      'A linguagem depende de uma rede perissilviana do hemisfério dominante (o esquerdo em quase todos os destros e na maioria dos canhotos): a região frontal inferior (Broca) monta a produção, a temporal posterior (Wernicke) decodifica o que se ouve, o fascículo arqueado as conecta e permite repetir. A artéria cerebral média irriga tudo isso — por isso a afasia é o sinal cortical mais comum do AVC. Lesão anterior poupa a compreensão e tira a fluência; lesão posterior faz o inverso; lesão da conexão mantém as duas e tira a repetição (afasia de condução); infarto extenso apaga tudo.',
    significado:
      'Afasia súbita é AVC de cerebral média esquerda até prova em contrário e pesa na NIHSS. A pontuação no item de linguagem, mais que o déficit motor, prediz a dependência a longo prazo — e a afasia de Wernicke, em que o paciente parece "confuso", é a que mais atrasa o reconhecimento do AVC e a trombólise. Afasia progressiva sem outro déficit é demência frontotemporal ou tumor. Todo tipo de afasia exige adaptar a comunicação: o afásico de Broca entende e sofre; o de Wernicke não entende e não sabe.',
    armadilhas: [
      'Chamar afasia de Wernicke de "confusão mental" ou "delirium". O afásico fluente está alerta, atento e orientado ao ambiente; só a linguagem falha.',
      'Chamar disartria de afasia. O disártrico escreve normalmente.',
      'Mutismo por lesão frontal, depressão grave ou catatonia não é afasia; a linguagem está intacta quando o paciente escreve ou gesticula.',
      'Testar compreensão só com comandos de um passo ("feche os olhos") superestima: o paciente responde ao contexto.',
    ],
    causas: [
      { titulo: 'Aguda', mecanismo: 'Lesão súbita da rede perissilviana dominante.', itens: ['AVC de artéria cerebral média esquerda', 'Hemorragia intraparenquimatosa', 'Crise epiléptica (afasia ictal ou pós-ictal)', 'Enxaqueca com aura (transitória)', 'Trauma craniano'] },
      { titulo: 'Progressiva', mecanismo: 'Destruição ou degeneração lenta.', itens: ['Tumor primário ou metastático', 'Afasia progressiva primária (demência frontotemporal)', 'Doença de Alzheimer (variante logopênica)', 'Encefalite herpética (temporal)'] },
    ],
    ilustracao: { id: 'manobra-neurologica', params: { achado: 'afasia', valor: 30 }, alt: 'Traçado de fala fragmentado com palavras faltando; compreensão de comandos preservada' },
    patologias: ['acidente-vascular-cerebral-isquemico'],
    referencias: ['Damasio AR. Aphasia. N Engl J Med, 1992.', 'Campbell WW. DeJong’s The Neurologic Examination, 8ª ed.'],
  },
  {
    slug: 'marcha-ataxica',
    nome: 'Marcha atáxica',
    sinonimos: ['Marcha ebriosa', 'Marcha cerebelar', 'Ataxia de marcha'],
    sistema: 'neurologico',
    resumo: 'Base larga, passos irregulares, o corpo oscilando como quem bebeu — o cerebelo (ou a propriocepção) deixou de cronometrar os passos.',
    definicao:
      'Marcha com base alargada, passos de comprimento e direção irregulares, oscilação do tronco e dificuldade de andar em linha (calcanhar-ponta), com tendência a desviar ou cair. Cerebelar: a instabilidade existe com os olhos abertos e piora pouco ao fechá-los. Sensitiva (proprioceptiva): o paciente olha os pés, bate com os calcanhares e piora muito ao fechar os olhos (Romberg positivo).',
    comoProcurar: [
      { passo: 'Peça para andar pelo corredor, ir e voltar, e observe base, passo, braços e tronco.', detalhe: 'A base larga é a compensação; a irregularidade do passo é o sinal. Marcha normal tem passos iguais.' },
      { passo: 'Peça para andar calcanhar-ponta numa linha.', detalhe: 'É a manobra mais sensível: ataxia leve, invisível na marcha comum, aparece aqui. Idosos sadios podem ter dificuldade — compare com a idade.' },
      { passo: 'Faça o Romberg: pés juntos, olhos abertos, depois fechados.', detalhe: 'Cai só ao fechar os olhos: propriocepção (cordão posterior, neuropatia). Instável com olhos abertos: cerebelo ou vestíbulo.' },
      { passo: 'Procure ataxia apendicular: dedo-nariz, calcanhar-joelho, diadococinesia.', detalhe: 'Ataxia de marcha sem ataxia dos membros é lesão de vérmis (álcool, tumor de linha média). Com ataxia dos membros, hemisfério cerebelar.' },
    ],
    mecanismo:
      'Andar é uma sequência de quedas controladas: cada passo precisa ser corrigido em tempo real com base em onde o corpo está (propriocepção, vestíbulo, visão) e em quanto cada músculo deve contrair (cerebelo). O cerebelo, sobretudo o vérmis e o lobo anterior, compara o movimento planejado com o executado e ajusta a força e o tempo. Sem ele, os passos saem com força e amplitude erradas — dismetria da marcha — e o tronco oscila; o paciente alarga a base para não cair. Quando o defeito é a informação de entrada (propriocepção perdida), o cerebelo funciona mas não sabe onde os pés estão: a visão substitui, e fechar os olhos derruba o paciente.',
    significado:
      'Ataxia de marcha aguda é urgência: AVC ou hemorragia cerebelar (que pode comprimir o tronco e matar em horas), intoxicação (álcool, fenitoína, lítio), encefalopatia de Wernicke (tratar com tiamina antes de qualquer glicose). Subaguda, sugere tumor de fossa posterior, síndrome paraneoplásica ou esclerose múltipla. Crônica, degeneração alcoólica, ataxias hereditárias ou deficiência de vitamina B12 (sensitiva). A divisão cerebelar × sensitiva pelo Romberg decide se a investigação vai para a cabeça ou para a medula e os nervos.',
    armadilhas: [
      'Vertigem vestibular aguda dá marcha instável com desvio para um lado; o nistagmo e a ausência de dismetria distinguem.',
      'Fraqueza proximal (miopatia) dá marcha anserina, não atáxica; ataxia não é fraqueza.',
      'Hidrocefalia de pressão normal dá marcha "magnética", de pés colados ao chão, com base larga — não é cerebelar.',
      'Cefaleia, vômito e ataxia aguda em hipertenso ou anticoagulado é hemorragia cerebelar até a tomografia; não espere o déficit focal.',
    ],
    causas: [
      { titulo: 'Cerebelar aguda', mecanismo: 'Lesão ou disfunção súbita do cerebelo.', itens: ['AVC ou hemorragia cerebelar', 'Intoxicação (álcool, anticonvulsivantes, lítio)', 'Encefalopatia de Wernicke', 'Cerebelite pós-infecciosa (criança)'] },
      { titulo: 'Cerebelar crônica', mecanismo: 'Degeneração ou lesão progressiva.', itens: ['Degeneração alcoólica do vérmis', 'Tumor de fossa posterior', 'Esclerose múltipla', 'Ataxias hereditárias', 'Síndrome paraneoplásica', 'Hipotireoidismo'] },
      { titulo: 'Sensitiva', mecanismo: 'Propriocepção perdida; piora sem a visão.', itens: ['Deficiência de B12 e degeneração combinada', 'Neuropatia diabética grave', 'Tabes dorsalis', 'Ganglionopatia sensitiva'] },
    ],
    ilustracao: { id: 'manobra-neurologica', params: { achado: 'marcha-ataxica', valor: 20 }, alt: 'Pegadas irregulares de base alargada, oscilando em torno de uma linha' },
    patologias: ['acidente-vascular-cerebral-isquemico'],
    referencias: ['Campbell WW. DeJong’s The Neurologic Examination, 8ª ed.', 'Edlow JA, Newman-Toker D. Using the physical examination to diagnose patients with acute dizziness and vertigo. J Emerg Med, 2016.'],
  },
  {
    slug: 'nistagmo',
    nome: 'Nistagmo',
    sinonimos: ['Movimento oscilatório ocular', 'Nistagmo em ressalto'],
    sistema: 'neurologico',
    resumo: 'Os olhos deslizam para um lado e saltam de volta, repetidamente — e a direção em que saltam, e se ela muda, diz se a doença é do ouvido ou do cérebro.',
    definicao:
      'Oscilação rítmica e involuntária dos olhos, com uma fase lenta (o desvio) e uma fase rápida (a correção), nomeada pela direção da fase rápida. Descreve-se por direção (horizontal, vertical, rotatório), se é espontâneo ou evocado pelo olhar, se muda de direção com o olhar e se é suprimido pela fixação. Periférico: horizontal-rotatório, unidirecional, suprime com a fixação. Central: pode ser vertical, muda de direção com o olhar, não suprime.',
    comoProcurar: [
      { passo: 'Olhe os olhos na posição primária, depois a 30° para cada lado e para cima e para baixo.', detalhe: 'Não peça olhar extremo: nas posições extremas todo mundo tem batidas finas, fisiológicas.' },
      { passo: 'Nomeie pela fase rápida e diga se a direção muda com o olhar.', detalhe: 'Bate sempre para o mesmo lado, mais forte ao olhar para esse lado (lei de Alexander): periférico. Bate para a direita ao olhar à direita e para a esquerda ao olhar à esquerda: central.' },
      { passo: 'Remova a fixação: oftalmoscópio com o outro olho coberto, ou lentes de Frenzel.', detalhe: 'Nistagmo periférico aumenta sem fixação; central não muda. Sem esse passo, o nistagmo periférico leve escapa.' },
      { passo: 'Se há vertigem aguda, faça o HINTS: impulso cefálico, nistagmo, teste de cobertura (skew).', detalhe: 'Impulso cefálico normal + nistagmo que muda de direção + desvio vertical à cobertura = central. O conjunto supera a ressonância precoce para AVC de fossa posterior.' },
    ],
    mecanismo:
      'Os olhos são mantidos estáveis por um equilíbrio entre os dois labirintos e pelo integrador neural do tronco e do cerebelo. Quando um labirinto falha (neurite vestibular), o outro empurra os olhos lentamente para o lado doente; o tronco corrige com uma sacada rápida para o lado são — nistagmo unidirecional, que a fixação visual consegue frear parcialmente. Quando o defeito é no integrador (cerebelo, tronco), os olhos não conseguem manter a posição excêntrica e derivam de volta ao centro, com correção na direção do olhar — o nistagmo evocado que muda de direção. Nistagmo vertical puro exige lesão de tronco ou cerebelo, porque só ali as vias verticais dos dois lados convergem.',
    significado:
      'Em vertigem aguda, a análise do nistagmo (com o HINTS) separa neurite vestibular de AVC de cerebelo ou tronco com mais acurácia que a ressonância nas primeiras 48 horas. Nistagmo que muda de direção, vertical ou não suprimido pela fixação é central e pede imagem e neurologia; unidirecional horizontal-rotatório com impulso cefálico positivo é periférico e se trata em casa. Fora da vertigem, nistagmo novo aponta intoxicação (fenitoína, carbamazepina, álcool), esclerose múltipla, Wernicke ou lesão de fossa posterior.',
    armadilhas: [
      'Batidas finas no olhar extremo (> 40°) são fisiológicas. Teste a 30°.',
      'Nistagmo periférico pode sumir com a fixação e ser chamado de "ausente"; retire a fixação antes de concluir.',
      'Nistagmo posicional benigno (VPPB) só aparece na manobra de Dix-Hallpike, tem latência e fadiga. Em repouso, não há nistagmo.',
      'Um HINTS "periférico" em paciente sem nistagmo espontâneo não vale: o teste foi validado em vertigem aguda contínua com nistagmo.',
    ],
    causas: [
      { titulo: 'Periférico', mecanismo: 'Assimetria labiríntica ou do nervo vestibular.', itens: ['Neurite vestibular', 'Labirintite', 'Doença de Ménière', 'VPPB (posicional)', 'Fístula perilinfática'] },
      { titulo: 'Central', mecanismo: 'Lesão do integrador (tronco, cerebelo) ou das vias vestibulares centrais.', itens: ['AVC de cerebelo ou tronco', 'Esclerose múltipla', 'Intoxicação por anticonvulsivantes, lítio, álcool', 'Encefalopatia de Wernicke', 'Tumor de fossa posterior, malformação de Chiari'] },
    ],
    desempenho: [
      { alvo: 'AVC em vertigem aguda contínua (HINTS: qualquer componente central)', sensibilidade: '~97%', especificidade: '~85–98%', leitura: 'O exame de três passos, feito por quem sabe, é mais sensível que a ressonância nas primeiras 48 horas.', fonte: 'Kattah JC et al. HINTS to diagnose stroke in the acute vestibular syndrome. Stroke, 2009.' },
    ],
    ilustracao: { id: 'face', params: { achado: 'nistagmo', valor: 3 }, alt: 'Par de olhos com as pupilas desviadas e seta indicando a fase rápida para a direita' },
    patologias: ['acidente-vascular-cerebral-isquemico'],
    referencias: ['Kattah JC et al. Stroke, 2009.', 'Leigh RJ, Zee DS. The Neurology of Eye Movements, 5ª ed.'],
  },
  {
    slug: 'rigidez-de-nuca',
    nome: 'Rigidez de nuca',
    sinonimos: ['Rigidez de nuca meníngea', 'Sinal meníngeo'],
    sistema: 'neurologico',
    resumo: 'O queixo não chega ao peito — o pescoço trava, com dor, quando se tenta fletir. As meninges inflamadas resistem a ser estiradas.',
    definicao:
      'Resistência involuntária e dolorosa à flexão passiva do pescoço, com rotação lateral preservada. A cabeça não pode ser levada até o queixo tocar o esterno, e a tentativa provoca dor e contração dos músculos posteriores. Distingue-se da rigidez cervical por espondilose ou parkinsonismo, em que todos os movimentos estão limitados, inclusive a rotação.',
    comoProcurar: [
      { passo: 'Paciente deitado, sem travesseiro, relaxado. Mão sob o occipital, flexione o pescoço devagar até o queixo tocar o peito.', detalhe: 'Movimento passivo e lento: o paciente que ajuda ou resiste voluntariamente invalida o teste.' },
      { passo: 'Observe a resistência, a dor e a distância queixo-esterno.', detalhe: 'Rigidez meníngea é resistência elástica ao final, com dor e, às vezes, flexão dos joelhos (Brudzinski).' },
      { passo: 'Gire a cabeça para os lados.', detalhe: 'Rotação livre com flexão travada é meninge. Rotação e flexão travadas é coluna ou rigidez extrapiramidal.' },
      { passo: 'Complete com Kernig e Brudzinski, e olhe a pele à procura de petéquias.', detalhe: 'Nenhum dos sinais exclui meningite; petéquias com rigidez de nuca é meningococcemia, e o antibiótico não espera a punção.' },
    ],
    mecanismo:
      'As meninges inflamadas — por infecção ou sangue — tornam-se sensíveis ao estiramento. A flexão do pescoço alonga a medula e as raízes dentro do canal, tracionando a dura e a aracnoide inflamadas, e o corpo responde com contração reflexa dos músculos paravertebrais cervicais para impedir o movimento que dói. A rotação lateral não estira o saco dural, por isso permanece livre. É o mesmo mecanismo de Kernig e Brudzinski, que tracionam as raízes lombares e sacras.',
    significado:
      'Rigidez de nuca com febre e cefaleia é meningite até a punção lombar; com cefaleia súbita e sem febre, hemorragia subaracnóidea. Em ambos, o sinal muda a conduta para tomografia (quando indicada), punção e, na suspeita bacteriana, antibiótico dentro da primeira hora — antes da punção, se ela vai atrasar. A ausência do sinal, porém, não exclui nada: um terço das meningites bacterianas do adulto não tem rigidez de nuca, e nos extremos da idade e no imunossuprimido o sinal falta ainda mais.',
    armadilhas: [
      'Ausência de rigidez não exclui meningite. Febre + cefaleia + alteração do estado mental já indica punção.',
      'Idoso com espondilose cervical tem pescoço rígido em todas as direções; a rotação livre separa.',
      'Lactentes e pacientes em coma raramente têm rigidez de nuca; no lactente, a fontanela abaulada vale mais.',
      'Rigidez de nuca com dor de garganta intensa e trismo pode ser abscesso retrofaríngeo; olhe a faringe.',
    ],
    causas: [
      { titulo: 'Irritação meníngea', mecanismo: 'Meninges inflamadas ou com sangue, sensíveis ao estiramento.', itens: ['Meningite bacteriana, viral, tuberculosa, fúngica', 'Hemorragia subaracnóidea', 'Meningite carcinomatosa', 'Meningite química (pós-punção, contraste)'] },
      { titulo: 'Outras rigidezes cervicais (rotação também limitada)', mecanismo: 'Coluna, músculos ou tônus.', itens: ['Espondilose cervical', 'Parkinsonismo', 'Abscesso retrofaríngeo', 'Tétano', 'Distonia cervical'] },
    ],
    desempenho: [
      { alvo: 'Meningite (pleocitose liquórica) em adultos com suspeita', sensibilidade: '~30%', especificidade: '~68%', razaoPositiva: '~0,9', leitura: 'Ruim nos dois sentidos: nem confirma nem afasta. Serve para lembrar de puncionar, não para decidir não puncionar.', fonte: 'Thomas KE et al. The diagnostic accuracy of Kernig’s sign, Brudzinski’s sign, and nuchal rigidity in adults with suspected meningitis. Clin Infect Dis, 2002.' },
    ],
    ilustracao: { id: 'manobra-neurologica', params: { achado: 'rigidez-nuca', valor: 20 }, alt: 'Paciente deitado com a mão do examinador sob a nuca; o pescoço flexiona pouco' },
    patologias: ['meningite-bacteriana', 'hemorragia-subaracnoidea'],
    referencias: ['Thomas KE et al. Clin Infect Dis, 2002.', 'van de Beek D et al. Clinical features and prognostic factors in adults with bacterial meningitis. N Engl J Med, 2004.'],
  },
  {
    slug: 'sinal-de-kernig',
    nome: 'Sinal de Kernig',
    sinonimos: ['Kernig positivo', 'Resistência à extensão do joelho'],
    sistema: 'neurologico',
    resumo: 'Quadril fletido, e o joelho não estende: dor e resistência nos últimos graus. As raízes lombossacras estiradas contra uma meninge inflamada.',
    definicao:
      'Com o paciente deitado, quadril e joelho fletidos a 90°, a extensão passiva do joelho provoca dor lombar ou posterior da coxa e resistência involuntária antes de atingir 135°. Positivo quando bilateral; unilateral sugere ciática ou hérnia discal. Costuma acompanhar rigidez de nuca e Brudzinski.',
    comoProcurar: [
      { passo: 'Deite o paciente, flexione o quadril a 90° e o joelho a 90°.', detalhe: 'Segure a coxa com uma mão e a perna com a outra. O paciente deve estar relaxado.' },
      { passo: 'Estenda o joelho lentamente.', detalhe: 'Positivo: dor lombar ou na coxa posterior, com contração dos isquiotibiais que impede passar de ~135°.' },
      { passo: 'Repita do outro lado.', detalhe: 'Meningite é bilateral. Unilateral com dor irradiada é radiculopatia — Lasègue, não Kernig.' },
      { passo: 'Some à rigidez de nuca e ao Brudzinski.', detalhe: 'Nenhum isolado decide; o conjunto positivo em paciente febril com cefaleia reforça a punção que já estava indicada.' },
    ],
    mecanismo:
      'A extensão do joelho com o quadril fletido estira o nervo ciático e, por ele, as raízes lombossacras e o saco dural até a cauda equina. Com as meninges inflamadas, esse estiramento dói, e o reflexo protetor contrai os isquiotibiais para impedir que o movimento continue. É o equivalente lombar da rigidez de nuca: o mesmo princípio de meninge que não tolera ser tracionada, testado na outra extremidade do saco dural.',
    significado:
      'É um dos três sinais meníngeos clássicos, e o seu valor real é modesto: quando presente, aumenta um pouco a probabilidade de meningite; quando ausente, não a reduz. Serve de lembrete e de argumento, não de critério. Em paciente com febre e cefaleia, a punção lombar está indicada com ou sem Kernig — o sinal positivo apenas torna mais difícil adiá-la.',
    armadilhas: [
      'Ausência não exclui meningite. É a armadilha que mata: adiar a punção porque "não tinha sinal meníngeo".',
      'Unilateral com dor irradiada até o pé é ciática, não meningite.',
      'Idosos com encurtamento de isquiotibiais e pacientes com artrose de joelho têm limitação mecânica sem dor lombar.',
      'Em coma profundo, os sinais meníngeos desaparecem apesar da meningite.',
    ],
    causas: [
      { titulo: 'Irritação meníngea', mecanismo: 'Estiramento doloroso das raízes e do saco dural inflamados.', itens: ['Meningite bacteriana, viral, tuberculosa', 'Hemorragia subaracnóidea', 'Meningite carcinomatosa'] },
      { titulo: 'Simuladores (unilaterais ou mecânicos)', mecanismo: 'Raiz comprimida ou tecido encurtado.', itens: ['Hérnia discal lombar', 'Encurtamento de isquiotibiais', 'Artrose de joelho'] },
    ],
    desempenho: [
      { alvo: 'Meningite (pleocitose liquórica) em adultos com suspeita', sensibilidade: '~5%', especificidade: '~95%', razaoPositiva: '~1', leitura: 'Quase nunca positivo, e quando é, mal desloca a probabilidade. Não decide nada sozinho.', fonte: 'Thomas KE et al. Clin Infect Dis, 2002.' },
    ],
    ilustracao: { id: 'manobra-neurologica', params: { achado: 'kernig', valor: 110 }, alt: 'Paciente deitado com quadril fletido; o joelho resiste à extensão' },
    patologias: ['meningite-bacteriana', 'hemorragia-subaracnoidea'],
    referencias: ['Thomas KE et al. Clin Infect Dis, 2002.', 'Campbell WW. DeJong’s The Neurologic Examination, 8ª ed.'],
  },

  // ─── Abdome ──────────────────────────────────────────────────────────────

  {
    slug: 'sinal-de-grey-turner',
    nome: 'Sinal de Grey Turner',
    sinonimos: ['Equimose de flancos', 'Grey Turner'],
    sistema: 'abdome',
    resumo: 'Manchas azul-arroxeadas nos flancos, sem trauma que as explique — sangue retroperitoneal que levou dias para chegar à pele.',
    definicao:
      'Equimose nos flancos, uni ou bilateral, que surge 24 a 72 horas após hemorragia retroperitoneal, sem história de trauma local. Costuma acompanhar o sinal de Cullen (equimose periumbilical). Não é um sinal precoce: aparece quando o sangue já dissecou os planos fasciais até o subcutâneo.',
    comoProcurar: [
      { passo: 'Exponha os flancos e olhe com boa luz, dos dois lados.', detalhe: 'Fica escondido pela roupa e pelo decúbito. Vire o paciente ou levante a lateral.' },
      { passo: 'Descreva cor, extensão e se há dor local.', detalhe: 'Equimose recente é azul-arroxeada; tardia, esverdeada ou amarelada. A coloração ajuda a datar o sangramento.' },
      { passo: 'Procure Cullen no umbigo e Fox na virilha.', detalhe: 'O sangue segue os planos: para o umbigo pelo ligamento falciforme e redondo, para a virilha pela fáscia.' },
      { passo: 'Pergunte por trauma, anticoagulantes, dor abdominal, pancreatite.', detalhe: 'A equimose só tem valor quando não há trauma direto que a explique.' },
    ],
    mecanismo:
      'Sangue no retroperitônio — de uma pancreatite necro-hemorrágica, de um aneurisma roto, de uma hemorragia renal ou de um sangramento por anticoagulante — não tem para onde ir a não ser dissecar os planos fasciais. Pelo espaço pararrenal posterior e a fáscia lombodorsal, ele chega ao subcutâneo dos flancos; pelo ligamento falciforme e o tecido periumbilical, ao umbigo. A hemoglobina degradada tinge a pele de azul, depois verde e amarelo. O trajeto leva dias, e é por isso que o sinal marca hemorragia que já aconteceu, não que está acontecendo.',
    significado:
      'Na pancreatite aguda, Grey Turner e Cullen indicam a forma necro-hemorrágica, com mortalidade historicamente descrita em torno de 40% — é um marcador de gravidade que exige terapia intensiva. Fora da pancreatite, é hemorragia retroperitoneal até prova em contrário: aneurisma de aorta roto, hematoma de psoas ou renal, gravidez ectópica rota, sangramento por anticoagulante. Muda a conduta para imagem imediata e avaliação de choque, mesmo quando o paciente parece estável — o sinal é tardio e o sangue já está lá.',
    armadilhas: [
      'É raro (< 3% das pancreatites) e tardio. Sua ausência não diz nada sobre gravidade.',
      'Trauma direto do flanco, injeção de heparina ou queda produzem equimose local sem retroperitônio.',
      'Em pele escura a equimose é discreta; compare os lados e palpe a induração.',
      'Confundir com livedo, dermatite de contato ou mancha mongólica do adulto.',
    ],
    causas: [
      { titulo: 'Hemorragia retroperitoneal', mecanismo: 'Sangue dissecando os planos fasciais até o flanco.', itens: ['Pancreatite necro-hemorrágica', 'Ruptura de aneurisma de aorta abdominal', 'Hematoma renal ou perirrenal', 'Hematoma de psoas (anticoagulantes, hemofilia)', 'Gravidez ectópica rota', 'Trauma renal ou pélvico'] },
    ],
    ilustracao: { id: 'abdome', params: { achado: 'grey-turner', valor: 12 }, alt: 'Abdome com manchas arroxeadas nos dois flancos' },
    patologias: ['pancreatite-aguda', 'aneurisma-de-aorta-abdominal'],
    referencias: ['Mookadam F, Cikes M. Cullen’s and Turner’s signs. N Engl J Med, 2005.', 'Meyers MA et al. Grey Turner’s sign and Cullen’s sign in acute pancreatitis. Gastrointest Radiol, 1989.'],
  },
  {
    slug: 'sinal-de-cullen',
    nome: 'Sinal de Cullen',
    sinonimos: ['Equimose periumbilical', 'Cullen'],
    sistema: 'abdome',
    resumo: 'Um halo azulado em torno do umbigo — o sangue que veio por dentro dos ligamentos e chegou ao ponto mais fino da parede.',
    definicao:
      'Equimose periumbilical, em geral circular, azul-arroxeada, que surge dias após hemorragia intraperitoneal ou retroperitoneal. Descrito originalmente na gravidez ectópica rota, hoje mais associado à pancreatite necro-hemorrágica. Costuma acompanhar Grey Turner.',
    comoProcurar: [
      { passo: 'Olhe o umbigo com boa luz e compare com a pele ao redor.', detalhe: 'O halo pode ser sutil; a distância da equimose ao umbigo e o diâmetro do halo descrevem o achado.' },
      { passo: 'Palpe: há induração ou dor local?', detalhe: 'Hematoma subcutâneo endurece; dermatite não.' },
      { passo: 'Procure Grey Turner nos flancos.', detalhe: 'Os dois juntos são quase patognomônicos de sangue no retroperitônio.' },
      { passo: 'Contextualize: pancreatite, anticoagulação, atraso menstrual, trauma.', detalhe: 'O sinal é o mesmo; a causa muda tudo.' },
    ],
    mecanismo:
      'O sangue intra ou retroperitoneal segue os caminhos de menor resistência: o ligamento falciforme e o ligamento redondo levam do espaço peri-hepático e retroperitoneal até o umbigo, onde a parede abdominal é mais fina e a fáscia se funde à pele. Ali a hemoglobina se acumula no subcutâneo e tinge a pele em anel. Como no Grey Turner, o trajeto leva 24 a 72 horas, e o sinal denuncia hemorragia passada.',
    significado:
      'Na pancreatite, marca necrose hemorrágica e gravidade. Em mulher em idade fértil com dor abdominal, é gravidez ectópica rota até o teste de gravidez e o ultrassom dizerem o contrário. Em anticoagulado, é hematoma retroperitoneal ou de reto abdominal. Sempre indica que houve sangramento volumoso o bastante para dissecar até a pele — e pede imagem, hemograma e vigilância de choque.',
    armadilhas: [
      'Raro e tardio; ausência não afasta nada.',
      'Injeções subcutâneas periumbilicais (heparina, insulina) produzem equimoses locais que não são Cullen.',
      'Hérnia umbilical encarcerada pode ter pele violácea por isquemia local — palpe a hérnia.',
      'Pele escura: procure induração e compare com a pele vizinha.',
    ],
    causas: [
      { titulo: 'Hemorragia intra ou retroperitoneal', mecanismo: 'Sangue pelo ligamento falciforme e redondo até o umbigo.', itens: ['Pancreatite necro-hemorrágica', 'Gravidez ectópica rota', 'Ruptura de aneurisma de aorta', 'Hematoma de reto abdominal', 'Ruptura esplênica ou hepática', 'Anticoagulação excessiva'] },
    ],
    ilustracao: { id: 'abdome', params: { achado: 'cullen', valor: 5 }, alt: 'Abdome com halo arroxeado ao redor do umbigo' },
    patologias: ['pancreatite-aguda'],
    referencias: ['Mookadam F, Cikes M. Cullen’s and Turner’s signs. N Engl J Med, 2005.', 'Cullen TS. A new sign in ruptured extrauterine pregnancy. Am J Obstet, 1918.'],
  },
  {
    slug: 'defesa-abdominal',
    nome: 'Defesa abdominal e rigidez',
    sinonimos: ['Defesa involuntária', 'Abdome em tábua', 'Contratura abdominal', 'Guarding'],
    sistema: 'abdome',
    resumo: 'A parede que se contrai sozinha quando a mão se aproxima — e que, na peritonite, fica dura como madeira. O músculo protegendo o que dói por baixo.',
    definicao:
      'Contração involuntária dos músculos da parede abdominal à palpação, que persiste com a distração e com a expiração e não depende da vontade do paciente. Localizada (sobre a víscera inflamada) ou difusa. Rigidez é o grau máximo: a parede está contraída mesmo sem palpação, o abdome não se move com a respiração — o "abdome em tábua" da peritonite generalizada. Distingue-se da defesa voluntária (contração por medo, frio ou cócegas, que some com a distração e a respiração profunda).',
    comoProcurar: [
      { passo: 'Mão morna, paciente deitado com os joelhos fletidos, conversa em andamento.', detalhe: 'A defesa voluntária depende da tensão; a involuntária, não. Relaxe o paciente para isolar a segunda.' },
      { passo: 'Palpe superficialmente, começando longe da dor, e observe a parede enquanto ele expira.', detalhe: 'Na expiração o abdome relaxa; contração que persiste na expiração é involuntária.' },
      { passo: 'Distraia: pergunte algo, peça para respirar fundo, palpe com o estetoscópio.', detalhe: 'A "ausculta" que aperta é palpação sem que o paciente perceba. Se a contratura persiste, é real.' },
      { passo: 'Olhe o abdome respirar.', detalhe: 'Na peritonite generalizada a parede não se move; o paciente respira só com o tórax e fica imóvel, porque qualquer movimento dói.' },
    ],
    mecanismo:
      'O peritônio parietal é inervado pelos mesmos nervos somáticos que inervam a parede abdominal (T6–L1). Quando ele se inflama — por contato com pus, sangue, suco gástrico ou uma víscera inflamada —, a dor viaja por esses nervos e desencadeia um reflexo medular que contrai os músculos do mesmo segmento: uma tala de músculo sobre a área inflamada. Quanto mais extensa a irritação, mais segmentos entram, até que toda a parede se contrai (rigidez). É um reflexo, não uma decisão: por isso não cede à distração, e por isso é o sinal mais confiável de peritonite.',
    significado:
      'Defesa involuntária localizada é peritonite localizada — apendicite, colecistite, diverticulite — e aponta a víscera. Rigidez difusa é peritonite generalizada — perfuração, isquemia, abscesso roto — e pede cirurgião, não mais exames. É o sinal que distingue "abdome agudo cirúrgico" de dor abdominal, e a sua presença justifica tomografia e avaliação cirúrgica imediatas mesmo com exames laboratoriais normais.',
    armadilhas: [
      'Defesa voluntária (medo, frio, cócegas) simula o sinal; distrair e observar a expiração são o que separa.',
      'Idosos, imunossuprimidos, diabéticos e pacientes com corticoide podem ter peritonite sem defesa — parede fraca, reflexo embotado. Nesses, a ausência não tranquiliza.',
      'Obesidade e ascite volumosa escondem a rigidez.',
      'Rigidez sem dor à descompressão e com hiperestesia cutânea pode ser dor referida (pneumonia de base, infarto inferior, cetoacidose, herpes-zóster pré-eruptivo).',
    ],
    causas: [
      { titulo: 'Peritonite localizada', mecanismo: 'Irritação parietal sobre uma víscera inflamada.', itens: ['Apendicite', 'Colecistite aguda', 'Diverticulite', 'Doença inflamatória pélvica', 'Abscesso intra-abdominal'] },
      { titulo: 'Peritonite generalizada (rigidez)', mecanismo: 'Irritação parietal difusa.', itens: ['Úlcera perfurada', 'Perfuração de cólon ou delgado', 'Isquemia mesentérica com necrose', 'Pancreatite grave', 'Ruptura de víscera por trauma', 'Peritonite bacteriana espontânea (raro, defesa discreta)'] },
    ],
    desempenho: [
      { alvo: 'Peritonite (achado cirúrgico)', sensibilidade: 'rigidez ~20–30%', especificidade: 'rigidez ~95%', razaoPositiva: 'rigidez ~4–5 · defesa involuntária ~2,5', leitura: 'Rigidez é rara mas quase decisiva; defesa localizada ajuda menos, mas ainda pesa.', fonte: 'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.' },
    ],
    ilustracao: { id: 'abdome', params: { achado: 'defesa', valor: 2 }, alt: 'Abdome com a parede muscular contraída e demarcada' },
    patologias: ['apendicite-aguda', 'ulcera-peptica-perfurada', 'peritonite-bacteriana-espontanea'],
    referencias: ['McGee S. Evidence-Based Physical Diagnosis, 5ª ed.', 'Silen W. Cope’s Early Diagnosis of the Acute Abdomen, 22ª ed.'],
  },
  {
    slug: 'massa-abdominal-pulsatil',
    nome: 'Massa abdominal pulsátil',
    sinonimos: ['Aorta palpável dilatada', 'Massa pulsátil expansiva'],
    sistema: 'abdome',
    resumo: 'Uma massa acima do umbigo que não só pulsa, mas se expande para os lados a cada batimento — a aorta dilatada, e a única chance de achá-la antes que rompa.',
    definicao:
      'Massa na linha média ou à esquerda dela, epigástrica ou periumbilical, com pulsação expansiva (os dedos colocados nas duas bordas se afastam a cada sístole) e diâmetro estimado > 3 cm. Pulsação transmitida (uma massa sobre a aorta que sobe e desce, sem se expandir) não é o sinal. A aorta normal é palpável em pessoas magras, com 2 a 2,5 cm.',
    comoProcurar: [
      { passo: 'Paciente deitado, joelhos fletidos, abdome relaxado, expirando.', detalhe: 'A aorta fica entre o apêndice xifoide e o umbigo, ligeiramente à esquerda. Abaixo do umbigo ela já bifurcou.' },
      { passo: 'Com as duas mãos, pressione profundamente de cada lado da aorta e sinta as bordas.', detalhe: 'As pontas dos dedos de uma mão de cada lado da pulsação; a distância entre elas é a largura. Estime em centímetros.' },
      { passo: 'Sinta se a pulsação afasta os dedos (expansiva) ou só os levanta (transmitida).', detalhe: 'Expansão lateral é aneurisma. Elevação só é uma massa em cima da aorta, ou a aorta normal de uma pessoa magra.' },
      { passo: 'Ausculte sopro, palpe os pulsos femorais e, se possível, faça ultrassom à beira do leito.', detalhe: 'A palpação perde metade dos aneurismas; o ultrassom acha quase todos em dois minutos.' },
    ],
    mecanismo:
      'A parede aórtica perde elastina e colágeno com a idade, o tabagismo e a aterosclerose; a partir de um ponto, a tensão da parede (que cresce com o raio, pela lei de Laplace) supera a capacidade de reparo, e o vaso dilata progressivamente. Um cilindro de 5 cm de diâmetro, pulsando sob a parede abdominal, se expande a cada sístole em todas as direções — e é essa expansão que os dedos sentem. A aorta normal pulsa mas quase não se expande. A parede fina do aneurisma é o que rompe, e a probabilidade de ruptura sobe com o diâmetro: ~1%/ano abaixo de 5 cm, > 10%/ano acima de 6 cm.',
    significado:
      'Aneurisma de aorta abdominal é silencioso até romper, e a ruptura mata 80% dos pacientes. Achar uma massa pulsátil expansiva em homem idoso fumante, ainda assintomático, é a oportunidade de operar eletivamente (mortalidade ~2–5%) em vez de na urgência (~50%). Em paciente com dor abdominal ou lombar súbita, hipotensão e massa pulsátil, é ruptura: cirurgia imediata, sem tomografia se instável. Muda também a conduta no rastreio: a palpação é tão insensível que homens de 65 a 75 anos que fumaram devem fazer ultrassom independentemente do exame.',
    armadilhas: [
      'Aorta normal em pessoa magra é palpável e pulsátil, mas tem menos de 3 cm e não expande.',
      'Massa sobre a aorta (tumor de pâncreas, linfonodo) transmite a pulsação sem expandir.',
      'Obesidade esconde o aneurisma: sensibilidade cai para menos de 20% quando a circunferência abdominal é grande.',
      'Dor lombar, hipotensão e "cólica renal" em homem idoso é aneurisma roto até o ultrassom dizer o contrário.',
    ],
    causas: [
      { titulo: 'Aneurisma de aorta abdominal', mecanismo: 'Degeneração da parede com dilatação progressiva.', itens: ['Aterosclerótico (idade, tabagismo, sexo masculino, história familiar)', 'Inflamatório', 'Micótico (infeccioso)', 'Doenças do tecido conjuntivo (Marfan, Ehlers-Danlos)'] },
      { titulo: 'Pulsação transmitida (não é o sinal)', mecanismo: 'Massa apoiada sobre a aorta normal.', itens: ['Tumor de pâncreas', 'Linfonodomegalia retroperitoneal', 'Aorta normal em pessoa magra', 'Aorta tortuosa do idoso'] },
    ],
    desempenho: [
      { alvo: 'Aneurisma de aorta abdominal ≥ 3 cm (ultrassom)', sensibilidade: '~68% no total; ~29% para 3–3,9 cm, ~76% para ≥ 5 cm', especificidade: '~75%', razaoPositiva: '~12 (massa pulsátil ampla)', leitura: 'Achar é decisivo; não achar não afasta — os aneurismas pequenos e os pacientes obesos escapam.', fonte: 'Lederle FA, Simel DL. Does this patient have abdominal aortic aneurysm? JAMA, 1999.' },
    ],
    ilustracao: { id: 'abdome', params: { achado: 'massa-pulsatil', valor: 5 }, alt: 'Abdome com massa pulsátil na linha média e setas de expansão lateral' },
    patologias: ['aneurisma-de-aorta-abdominal'],
    referencias: ['Lederle FA, Simel DL. Does this patient have abdominal aortic aneurysm? JAMA, 1999.', 'Chaikof EL et al. SVS practice guidelines on the care of patients with an abdominal aortic aneurysm. J Vasc Surg, 2018.'],
  },
  {
    slug: 'hepatomegalia',
    nome: 'Hepatomegalia',
    sinonimos: ['Fígado aumentado', 'Fígado palpável abaixo do rebordo'],
    sistema: 'abdome',
    resumo: 'A borda do fígado que encontra a mão vários centímetros abaixo das costelas — e o que ela é (lisa, dura, dolorosa, nodular) diz mais que o quanto desceu.',
    definicao:
      'Fígado com dimensão vertical > 12 a 13 cm na linha hemiclavicular (percussão da borda superior à inferior), ou borda palpável mais de 2 cm abaixo do rebordo costal em quem tem a borda superior no lugar. A borda palpável sozinha não define: um fígado empurrado para baixo (enfisema, derrame) é palpável sem estar aumentado. Descreve-se a borda (fina ou romba), a consistência (macia, firme, dura), a superfície (lisa, nodular) e a dor.',
    comoProcurar: [
      { passo: 'Percuta a borda superior na linha hemiclavicular, de cima para baixo, até o som claro virar maciço.', detalhe: 'Costuma ser o 5º espaço intercostal. Sem isso, não se sabe se o fígado está grande ou só baixo.' },
      { passo: 'Palpe a partir da fossa ilíaca direita, subindo a cada expiração, com a mão em concha ou em garra.', detalhe: 'A borda vem ao encontro dos dedos na inspiração profunda. Comece baixo: um fígado enorme tem a borda onde não se espera.' },
      { passo: 'Percuta a borda inferior e meça a distância até a superior.', detalhe: '12 a 13 cm é o limite na hemiclavicular. A distância borda-rebordo em centímetros é o que se anota para acompanhar.' },
      { passo: 'Caracterize a borda e a superfície; ausculte sopro e atrito.', detalhe: 'Lisa, macia e dolorosa: congestão ou hepatite. Dura e nodular: cirrose ou metástase. Sopro: carcinoma hepatocelular ou hepatite alcoólica.' },
    ],
    mecanismo:
      'O fígado cresce por quatro razões: congestão (sangue represado pela insuficiência cardíaca direita ou obstrução venosa — fígado macio, doloroso pela distensão da cápsula), infiltração (gordura, glicogênio, amiloide, células tumorais ou inflamatórias), inflamação com edema (hepatites) e proliferação (tumores, cistos). A cápsula de Glisson, inervada, dói quando estirada rapidamente — por isso a hepatomegalia aguda dói e a crônica não. A cirrose avançada, ao contrário, encolhe o fígado; quando a borda é palpável na cirrose, costuma ser o lobo esquerdo hipertrofiado, duro e irregular.',
    significado:
      'Hepatomegalia dolorosa aguda com jugular alta é congestão por insuficiência cardíaca direita; com febre e icterícia, hepatite; com dor intensa e febre alta, abscesso. Hepatomegalia dura e nodular é metástase ou hepatocarcinoma até prova em contrário. A esteatose é a causa mais comum de fígado grande e firme assintomático. O achado direciona a investigação (ultrassom, enzimas, sorologias) e, no acompanhamento, a medida em centímetros abaixo do rebordo é o que mostra resposta ao diurético ou ao tratamento.',
    armadilhas: [
      'Fígado palpável não é fígado grande: enfisema, derrame pleural direito e lobo de Riedel (variante) empurram a borda para baixo. Percuta a borda superior.',
      'Ausência de borda palpável não exclui hepatomegalia — a sensibilidade da palpação é baixa em obesos e ascíticos.',
      'Cirrose avançada tem fígado pequeno; um fígado grande em cirrótico é hepatocarcinoma, esteato-hepatite ou congestão até se provar o contrário.',
      'A borda romba e dolorosa da congestão volta ao normal em dias de diurético; se não volta, não era só congestão.',
    ],
    causas: [
      { titulo: 'Congestão', mecanismo: 'Sangue represado nas veias hepáticas.', itens: ['Insuficiência cardíaca direita', 'Pericardite constritiva', 'Síndrome de Budd-Chiari', 'Insuficiência tricúspide (fígado pulsátil)'] },
      { titulo: 'Infiltração e depósito', mecanismo: 'Substância ou célula que ocupa o parênquima.', itens: ['Esteatose hepática', 'Amiloidose', 'Doenças de depósito (Gaucher, glicogenoses)', 'Leucemia, linfoma', 'Metástases (a causa mais comum de fígado nodular)'] },
      { titulo: 'Inflamação e infecção', mecanismo: 'Edema e infiltrado inflamatório.', itens: ['Hepatites virais agudas', 'Hepatite alcoólica', 'Abscesso hepático', 'Malária, leishmaniose visceral, esquistossomose'] },
      { titulo: 'Tumores e cistos', mecanismo: 'Massa que cresce.', itens: ['Carcinoma hepatocelular', 'Hemangioma gigante', 'Doença policística', 'Cisto hidático'] },
    ],
    desempenho: [
      { alvo: 'Hepatomegalia ao ultrassom (borda palpável abaixo do rebordo)', sensibilidade: '~48–70%', especificidade: '~70–85%', razaoPositiva: '~2,5', razaoNegativa: '~0,5', leitura: 'Palpação positiva desloca modestamente; negativa quase não exclui. O ultrassom decide.', fonte: 'Naylor CD. Physical examination of the liver. JAMA, 1994.' },
    ],
    ilustracao: { id: 'abdome', params: { achado: 'hepatomegalia', valor: 6 }, alt: 'Abdome com a borda hepática desenhada vários centímetros abaixo do rebordo costal direito' },
    patologias: ['insuficiencia-cardiaca', 'hepatite-viral-aguda', 'cirrose-hepatica'],
    referencias: ['Naylor CD. Physical examination of the liver. JAMA, 1994.', 'Porto CC. Semiologia Médica, 8ª ed.'],
  },
  {
    slug: 'esplenomegalia',
    nome: 'Esplenomegalia',
    sinonimos: ['Baço palpável', 'Baço aumentado'],
    sistema: 'abdome',
    resumo: 'O baço, que ninguém sente no normal, aparece sob o rebordo esquerdo e desce em direção à fossa ilíaca direita — quase sempre é doença, e quase nunca é uma só.',
    definicao:
      'Baço palpável abaixo do rebordo costal esquerdo, em qualquer grau, ou macicez esplênica que se estende além da linha axilar anterior ou que aparece à percussão do espaço de Traube na inspiração (sinal de Castell). Palpável só quando ao menos 1,5 a 2 vezes o tamanho normal. Descreve-se em centímetros abaixo do rebordo, na direção do umbigo, e pela consistência. Maciça (≥ 8 cm ou cruzando a linha média) tem lista própria de causas.',
    comoProcurar: [
      { passo: 'Percuta o espaço de Traube (entre a 6ª costela, a linha axilar anterior e o rebordo) em expiração e inspiração.', detalhe: 'Timpânico nas duas: baço provavelmente normal. Maciço na inspiração: baço aumentado que desce — sinal de Castell. É o passo mais sensível.' },
      { passo: 'Palpe a partir da fossa ilíaca direita, subindo em diagonal a cada expiração, com a outra mão elevando o flanco esquerdo.', detalhe: 'O baço cresce para o umbigo e a fossa ilíaca direita, não para baixo. Comece longe: um baço maciço tem a borda perto do umbigo.' },
      { passo: 'Se não palpou, repita em decúbito lateral direito com os joelhos fletidos.', detalhe: 'A gravidade traz o baço para os dedos. Sinta a incisura na borda medial — é o que o distingue de um rim.' },
      { passo: 'Meça em centímetros e caracterize.', detalhe: 'Macio e doloroso: infecção aguda. Duro e enorme: mieloproliferativa, leishmaniose, esquistossomose. Com hepatomegalia e estigmas: hipertensão portal.' },
    ],
    mecanismo:
      'O baço cresce por congestão (a veia esplênica represada pela hipertensão portal ou pela trombose), por hiperplasia do tecido linfoide (infecções, doenças autoimunes), por trabalho aumentado (hemólise crônica: o baço destrói hemácias e cresce fazendo isso), por infiltração (leucemia, linfoma, doenças de depósito) ou por hematopoese extramedular (mielofibrose). Só se torna palpável quando dobra de tamanho, porque fica inteiro sob o gradil costal. A cápsula distendida rapidamente dói (infecção, infarto esplênico); a crônica não. A incisura da borda medial é a assinatura anatômica que o rim não tem.',
    significado:
      'Baço palpável é quase sempre anormal e quase nunca tem uma explicação trivial. Com febre e linfonodos, infecção (mononucleose, endocardite, malária) ou linfoma; com hepatomegalia e estigmas hepáticos, hipertensão portal; com anemia e icterícia, hemólise; maciço e indolor, mieloproliferativa ou leishmaniose. Muda a conduta em duas direções: dispara a investigação (hemograma com esfregaço, ultrassom, sorologias, às vezes biópsia de medula) e proíbe esportes de contato — o baço grande rompe com trauma banal.',
    armadilhas: [
      'Rim esquerdo palpável (ptose, hidronefrose) simula baço; o rim não tem incisura, é balotável e a percussão sobre ele é timpânica (cólon na frente).',
      'Baço palpável em adolescente com mononucleose pode romper; o exame deve ser gentil e o esporte, proibido por semanas.',
      'Ausência de baço palpável não exclui esplenomegalia moderada — a palpação só acha baços ≥ 2 vezes o normal.',
      'Lobo esquerdo do fígado aumentado pode chegar ao hipocôndrio esquerdo e ser confundido; ele se move com a respiração como o fígado e não tem incisura.',
    ],
    causas: [
      { titulo: 'Congestiva', mecanismo: 'Veia esplênica represada.', itens: ['Cirrose com hipertensão portal', 'Trombose de veia esplênica ou porta', 'Esquistossomose hepatoesplênica', 'Insuficiência cardíaca grave'] },
      { titulo: 'Infecciosa e inflamatória', mecanismo: 'Hiperplasia linfoide.', itens: ['Mononucleose, citomegalovírus, HIV', 'Endocardite', 'Malária, leishmaniose visceral, febre tifoide', 'Lúpus, artrite reumatoide (Felty), sarcoidose'] },
      { titulo: 'Hematológica', mecanismo: 'Trabalho, infiltração ou hematopoese extramedular.', itens: ['Hemólise (esferocitose, talassemia, autoimune)', 'Leucemias e linfomas', 'Mielofibrose, policitemia vera', 'Doença de Gaucher'] },
      { titulo: 'Maciça (≥ 8 cm ou além da linha média)', mecanismo: 'Poucas causas chegam a esse tamanho.', itens: ['Leucemia mieloide crônica', 'Mielofibrose', 'Leishmaniose visceral (calazar)', 'Esquistossomose', 'Malária crônica', 'Gaucher', 'Linfoma esplênico'] },
    ],
    desempenho: [
      { alvo: 'Esplenomegalia ao ultrassom', sensibilidade: 'palpação ~58% · percussão de Traube ~62% · Castell ~82%', especificidade: 'palpação ~92% · Traube ~72%', razaoPositiva: 'palpação ~8,5', leitura: 'Palpar o baço confirma; não palpar não exclui. Comece pela percussão, que acha mais.', fonte: 'Grover SA, Barkun AN, Sackett DL. Does this patient have splenomegaly? JAMA, 1993.' },
    ],
    ilustracao: { id: 'abdome', params: { achado: 'esplenomegalia', valor: 6 }, alt: 'Abdome com a borda do baço desenhada abaixo do rebordo esquerdo, em direção ao umbigo' },
    patologias: ['cirrose-hepatica', 'leucemia-mieloide-cronica', 'mononucleose-infecciosa'],
    referencias: ['Grover SA, Barkun AN, Sackett DL. Does this patient have splenomegaly? JAMA, 1993.', 'Porto CC. Semiologia Médica, 8ª ed.'],
  },
  {
    slug: 'descompressao-dolorosa-localizada',
    nome: 'Dor à descompressão brusca localizada',
    sinonimos: ['Blumberg localizado', 'Rebote localizado', 'Descompressão positiva em um ponto'],
    sistema: 'abdome',
    resumo: 'A mão sai de repente e a dor aparece num ponto só — o peritônio parietal inflamado exatamente sobre a víscera doente, e não em todo o abdome.',
    definicao:
      'Dor aguda, intensa e breve, provocada pela retirada súbita da mão que comprimia lentamente a parede abdominal, referida a um ponto ou região restrita (fossa ilíaca direita, hipocôndrio direito, fossa ilíaca esquerda), e não a todo o abdome. Diferente da descompressão difusa (peritonite generalizada) e da dor que só ocorre à compressão (víscera dolorosa sem irritação peritoneal). Sinal de Rovsing é a variante em que a dor na fossa ilíaca direita é provocada pela compressão ou descompressão da esquerda.',
    comoProcurar: [
      { passo: 'Comprima devagar e fundo, por 2 a 3 segundos, o ponto suspeito — ou, melhor, um ponto vizinho.', detalhe: 'A compressão lenta não é o teste; é a preparação. Avise o paciente de que vai soltar.' },
      { passo: 'Solte de uma vez e observe o rosto, não a mão.', detalhe: 'A dor de descompressão é uma careta, um gemido, uma contração súbita. Pergunte onde doeu: a localização é o achado.' },
      { passo: 'Compare com a percussão leve e com a tosse.', detalhe: 'Dor à percussão suave sobre o ponto, ou dor localizada ao tossir, é o mesmo fenômeno com menos sofrimento — e mais confiável que o rebote em paciente ansioso.' },
      { passo: 'Delimite: é só ali, ou em todo o abdome?', detalhe: 'Localizada: víscera inflamada com peritônio adjacente irritado. Difusa: peritonite generalizada — muda a urgência.' },
    ],
    mecanismo:
      'O peritônio parietal inflamado é sensível ao movimento abrupto. A compressão lenta afasta as alças e aproxima o peritônio parietal da víscera inflamada sem disparar dor intensa; a descompressão súbita faz o peritônio parietal voltar bruscamente à posição e roçar na serosa inflamada, e as terminações somáticas (mesmas raízes da parede) disparam uma dor aguda, bem localizada. Como a irritação é apenas onde a víscera toca o peritônio, a dor aparece exatamente ali — o sinal localiza o órgão antes de qualquer imagem. Quando o processo se generaliza, a dor também.',
    significado:
      'Descompressão dolorosa localizada na fossa ilíaca direita é o sinal físico mais associado à apendicite; no hipocôndrio direito, à colecistite; na fossa ilíaca esquerda, à diverticulite. Confirma que há irritação peritoneal — não só dor visceral — e desloca a conduta para imagem e avaliação cirúrgica. Sua expansão para todo o abdome, num reexame, é o momento de operar sem esperar mais. E, como o sinal é doloroso, vale substituir a manobra pela percussão suave ou pela tosse, que mostram o mesmo com menos sofrimento e menos defesa voluntária.',
    armadilhas: [
      'Paciente ansioso sente "dor" a qualquer manobra brusca; a percussão suave e a tosse são mais específicas.',
      'Idoso, imunossuprimido e gestante podem ter apendicite sem rebote; ausência não exclui.',
      'Descompressão feita com força excessiva ou várias vezes esgota a cooperação e cria defesa voluntária no reexame.',
      'Dor à compressão sem dor à descompressão é víscera dolorosa (enterite, cólica) sem peritonite — outra conduta.',
    ],
    causas: [
      { titulo: 'Fossa ilíaca direita', mecanismo: 'Irritação parietal sobre o apêndice ou anexo.', itens: ['Apendicite aguda', 'Doença inflamatória pélvica, cisto de ovário roto ou torcido', 'Ileíte terminal (Crohn, Yersinia)', 'Diverticulite de Meckel'] },
      { titulo: 'Hipocôndrio direito', mecanismo: 'Vesícula inflamada tocando o peritônio.', itens: ['Colecistite aguda', 'Abscesso hepático subcapsular', 'Úlcera duodenal perfurada bloqueada'] },
      { titulo: 'Fossa ilíaca esquerda', mecanismo: 'Sigmoide inflamado.', itens: ['Diverticulite aguda', 'Colite isquêmica', 'Doença inflamatória pélvica'] },
    ],
    desempenho: [
      { alvo: 'Apendicite aguda (descompressão dolorosa na FID)', sensibilidade: '~63%', especificidade: '~69%', razaoPositiva: '~2', razaoNegativa: '~0,5', leitura: 'Modesto: ajuda, não decide. Combinado com defesa, migração da dor e leucocitose, ganha peso.', fonte: 'Wagner JM et al. Does this patient have appendicitis? JAMA, 1996.' },
    ],
    ilustracao: { id: 'abdome', params: { achado: 'descompressao', valor: 7 }, alt: 'Abdome com um ponto de dor à descompressão marcado na fossa ilíaca direita' },
    patologias: ['apendicite-aguda', 'colecistite-aguda', 'diverticulite-aguda'],
    referencias: ['Wagner JM et al. Does this patient have appendicitis? JAMA, 1996.', 'Silen W. Cope’s Early Diagnosis of the Acute Abdomen, 22ª ed.'],
  },
]
