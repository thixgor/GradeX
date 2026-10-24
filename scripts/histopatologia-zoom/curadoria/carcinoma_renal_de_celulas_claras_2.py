import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 550, caso 7 — "Renal cell carcinoma, clear cell type".
salvar('carcinoma-renal-de-celulas-claras-2', [
    pat('celulas-claras', 'celulas-claras-neoplasicas', seta(0.5300, 0.2150, 225),
        rotulo='Células poligonais de citoplasma claro e membrana nítida',
        nota='Cada célula parece uma caixinha vazia com um núcleo redondo no meio: o citoplasma é transparente porque estava cheio de glicogênio e lipídio, dissolvidos pelo processamento. A membrana celular fica bem marcada, como uma grade. O acúmulo vem da perda do gene VHL — a célula se comporta como se estivesse em hipóxia permanente e reprograma o metabolismo.',
        vista=(0.500, 0.200, 0.560, 0.250)),
    pat('capilares', 'rede-capilar-delicada', seta(0.5130, 0.2120, 45),
        rotulo='Capilares finos em volta de cada ninho',
        nota='Os ninhos de células claras são separados só por capilares delicados, quase sem estroma — a "tela de galinheiro". É o mesmo defeito do VHL: a falsa hipóxia faz o tumor produzir VEGF sem parar, e ele fica ricamente vascularizado (por isso sangra e por isso responde a antiangiogênicos).',
        vista=(0.500, 0.200, 0.530, 0.230)),
    pat('hemorragia', 'hemorragia-intersticial', seta(0.6550, 0.2750, 225),
        rotulo='Lagos de sangue e cavidades hemorrágicas no tumor',
        nota='A rede vascular frágil se rompe: o tumor tem focos de hemorragia recente e cavidades cheias de sangue — o aspecto variegado (amarelo, vermelho e branco) da peça macroscópica e a hematúria do paciente.',
        vista=(0.630, 0.230, 0.760, 0.330)),
    pat('capsula', 'pseudocapsula-fibrosa', seta(0.3500, 0.2700, 0),
        rotulo='Faixas fibrosas espessas cortando o tumor',
        vista=(0.300, 0.150, 0.420, 0.400)),
], achados=[
    achado('celulas-claras-neoplasicas', 'presente', ['celulas-claras'],
           'Ninhos e ácinos de células claras de membrana nítida em quase todo o tumor, com núcleos redondos de grau baixo a intermediário.'),
    achado('rede-capilar-delicada', 'presente', ['capilares'],
           'Rede capilar delicada envolvendo cada ninho.'),
    achado('hemorragia-intersticial', 'presente', ['hemorragia'],
           'Focos de hemorragia e cavidades hemorrágicas, principalmente na metade direita.'),
    achado('pseudocapsula-fibrosa', 'presente', ['capsula'],
           'Septos fibrosos largos atravessam a massa; a cápsula periférica não está incluída inteira neste corte.'),
    achado('necrose-coagulativa', 'ausente', [],
           'Não há áreas de necrose tumoral nos campos conferidos.'),
], conferencias=3, resumo='Carcinoma de células renais de células claras: ninhos e ácinos de células poligonais de citoplasma claro e membrana nítida, cada um envolto por capilares delicados ("tela de galinheiro"), com septos fibrosos e focos hemorrágicos. Sem necrose tumoral neste corte.')
print('ok')
