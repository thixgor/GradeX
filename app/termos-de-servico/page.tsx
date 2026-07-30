import { Metadata } from 'next'
import { BackButton } from '@/components/back-button'

export const metadata: Metadata = {
  title: 'Termos de Serviço',
  description: 'Termos de Serviço da plataforma DomineAqui. Regras de uso, assinatura, cancelamento e responsabilidades.',
  alternates: { canonical: '/termos-de-servico' },
}

export default function TermosDeServicoPage() {
  return (
    <div className="bg-gradient-to-br from-background to-muted flex flex-col flex-1">
      <div className="container mx-auto px-4 py-8">
        <BackButton />

        <div className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm rounded-xl border p-6 sm:p-8 shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Termos de Serviço</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: Janeiro de 2025
          </p>

          <div className="prose prose-sm sm:prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar a plataforma DomineAqui, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Assinatura Plus+, Cancelamento e Reembolso</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Plano único:</strong> a assinatura Plus+ é o único plano pago da plataforma e libera todo o acervo — Manual Clínico, materiais, flashcards, aulas, mapas mentais, provas por IA, flashcards por IA e cronogramas. Os planos disponíveis diferem apenas em preço e duração.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Cancelamento:</strong> após cancelar a assinatura, você perde o acesso aos benefícios do Plus+ ao fim do período já pago. Nenhum novo valor é cobrado após o cancelamento.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Direito de arrependimento (art. 49 do CDC):</strong> você pode desistir da contratação em até 7 dias corridos contados da compra e receber a devolução do valor pago.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Limites de uso no período inicial:</strong> como o Plus+ dá acesso imediato a todo o acervo digital, a plataforma aplica limites de download por hora, por dia e um teto total durante os primeiros 7 dias de assinatura. Esses limites são dimensionados para o uso normal de um estudante e existem para proteger o acervo contra extração em massa. Eles são ampliados automaticamente depois desse período, sem qualquer ação sua.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Registro de consumo:</strong> todo download é registrado (data, hora, conteúdo e endereço de rede) e cada arquivo entregue leva marca d&apos;água com a identificação da sua conta. Esse registro é usado para apurar o uso efetivo do serviço em caso de solicitação de reembolso ou contestação de cobrança.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Reembolso após uso:</strong> passados os 7 dias do direito de arrependimento, o valor não é reembolsável quando há registro de uso efetivo da plataforma. Pedidos fora desse prazo são avaliados caso a caso.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Efeitos do reembolso:</strong> aprovado o reembolso ou o estorno, o acesso Plus+ é encerrado imediatamente e a conta retorna ao plano gratuito. Contas que já tiveram uma assinatura reembolsada podem ficar temporariamente impedidas de assinar novamente; nesse caso, fale com o suporte.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Uso abusivo:</strong> download automatizado, redistribuição de material, remoção de marca d&apos;água ou compartilhamento de conta são violações destes Termos e podem levar à suspensão dos downloads ou ao encerramento da conta, sem direito a reembolso do período já utilizado.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Renovação Automática:</strong> as assinaturas são renovadas automaticamente no final de cada período de cobrança, a menos que sejam canceladas antes da data de renovação.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Uso da Conta</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Confidencialidade:</strong> Você não pode compartilhar seus dados de usuário (login e senha) com ninguém. O compartilhamento de conta resultará em banimento permanente da conta sem direito a reembolso.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Conta Única:</strong> A criação de múltiplas contas pelo mesmo usuário é estritamente proibida e resultará em banimento por endereço IP. Cada usuário deve possuir apenas uma conta ativa.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Responsabilidade:</strong> Você é responsável por manter a confidencialidade de sua conta e senha, e por todas as atividades que ocorram sob sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Propriedade Intelectual e Proteção de Conteúdo</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Direitos Autorais:</strong> Todo o conteúdo disponível na plataforma DomineAqui, incluindo mas não se limitando a vídeo-aulas, materiais didáticos, questões, provas e textos, é de propriedade exclusiva da DomineAqui LTDA e está protegido por leis de direitos autorais.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Gravação e Distribuição:</strong> É estritamente proibida a gravação, reprodução, distribuição ou compartilhamento de qualquer conteúdo da plataforma, incluindo vídeo-aulas. A gravação de vídeo-aulas onde apareça o CPF do usuário (watermark) resultará em medidas legais cabíveis segundo o Código Penal Brasileiro, incluindo processos por violação de direitos autorais (Lei nº 9.610/98).
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Uso Pessoal:</strong> O acesso ao conteúdo é concedido exclusivamente para uso pessoal e não comercial. Qualquer tentativa de comercialização, distribuição ou uso não autorizado do conteúdo será considerada violação destes termos.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Monitoramento:</strong> A plataforma utiliza tecnologias de watermarking e rastreamento para identificar usuários que violem estas políticas. Violações serão processadas judicial e extrajudicialmente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Conduta do Usuário</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos. É proibido:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Usar a plataforma de qualquer forma que viole leis federais, estaduais ou municipais</li>
                <li>Tentar obter acesso não autorizado a qualquer parte da plataforma</li>
                <li>Interferir ou interromper a integridade ou desempenho da plataforma</li>
                <li>Fazer upload ou transmitir vírus ou qualquer outro tipo de código malicioso</li>
                <li>Coletar ou rastrear informações pessoais de outros usuários</li>
                <li>Usar bots, scripts ou qualquer forma de automação não autorizada</li>
                <li>Fazer engenharia reversa de qualquer parte da plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Proctoring e Monitoramento de Provas</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Monitoramento:</strong> Determinadas provas podem ser monitoradas através de câmera e tela para garantir a integridade acadêmica. Ao iniciar uma prova com proctoring ativado, você concorda com o monitoramento.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Detecção de Fraude:</strong> Comportamentos suspeitos detectados durante provas monitoradas serão registrados e podem resultar em anulação da prova e suspensão da conta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Limitações de Serviço</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Disponibilidade:</strong> Embora nos esforcemos para manter a plataforma disponível 24/7, não garantimos que o serviço será ininterrupto ou livre de erros. Podemos suspender temporariamente o acesso para manutenção ou atualizações.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Limitações por Plano:</strong> Diferentes planos de assinatura possuem diferentes limitações quanto ao número de provas, questões, flashcards e outros recursos. Essas limitações estão claramente descritas em cada plano.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Modificações dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas através da plataforma ou por e-mail. O uso continuado da plataforma após modificações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Rescisão</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos encerrar ou suspender seu acesso à plataforma imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos de Serviço. Todas as disposições destes Termos que, por sua natureza, devam sobreviver à rescisão, sobreviverão, incluindo propriedade intelectual, isenções de garantia e limitações de responsabilidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Em nenhuma circunstância a DomineAqui LTDA, seus diretores, funcionários ou parceiros serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados ou outros intangíveis, resultantes do uso ou incapacidade de usar o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Lei Aplicável</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil, sem considerar conflitos de disposições legais. Qualquer disputa relacionada a estes Termos será submetida à jurisdição exclusiva dos tribunais brasileiros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre estes Termos de Serviço, entre em contato conosco através do chat de suporte na plataforma ou pelo telefone (24) 99223-0908.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
