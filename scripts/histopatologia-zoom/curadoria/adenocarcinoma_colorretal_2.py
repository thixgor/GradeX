import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1458, caso 6 — "Schistosomiasis in carcinoma of the sigmoid" (o carcinoma é o achado dominante do corte).
salvar('adenocarcinoma-colorretal-2', [
    pat('glandulas', 'glandulas-neoplasicas-complexas', seta(0.5000, 0.3200, 225),
        rotulo='Glândulas neoplásicas irregulares, ramificadas e aglomeradas',
        nota='Glândulas de tamanhos e formas diferentes, encostadas umas nas outras e ramificadas, revestidas por epitélio colunar alto, escuro e estratificado, sem células caliciformes. Elas substituem as criptas retas e iguais da mucosa normal: é o adenocarcinoma moderadamente diferenciado.',
        vista=(0.400, 0.200, 0.600, 0.400)),
    pat('muscular', 'infiltracao-da-muscular-propria', seta(0.2900, 0.3500, 135),
        rotulo='Glândulas tumorais entre os feixes da muscular própria',
        nota='Ilhas de glândulas aparecem já dentro e abaixo dos feixes de músculo liso da muscular própria — o tumor atravessou mucosa e submucosa (pelo menos pT2). A profundidade da invasão é o principal dado do estadiamento.',
        vista=(0.150, 0.250, 0.350, 0.450)),
    pat('invasao', 'invasao-estromal', seta(0.5200, 0.2300, 315),
        rotulo='Glândulas infiltrando o estroma abaixo da mucosa',
        vista=(0.440, 0.200, 0.580, 0.280)),
    pat('transicao', 'transicao-abrupta-para-mucosa-normal', seta(0.7600, 0.1500, 225),
        rotulo='Mucosa colônica normal ao lado do tumor',
        nota='À direita, criptas retas e claras, ricas em caliciformes, passam sem intermediário ao epitélio tumoral escuro.',
        vista=(0.600, 0.100, 0.800, 0.300)),
    est('muscular-propria', 'muscular-externa', seta(0.1000, 0.3000, 0),
        rotulo='Muscular própria',
        vista=(0.000, 0.150, 0.200, 0.450)),
], achados=[
    achado('glandulas-neoplasicas-complexas', 'presente', ['glandulas'], 'Glândulas neoplásicas complexas em toda a massa.'),
    achado('invasao-estromal', 'presente', ['invasao'], 'Glândulas além da muscular da mucosa, no estroma.'),
    achado('infiltracao-da-muscular-propria', 'presente', ['muscular'], 'Glândulas tumorais entre e abaixo dos feixes da muscular própria.'),
    achado('necrose-suja', 'nao-avaliavel', [], 'Não conferida em grande aumento nas luzes glandulares deste corte.'),
    achado('transicao-abrupta-para-mucosa-normal', 'presente', ['transicao'], 'Mucosa normal à direita, com transição abrupta.'),
    achado('mucina-extracelular', 'ausente', [], 'Sem lagos de muco nos campos conferidos.'),
    achado('celulas-em-anel-de-sinete', 'ausente', [], 'Não se veem células isoladas em anel de sinete.'),
    achado('adenoma-residual', 'nao-avaliavel', [], 'A superfície do tumor não foi conferida em grande aumento para restos de adenoma.'),
    achado('atipia-citologica', 'presente', ['glandulas'], 'Núcleos alongados, hipercromáticos e estratificados até a superfície.'),
    achado('reacao-desmoplasica', 'presente', ['muscular'], 'Estroma fibroso em volta das glândulas invasivas.'),
    achado('invasao-angiolinfatica', 'nao-avaliavel', [], 'Não se identificaram êmbolos em vasos nos campos conferidos.'),
    achado('ulceracao-da-mucosa', 'nao-avaliavel', [], 'A superfície do tumor não foi examinada em detalhe.'),
], conferencias=3, resumo='Adenocarcinoma do sigmoide moderadamente diferenciado: glândulas neoplásicas irregulares e aglomeradas substituem a mucosa e infiltram a submucosa e a muscular própria, com mucosa colônica normal e transição abrupta à direita. O seminário de origem registra ovos de Schistosoma em outro nível da peça.')
print('ok')
