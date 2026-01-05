'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PoliticaDePrivacidadePage() {
  const router = useRouter()

  return (
    <div className="bg-gradient-to-br from-background to-muted flex flex-col flex-1">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm rounded-xl border p-6 sm:p-8 shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: Janeiro de 2025
          </p>

          <div className="prose prose-sm sm:prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A DomineAqui LTDA ("nós", "nosso" ou "DomineAqui") está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você utiliza nossa plataforma educacional.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Informações que Coletamos</h2>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Informações Pessoais</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Coletamos as seguintes informações pessoais quando você se cadastra e utiliza nossa plataforma:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>CPF (Cadastro de Pessoa Física)</li>
                <li>Data de nascimento</li>
                <li>Instituição de ensino e unidade (quando aplicável)</li>
                <li>Informações de pagamento (processadas através de gateways seguros)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Dados de Utilização</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Coletamos automaticamente informações sobre como você utiliza nossa plataforma:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Registros de acesso (logs) incluindo endereço IP, tipo de navegador e sistema operacional</li>
                <li>Páginas visitadas e tempo gasto em cada página</li>
                <li>Provas realizadas, pontuações e desempenho acadêmico</li>
                <li>Flashcards estudados e cronogramas criados</li>
                <li>Interações com vídeo-aulas e materiais didáticos</li>
                <li>Tickets de suporte e comunicações com nossa equipe</li>
                <li>Dados de proctoring quando aplicável (câmera, tela, detecção de comportamento)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Dados Acadêmicos e Universitários</h3>
              <p className="text-muted-foreground leading-relaxed">
                Coletamos informações sobre sua instituição de ensino, curso, período e desempenho acadêmico para personalizar sua experiência e melhorar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Como Utilizamos Suas Informações</h2>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.1 Melhoria da Plataforma</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Podemos usar seus dados de utilização, tickets e dados de sistema para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Aprimorar a performance e velocidade da plataforma</li>
                <li>Melhorar a experiência do usuário (UX/UI)</li>
                <li>Desenvolver novos recursos e funcionalidades</li>
                <li>Identificar e corrigir bugs e problemas técnicos</li>
                <li>Realizar análises estatísticas e pesquisas de comportamento do usuário</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Marketing e Expansão Institucional</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Podemos utilizar seus dados universitários para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Aprimorar a disponibilização de recursos específicos para sua instituição</li>
                <li>Estudar padrões de uso por instituição para melhor atender suas necessidades</li>
                <li>Desenvolver estratégias de marketing direcionadas a alunos da mesma instituição</li>
                <li>Criar conteúdos e materiais personalizados para diferentes cursos e universidades</li>
                <li>Estabelecer parcerias com instituições de ensino</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Prestação de Serviços</h3>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos suas informações para fornecer, manter e melhorar nossos serviços, incluindo processamento de pagamentos, suporte ao cliente, personalização de conteúdo e comunicação de atualizações importantes.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.4 Segurança e Integridade</h3>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos seus dados para detectar e prevenir fraudes, abusos, violações de segurança e atividades ilegais na plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Compartilhamento de Informações</h2>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.1 Não Vendemos Seus Dados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Não vendemos, alugamos ou comercializamos suas informações pessoais com terceiros para fins de marketing.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Compartilhamento Necessário</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Podemos compartilhar suas informações com:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Provedores de Serviços:</strong> Empresas terceirizadas que nos auxiliam na operação da plataforma (hospedagem, pagamentos, análise de dados)</li>
                <li><strong>Parceiros Educacionais:</strong> Instituições de ensino parceiras, apenas com seu consentimento explícito</li>
                <li><strong>Autoridades Legais:</strong> Quando exigido por lei, ordem judicial ou para proteger nossos direitos legais</li>
                <li><strong>Sucessores Comerciais:</strong> Em caso de fusão, aquisição ou venda de ativos da empresa</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Dados Agregados e Anonimizados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Podemos compartilhar dados estatísticos agregados e anonimizados que não identificam você pessoalmente para fins de pesquisa, análise de mercado e desenvolvimento de produtos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Cookies e Tecnologias de Rastreamento</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Manter você conectado durante sua sessão</li>
                <li>Lembrar suas preferências e configurações</li>
                <li>Analisar o uso da plataforma e o comportamento dos usuários</li>
                <li>Melhorar a segurança e detectar atividades fraudulentas</li>
                <li>Personalizar conteúdo e recomendações</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Você pode configurar seu navegador para recusar cookies, mas isso pode limitar algumas funcionalidades da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Proteção de Dados</h2>

              <h3 className="text-xl font-semibold mb-2 mt-4">6.1 Medidas de Segurança</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Implementamos medidas técnicas e organizacionais para proteger suas informações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Criptografia de dados sensíveis em repouso</li>
                <li>Controles de acesso restrito a dados pessoais</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e planos de recuperação de desastres</li>
                <li>Auditorias de segurança periódicas</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">6.2 Retenção de Dados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Retemos suas informações pessoais pelo tempo necessário para fornecer nossos serviços, cumprir obrigações legais, resolver disputas e aplicar nossos acordos. Dados de desempenho acadêmico podem ser retidos por períodos mais longos para fins educacionais e histórico do usuário.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                De acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Acesso:</strong> Solicitar cópias de suas informações pessoais</li>
                <li><strong>Correção:</strong> Solicitar correção de informações incorretas ou incompletas</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão de suas informações pessoais (direito ao esquecimento)</li>
                <li><strong>Portabilidade:</strong> Solicitar a transferência de seus dados para outro provedor</li>
                <li><strong>Revogação de Consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados em determinadas situações</li>
                <li><strong>Informação:</strong> Ser informado sobre com quem compartilhamos seus dados</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Para exercer qualquer destes direitos, entre em contato conosco através do chat de suporte ou pelo e-mail de contato.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Dados de Menores de Idade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nossa plataforma é destinada a usuários maiores de 16 anos. Se você tem entre 16 e 18 anos, deve ter o consentimento de seus pais ou responsáveis para utilizar nossos serviços. Não coletamos intencionalmente informações de menores de 16 anos. Se tomarmos conhecimento de que coletamos dados de menores de 16 anos sem o consentimento parental adequado, tomaremos medidas para excluir essas informações.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Transferência Internacional de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados podem ser armazenados e processados em servidores localizados no Brasil ou em outros países. Ao utilizar nossos serviços, você consente com essa transferência. Garantimos que todos os parceiros internacionais atendam a padrões adequados de proteção de dados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Proctoring e Dados Biométricos</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Para provas com proctoring ativado:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Coletamos imagens de câmera e capturas de tela durante a prova</li>
                <li>Utilizamos detecção de movimento e comportamento suspeito</li>
                <li>Podemos utilizar reconhecimento facial para verificar identidade</li>
                <li>Esses dados são retidos apenas pelo período necessário para validação da prova</li>
                <li>Você será claramente informado antes de iniciar uma prova monitorada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Marketing e Comunicações</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Podemos enviar e-mails e notificações sobre:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Atualizações importantes da plataforma</li>
                <li>Novos recursos e funcionalidades</li>
                <li>Conteúdos educacionais relevantes</li>
                <li>Ofertas e promoções especiais</li>
                <li>Pesquisas de satisfação</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Você pode cancelar a inscrição em comunicações de marketing a qualquer momento, mas comunicações transacionais e de serviço essenciais ainda serão enviadas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Alterações nesta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou por razões legais. Notificaremos você sobre alterações significativas através da plataforma ou por e-mail. A data da última atualização será sempre indicada no topo desta política.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">13. Encarregado de Dados (DPO)</h2>
              <p className="text-muted-foreground leading-relaxed">
                Em conformidade com a LGPD, designamos um Encarregado de Proteção de Dados (DPO) responsável por garantir o cumprimento desta política. Para questões relacionadas à privacidade e proteção de dados, entre em contato através dos canais oficiais de comunicação.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">14. Bases Legais para Processamento</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Processamos seus dados pessoais com base em:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Consentimento:</strong> Quando você concorda explicitamente com o processamento</li>
                <li><strong>Execução de Contrato:</strong> Para fornecer os serviços que você contratou</li>
                <li><strong>Obrigação Legal:</strong> Para cumprir com leis e regulamentos aplicáveis</li>
                <li><strong>Interesses Legítimos:</strong> Para melhorar nossos serviços e proteger nossa plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">15. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre esta Política de Privacidade, exercício de direitos LGPD ou preocupações sobre como tratamos seus dados, entre em contato conosco:
              </p>
              <ul className="list-none text-muted-foreground space-y-2 mt-3">
                <li>• Chat de suporte na plataforma</li>
                <li>• Telefone: (21) 99777-0936</li>
                <li>• DomineAqui LTDA</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
