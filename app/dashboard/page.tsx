'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { PlanLimitsCard } from '@/components/plan-limits-card'
import { AccountType } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Brain,
  BookMarked,
  Video,
  MessageCircle,
  User,
  Sparkles,
  ArrowRight,
  Trophy,
  Clock,
  TrendingUp,
  Calendar,
  Zap,
  Target,
  BarChart3,
  Play,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Flame,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Activity,
  HeartPulse,
  Heart,
  Download,
  Package,
  Quote,
  X,
} from 'lucide-react'
import { DoacaoContent } from '@/components/doacoes/doacao-content'
import { DoacaoRanking } from '@/components/doacoes/doacao-ranking'
import { DoacaoForm } from '@/components/doacoes/doacao-form'
import { PendingReviewReminder } from '@/components/reviews/pending-review-reminder'

// ─── Circular Progress Ring ─────────────────────────────────────
function ProgressRing({
  value,
  max,
  size = 48,
  strokeWidth = 4,
  color = '#468152',
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percent = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference - percent * circumference

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-circle"
      />
    </svg>
  )
}

// ─── Animated Counter ───────────────────────────────────────────
function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1000
      const start = Date.now()
      const step = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        setDisplay(Math.round(eased * value))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return <span>{display.toLocaleString('pt-BR')}</span>
}

// ─── Motivational Phrases ───────────────────────────────────────
const MOTIVATIONAL_PHRASES = [
  "Consistência não é fazer o máximo todos os dias. É fazer o suficiente mesmo quando tudo em você pede para parar. O médico que você quer ser foi construído exatamente nos dias em que você não tinha vontade nenhuma de abrir um livro.",
  "Tem algo que ninguém te conta sobre o processo: ele não parece progresso enquanto está acontecendo. Parece rotina, parece repetição, parece igual ao dia anterior. E é exatamente assim que os melhores são formados — em silêncio, sem plateia, tijolo por tijolo.",
  "Você não precisa de um mês perfeito. Você precisa de um mês feito. A diferença entre os dois é que o primeiro existe só na sua cabeça, e o segundo existe no seu histórico de estudo — e é esse que vai aparecer no resultado.",
  "A consistência é a única coisa em medicina que o dinheiro não compra, o talento não substitui e a sorte não imita. É também a única coisa que você controla completamente. Pensa nisso enquanto decide o que fazer com a próxima hora.",
  "Toda semana tem um dia que você quebra o ritmo. Isso não é falha — é dado. O que separa quem passa de quem não passa não é quem nunca cai. É quem levanta sem fazer drama e volta mais rápido do que caiu.",
  "Foco não é sobre eliminar distração. Distração sempre vai existir — celular, cansaço, barulho, pensamento inútil. Foco é sobre o que você faz depois que se distrai. Você volta? Com que velocidade? Isso é o que define quem você é como estudante.",
  "O problema não é que você estuda pouco. É que você estuda uma hora e passa três horas estudando pela metade. Uma hora de presença real, sem celular, sem pausa desnecessária, vale mais do que cinco horas de simulacro de estudo.",
  "Determinação não é aquela energia que você sente quando assiste um vídeo motivacional. É o que sobra quando essa energia vai embora — e ela sempre vai embora. O que fica depois que a empolgação passa é quem você realmente é, e é esse que vai fazer a prova.",
  "Paciência em medicina não é esperar passivamente. É trabalhar com consistência mesmo sem ver resultado imediato, sabendo que o processo tem uma lógica que não obedece ao seu calendário emocional. O fruto vem. Mas vem no tempo dele, não no tempo da sua ansiedade.",
  "Ninguém chega na residência que quer porque foi mais fácil para eles. Eles chegaram porque quando ficou difícil, não ressignificaram a dificuldade como sinal de que deveriam parar. Eles a ressignificaram como sinal de que estavam exatamente onde precisavam estar.",
  "A grande ilusão do estudo é achar que mais horas equivalem a mais aprendizado. Não é assim. É qualidade de presença que determina o quanto você retém. Duas horas acordado de verdade valem mais do que oito horas acordado por fora.",
  "Você vai ter dias em que o conteúdo não entra. Dias em que você relê o mesmo parágrafo quatro vezes e ainda não entende. Esses dias não são sinal de que você não é capaz — são sinal de que seu cérebro precisa de outra abordagem. Mude a estratégia, não abandone o objetivo.",
  "A residência não é o destino. É o começo de um longo processo de formação. Mas chegar lá pela primeira vez — entrar naquele lugar que você imaginou por anos — isso é algo que pouquíssimas pessoas no mundo experimentam. Você quer ser uma delas ou quer explicar por que não quis?",
  "Tem um momento no estudo que tudo clica. De repente, um conceito que parecia abstrato vira algo que você entende de verdade, de um jeito que não desaparece. Esse momento não aparece para quem desiste antes. Ele é o prêmio da persistência.",
  "O seu concorrente direto não é mais inteligente. Provavelmente tem o mesmo nível de inteligência que você, às vezes até menos. A diferença está nas horas que ele coloca quando ninguém está vendo, nas revisões que faz quando poderia estar fazendo outra coisa.",
  "Medicina exige algo que a maioria das pessoas não consegue sustentar: trabalhar duro em silêncio por anos, sem garantia de resultado imediato, sem aplausos, sem validação externa constante. Se você aguenta isso, você já tem o mais difícil.",
  "A diferença entre quem passa e quem não passa não é a carga de estudo. É a qualidade da revisão. Você pode ler um conteúdo cem vezes e não memorizar. Ou pode revisar ativamente cinco vezes e gravar para sempre. O método importa tanto quanto o esforço.",
  "Quando você sente que está atrasado, que todo mundo está na sua frente, que o tempo está acabando — respira. Essa sensação não é dado, é narrativa. A única coisa que você pode fazer é trabalhar bem agora, nesse momento. O resto não está no seu controle.",
  "Há uma certa nobreza em estudar medicina. Não a nobreza superficial de título ou status, mas a nobreza real de dizer: vou aprender o suficiente para não prejudicar a vida de ninguém. Cada hora de estudo é um ato de responsabilidade com pessoas que você ainda não conhece.",
  "Você vai errar questões que deveria acertar. Vai sair de simulados sentindo que foi mal. Vai ter momentos de dúvida genuína sobre se vai conseguir. E vai continuar assim mesmo. Porque é exatamente isso que diferencia quem chega de quem desiste: continuar mesmo quando a evidência não apoia a confiança.",
  "O ritmo sustentável é mais valioso do que o sprint ocasional. Estudar bem por doze meses supera estudar em pânico por três. A construção lenta e consistente de conhecimento é o único método que funciona no longo prazo — e medicina é sempre longo prazo.",
  "Não existe versão de você que consegue tudo de uma vez. Não existe sessão de estudo que resolve o semestre. O que existe é o acúmulo, dia após dia, de pequenas vitórias que sozinhas não parecem nada, mas juntas constroem algo que nenhum talento bruto consegue replicar.",
  "A paciência não é uma virtude passiva. É uma escolha ativa de continuar confiando no processo mesmo quando os resultados ainda não aparecem. É dizer: eu sei que o que estou fazendo vai funcionar, e vou continuar fazendo mesmo sem prova imediata disso.",
  "Medicina é uma das poucas carreiras onde o conhecimento que você acumula hoje vai literalmente salvar vidas no futuro. Isso não é motivação barata — é realidade objetiva. Cada conteúdo que você domina agora é uma decisão melhor que você vai tomar em plantão.",
  "O maior inimigo do progresso não é a dificuldade do conteúdo. É a inconsistência. Você pode superar qualquer lacuna de conhecimento com tempo e método. Mas não tem como superar a falta de presença consistente — ela cria buracos que se acumulam até virar abismo.",
  "Foco profundo é um estado que precisa ser treinado como músculo. No começo, cinco minutos de presença real é tudo que você consegue. Com treino, vira vinte, quarenta, noventa minutos. Esse músculo é o que separa o estudante mediano do estudante que domina.",
  "Você vai chegar em dias que o conteúdo te intimida. Que a extensão do que falta te paralisa. Nesses dias, a resposta não é ver o todo — é escolher uma coisa pequena, fazer essa coisa, e depois escolher outra. Momentum se constrói com micromovimentos, não com grandes saltos.",
  "A residência que você quer não está guardada por sorte ou por acaso. Está guardada por pontos. E pontos são conquistados questão por questão, revisão por revisão, dia por dia. Quando você entende isso de verdade, o processo para de parecer abstrato e começa a parecer administrável.",
  "Consistência é o que converte esforço em resultado. Você pode se esforçar muito por três dias e obter pouco. Ou pode se esforçar de forma razoável por trezentos dias e obter algo que supera qualquer sprint de curto prazo. O tempo é seu aliado se você não desperdiçar ele.",
  "Determinação real não grita. Ela não precisa de post de madrugada nem de discurso. Ela aparece no calendário de estudo, nos flashcards revisados, nas questões respondidas quando você preferiria estar fazendo outra coisa. É silenciosa, eficaz e invisível para quem não está prestando atenção.",
  "Você não vai gostar de todo o conteúdo. Vai ter áreas que te entediam, que não fazem sentido, que parecem irrelevantes. Mas a prova não sabe disso. Ela cobra o que foi definido na ementa, independente da sua relação emocional com o assunto. Domine tudo ou pague o preço depois.",
  "O processo de aprender medicina é longo por uma razão: o que está sendo construído é complexo. Não é memorização de fatos — é a construção de um raciocínio clínico que leva anos para se solidificar. Tenha paciência com esse processo porque ele não tem atalho que seja honesto.",
  "Quando você está com medo de não passar, lembra: esse medo só existe porque o objetivo importa para você de verdade. Use esse medo como dado — ele te diz onde está a lacuna, o que precisa de mais atenção, onde você sabe que não está preparado. Medo é informação, não sentença.",
  "A melhor coisa que você pode fazer pelo seu futuro paciente é estudar bem agora. Não estudar sob pressão de last minute, não memorizar para passar e esquecer depois — estudar de verdade, com compreensão, com intenção de reter. Esse é o padrão ético do profissional que você está se tornando.",
  "Existe uma versão de você que acorda, abre o material sem negociar, faz o que precisa ser feito e vai dormir sabendo que usou bem o dia. Essa versão não precisa de motivação porque opera por disciplina. Você a construiu ou está esperando que ela apareça sozinha?",
  "O foco não vem antes da ação. Vem durante. Você não espera ter vontade de estudar para começar a estudar — você começa, e depois de alguns minutos o foco aparece. Quem espera o estado ideal para começar nunca começa de verdade.",
  "Paciência com o processo é diferente de tolerância com a estagnação. Você pode ser paciente com o ritmo de crescimento e ainda assim exigente com a consistência. Paciência não é desculpa para não estar presente — é a sabedoria de entender que resultado demora e trabalho é agora.",
  "Os melhores estudantes de medicina não são os que nunca têm dúvida. São os que transformam dúvida em pergunta, pergunta em pesquisa, pesquisa em compreensão. A dúvida é o motor do aprendizado real — o problema é quando você a ignora em vez de persegui-la.",
  "Tem uma sensação que aparece depois de semanas de consistência. É difícil de descrever — uma espécie de clareza, de leveza, de saber que você está no caminho certo. Você só consegue essa sensação fazendo. Não existe jeito de comprar, simular ou buscar atalho para ela.",
  "Residência é um projeto de longo prazo que exige gerenciamento de energia, não apenas de tempo. Você não pode estudar em colapso e esperar absorver conteúdo. Descanso adequado, alimentação, movimento físico — esses não são luxos, são infraestrutura do seu desempenho.",
  "A maioria das pessoas subestima o quanto pode aprender se simplesmente aparecer todos os dias. Não de forma brilhante, não de forma inspirada — só aparecendo e fazendo. A acumulação de dias comuns e consistentes produz resultados que parecem extraordinários para quem só vê o final.",
  "Quando tudo converge — consistência, foco, determinação e paciência — você entra em um estado diferente. O estudo deixa de parecer obrigação e começa a parecer construção. Você não está só preparando para uma prova. Está se tornando a pessoa que vai passar nela.",
  "A prova de residência não mede quem é mais inteligente. Mede quem preparou melhor dentro de um sistema específico de avaliação. Isso significa que é inteiramente possível superar candidatos 'mais dotados' simplesmente entendendo melhor o que é cobrado e preparando de forma mais intencional.",
  "Você vai ter semanas em que o progresso some. Em que tudo parece estagnado, os simulados não evoluem, você questiona o método. Essas semanas são parte do processo, não exceção a ele. Elas existem para testar se você tem o que precisa — não inteligência, mas persistência.",
  "Foco não é um traço de personalidade que algumas pessoas têm e outras não. É uma habilidade que se desenvolve com prática deliberada. Cada vez que você se reconecta com o material depois de se distrair, você está treinando esse músculo. Cada dia de prática conta.",
  "O conhecimento médico não é decoração intelectual. É ferramenta de trabalho de alta pressão. O que você aprende agora vai ser acionado em contexto de urgência, com vida em jogo, com tempo limitado. Aprenda como se você fosse precisar disso de verdade — porque vai.",
  "Determinação sem direção é esforço desperdiçado. Mas direção sem determinação é um plano sem executor. Os dois precisam coexistir: saber o que estudar e ter a disposição de sentar e fazer isso, dia após dia, mesmo sem aplausos.",
  "Você está aqui, abrindo o material, quando podia estar fazendo outra coisa. Isso não é pouca coisa. É uma escolha que a maioria das pessoas não consegue fazer de forma consistente. Honre essa escolha usando bem o tempo que você acabou de reservar.",
  "A diferença entre quem é bom e quem é excelente não está no talento inicial. Está em quantas vezes revisou o que já sabia para solidificar ainda mais, em quantas vezes estudou o difícil em vez do confortável, em quantas vezes escolheu o longo prazo em vez do prazer imediato.",
  "Medicina te cobra tudo — tempo, energia, atenção, emoção. E em troca, te dá a capacidade de fazer algo que pouquíssimas pessoas no mundo conseguem fazer. Não reclame do preço. Pague consciente, com orgulho, sabendo exatamente o que está comprando.",
  "Todo conteúdo que você acha que não vai cair já caiu em alguma edição anterior. Todo tema que você pulou porque achou que sabia já foi responsável por uma reprovação. O respeito pelo processo inclui não escolher o que merece sua atenção — a ementa já fez essa escolha.",
  "Você não está competindo com todo mundo. Está competindo com quem está estudando agora, nesse momento, com o mesmo objetivo que você. Esse universo é menor do que parece. E dentro dele, consistência e método valem mais do que brilhantismo esporádico.",
  "Tem uma satisfação profunda em dominar um conteúdo difícil. Não a satisfação de ter decorado — mas de ter entendido de verdade, de conseguir explicar, de saber por que funciona assim. Persiga essa sensação. Ela é o indicador mais confiável de que você vai reter aquilo.",
  "Paciência é a virtude mais subestimada em medicina. Os resultados no corpo humano não são imediatos, e o aprendizado médico também não é. Você planta hoje para colher em meses. Quem não tem paciência com esse ciclo desiste antes de ver o fruto.",
  "Cada flashcard que você revisa quando estava quase dormindo, cada questão que analisa quando preferiria parar, cada hora que rouba do ócio para dar ao estudo — tudo isso vai para algum lugar. Nada se perde. O cérebro registra, consolida e entrega quando você mais precisa.",
  "A identidade do estudante que você quer ser não aparece de uma vez. Ela é construída ação por ação, hábito por hábito. Cada vez que você age de acordo com quem você quer ser, você reforça essa identidade. Cada vez que você cede, enfraquece. A escolha é repetida, não única.",
  "Não existe preparação sem sacrifício. Não existe conquista de nível alto sem abrir mão de coisas de nível médio. A questão não é se você vai sacrificar — é se está sacrificando conscientemente em direção a algo que vale, ou aleatoriamente em direção a nada.",
  "O estudo profundo não é sobre volume. É sobre penetração. Você pode passar três horas em cima de um tema ou trinta minutos entendendo de verdade o mecanismo central, e os trinta minutos valem mais. Busque profundidade antes de extensão — sempre.",
  "Quando você chegar na residência que quer, o que vai lembrar não é dos dias fáceis. Vai lembrar dos dias que quase desistiu e não desistiu. Vai lembrar da noite que o conteúdo não entrava e você ficou até entrar. Vai lembrar de ter escolhido certo quando foi difícil.",
  "A pergunta certa não é 'consigo passar?'. A pergunta certa é 'o que preciso fazer para garantir que passo?' A primeira é passiva e depende de sorte. A segunda é ativa e depende de você. Responda a segunda e você tem um plano. Responda a primeira e você tem uma esperança.",
  "Determinação é fácil quando está dando certo. O teste real é o que você faz quando não está dando certo — quando o simulado foi ruim, quando o conteúdo não entrou, quando o resultado não justifica o esforço. É nesses momentos que o caráter do estudante se revela.",
  "O foco que você precisa não é sobrenatural. É simplesmente a capacidade de estar onde você está, fazendo o que está fazendo, sem estar em dez outros lugares mentalmente. Isso soa simples porque é simples. O difícil é praticar — todo dia, toda sessão.",
  "Consistência não é glamour. É aparecer no dia chuvoso, no dia com dor de cabeça, no dia que teve uma conversa difícil, no dia que não está com nada. E aparecendo nesses dias, você constrói algo que as pessoas que só aparecem nos bons dias nunca vão ter.",
  "Você já escolheu medicina. Agora precisa escolher todos os dias a preparação que essa escolha exige. A primeira escolha foi uma declaração de intenção. A segunda é a prova de que você quis dizer o que disse.",
  "Paciência com o processo não é indiferença com o resultado. Você pode querer muito a aprovação e ainda assim ter a maturidade de entender que ela não vai chegar antes de estar pronta. Urgência interna, paciência externa. Essa é a combinação que funciona.",
  "O pior erro que você pode cometer agora não é errar uma questão difícil. É não revisar o erro. É deixar a lacuna aberta, seguir em frente como se não importasse, e acumular buracos que no dia da prova vão aparecer todos ao mesmo tempo.",
  "Você não vai lembrar de tudo o que estudou. Ninguém lembra. Mas vai lembrar de uma quantidade significativa, e vai saber onde buscar o que esqueceu. Esse é o objetivo: não onisciência, mas uma base sólida o suficiente para funcionar sob pressão.",
  "A preparação para medicina é um investimento de retorno assimétrico. Você coloca anos de trabalho e, se fizer certo, ganha uma carreira inteira. O ROI é absurdo a favor de quem persiste. O único jeito de perder essa aposta é desistir antes do tempo.",
  "Foco profundo é uma das habilidades mais raras e mais valiosas do mundo atual. Enquanto todo mundo está fragmentado em dez telas, você pode desenvolver a capacidade de se concentrar de verdade por horas. Isso é vantagem competitiva pura — e é construída na prática diária.",
  "Estude difícil quando está fácil, e vai estudar fácil quando ficar difícil. Essa é a lógica da preparação antecipada. O candidato que só estuda em pânico fica sempre correndo atrás — e geralmente chega tarde.",
  "Medicina é uma das poucas profissões onde incompetência tem consequência direta sobre a vida de outra pessoa. Essa responsabilidade não deveria pesar como fardo — deveria pesar como honra. Você está se formando para ser confiável, para ser aquela pessoa que alguém chama quando está com medo.",
  "Determinação não é rigidez. É saber o objetivo com tanta clareza que você consegue flexibilizar o caminho sem perder o destino. Se uma estratégia não funciona, mude a estratégia. Se um método não serve, troque o método. Mas não negocie o objetivo.",
  "A revisão espaçada não é técnica de estudo avançada. É como o cérebro humano funciona. Você não pode mudar a neurociência — pode usá-la a seu favor ou ignorá-la e pagar o preço. Revisar no momento certo é a diferença entre lembrar e esquecer.",
  "Você está construindo um banco de conhecimento. Cada conceito que você entende de verdade é um ativo permanente. Cada decoreba que não foi consolidada é um passivo que vai aparecer na hora errada. Invista no ativo. Minimize o passivo.",
  "O candidato ideal para a residência que você quer não existe ainda — você está no processo de se tornar ele. Cada dia de preparação é uma construção em direção a esse candidato. A pergunta é: a versão que aparece na prova vai ser boa o suficiente?",
  "Paciência real é trabalhar bem hoje sem saber quando o resultado vem. É não precisar da aprovação imediata para continuar. É operar com confiança no processo mesmo quando os indicadores ainda não te dão razão. Isso é maturidade, e ela é construída, não dada.",
  "Os dias mais produtivos da sua preparação não vão parecer os mais produtivos enquanto estão acontecendo. Vão parecer dias normais. Será só olhando para trás, semanas depois, que você vai perceber o quanto aqueles dias normais te moveram. Confie nos dias normais.",
  "Você vai comparar seu progresso com o de alguém que parece estar na sua frente. Antes de aceitar essa narrativa, pergunte: você tem os dados reais do progresso dessa pessoa, ou só as highlights que ela mostra? Comparação sem dados é ficção, e ficção não te ajuda a estudar.",
  "Foco não é sobre nunca se distrair. É sobre quantas vezes você consegue se reconectar após a distração. Um estudante que se distrai dez vezes e volta dez vezes é mais eficiente do que um que se distrai uma vez e fica uma hora nela. A métrica é a reconexão, não a perfeição.",
  "Tem algo de filosófico em estudar medicina: você está comprometendo anos do seu presente para servir melhor pessoas que ainda não conhece no futuro. É uma forma de altruísmo que exige sacrifício real. Esse propósito, quando interiorizado, é combustível que não acaba.",
  "A pressão que você sente agora é real, mas não é permanente. Ela vai passar — ou pela aprovação ou pela conclusão do processo. O que vai durar é quem você se tornou durante esse período: mais disciplinado, mais focado, mais capaz de sustentar esforço por longo prazo.",
  "Você não precisa ser perfeito. Precisa ser constante. A perfeição paralisa — ela faz você esperar o momento ideal, a sessão perfeita, o dia certo. A constância libera — te faz aparecer agora, com o que você tem, no estado em que você está. Constância supera perfeição toda vez.",
  "Há dias que o único motivo para abrir o livro é porque você disse que ia abrir. E isso é suficiente. Você não precisa de razão profunda todo dia — precisa de compromisso. O compromisso carrega você nos dias em que a razão não aparece.",
  "Foco é a capacidade de escolher onde colocar a atenção e mantê-la lá o tempo suficiente para que algo real aconteça. Isso não é dom — é decisão. Você decide onde olhar. Você decide quanto tempo olha. Você decide o que fazer quando o olhar desvia.",
  "O estudante que passa não é o que mais sofreu. É o que trabalhou com mais inteligência e consistência. Sofrimento não converte em aprovação. Trabalho bem feito, sim. Pare de romantizar o sacrifício e comece a otimizar o método.",
  "Cada dia que você mantém o ritmo, mesmo sem vontade, você está depositando em uma conta que vai ser sacada no dia da prova. Como toda conta bancária, o saldo reflete exatamente o que foi depositado. Não existe saldo que você não construiu.",
  "Paciência não é resignação com a mediocridade. É a compreensão de que resultados excepcionais emergem de processos excepcionais que levam tempo. Seja impaciente com o esforço diário e paciente com o resultado que esse esforço produz.",
  "Você vai errar. Vai errar muito. A questão não é não errar — é o que você faz com cada erro. O estudante que analisa cada erro, entende a origem, resolve a lacuna e segue em frente transforma falha em crescimento. Esse é o único uso válido do erro.",
  "A medicina que você vai praticar no futuro é função direta da medicina que você estudou agora. Não existe upgrade automático depois de passar. O nível de compreensão que você constrói durante a preparação é a base sobre a qual tudo mais vai ser construído. Construa bem.",
  "Determinação não é sobre intensidade de sentimento. É sobre consistência de ação. Você pode não sentir nada de especial e ainda assim fazer exatamente o que precisa ser feito. De fato, os mais consistentes frequentemente operam com emoção neutra — não inspirados, só presentes.",
  "O que você leva da preparação para a residência não é só o conhecimento técnico. É a capacidade de aprender rápido, de funcionar sob pressão, de identificar o que não sabe e buscar a resposta. Esse meta-aprendizado é o presente que o processo dá para quem o leva a sério.",
  "Consistência cria confiança. Não a confiança falsa de quem se acha bom — a confiança real de quem sabe o que fez. Quando você chega na prova sabendo que preparou de forma honesta e consistente, a ansiedade tem menos espaço. O trabalho feito é a melhor vacina contra o medo.",
  "A primeira hora de estudo do dia é a mais valiosa. Não porque você é mais inteligente nessa hora — mas porque ainda não foi drenado por decisões, interações e estímulos aleatórios. Proteja essa janela com obsessão.",
  "Você está estudando agora para construir um futuro que ainda não consegue ver com clareza. Isso exige uma forma de fé — não religiosa, mas racional. A fé de que processo consistente e método correto produzem resultado. Essa fé se sustenta em evidência histórica, não em esperança vaga.",
  "O silêncio do estudo solitário é onde a maioria das pessoas desiste. Sem plateia, sem validação, sem prova imediata de que está funcionando. Só você, o material e a escolha de continuar. É exatamente nesse silêncio que o caráter se forma.",
  "Foco profundo ativa regiões do cérebro que atenção fragmentada nunca alcança. É em estado de foco profundo que as conexões neurais mais sofisticadas são formadas, que o aprendizado mais duradouro acontece. Você está literalmente construindo um cérebro diferente quando escolhe profundidade.",
  "Você vai ter períodos de platô onde nada parece crescer. Os simulados ficam iguais, a sensação de progresso some. Esses períodos não são estagnação — são consolidação. O conhecimento está sendo organizado internamente antes de se manifestar como performance. Continue.",
  "A diferença entre quem desiste e quem continua frequentemente não é força — é a narrativa sobre o que a dificuldade significa. Um acha que dificuldade significa que não é para ele. O outro acha que dificuldade significa que está crescendo. Você escolhe qual narrativa adotar.",
  "Determinação a longo prazo precisa de propósito claro. 'Quero passar' não é propósito suficiente — é objetivo. Propósito é por que você quer passar, quem você quer ser como médico, qual diferença você quer fazer. Quando o objetivo fraqueja, o propósito sustenta.",
  "Paciência com o aprendizado é entender que o cérebro precisa de tempo para consolidar. Você não pode forçar compreensão. Pode criar as condições para ela — exposição repetida, sono adequado, revisão espaçada — e depois ter paciência para que aconteça no seu tempo.",
  "O caminho para a residência que você quer é mais claro do que parece. Não é misterioso. É longa dedicação ao conteúdo certo, com método eficaz, de forma consistente. O que obscurece o caminho não é complexidade — é a resistência de fazer o que você já sabe que precisa ser feito.",
  "O que você evita estudar é exatamente o que você mais precisa estudar. Essa é a lei cruel do aprendizado: a resistência indica a lacuna. A próxima vez que você sentir aquele impulso de pular um tema, está recebendo uma informação valiosa sobre onde sua energia deve ir.",
  "Consistência composta é a força mais poderosa em preparação. Assim como juros compostos crescem exponencialmente, conhecimento consistentemente revisado cresce de forma que parece desproporcional ao esforço. Você não vai ver isso no começo. Vai ver lá na frente, quando precisar.",
  "A determinação que importa não é a que você declara — é a que você demonstra. Não nas histórias que conta sobre o quanto está estudando, mas nas horas que estão no registro, nos erros que estão corrigidos, no conteúdo que está no flashcard. Evidência, não narrativa.",
  "Você não precisa que estudar seja prazeroso para que seja produtivo. Pode ser difícil, cansativo, até chato — e ainda assim ser exatamente o que precisa ser feito. A tolerância ao desconforto do esforço é uma habilidade adulta, e medicina exige que você a desenvolva.",
  "Quando tudo converge — quando você está estudando bem, revisando com método, dormindo o necessário, mantendo a consistência — você sente. Há uma sensação de estar no controle, de saber que está no caminho, completamente diferente da ansiedade de quem corre sem direção.",
  "A madrugada de estudo não é prova de dedicação. Pode ser prova de má gestão de tempo durante o dia. Prefira estudar bem durante o dia e dormir bem à noite do que estudar mal à noite e prejudicar o dia seguinte. Sono é performance, não fraqueza.",
  "Consistência com o método certo é o único atalho real que existe. Não é um atalho de tempo — ainda vai demorar. É um atalho de desperdício: você não gasta energia em coisas que não funcionam. Encontre o método, aplique de forma consistente, confie no processo.",
  "Quando você dominar um conteúdo de verdade — não decorou, dominou — vai querer compartilhar, vai conseguir explicar, vai notar as aplicações no cotidiano. Esse nível não vem de qualquer estudo. Vem de estudo profundo, revisão consistente e tempo. Construa isso.",
  "Você está em um processo que vai moldar quem você é como profissional pelo resto da carreira. Não é só sobre passar na prova. É sobre se tornar o tipo de médico que você admiraria ser atendido por ele. Que padrão é esse? Está estudando para esse padrão?",
  "A determinação que você precisa não é a de um sprint — é a de uma maratona. Sprints são intensos e curtos. Maratonas são sustentadas e longas. A preparação para residência é maratona. Calibre sua energia de acordo.",
  "Paciência é confiar que o que você está fazendo hoje vai importar mais tarde, mesmo que hoje não dê nenhuma evidência disso. É o tipo de fé que só o tempo valida. E o tempo sempre valida — desde que o trabalho tenha sido feito.",
  "O foco que você treina agora vai ser útil na residência, na carreira, na vida. A capacidade de estar completamente presente numa situação clínica difícil, de não ser distraído pelo cansaço ou pela emoção, começa a ser construída agora, nessa sessão, nessa escolha de voltar ao material.",
  "Medicina é uma das profissões mais exigentes da humanidade. Quem escolhe esse caminho está dizendo implicitamente: eu aceito ser cobrado num nível que a maioria das profissões não exige. Aceite essa cobrança. Corresponda a ela. Não existe medicina boa sem preparação exigente.",
  "O estudante que você quer ser amanhã está sendo construído pelas escolhas que você faz hoje. Não existe outra forma. A versão futura de você não vai aparecer de repente — vai emergir do acúmulo de decisões que o presente você está tomando agora.",
  "Foco é um presente que você dá ao material. Quando você está com foco real, está tratando o conteúdo — e o seu próprio esforço — com o respeito que merecem. Atenção fragmentada é desrespeito com o seu próprio investimento.",
  "Você vai carregar o peso da preparação. E depois vai carregar o resultado dela. Os dois têm peso diferente. O peso da preparação é cansativo mas temporário. O resultado que ela produz é permanente. Escolha com qual peso quer viver.",
  "Determinação não escolhe horário conveniente. Ela aparece no sábado de manhã quando você preferiria dormir, na sexta à noite quando todo mundo saiu. Esses são os momentos que criam a diferença entre candidatos com a mesma capacidade.",
  "Paciência com o processo inclui paciência com a velocidade do resultado. Você pode estar progredindo mais do que percebe. O cérebro processa e consolida em profundidade antes de liberar como performance visível. Confie no trabalho invisível que está acontecendo.",
  "A ansiedade antes da prova é informação: ela te diz que o objetivo importa. Use-a como combustível, não como freio. O candidato que não sente nada antes de uma prova de residência provavelmente não quer o suficiente. Você quer. Deixe esse querer te mover.",
  "Você está construindo um patrimônio intelectual. Cada conceito entendido de verdade é parte desse patrimônio. Diferente de patrimônio financeiro, não pode ser roubado, não deprecia, não é afetado por crise. É absolutamente seu. Acumule com consciência.",
  "O foco que você pratica no estudo é o mesmo foco que vai salvar vidas. A capacidade de desligar o ruído externo e estar completamente presente numa situação crítica começa a ser desenvolvida agora, nessa sessão, nessa escolha de não pegar o celular.",
  "Quando você domina medicina de verdade, você muda. A forma como você vê o mundo físico muda, sua percepção do corpo muda, sua relação com a vulnerabilidade humana muda. Esse é o verdadeiro resultado do estudo profundo — não só o score na prova, mas a transformação de quem você é.",
  "Consistência diária cria momentum. Momentum torna o trabalho mais fácil. Trabalho mais fácil cria mais consistência. Esse ciclo virtuoso não começa com motivação — começa com a decisão de aparecer uma vez, depois outra, depois outra.",
  "A primeira hora de estudo abre o canal. Depois que você entra no ritmo, continuar é mais fácil do que começar. O problema de quem não rende não é falta de talento — é que nunca supera o atrito inicial do começo. Supere esse atrito. Tudo fica mais fácil depois.",
  "Foco não é sobre velocidade. É sobre presença. Você pode ler rápido e não reter nada, ou ler devagar com atenção total e gravar para sempre. A velocidade do estudo importa menos do que a qualidade da atenção.",
  "A determinação que importa é aquela que persiste mesmo quando não tem audiência. Não quando você está posando de estudante — quando você está completamente só com o material, sem nenhuma recompensa imediata, e escolhe ficar.",
  "Paciência com o aprendizado é saber que o cérebro precisa de tempo para consolidar. Você não pode forçar compreensão. Pode criar as condições para ela — e depois ter a maturidade de esperar que aconteça no seu tempo, não no tempo da sua ansiedade.",
  "Você vai cruzar com candidatos que parecem saber mais que você. Lembre: aparência de preparo não é preparo. Foque no seu processo, não na performance alheia. A prova não mede quem pareceu mais preparado — mede quem estava.",
  "A medicina boa é consequência de estudo honesto, não de estudo estratégico. Estudar para a prova com atalhos pode funcionar no curto prazo. Mas o médico que vai existir no plantão daqui a cinco anos é feito do que você realmente aprendeu, não do que fingiu saber.",
  "Determinação e paciência não são opostos. São complementares. Determinação é a força que te mantém em movimento. Paciência é a sabedoria que te mantém no caminho certo sem queimar na pressa. Os dois juntos são imbatíveis.",
  "Quando o resultado chegar — e vai chegar — você vai olhar para o processo e entender que o resultado foi justo. Não porque o mundo é justo, mas porque você foi honesto com o processo. O processo honesto produz resultados proporcionais. Confie nisso.",
  "Consistência é o ato de cuidar do seu objetivo todos os dias, não só quando você sente que vai dar certo. É o cuidado de quem sabe que resultado exige atenção diária, não só nos momentos de entusiasmo.",
  "Foco real produz um cansaço diferente. É o cansaço satisfatório de quem usou o cérebro de verdade, não o cansaço vazio de quem ficou em frente à tela sem processar nada. Aprenda a distinguir os dois — um indica trabalho real, o outro indica tempo perdido.",
  "A paciência mais difícil é a paciência com si mesmo. Com os seus próprios limites, o seu próprio ritmo, as suas próprias limitações. Mas é essa paciência que permite crescimento real — a que não se dobra à comparação com outros nem à impaciência de querer mais rápido do que é possível.",
  "Todo candidato que você admira passou por exatamente o que você está passando agora. A dúvida, o cansaço, os dias ruins, a sensação de não ser suficiente. A diferença é que eles continuaram. Não porque eram especiais — porque eram consistentes.",
  "Você está no início de uma carreira que vai durar décadas. O que você constrói agora é a fundação. Fundações mal construídas criam problemas que aparecem só quando o peso é maior. Construa agora com a integridade que você vai precisar que a fundação tenha lá na frente.",
  "Determinação é saber o preço de algo e pagá-lo sem negociar. Você sabe o que a aprovação custa em tempo, em esforço, em privações. Ou você paga esse preço ou você não o paga. Não existe versão em que você consegue o resultado sem o custo correspondente.",
  "O foco que você constrói no estudo é treinamento para a atenção que vai definir você como médico. O médico que consegue estar completamente presente com um paciente, sem se dispersar em mil preocupações paralelas, começa a ser treinado agora.",
  "Paciência é a virtude do tempo longo. E medicina é sempre tempo longo. A graduação é longa. A especialização é longa. A carreira é longa. Quem não tem paciência com o tempo longo escolheu a profissão errada. Quem tem, escolheu certo.",
  "A conversa que você tem com você mesmo sobre o processo importa. Se você se diz constantemente que é difícil demais, que você não aguenta, que não vai dar certo — essas narrativas têm peso. Mude a narrativa sem mentir para si mesmo: 'está difícil, e eu continuo.'",
  "Determinação é o compromisso que você mantém mesmo quando ninguém está olhando, mesmo quando não tem recompensa imediata, mesmo quando é difícil. É o compromisso mais honesto que existe — feito com você mesmo, cobrado por você mesmo.",
  "Foco é a habilidade de dar a uma coisa mais atenção do que ela aparentemente merece, por tempo suficiente para que o entendimento real emerja. A maioria das pessoas toca as coisas de leve. O estudante que domina vai fundo. É a profundidade que diferencia.",
  "Quando você estiver na residência, lembrará que houve um período em que era tudo incerto, em que você estudava sem saber se ia dar certo. E vai perceber que esse período foi exatamente onde você foi forjado. Valorize o processo enquanto ele está acontecendo.",
  "Paciência, foco, consistência e determinação não são traços separados. São expressões de uma única coisa: comprometimento real com aquilo que importa para você. Quando o comprometimento é real, as virtudes aparecem naturalmente. Quando não é, nenhuma delas aparece de forma sustentada.",
  "Você não precisa sentir que merece o sucesso antes de trabalhar por ele. Você trabalha por ele, e o mérito se constrói no processo. Ninguém 'merece' uma residência antes de se preparar para ela. O merecimento vem depois, não antes.",
  "Consistência ao longo do tempo produz um tipo de confiança que não pode ser forjada. A confiança de quem sabe o que fez, de quem pode olhar para trás e ver o trabalho, de quem chega na prova sabendo que preparou com honestidade. Essa confiança é invulnerável à ansiedade.",
  "Foco te protege de desperdiçar o recurso mais escasso que você tem: tempo. Com foco real, cada hora de estudo produz mais resultado do que duas horas fragmentadas. Você não tem mais tempo do que tem. Mas pode usar melhor o tempo que tem.",
  "A determinação necessária para medicina não é a de resolver um problema uma vez. É a de voltar ao mesmo problema até resolvê-lo, de estudar o mesmo conteúdo até dominá-lo, de aparecer no mesmo lugar dia após dia até o resultado chegar. É determinação de longa duração.",
  "Paciência não é passividade. É o estado ativo de confiar no processo enquanto você executa o processo. Você não espera o resultado — você trabalha em direção ao resultado com a tranquilidade de quem sabe que está no caminho certo.",
  "Cada semana que você mantém a consistência, você está criando distância do candidato que você era antes. Essa distância acumula de forma que, depois de alguns meses, você olha para trás e quase não reconhece o nível de onde partiu. Isso é crescimento real. Só aparece para quem permanece.",
  "O aprendizado médico tem uma característica única: é cumulativo e retroativo. Conteúdo novo ilumina conteúdo antigo com nova perspectiva. E conteúdo antigo bem consolidado facilita o novo. Isso significa que todo o trabalho que você faz tem valor além do imediato.",
  "Foco e determinação juntos criam uma forma de estudo que é rara e poderosa: você está no lugar certo, fazendo a coisa certa, com atenção total, por tempo suficiente. Quando todos os elementos estão alinhados assim, o aprendizado acontece em nível diferente.",
  "O que você faz nos momentos em que ninguém está vendo — nenhum professor, nenhum colega, nenhuma câmera — é quem você realmente é como estudante. Seja esse estudante de forma consistente, e o resultado vai espelhar essa consistência.",
  "O momento em que você mais precisará do que está aprendendo agora não será num simulado — será num plantão. Será com alguém olhando para você esperando que você saiba. Será com a vida de alguém no limite. Estude com essa responsabilidade. Ela é real.",
  "Consistência, foco, determinação e paciência não são quatro virtudes separadas. São quatro ângulos da mesma pedra: o comprometimento genuíno com algo maior do que o conforto imediato. Quando você tem isso, a aprovação não é questão de se — é questão de quando.",
  "O dia que você passar na residência que sempre quis, vai olhar para esse período e entender que cada sessão de estudo, cada revisão, cada erro analisado, cada hora de presença foi necessária. Nada foi desperdiçado. Tudo foi construção. E a construção foi você.",
]

// ─── Dashboard Content ──────────────────────────────────────────
function DashboardContent() {
  const router = useRouter()
  const { user, isAdmin, accountType } = useAppShell()

  const [stats, setStats] = useState({
    questionsAnswered: 0,
    examsCompleted: 0,
    flashcardsStudied: 0,
    streakDays: 0,
  })
  const [recentExams, setRecentExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [phraseIndex, setPhraseIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)
  )
  const [showLyrics, setShowLyrics] = useState(false)
  const lyricsScrollRef = useRef<HTMLDivElement>(null)
  const activePhraseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(i => (i + 1) % MOTIVATIONAL_PHRASES.length)
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  // On open: position instantly (no visible scroll animation)
  useEffect(() => {
    if (showLyrics) {
      const t = setTimeout(() => {
        activePhraseRef.current?.scrollIntoView({ behavior: 'instant', block: 'center' })
      }, 50)
      return () => clearTimeout(t)
    }
  }, [showLyrics])

  // On phrase change while already open: smooth scroll
  useEffect(() => {
    if (showLyrics) {
      activePhraseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [phraseIndex]) // eslint-disable-line react-hooks/exhaustive-deps
  const [userStats, setUserStats] = useState({
    cronogramasCreated: 0,
    flashcardsCreated: 0,
    personalExamsCreated: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const [statsRes, examsRes, cronogramasRes] = await Promise.all([
        fetch('/api/user/statistics'),
        fetch('/api/exams?limit=3'),
        fetch('/api/cronogramas'),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats({
          questionsAnswered: data.questionsAnswered || 0,
          examsCompleted: data.examsCompleted || 0,
          flashcardsStudied: data.flashcardsStudied || 0,
          streakDays: data.streakDays || 0,
        })
      }

      if (examsRes.ok) {
        const data = await examsRes.json()
        setRecentExams((data.exams || []).slice(0, 3))
      }

      if (cronogramasRes.ok) {
        const data = await cronogramasRes.json()
        const cronogramas = data.cronogramas || []
        setUserStats(prev => ({ ...prev, cronogramasCreated: cronogramas.length }))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const firstName = user?.name?.split(' ')[0] || ''

  // ─── Stats Config ──────────────────────────────────────────────
  const quickStats = [
    {
      label: 'Questoes Respondidas',
      value: stats.questionsAnswered,
      icon: FileText,
      color: '#468152',
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    {
      label: 'Provas Realizadas',
      value: stats.examsCompleted,
      icon: Trophy,
      color: '#E2A43E',
      gradient: 'from-amber-500/20 to-amber-600/5',
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    },
    {
      label: 'Flashcards Estudados',
      value: stats.flashcardsStudied,
      icon: Brain,
      color: '#8b5cf6',
      gradient: 'from-violet-500/20 to-violet-600/5',
      iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    },
    {
      label: 'Dias de Estudo',
      value: stats.streakDays,
      icon: Flame,
      color: '#f97316',
      gradient: 'from-orange-500/20 to-orange-600/5',
      iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    },
  ]

  // ─── Quick Actions Config ──────────────────────────────────────
  const quickActions = [
    {
      title: 'Provas',
      description: 'Simulados e avaliacoes',
      icon: FileText,
      href: '/provas',
      color: '#468152',
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      hoverGradient: 'hover:from-emerald-500/20 hover:to-emerald-600/10',
    },
    {
      title: 'Flashcards IA',
      description: 'Gerados por IA, repeticao espacada',
      icon: Brain,
      href: '/flashcards/ia',
      color: '#8b5cf6',
      gradient: 'from-violet-500/10 to-violet-600/5',
      hoverGradient: 'hover:from-violet-500/20 hover:to-violet-600/10',
    },
    {
      title: 'Aulas',
      description: 'Video-aulas e materiais',
      icon: Video,
      href: '/aulas',
      color: '#3b82f6',
      gradient: 'from-blue-500/10 to-blue-600/5',
      hoverGradient: 'hover:from-blue-500/20 hover:to-blue-600/10',
    },
    {
      title: 'Cronogramas',
      description: 'Planeje seus estudos',
      icon: Calendar,
      href: '/cronogramas',
      color: '#E2A43E',
      gradient: 'from-amber-500/10 to-amber-600/5',
      hoverGradient: 'hover:from-amber-500/20 hover:to-amber-600/10',
    },
    {
      title: 'Manual Clínico',
      description: 'Patologias e farmacologia',
      icon: HeartPulse,
      href: '/manual-clinico',
      color: '#ef4444',
      gradient: 'from-red-500/10 to-rose-600/5',
      hoverGradient: 'hover:from-red-500/20 hover:to-rose-600/10',
    },
    {
      title: 'Forum',
      description: 'Discussoes e ajuda',
      icon: MessageCircle,
      href: '/forum',
      color: '#ec4899',
      gradient: 'from-pink-500/10 to-pink-600/5',
      hoverGradient: 'hover:from-pink-500/20 hover:to-pink-600/10',
    },
    {
      title: 'Meu Perfil',
      description: 'Configuracoes e dados',
      icon: User,
      href: '/profile',
      color: '#64748b',
      gradient: 'from-slate-500/10 to-slate-600/5',
      hoverGradient: 'hover:from-slate-500/20 hover:to-slate-600/10',
    },
  ]

  // ─── Smart study insights ─────────────────────────────────────
  const insights = useMemo(() => {
    const items = []
    if (stats.streakDays >= 7) {
      items.push({
        icon: Flame,
        color: '#f97316',
        title: `${stats.streakDays} dias seguidos!`,
        description: 'Consistencia e o segredo. Continue assim!',
      })
    } else if (stats.streakDays > 0) {
      items.push({
        icon: Target,
        color: '#468152',
        title: 'Construa sua sequencia',
        description: `Voce tem ${stats.streakDays} dia${stats.streakDays > 1 ? 's' : ''} de estudo. Tente chegar a 7!`,
      })
    } else {
      items.push({
        icon: Sparkles,
        color: '#8b5cf6',
        title: 'Comece sua jornada hoje',
        description: 'Estude um pouco todos os dias para construir uma sequencia.',
      })
    }

    if (stats.flashcardsStudied > 0 && stats.questionsAnswered > 0) {
      const ratio = stats.flashcardsStudied / stats.questionsAnswered
      if (ratio < 0.5) {
        items.push({
          icon: Brain,
          color: '#8b5cf6',
          title: 'Reforce com Flashcards',
          description: 'A repeticao espacada aumenta a retencao em ate 200%.',
        })
      }
    }

    items.push({
      icon: Lightbulb,
      color: '#E2A43E',
      title: 'Dica de estudo',
      description: 'Revise conteudos dificeis antes de dormir para melhor consolidacao.',
    })

    return items.slice(0, 3)
  }, [stats])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">

      {/* ═══ SPOTIFY LYRICS OVERLAY ═══════════════════════════════ */}
      <AnimatePresence>
        {showLyrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <Quote className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white/50 tracking-[0.15em] uppercase">Frases</span>
              </div>
              <button
                onClick={() => setShowLyrics(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable phrases list */}
            <div
              ref={lyricsScrollRef}
              className="flex-1 overflow-y-auto py-16 px-6 sm:px-16 md:px-28 lg:px-48"
            >
              <div className="space-y-12 max-w-2xl mx-auto">
                {MOTIVATIONAL_PHRASES.map((phrase, i) => {
                  const distance = Math.abs(i - phraseIndex)
                  const isCurrent = i === phraseIndex
                  return (
                    <motion.div
                      key={i}
                      ref={isCurrent ? activePhraseRef : undefined}
                      animate={{
                        opacity: isCurrent ? 1 : distance === 1 ? 0.28 : distance === 2 ? 0.15 : 0.07,
                      }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                      className="cursor-pointer group"
                      onClick={() => setPhraseIndex(i)}
                    >
                      <p
                        className={
                          isCurrent
                            ? 'text-white text-xl sm:text-2xl font-semibold leading-relaxed'
                            : 'text-white text-lg sm:text-xl font-medium leading-relaxed group-hover:opacity-60 transition-opacity'
                        }
                      >
                        {phrase}
                      </p>
                      {isCurrent && (
                        <motion.div
                          layoutId="active-indicator"
                          className="mt-3 h-0.5 w-8 rounded-full bg-emerald-400"
                        />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Footer progress */}
            <div className="px-6 py-4 border-t border-white/8 flex items-center gap-4">
              <span className="text-xs font-mono text-white/25 tabular-nums w-16">
                {phraseIndex + 1} / {MOTIVATIONAL_PHRASES.length}
              </span>
              <div className="flex-1 h-px bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-400/50 rounded-full"
                  animate={{ width: `${((phraseIndex + 1) / MOTIVATIONAL_PHRASES.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ═══════════════════════════════════════════════════════
            1. HERO FOCUS SECTION
           ═══════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl hero-gradient text-white"
        >
          <div className="relative z-10 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* Left: Greeting + Context */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-white/70 tracking-wide uppercase">
                    {greeting}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  {firstName ? `${firstName}, ` : ''}
                  <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-amber-200 bg-clip-text text-transparent">
                    seja o foco.
                  </span>
                </h1>

                {/* Rotating Motivational Phrase */}
                <div className="flex items-start gap-3 max-w-lg">
                  <motion.div layout transition={{ layout: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }} className="relative pl-4 flex-1">
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-emerald-400/80 to-amber-400/50" />
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={phraseIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.55, ease: 'easeInOut' }}
                        className="text-emerald-50/90 text-sm sm:text-[15px] font-medium italic leading-relaxed"
                      >
                        {MOTIVATIONAL_PHRASES[phraseIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>
                  <button
                    onClick={() => setShowLyrics(true)}
                    className="mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white/40 hover:text-emerald-300 transition-all duration-200"
                    title="Ver todas as frases"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-white/60 max-w-lg text-sm sm:text-base leading-relaxed">
                  Cronogramas, flashcards e provas com ementas completas de Ciências Médicas, Ciências Psicossociais, Ciências Biomédicas e Ciências Odontológicas.
                </p>

                {/* Academic Focus Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Ciências Médicas
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Ciências Psicossociais
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Ciências Biomédicas
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
                    <BookOpen className="h-3.5 w-3.5" />
                    Ciências Odontológicas
                  </span>
                </div>
              </div>

              {/* Right: Quick Resume Button */}
              <div className="flex flex-col items-start sm:items-end gap-3">
                <Button
                  onClick={() => router.push('/provas')}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm rounded-xl px-6 h-12 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-white/5 group"
                >
                  <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Continuar Estudando
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Streak Indicator */}
                {stats.streakDays > 0 && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span>{stats.streakDays} dias consecutivos</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subtle dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          {/* Decorative Orbs */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        </motion.section>

        {/* ═══════════════════════════════════════════════════════
            2. PERFORMANCE OVERVIEW CARDS
           ═══════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
                className={`
                  glass-stat stat-card-glow rounded-2xl p-4 sm:p-5
                  hover-glow-brand hover-lift
                  transition-all duration-300 cursor-default group
                `}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }}
                />
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`
                      p-2.5 rounded-xl ${stat.iconBg}
                      group-hover:scale-110 transition-transform duration-300
                    `}
                  >
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <ProgressRing
                    value={stat.value}
                    max={Math.max(stat.value, 100)}
                    size={36}
                    strokeWidth={3}
                    color={stat.color}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                    <AnimatedNumber value={stat.value} delay={200 + index * 100} />
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </section>

        {/* Plan Limits Card - Free users */}
        {accountType === 'gratuito' && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <PlanLimitsCard
              accountType={accountType as AccountType}
              isAdmin={isAdmin}
              cronogramasCreated={userStats.cronogramasCreated}
              flashcardsCreated={userStats.flashcardsCreated}
              personalExamsCreated={userStats.personalExamsCreated}
              showUpgradeButton
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.55 }}
        >
          <PendingReviewReminder />
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            3. QUICK ACTION HUB
           ═══════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Acesso Rápido</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.15 + index * 0.06 }}
                  onClick={() => router.push(action.href)}
                  className={`
                    glass-action group relative p-5 sm:p-6 rounded-2xl text-left
                    transition-all duration-300 hover-glow-green hover-lift
                    hover:scale-[1.02] active:scale-[0.98]
                    bg-gradient-to-br ${action.gradient} ${action.hoverGradient}
                  `}
                >
                  {/* Icon */}
                  <div
                    className="mb-4 p-2.5 rounded-xl w-fit transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{
                      backgroundColor: `${action.color}15`,
                      boxShadow: 'none',
                    }}
                  >
                    <Icon
                      className="h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-300"
                      style={{ color: action.color }}
                    />
                  </div>

                  {/* Title + Description */}
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{action.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronRight
                      className="h-4 w-4"
                      style={{ color: action.color }}
                    />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            4. RECENT ACTIVITY TIMELINE
           ═══════════════════════════════════════════════════════ */}
        {recentExams.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">Atividade Recente</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/provas')}
                className="text-xs text-muted-foreground hover:text-foreground gap-1 group"
              >
                Ver todas
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* Horizontal scroll cards */}
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {recentExams.map((exam, index) => (
                <motion.div
                  key={exam._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.65 + index * 0.08 }}
                  onClick={() => router.push(`/exam/${exam._id}`)}
                  className="
                    glass-stat min-w-[260px] sm:min-w-[300px] flex-shrink-0 p-5 rounded-2xl
                    cursor-pointer group hover-glow-green hover-lift
                    transition-all duration-300
                  "
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {exam.numberOfQuestions} questoes
                      </p>
                    </div>
                    {exam.isPersonalExam ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium flex-shrink-0 ml-2 inline-flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        Pessoal IA
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium flex-shrink-0 ml-2">
                        Geral
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(exam.startTime).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              ))}

              {/* "See more" card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.85 }}
                onClick={() => router.push('/provas')}
                className="
                  min-w-[140px] flex-shrink-0 p-5 rounded-2xl
                  cursor-pointer group transition-all duration-300
                  border border-dashed border-border/50 hover:border-primary/30
                  flex flex-col items-center justify-center gap-2
                  hover:bg-primary/5
                "
              >
                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary font-medium transition-colors">
                  Ver todas
                </span>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ═══════════════════════════════════════════════════════
            5. SMART STUDY INSIGHTS
           ═══════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold tracking-tight">Insights de Estudo</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.75 + index * 0.08 }}
                  className="
                    glass-stat p-5 rounded-2xl
                    hover-glow-orange hover-lift
                    transition-all duration-300
                    group cursor-default
                  "
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2.5 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${insight.color}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: insight.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════
            6. MEUS MATERIAIS
           ═══════════════════════════════════════════════════════ */}
        <MeusMaterialsWidget />

        {/* ═══════════════════════════════════════════════════════
            7. DOAÇÕES PIX — Apoie o DomineAqui
           ═══════════════════════════════════════════════════════ */}
        <DashboardDoacaoSection />
      </div>
    </div>
  )
}

// ─── Meus Materiais Widget ──────────────────────────────────────
interface DashMaterial {
  _id: string
  title: string
  coverImage?: string
  type: string
  pricing: string
  _hasAccess?: boolean
  _isPurchased?: boolean
  _hasGroupAccess?: boolean
}

const TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  video: <Play className="h-4 w-4" />,
  video_embed: <Play className="h-4 w-4" />,
  flashcard_deck: <Brain className="h-4 w-4" />,
}

function MeusMaterialsWidget() {
  const router = useRouter()
  const [materials, setMaterials] = useState<DashMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/materiais', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { materials: [] })
      .then(d => {
        const mine = (d.materials || []).filter((m: DashMaterial) => m._hasAccess)
        setMaterials(mine)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && materials.length === 0) return null

  const visible = expanded ? materials : materials.slice(0, 4)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.78 }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between mb-3 group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Meus Materiais</h2>
          {!loading && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {materials.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/materiais?tab=mine"
            onClick={e => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group/link"
          >
            Ver todos
            <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {(expanded || true) && (
          <motion.div
            key="meus-materiais-content"
            initial={false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-stat rounded-2xl p-3 animate-pulse">
                    <div className="h-20 rounded-xl bg-muted mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {visible.map((m, i) => (
                    <motion.div
                      key={m._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href={`/materiais/${m._id}`}
                        className="group block glass-stat rounded-2xl overflow-hidden hover-lift transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                      >
                        <div className="relative h-20 bg-muted/40">
                          {m.coverImage ? (
                            <Image
                              src={m.coverImage}
                              alt={m.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                              {TYPE_ICON_MAP[m.type] ?? <Package className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-1.5 left-2">
                            <span className="text-[9px] font-bold text-white/80 uppercase tracking-wide">
                              {m.type === 'flashcard_deck' ? 'Flashcard' : m.type === 'video_embed' ? 'Vídeo' : m.type?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {m.title}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
                {materials.length > 4 && (
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="mt-3 w-full py-2 rounded-xl border border-dashed border-border/50 hover:border-primary/30 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                  >
                    {expanded
                      ? <><ChevronUp className="h-3 w-3" /> Ver menos</>
                      : <><ChevronDown className="h-3 w-3" /> Ver mais {materials.length - 4} materiais</>
                    }
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

// ─── Dashboard Donation Section ─────────────────────────────────
function DashboardDoacaoSection() {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.9 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
          <h2 className="text-lg font-semibold tracking-tight">Apoie o DomineAqui</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          {/* Conteúdo de doação (compacto) */}
          <DoacaoContent compact onDonateClick={() => setFormOpen(true)} />

          {/* Ranking lateral */}
          <div className="glass-stat rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">Top Doadores</h3>
            </div>
            <DoacaoRanking compact />
          </div>
        </div>
      </motion.section>

      <DoacaoForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  )
}

// ─── Main Page Component ────────────────────────────────────────
export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  )
}
