import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('gastrite-cronica-h-pylori-1', [
    pat('metaplasia', 'metaplasia-intestinal', seta(0.0485, 0.1475, 225),
        rotulo='Metaplasia intestinal: células caliciformes',
        nota='Glândulas com células caliciformes em cálice espaçadas no epitélio — epitélio do tipo intestinal dentro do estômago.',
        vista=(0.038, 0.135, 0.054, 0.155)),
    pat('paneth', 'metaplasia-intestinal', seta(0.0419, 0.1437, 225),
        rotulo='Células de Paneth (grânulos vermelhos): metaplasia completa',
        nota='Células com grânulos eosinofílicos vivos na base da glândula: células de Paneth, que não existem no estômago normal.',
        vista=(0.036, 0.138, 0.050, 0.152)),
    pat('linfoplasmocitario', 'infiltrado-linfoplasmocitario', seta(0.0455, 0.1515, 0),
        rotulo='Lâmina própria com linfócitos e plasmócitos',
        vista=(0.038, 0.143, 0.054, 0.159)),
    pat('agregado-linfoide', 'hiperplasia-linfoide-reativa', seta(0.0395, 0.1435, 0),
        rotulo='Agregado linfoide denso na mucosa',
        nota='Agregado linfoide na mucosa gástrica — ausente no estômago normal e muito associado à infecção por H. pylori.',
        vista=(0.030, 0.130, 0.046, 0.146)),
    est('fovea', 'mucosa-gastrica', seta(0.0990, 0.1219, 60), rotulo='Epitélio foveolar gástrico (muco em capuz)',
        vista=(0.088, 0.108, 0.104, 0.124)),
    est('glandulas-antrais', 'glandula-pilorica', seta(0.0845, 0.152, 45), rotulo='Glândulas mucosas do tipo antral',
        vista=(0.074, 0.140, 0.094, 0.160)),
], achados=[
    achado('infiltrado-linfoplasmocitario', 'presente', ['linfoplasmocitario'], 'Inflamação crônica difusa da lâmina própria.'),
    achado('helicobacter-pylori', 'nao-avaliavel', [],
           'O diagnóstico de origem é de gastrite associada ao Helicobacter, mas o bacilo (2–4 µm) não é identificável com segurança nesta digitalização em H&E; a confirmação exige Giemsa ou imuno-histoquímica.'),
    achado('hiperplasia-linfoide-reativa', 'presente', ['agregado-linfoide'], 'Agregado linfoide denso na mucosa.'),
    achado('infiltrado-neutrofilico', 'nao-avaliavel', [],
           'Não se identificaram neutrófilos intraepiteliais inequívocos nos campos examinados; a atividade não foi graduada.'),
    achado('metaplasia-intestinal', 'presente', ['metaplasia', 'paneth'],
           'Metaplasia intestinal com células caliciformes e de Paneth, como consta no diagnóstico de origem (com atrofia).'),
], conferencias=3, resumo='Biópsias gástricas da incisura angular com gastrite crônica associada ao H. pylori em fase avançada: lâmina própria inflamada, agregado linfoide e metaplasia intestinal completa (caliciformes e células de Paneth). As glândulas profundas são mucosas, do tipo antral.')
print('ok')
