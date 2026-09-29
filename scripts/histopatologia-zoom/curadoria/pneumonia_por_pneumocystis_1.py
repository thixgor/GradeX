import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('pneumonia-por-pneumocystis-1', [
    pat('espuma', 'exsudato-espumoso-alveolar', seta(0.7660, 0.3285, 45),
        rotulo='Exsudato espumoso em favo de mel no alvéolo',
        nota='Material eosinofílico com pequenas bolhas claras, sem neutrófilos: agregados de Pneumocystis e restos de surfactante.',
        vista=(0.760, 0.320, 0.775, 0.335)),
    pat('espuma-panoramica', 'exsudato-espumoso-alveolar', seta(0.78, 0.33, 45),
        rotulo='Alvéolos difusamente preenchidos',
        vista=(0.72, 0.28, 0.82, 0.38)),
    pat('pneumocitos', 'hiperplasia-de-pneumocitos-tipo-ii', seta(0.7750, 0.3266, 270),
        rotulo='Pneumócitos tipo II reativos no septo',
        vista=(0.766, 0.318, 0.776, 0.328)),
    pat('septo-inflamado', 'infiltrado-linfoplasmocitario', seta(0.7616, 0.3270, 0),
        rotulo='Septo discretamente espessado por células inflamatórias',
        vista=(0.757, 0.321, 0.767, 0.331)),
    est('vaso', 'vaso-sanguineo', seta(0.7745, 0.3222, 0), rotulo='Capilar/vênula com hemácias', vista=(0.768, 0.317, 0.778, 0.327)),
], achados=[
    achado('exsudato-espumoso-alveolar', 'presente', ['espuma', 'espuma-panoramica'], 'Exsudato espumoso ocupando a maioria dos alvéolos. O caso de origem confirma pneumocistose.'),
    achado('hiperplasia-de-pneumocitos-tipo-ii', 'presente', ['pneumocitos'], 'Pneumócitos tipo II volumosos em partes dos septos.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['septo-inflamado'], 'Infiltrado mononuclear discreto nos septos.'),
    achado('membranas-hialinas', 'ausente', [], 'Não há membranas hialinas: não há dano alveolar difuso sobreposto neste corte.'),
], conferencias=3, resumo='Biópsia pulmonar a céu aberto com pneumonia por Pneumocystis: alvéolos difusamente preenchidos por exsudato eosinofílico espumoso, com septos discretamente espessados e pneumócitos tipo II reativos, quase sem neutrófilos. A confirmação dos organismos exige prata de Grocott.')

salvar('dano-alveolar-difuso-1', [
    pat('pneumocitos', 'hiperplasia-de-pneumocitos-tipo-ii', seta(0.4477, 0.4445, 0),
        rotulo='Pneumócitos tipo II cúbicos revestindo o septo',
        nota='Células cúbicas lado a lado, com núcleos grandes, cobrindo a parede alveolar que perdeu os pneumócitos tipo I.',
        vista=(0.440, 0.438, 0.455, 0.453)),
    pat('organizacao', 'tecido-de-granulacao', seta(0.4460, 0.4480, 45),
        rotulo='Septo espessado por fibroblastos em matriz frouxa',
        nota='Fibroblastos em proliferação, em matriz mixoide pálida, alargam o septo: é a fase organizante.',
        vista=(0.440, 0.442, 0.455, 0.457)),
    pat('septos-panoramico', 'tecido-de-granulacao', seta(0.4665, 0.4815, 45),
        rotulo='Septos difusamente espessados',
        vista=(0.40, 0.40, 0.52, 0.52)),
    pat('congestao', 'hiperemia-e-congestao', seta(0.4145, 0.4465, 0),
        rotulo='Vasos congestos',
        vista=(0.40, 0.43, 0.43, 0.46)),
    est('bronquiolo', 'bronquiolo', seta(0.4495, 0.4085, 45), rotulo='Bronquíolo', vista=(0.43, 0.39, 0.47, 0.43)),
], achados=[
    achado('membranas-hialinas', 'nao-avaliavel', [],
           'Na fase organizante as membranas já foram em grande parte incorporadas; há material eosinofílico denso em alguns espaços aéreos, mas não com o aspecto inequívoco de membrana revestindo a parede.'),
    achado('hiperplasia-de-pneumocitos-tipo-ii', 'presente', ['pneumocitos'], 'Hiperplasia difusa de pneumócitos tipo II.'),
    achado('tecido-de-granulacao', 'presente', ['organizacao', 'septos-panoramico'], 'Septos difusamente espessados por fibroblastos em matriz frouxa.'),
    achado('hiperemia-e-congestao', 'presente', ['congestao'], 'Congestão vascular e focos de hemorragia.'),
], conferencias=3, resumo='Biópsia pulmonar com dano alveolar difuso em fase organizante: septos difusamente espessados por fibroblastos em matriz mixoide, revestidos por pneumócitos tipo II hiperplásicos, e congestão. Quadro de insuficiência respiratória aguda com febre.')
print('ok')
