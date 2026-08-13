# Licença, publicação e atribuição — LEIA ANTES DE IMPLEMENTAR

O acervo do Digital Histology é anunciado em `https://digitalhistology.org/credits/` sob **CC BY-NC-SA 4.0**. A cláusula **NãoComercial** é incompatível, por padrão, com paywall, assinatura, promoção de produto ou uso comercial. O GradeX possui fluxos Plus+/assinatura; portanto há um bloqueio de publicação obrigatório.

## Condição de liberação

Escolha e registre uma destas rotas antes de publicar:

1. manter o Manual da Histologia integralmente gratuito, sem paywall, sem CTA comercial contextual e tecnicamente separado de benefícios pagos; ou
2. obter autorização escrita dos titulares para o uso comercial pretendido e arquivá-la no projeto.

Enquanto isso não estiver resolvido, é permitido desenvolver e revisar em ambiente privado, mas não lançar em produção comercial.

## Estado atual (2026-08-13): rota 2 escolhida, autorização ainda pendente

Por decisão do responsável pelo produto, o módulo passou a ser **privativo de assinantes do Manual Clínico e de contas Plus+**. A autorização escrita da rota 2 **ainda não foi obtida nem arquivada** — o risco da cláusula NãoComercial está assumido e declarado em código (`PENDENCIA_NAO_COMERCIAL`, em `lib/histologia/licenca.ts`) e em `docs/adr/0003-histologia-privativa-assinantes.md`.

Enquanto a autorização não chegar, mantenha o portão onde ele está: **um único arquivo**, `lib/histologia/acesso.ts`, aplicado pelo layout do módulo. Não espalhe checagem de acesso pelas páginas — reverter a decisão precisa continuar sendo uma mudança de um arquivo só. As obrigações de atribuição abaixo continuam valendo integralmente, inclusive na landing de vendas exibida a quem ainda não assina.

## Obrigações mínimas

- atribuir Digital Histology, VCU School of Medicine, ALT Lab e os titulares específicos encontrados em cada página;
- informar que houve reorganização, tradução, metadados e nova interface;
- manter a mesma licença nas adaptações quando aplicável;
- preservar `url_origem`, créditos, data de acesso e hashes;
- não declarar como tradução humana revisada o conteúdo que ainda não passou por revisão biomédica;
- não remover marcas ou autoria das imagens.

Crédito-base sugerido: “Conteúdo visual adaptado de Digital Histology (Virginia Commonwealth University), CC BY-NC-SA 4.0; reorganização, interface e conteúdo complementar em português pelo Manual Clínico. Créditos específicos disponíveis em cada lâmina.”

Referências: https://digitalhistology.org/credits/ e https://creativecommons.org/licenses/by-nc-sa/4.0/
