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
