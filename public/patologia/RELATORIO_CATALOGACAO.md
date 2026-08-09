# Relatório de catalogação

O catálogo foi gerado em 9 de agosto de 2026 por leitura de páginas HTML/XML e extração de URLs. Nenhum arquivo de imagem, miniatura ou lâmina virtual foi requisitado ou armazenado.

| Indicador | Total |
|---|---:|
| Páginas processadas | 4.042 |
| Entradas catalogadas de patologia/tema | 2.917 |
| Referências de mídia | 202.593 |
| Referências da Unicamp | 202.301 |
| Referências do Histopathology Atlas | 292 |
| Páginas com falha registrada | 288 |
| Duplicatas removidas | 8.429 |
| Assets de interface removidos na limpeza | 4.682 |

## Modalidades catalogadas

| Modalidade | Total |
|---|---:|
| Histologia | 33.818 |
| Imagem anatomopatológica | 119.969 |
| Imuno-histoquímica | 39.224 |
| Macroscopia | 9.348 |
| Lâmina virtual (WSI) | 234 |

Os valores representam classificação automatizada do catálogo, não revisão diagnóstica.

## Interpretação correta

- “Entrada catalogada” não equivale necessariamente a doença canônica.
- Um título pode representar doença, variante, caso, órgão, técnica, marcador, aula, coleção ou página editorial.
- O campo `sistemaCatalogado` é uma classificação preliminar; entradas em “Não classificado” exigem curadoria.
- Descrições recuperadas por contexto são pistas editoriais, não texto médico pronto para publicação.
- A contagem elevada da Unicamp inclui ampliações, colorações, macroscopia e referências repetidas em páginas distintas, posteriormente deduplicadas por URL e contexto.

## Falhas e lacunas

As 288 falhas permanecem em `catalogo/falhas-de-coleta.json`. A maior parte corresponde a páginas indisponíveis na origem. Elas não foram substituídas por conteúdo presumido.

Alguns títulos permanecem ambíguos e devem ser resolvidos na camada editorial. O pipeline deve permitir marcar uma entrada como `nao-e-doenca`, `caso`, `tecnica`, `colecao` ou `pendente-de-classificacao` sem removê-la do inventário de proveniência.

## Revisão antes de exibir uma mídia

1. Confirmar que ela representa a patologia canônica associada.
2. Confirmar modalidade e coloração.
3. Criar texto alternativo que descreva o conteúdo visível.
4. Verificar disponibilidade do link fora do runtime do site.
5. Confirmar licença ou autorização para incorporação.
6. Manter o crédito exigido próximo da mídia.

Falha futura do link não deve apagar o registro. Atualize o estado de disponibilidade, preserve a URL histórica e registre nova URL apenas com evidência de equivalência.

## Economia de rede e computação

As 202.593 referências foram distribuídas em 18 fragmentos `.json.gz`, com aproximadamente 5 MB compactados no total. A aplicação deve abrir somente os fragmentos relacionados à doença solicitada. Isso reduz Git, build e transferência de metadados sem armazenar imagens.
