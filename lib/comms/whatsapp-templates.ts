// ────────────────────────────────────────────────────────────────────────────
// Biblioteca de templates de WhatsApp para o público de estudantes de medicina.
//
// Cada template já aplica um princípio de persuasão (ver Parte 5 do plano:
// prova social, autoridade, escassez legítima, reciprocidade, personalização,
// compromisso/consistência). Usados como ponto de partida no composer da
// Central Social-Media e no campo "Mensagem do 1º toque" das campanhas de
// leads — o admin edita livremente depois de inserir.
//
// Tokens aceitos: %nome%, %nome completo%, %cidade% (resolvidos com os dados
// reais do destinatário no envio) e {{persuasiveTag}}, {{campaignName}},
// {{totalStudents}}, {{campaignLeads}}, {{authority}} (variáveis de
// persuasão, resolvidas antes do envio — ver lib/comms/persuasion.ts).
// ────────────────────────────────────────────────────────────────────────────

export type WhatsappTemplateCategory =
    | 'reciprocidade'
    | 'prova-social'
    | 'autoridade'
    | 'compromisso'
    | 'escassez'
    | 'reengajamento'
    | 'checkin'

export interface WhatsappTemplate {
    key: string
    label: string
    category: WhatsappTemplateCategory
    text: string
}

export const WHATSAPP_TEMPLATE_CATEGORY_LABELS: Record<WhatsappTemplateCategory, string> = {
    reciprocidade: 'Reciprocidade (1º toque)',
    checkin: 'Check-in',
    'prova-social': 'Prova social',
    autoridade: 'Autoridade',
    compromisso: 'Compromisso',
    escassez: 'Escassez/urgência',
    reengajamento: 'Reengajamento',
}

export const WHATSAPP_TEMPLATES: WhatsappTemplate[] = [
    {
        key: 'primeiro-toque-material',
        label: 'Entrega do material (1º toque)',
        category: 'reciprocidade',
        text: 'Olá %nome%! 👋 Aqui está seu material *{{campaignName}}*. Qualquer dúvida, é só responder por aqui.',
    },
    {
        key: 'primeiro-toque-boas-vindas',
        label: 'Boas-vindas + valor imediato',
        category: 'reciprocidade',
        text:
            'Oi, %nome%! Seja bem-vindo(a) ao DomineAqui 🩺. Preparei algo pra te ajudar com {{persuasiveTag}} — ' +
            'confira o material que te enviei por e-mail. Bora estudar juntos?',
    },
    {
        key: 'checkin-abertura',
        label: 'Checagem pós-entrega',
        category: 'checkin',
        text: 'Oi, %nome%! Conseguiu abrir o material de *{{campaignName}}*? Se tiver qualquer dúvida, me chama por aqui 🙂',
    },
    {
        key: 'checkin-duvida',
        label: 'Oferecer ajuda com dúvidas',
        category: 'checkin',
        text: '%nome%, vi que baixou o material sobre {{persuasiveTag}}. Ficou alguma dúvida? Posso te ajudar a organizar os próximos passos dos estudos.',
    },
    {
        key: 'prova-social-depoimento',
        label: 'Depoimento de outro estudante',
        category: 'prova-social',
        text:
            '%nome%, olha o que um estudante nos contou: "consegui organizar meus estudos e evoluir muito em {{persuasiveTag}}". ' +
            'Já são {{totalStudents}} estudantes usando o DomineAqui. Quer ver como? 👇',
    },
    {
        key: 'prova-social-numeros',
        label: 'Números da comunidade',
        category: 'prova-social',
        text: '%nome%, {{totalStudents}} estudantes de medicina já usam o DomineAqui pra estudar {{persuasiveTag}}. Bora fazer parte também?',
    },
    {
        key: 'autoridade-conteudo-validado',
        label: 'Conteúdo validado (autoridade)',
        category: 'autoridade',
        text: '%nome%, nosso conteúdo sobre {{persuasiveTag}} é {{authority}} — feito pra quem leva a aprovação a sério. Dá uma olhada:',
    },
    {
        key: 'compromisso-aula-gratis',
        label: 'Convite p/ aula gratuita (micro-conversão)',
        category: 'compromisso',
        text: '%nome%, separei uma aula gratuita sobre {{persuasiveTag}} pra você. É o próximo passo natural depois do material — topa dar uma olhada?',
    },
    {
        key: 'compromisso-checklist',
        label: 'Checklist de estudos (compromisso)',
        category: 'compromisso',
        text: '%nome%, montei um checklist rápido pra você organizar os estudos de {{persuasiveTag}} essa semana. Quer que eu te mande?',
    },
    {
        key: 'escassez-vagas',
        label: 'Vagas limitadas (real)',
        category: 'escassez',
        text: '%nome%, a turma de {{persuasiveTag}} está com vagas limitadas. Se quiser garantir a sua, corre lá — depois eu te aviso quando fechar.',
    },
    {
        key: 'escassez-oferta-tempo',
        label: 'Condição especial com prazo (real)',
        category: 'escassez',
        text: '%nome%, a condição especial pra quem baixou {{campaignName}} termina em breve. Não deixa passar — dá uma olhada 👇',
    },
    {
        key: 'reengajamento-lead-frio',
        label: 'Reengajar lead que sumiu',
        category: 'reengajamento',
        text: 'Oi, %nome%! Faz um tempo que a gente não se fala 👋 Ainda está estudando {{persuasiveTag}}? Tenho novidades que podem te ajudar.',
    },
    {
        key: 'reengajamento-oferta-valor',
        label: 'Reengajar com valor novo',
        category: 'reengajamento',
        text: '%nome%, preparei um conteúdo novo sobre {{persuasiveTag}} que acho que vai te interessar. Posso te mandar?',
    },
]

export function getWhatsappTemplate(key: string): WhatsappTemplate | undefined {
    return WHATSAPP_TEMPLATES.find((t) => t.key === key)
}
