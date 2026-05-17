import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Templates pré-definidos de e-mails
const emailTemplates = [
    {
        id: 'welcome-back',
        name: '🎉 Boas-vindas de Volta',
        description: 'Para reengajar usuários inativos',
        subject: 'Sentimos sua falta no DomineAqui! 🚀',
        previewText: 'Volte agora e confira as novidades que preparamos para você!',
        content: `
      <h1 style="text-align: center;">Ei, sentimos sua falta! 👋</h1>
      
      <p>Faz um tempo que você não aparece por aqui... e muita coisa mudou!</p>
      
      <p>Enquanto você estava fora, preparamos:</p>
      
      <div class="highlight-box">
        <p>✨ <strong>Novas provas</strong> para você testar seus conhecimentos</p>
        <p>📚 <strong>Novos conteúdos</strong> exclusivos</p>
        <p>🎮 <strong>Games educativos</strong> para aprender se divertindo</p>
        <p>💡 <strong>Flashcards inteligentes</strong> com IA</p>
      </div>
      
      <p>Não perca mais tempo! Seu futuro está esperando por você. 💪</p>
      
      <div style="text-align: center;">
        <a href="{{APP_URL}}" class="cta-button">🚀 Voltar a Estudar Agora</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="text-align: center; font-style: italic; color: #718096;">
        "O segredo do sucesso é começar. O segredo de começar é dividir tarefas complexas em pequenas tarefas praticáveis e começar pela primeira." - Mark Twain
      </p>
    `,
    },
    {
        id: 'new-content',
        name: '📢 Novo Conteúdo Disponível',
        description: 'Anunciar novos materiais ou aulas',
        subject: '🆕 Novidade fresquinha no DomineAqui!',
        previewText: 'Acabamos de liberar conteúdo novo para você dominar mais assuntos!',
        content: `
      <h1 style="text-align: center;">Conteúdo Novo no Ar! 🎯</h1>
      
      <p>Boas notícias! Acabamos de adicionar conteúdos novos que vão turbinar seus estudos.</p>
      
      <div class="highlight-box">
        <p><strong>📝 O que há de novo:</strong></p>
        <p>[Descreva aqui o novo conteúdo]</p>
      </div>
      
      <p>Não perca tempo! Quanto antes você começar, mais preparado você estará.</p>
      
      <div style="text-align: center;">
        <a href="{{APP_URL}}" class="cta-button">📚 Ver Novidades</a>
      </div>
      
      <p style="margin-top: 30px; text-align: center; color: #718096; font-size: 14px;">
        Lembre-se: consistência é a chave. Cada dia que você estuda é um passo mais perto do seu objetivo!
      </p>
    `,
    },
    {
        id: 'exam-reminder',
        name: '⏰ Lembrete de Prova',
        description: 'Avisar sobre prova próxima',
        subject: '⏰ Atenção: Prova acontecendo em breve!',
        previewText: 'Não esqueça de se preparar! A prova está chegando.',
        content: `
      <h1 style="text-align: center;">Prova à Vista! ⚠️</h1>
      
      <p>Olá! Este é um lembrete importante:</p>
      
      <div style="background-color: #fff3e0; border: 2px solid #f57c00; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
        <p style="font-size: 20px; font-weight: bold; color: #e65100; margin: 0;">
          📋 [Nome da Prova]
        </p>
        <p style="font-size: 16px; margin: 15px 0 0 0; color: #5d4037;">
          📅 Data: [Data e Hora]
        </p>
      </div>
      
      <p>Prepare-se bem! Revise os conteúdos, faça simulados e descanse na véspera.</p>
      
      <div class="highlight-box">
        <p><strong>💡 Dicas de última hora:</strong></p>
        <p>• Revise os pontos principais</p>
        <p>• Faça exercícios práticos</p>
        <p>• Durma bem na noite anterior</p>
        <p>• Confie no que você estudou!</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{APP_URL}}/exams" class="cta-button">📝 Ir para Provas</a>
      </div>
      
      <p style="text-align: center; margin-top: 30px; font-weight: bold; color: #0f3d2e;">
        Você consegue! Boa sorte! 🍀
      </p>
    `,
    },
    {
        id: 'premium-promo',
        name: '🌟 Promoção Premium',
        description: 'Oferta especial para upgrade',
        subject: '🔥 Oferta IMPERDÍVEL: Upgrade para Premium!',
        previewText: 'Por tempo limitado: condições especiais para você virar Premium!',
        content: `
      <h1 style="text-align: center;">Oferta Especial! 🎁</h1>
      
      <p>Você ainda está usando a versão gratuita? Chegou a hora de dar o próximo passo!</p>
      
      <div style="background: linear-gradient(135deg, #0f3d2e 0%, #1a5c45 100%); color: white; padding: 30px; border-radius: 16px; text-align: center; margin: 25px 0;">
        <p style="font-size: 14px; margin: 0; opacity: 0.9;">POR TEMPO LIMITADO</p>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">[X]% DE DESCONTO</p>
        <p style="font-size: 16px; margin: 0;">no plano Premium Anual</p>
      </div>
      
      <p><strong>Com o Premium você tem:</strong></p>
      
      <div class="highlight-box">
        <p>✅ Acesso ilimitado a todas as provas</p>
        <p>✅ Questões geradas por IA sem limite</p>
        <p>✅ Flashcards infinitos</p>
        <p>✅ Estatísticas avançadas</p>
        <p>✅ Conteúdo exclusivo</p>
        <p>✅ Suporte prioritário</p>
      </div>
      
      <p style="text-align: center; font-weight: bold; color: #e65100;">
        ⚡ Oferta válida até [DATA]
      </p>
      
      <div style="text-align: center;">
        <a href="{{APP_URL}}/buy" class="cta-button">🚀 Quero Ser Premium!</a>
      </div>
      
      <p style="text-align: center; font-size: 13px; color: #718096; margin-top: 25px;">
        Não perca essa chance! Investir em você é o melhor investimento.
      </p>
    `,
    },
    {
        id: 'feedback-request',
        name: '💬 Pedido de Feedback',
        description: 'Solicitar opinião dos usuários',
        subject: 'Sua opinião vale ouro para nós! 💎',
        previewText: 'Ajude-nos a melhorar o DomineAqui com seu feedback!',
        content: `
      <h1 style="text-align: center;">Precisamos de Você! 🙏</h1>
      
      <p>Olá! Você faz parte da nossa comunidade e sua opinião é muito importante para nós.</p>
      
      <p>Estamos sempre buscando melhorar o DomineAqui e queremos saber:</p>
      
      <div class="highlight-box">
        <p>💭 O que você mais gosta na plataforma?</p>
        <p>🔧 O que podemos melhorar?</p>
        <p>💡 Que funcionalidades você gostaria de ver?</p>
      </div>
      
      <p>Seu feedback nos ajuda a construir a melhor experiência de estudos para você!</p>
      
      <div style="text-align: center;">
        <a href="[LINK_DO_FORMULARIO]" class="cta-button">📝 Dar Meu Feedback</a>
      </div>
      
      <p style="text-align: center; margin-top: 30px; font-style: italic; color: #718096;">
        Leva menos de 2 minutinhos, prometemos! 😊
      </p>
    `,
    },
    {
        id: 'study-tips',
        name: '📖 Dicas de Estudo',
        description: 'Compartilhar dicas e motivação',
        subject: '📚 Dicas de ouro para turbinar seus estudos!',
        previewText: 'Estratégias comprovadas para estudar melhor e lembrar mais!',
        content: `
      <h1 style="text-align: center;">Domine a Arte de Estudar! 🎓</h1>
      
      <p>Estudar não é só sobre quantidade, mas principalmente sobre <strong>qualidade</strong>!</p>
      
      <p>Separamos algumas técnicas poderosas para você:</p>
      
      <div class="highlight-box">
        <p><strong>🧠 Técnica Pomodoro:</strong></p>
        <p>Estude 25 minutos focado, descanse 5. Após 4 ciclos, descanse 15-30 minutos.</p>
      </div>
      
      <div class="highlight-box">
        <p><strong>🔄 Revisão Espaçada:</strong></p>
        <p>Revise o conteúdo em intervalos crescentes: 1 dia, 3 dias, 1 semana, 1 mês.</p>
      </div>
      
      <div class="highlight-box">
        <p><strong>🎯 Prática Ativa:</strong></p>
        <p>Fazer questões é mais eficiente que apenas ler. Teste-se constantemente!</p>
      </div>
      
      <p>Aplique essas técnicas nos seus estudos no DomineAqui!</p>
      
      <div style="text-align: center;">
        <a href="{{APP_URL}}" class="cta-button">📚 Começar a Praticar</a>
      </div>
      
      <p style="text-align: center; margin-top: 30px; font-weight: bold; color: #0f3d2e;">
        "A educação é a arma mais poderosa que você pode usar para mudar o mundo." - Nelson Mandela
      </p>
    `,
    },
    {
        id: 'achievement',
        name: '🏆 Parabéns por Conquista',
        description: 'Celebrar conquistas dos usuários',
        subject: '🏆 PARABÉNS! Você conquistou algo especial!',
        previewText: 'Sua dedicação está dando resultados! Veja sua conquista!',
        content: `
      <div style="text-align: center;">
        <p style="font-size: 60px; margin: 0;">🏆</p>
        <h1>Parabéns pela Conquista!</h1>
      </div>
      
      <p>Você é incrível! Sua dedicação e esforço estão dando resultados.</p>
      
      <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); padding: 30px; border-radius: 16px; text-align: center; margin: 25px 0;">
        <p style="font-size: 18px; margin: 0; color: #5d4037;">
          🎯 <strong>[Descrição da Conquista]</strong>
        </p>
      </div>
      
      <p>Cada pequeno passo conta. Continue assim e você chegará onde quer!</p>
      
      <div class="highlight-box">
        <p><strong>💪 Próximo Desafio:</strong></p>
        <p>[Sugira o próximo objetivo]</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{APP_URL}}" class="cta-button">🚀 Continuar Evoluindo</a>
      </div>
      
      <p style="text-align: center; margin-top: 30px; color: #718096;">
        Compartilhe sua conquista e inspire outros! 🌟
      </p>
    `,
    },
    {
        id: 'material-drop',
        name: '📎 Material Liberado',
        description: 'Enviar um material com promessa clara de valor',
        category: 'Conteúdo',
        subject: 'Separei um material que pode destravar seus estudos hoje',
        previewText: 'Abra para acessar o material e saber exatamente como usar.',
        content: `
      <h1 style="text-align: center;">Material novo para estudar melhor</h1>

      <p>Olá! Passando para te entregar um material selecionado para facilitar sua revisão e te ajudar a ganhar ritmo.</p>

      <div class="highlight-box">
        <p><strong>Como aproveitar melhor:</strong></p>
        <p>1. Leia primeiro os tópicos principais</p>
        <p>2. Marque os pontos que você ainda erra</p>
        <p>3. Volte para fazer questões sobre o tema</p>
      </div>

      <p>O recurso está logo abaixo. Abra, salve e use ainda hoje enquanto o assunto está fresco.</p>
    `,
    },
    {
        id: 'flashcard-push',
        name: '🧠 Deck de Flashcards',
        description: 'Promover um deck pronto para revisão ativa',
        category: 'Flashcards',
        subject: 'Revise em poucos minutos com estes flashcards',
        previewText: 'Um deck pronto para praticar revisão ativa sem perder tempo.',
        content: `
      <h1 style="text-align: center;">Treino rápido para fixar de verdade</h1>

      <p>Se você quer revisar sem ficar só relendo conteúdo, este deck foi feito para prática ativa.</p>

      <div class="highlight-box">
        <p><strong>Use assim:</strong> responda antes de virar o card, marque os difíceis e repita amanhã.</p>
      </div>

      <p>O deck está anexado abaixo. São poucos cliques para começar.</p>
    `,
    },
    {
        id: 'limited-offer',
        name: '⚡ Oferta Relâmpago',
        description: 'Campanha com urgência e CTA forte',
        category: 'Vendas',
        subject: 'Condição especial liberada por pouco tempo',
        previewText: 'Aproveite antes que a janela feche.',
        content: `
      <h1 style="text-align: center;">Uma condição especial para acelerar seus estudos</h1>

      <p>Hoje liberamos uma oportunidade com tempo limitado para quem quer estudar com mais consistência e menos improviso.</p>

      <div style="background: linear-gradient(135deg, #0f3d2e 0%, #1a5c45 100%); color: white; padding: 28px; border-radius: 16px; text-align: center; margin: 25px 0;">
        <p style="font-size: 13px; margin: 0; opacity: .88;">JANELA ESPECIAL</p>
        <p style="font-size: 28px; font-weight: bold; margin: 8px 0;">[Descreva a oferta]</p>
        <p style="font-size: 15px; margin: 0;">válida até [data/horário]</p>
      </div>

      <p>Se você estava esperando um empurrão para organizar seus estudos, esse é um bom momento.</p>

      <div style="text-align: center;">
        <a href="{{APP_URL}}/buy" class="cta-button">Ver condição especial</a>
      </div>
    `,
    },
    {
        id: 'challenge-7-days',
        name: '🎯 Desafio 7 Dias',
        description: 'Criar hábito e retorno diário',
        category: 'Engajamento',
        subject: 'Topa um desafio de 7 dias para voltar ao ritmo?',
        previewText: 'Um plano simples para estudar um pouco por dia e sentir progresso.',
        content: `
      <h1 style="text-align: center;">Desafio de 7 dias: estudo sem travar</h1>

      <p>Você não precisa esperar a motivação perfeita. Precisa de um começo pequeno, claro e repetível.</p>

      <div class="highlight-box">
        <p><strong>Seu desafio:</strong></p>
        <p>Dia 1: 10 questões</p>
        <p>Dia 2: revisar erros</p>
        <p>Dia 3: flashcards rápidos</p>
        <p>Dia 4 a 7: repetir o ciclo com foco nos temas difíceis</p>
      </div>

      <div style="text-align: center;">
        <a href="{{APP_URL}}/dashboard" class="cta-button">Começar o desafio</a>
      </div>
    `,
    },
    {
        id: 'cart-recovery',
        name: '🛒 Carrinho/Interesse',
        description: 'Recuperar compra ou interesse em material',
        category: 'Vendas',
        subject: 'Seu material ainda está te esperando',
        previewText: 'Volte para finalizar e liberar acesso ao conteúdo.',
        content: `
      <h1 style="text-align: center;">Ainda dá tempo de continuar</h1>

      <p>Você demonstrou interesse em um material que pode ajudar bastante na sua rotina de estudos.</p>

      <p>Se ficou alguma dúvida, pense no principal: esse recurso foi criado para encurtar caminho, organizar o conteúdo e te colocar em prática mais rápido.</p>

      <div style="text-align: center;">
        <a href="{{APP_URL}}/materiais" class="cta-button">Ver materiais</a>
      </div>

      <p style="text-align: center; color: #718096; font-size: 14px;">O acesso fica disponível na plataforma após a confirmação.</p>
    `,
    },
    {
        id: 'class-live',
        name: '🎥 Aula/Aviso Ao Vivo',
        description: 'Convite para aula, live ou encontro',
        category: 'Eventos',
        subject: 'Aula especial chegando: reserve esse horário',
        previewText: 'Veja tema, horário e link para participar.',
        content: `
      <h1 style="text-align: center;">Aula especial marcada</h1>

      <p>Vamos ter uma aula para trabalhar um tema que costuma gerar dúvidas e erros em prova.</p>

      <div style="background-color: #eef6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 22px; margin: 25px 0;">
        <p style="margin: 0 0 8px; font-weight: 700; color: #1e3a8a;">[Tema da aula]</p>
        <p style="margin: 0; color: #334155;">Data: [data] · Horário: [horário]</p>
      </div>

      <p>Entre alguns minutos antes e já deixe suas perguntas separadas.</p>

      <div style="text-align: center;">
        <a href="[LINK_DA_AULA]" class="cta-button">Entrar na aula</a>
      </div>
    `,
    },
    {
        id: 'weekly-digest',
        name: '🗓️ Resumo Semanal',
        description: 'Newsletter curta com novidades e próximos passos',
        category: 'Newsletter',
        subject: 'Seu resumo da semana no DomineAqui',
        previewText: 'Novidades, atalhos de estudo e o melhor próximo passo.',
        content: `
      <h1 style="text-align: center;">O que vale sua atenção esta semana</h1>

      <p>Separei um resumo direto para você não perder o que importa.</p>

      <div class="highlight-box">
        <p><strong>Novidades:</strong></p>
        <p>• [Novidade 1]</p>
        <p>• [Novidade 2]</p>
        <p>• [Novidade 3]</p>
      </div>

      <p><strong>Próximo passo recomendado:</strong> escolha um tema difícil e faça uma sessão curta de questões hoje.</p>

      <div style="text-align: center;">
        <a href="{{APP_URL}}/dashboard" class="cta-button">Abrir meu painel</a>
      </div>
    `,
    },
    {
        id: 'social-proof',
        name: '💬 Prova Social',
        description: 'Mostrar resultado, depoimento ou caso de uso',
        category: 'Confiança',
        subject: 'Olha como outros alunos estão usando o DomineAqui',
        previewText: 'Uma forma simples de estudar com mais consistência.',
        content: `
      <h1 style="text-align: center;">Um jeito mais inteligente de evoluir</h1>

      <p>Muitos alunos melhoram quando param de estudar no escuro e começam a acompanhar erros, revisar por flashcards e praticar com frequência.</p>

      <blockquote style="border-left: 4px solid #0f3d2e; padding-left: 18px; margin: 24px 0; color: #4a5568; font-style: italic;">
        "[Insira aqui um depoimento curto ou resultado real]"
      </blockquote>

      <p>Use isso como sinal: você também pode transformar estudo em rotina prática.</p>

      <div style="text-align: center;">
        <a href="{{APP_URL}}" class="cta-button">Continuar estudando</a>
      </div>
    `,
    },
    {
        id: 'new-feature',
        name: '✨ Nova Funcionalidade',
        description: 'Apresentar recurso novo com benefício claro',
        category: 'Produto',
        subject: 'Tem uma novidade no DomineAqui para você testar',
        previewText: 'Veja como usar o novo recurso nos seus estudos.',
        content: `
      <h1 style="text-align: center;">Novo recurso liberado</h1>

      <p>Acabamos de liberar uma melhoria pensada para deixar seus estudos mais simples e eficientes.</p>

      <div class="highlight-box">
        <p><strong>O que muda:</strong></p>
        <p>[Explique o recurso em uma frase clara]</p>
      </div>

      <p>Teste hoje e veja se esse fluxo encaixa na sua rotina.</p>

      <div style="text-align: center;">
        <a href="{{APP_URL}}" class="cta-button">Testar agora</a>
      </div>
    `,
    },
    {
        id: 'exam-results',
        name: '📊 Resultado/Correção',
        description: 'Chamar usuário para ver desempenho',
        category: 'Provas',
        subject: 'Seu resultado merece alguns minutos de atenção',
        previewText: 'Veja seus erros, revise os pontos fracos e planeje o próximo treino.',
        content: `
      <h1 style="text-align: center;">Use seu resultado como mapa</h1>

      <p>Resultado bom ou ruim, ele mostra exatamente onde vale colocar energia agora.</p>

      <div class="highlight-box">
        <p><strong>Depois de abrir:</strong></p>
        <p>• Veja as questões erradas</p>
        <p>• Anote o padrão dos erros</p>
        <p>• Revise o tema com flashcards ou material de apoio</p>
      </div>

      <div style="text-align: center;">
        <a href="{{APP_URL}}/provas" class="cta-button">Ver minhas provas</a>
      </div>
    `,
    },
    {
        id: 'renewal',
        name: '🔁 Renovação Premium',
        description: 'Renovar acesso antes de expirar',
        category: 'Retenção',
        subject: 'Seu acesso Premium está perto de expirar',
        previewText: 'Renove para não interromper sua rotina de estudos.',
        content: `
      <h1 style="text-align: center;">Não deixe seu ritmo quebrar</h1>

      <p>Seu acesso Premium está chegando ao fim. Para continuar com questões, flashcards, aulas e recursos avançados, você pode renovar agora.</p>

      <div class="highlight-box">
        <p><strong>Você mantém:</strong></p>
        <p>• Acesso aos conteúdos Premium</p>
        <p>• Rotina de questões e revisões</p>
        <p>• Ferramentas para acompanhar evolução</p>
      </div>

      <div style="text-align: center;">
        <a href="{{APP_URL}}/buy" class="cta-button">Renovar acesso</a>
      </div>
    `,
    },
    {
        id: 'maintenance',
        name: '🛠️ Aviso Importante',
        description: 'Comunicado operacional sem perder clareza',
        category: 'Avisos',
        subject: 'Aviso importante sobre a plataforma',
        previewText: 'Leia para saber o que muda e quando.',
        content: `
      <h1 style="text-align: center;">Aviso importante</h1>

      <p>Queremos te avisar com antecedência sobre uma atualização programada na plataforma.</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; margin: 25px 0;">
        <p style="margin: 0 0 8px; font-weight: 700; color: #0f172a;">Quando?</p>
        <p style="margin: 0; color: #475569;">[data e horário]</p>
      </div>

      <p>Nosso objetivo é melhorar sua experiência e manter tudo funcionando com estabilidade.</p>
    `,
    },
    {
        id: 'empty',
        name: '✏️ E-mail em Branco',
        description: 'Começar do zero',
        subject: '',
        previewText: '',
        content: `
      <h1 style="text-align: center;">[Título do E-mail]</h1>
      
      <p>[Escreva seu conteúdo aqui]</p>
      
      <div style="text-align: center;">
        <a href="{{APP_URL}}" class="cta-button">Acessar Plataforma</a>
      </div>
    `,
    },
]

export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        // Substituir {{APP_URL}} pelas URLs reais
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br'
        const templatesWithUrls = emailTemplates.map(t => ({
            ...t,
            content: t.content.replace(/\{\{APP_URL\}\}/g, appUrl),
        }))

        return NextResponse.json({ templates: templatesWithUrls })
    } catch (error) {
        console.error('Get templates error:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar templates' },
            { status: 500 }
        )
    }
}
