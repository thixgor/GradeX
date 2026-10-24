import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1320, caso 4 — "Poorly differentiated (signet ring) adenocarcinoma and well-differentiated tubular adenocarcinoma".
salvar('adenocarcinoma-gastrico-1', [
    pat('anel-de-sinete', 'celulas-em-anel-de-sinete', seta(0.5470, 0.4060, 225),
        rotulo='Células pouco coesas, soltas, de citoplasma claro e vacuolado',
        nota='Células isoladas, que não se unem em glândulas, com citoplasma pálido cheio de mucina e núcleo atípico deslocado para a borda em muitas delas — células em anel de sinete. Elas se soltam porque perderam a E-caderina, a proteína que mantém as células epiteliais grudadas. É o componente difuso (de Lauren) do tumor.',
        vista=(0.540, 0.400, 0.555, 0.413)),
    pat('infiltracao', 'invasao-estromal', seta(0.5600, 0.4600, 135),
        rotulo='Lençóis de células tumorais infiltrando a parede, em volta de vasos',
        nota='As células pouco coesas se espalham em lençóis pela submucosa e pelas camadas profundas, sem formar massa delimitada, e envolvem vasos. É essa infiltração difusa que torna a parede espessa e rígida.',
        vista=(0.500, 0.400, 0.620, 0.520)),
    pat('muscular', 'infiltracao-da-muscular-propria', seta(0.6200, 0.6000, 225),
        rotulo='Células tumorais entre os feixes da muscular própria',
        nota='Os feixes rosados de músculo liso estão dissociados por células tumorais isoladas e em cordões. A invasão da muscular própria (pelo menos pT2) acompanha a linite plástica — o estômago "em garrafa de couro" da endoscopia e da tomografia.',
        vista=(0.580, 0.560, 0.680, 0.660)),
    pat('tubular', 'glandulas-neoplasicas-complexas', seta(0.6300, 0.1900, 225),
        rotulo='Componente tubular bem diferenciado na superfície',
        nota='Na mucosa, o mesmo tumor forma glândulas tubulares e frondes de epitélio colunar atípico — o componente intestinal. Tumores mistos como este mostram que as duas vias de Lauren podem coexistir.',
        vista=(0.550, 0.100, 0.700, 0.220)),
    pat('atipia', 'atipia-citologica', seta(0.5500, 0.4100, 315),
        rotulo='Núcleos aumentados e irregulares, com nucléolo',
        vista=(0.545, 0.403, 0.555, 0.413)),
    pat('desmoplasia', 'reacao-desmoplasica', seta(0.6400, 0.5800, 45),
        rotulo='Estroma fibroso em volta das células infiltrativas',
        vista=(0.600, 0.560, 0.680, 0.620)),
], achados=[
    achado('celulas-em-anel-de-sinete', 'presente', ['anel-de-sinete'],
           'Lençóis de células pouco coesas, muitas em anel de sinete, nas camadas profundas.'),
    achado('invasao-estromal', 'presente', ['infiltracao'],
           'Infiltração difusa da submucosa e da parede, em volta de vasos.'),
    achado('infiltracao-da-muscular-propria', 'presente', ['muscular'],
           'Células tumorais dissociando os feixes da muscular própria.'),
    achado('glandulas-neoplasicas-complexas', 'presente', ['tubular'],
           'Componente tubular bem diferenciado na mucosa.'),
    achado('reacao-desmoplasica', 'presente', ['desmoplasia'],
           'Estroma fibroso em torno das células infiltrativas na parede profunda.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Núcleos aumentados e irregulares, com nucléolos.'),
    achado('metaplasia-intestinal', 'nao-avaliavel', [],
           'A mucosa da superfície está tomada pelo componente tubular; não há mucosa não tumoral suficiente no corte para avaliar metaplasia intestinal.'),
], conferencias=3, resumo='Adenocarcinoma gástrico misto: na superfície, componente tubular bem diferenciado (tipo intestinal); na profundidade, lençóis de células pouco coesas, muitas em anel de sinete (tipo difuso), infiltrando a submucosa, envolvendo vasos e dissociando os feixes da muscular própria, com estroma fibroso.')
print('ok')
