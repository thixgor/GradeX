import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-ductal-invasivo-da-mama-1', [
    pat('invasao', 'invasao-estromal', seta(0.4378, 0.1112, 45),
        rotulo='Células tumorais isoladas e em cordões no estroma',
        nota='Células atípicas soltas e em pequenos grupos, sem contorno de ducto nem camada mioepitelial, infiltrando o colágeno.',
        vista=(0.435, 0.108, 0.445, 0.118)),
    pat('ninhos', 'invasao-estromal', seta(0.2805, 0.1965, 45),
        rotulo='Pequenos ninhos e glândulas angulosas infiltrando o estroma',
        vista=(0.275, 0.190, 0.295, 0.210)),
    pat('desmoplasia', 'reacao-desmoplasica', seta(0.418, 0.108, 45),
        rotulo='Estroma desmoplásico',
        vista=(0.40, 0.10, 0.45, 0.15)),
    pat('atipia', 'atipia-citologica', seta(0.2785, 0.2030, 45),
        rotulo='Núcleos grandes e pleomórficos, com nucléolos',
        vista=(0.277, 0.196, 0.289, 0.208)),
    est('tecido-adiposo', 'adipocito-unilocular', seta(0.655, 0.29, 0), rotulo='Tecido adiposo da mama', vista=(0.62, 0.25, 0.70, 0.35)),
    est('lobulo', 'lobulo-mamario', seta(0.7475, 0.3615, 0), rotulo='Lóbulo mamário normal na periferia',
        vista=(0.72, 0.34, 0.78, 0.40)),
], achados=[
    achado('invasao-estromal', 'presente', ['invasao', 'ninhos'], 'Invasão extensa do estroma por ninhos, cordões e células isoladas.'),
    achado('reacao-desmoplasica', 'presente', ['desmoplasia'], 'Estroma denso e ativado em toda a área do tumor.'),
    achado('carcinoma-in-situ-comedo', 'nao-avaliavel', [],
           'Há ninhos de contorno arredondado que podem corresponder a carcinoma in situ, mas o conteúdo das luzes examinadas é sangue, não necrose; distinguir in situ de invasivo exigiria imuno-histoquímica para células mioepiteliais (p63, calponina).'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Pleomorfismo nuclear acentuado.'),
    achado('glandulas-neoplasicas-complexas', 'ausente', [], 'O tumor forma poucos túbulos: cresce sobretudo em ninhos e cordões (pontuação alta de formação tubular no grau de Nottingham).'),
    achado('invasao-angiolinfatica', 'nao-avaliavel', [], 'Não se identificou êmbolo inequívoco nos campos examinados; a avaliação exige exame sistemático da periferia do tumor.'),
], conferencias=3, resumo='Mama com carcinoma invasivo de tipo não especial (ductal): ninhos, cordões e células isoladas infiltrando um estroma desmoplásico, com pleomorfismo nuclear acentuado e poucos túbulos. Na periferia, tecido adiposo e lóbulos normais.')
print('ok')
