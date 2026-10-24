import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 213, caso 1 — "Small cell (oat cell) carcinoma".
salvar('carcinoma-de-pequenas-celulas-de-pulmao-2', [
    pat('celulas', 'celulas-pequenas-com-moldagem-nuclear', seta(0.4130, 0.5630, 225),
        rotulo='Células pequenas, quase só núcleo, que se moldam umas às outras',
        nota='Células do tamanho de dois a três linfócitos, com citoplasma mínimo e núcleo escuro, oval ou fusiforme ("grão de aveia"), de cromatina fina e sem nucléolo. Como quase não há citoplasma, um núcleo encosta no outro e se deforma para caber: a moldagem nuclear. É o tumor neuroendócrino de alto grau do pulmão, ligado ao tabagismo pesado.',
        vista=(0.400, 0.550, 0.430, 0.580)),
    pat('necrose', 'necrose-coagulativa', seta(0.4200, 0.5770, 135),
        rotulo='Necrose extensa entre os grupos de células',
        nota='Lagos de material rosa e poeira nuclear separam as faixas de células viáveis. O tumor cresce tão rápido (Ki-67 perto de 100 %) que ultrapassa o próprio suprimento de sangue.',
        vista=(0.400, 0.565, 0.430, 0.580)),
    pat('esmagamento', 'artefato-de-esmagamento', seta(0.4100, 0.5640, 45),
        rotulo='Núcleos estirados em fios (artefato de esmagamento)',
        nota='As células são tão frágeis que a pinça e a navalha as esmagam: a cromatina se estira em fios e borrões azulados. O artefato é tão típico que, numa biópsia brônquica, chama atenção para o diagnóstico.',
        vista=(0.404, 0.557, 0.418, 0.568)),
    pat('invasao', 'invasao-estromal', seta(0.3500, 0.5000, 45),
        rotulo='Massa tumoral substituindo o parênquima, cercada por pulmão',
        vista=(0.200, 0.100, 0.700, 0.900)),
    est('alveolos', 'alveolo-pulmonar', seta(0.1500, 0.6000, 0),
        rotulo='Pulmão ao redor do tumor',
        vista=(0.050, 0.500, 0.200, 0.700)),
], achados=[
    achado('celulas-pequenas-com-moldagem-nuclear', 'presente', ['celulas'],
           'Lençóis de células pequenas, de citoplasma mínimo e cromatina fina, com moldagem nuclear.'),
    achado('artefato-de-esmagamento', 'presente', ['esmagamento'],
           'Núcleos estirados e borrados em vários pontos.'),
    achado('invasao-estromal', 'presente', ['invasao'],
           'Massa que substitui o parênquima e infiltra o tecido fibroso, com pulmão ao redor.'),
    achado('necrose-coagulativa', 'presente', ['necrose'],
           'Necrose extensa entre faixas de células viáveis.'),
], conferencias=3, resumo='Carcinoma de pequenas células do pulmão: massa formada por lençóis de células pequenas, de citoplasma mínimo, núcleos ovais e fusiformes com cromatina fina e moldagem, com necrose extensa e artefato de esmagamento, cercada por parênquima pulmonar.')
print('ok')
