import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 217, caso 10 — "Epidermoid (squamous cell) carcinoma" (pulmão).
salvar('carcinoma-escamoso-de-pulmao-2', [
    pat('ninhos', 'ninhos-escamosos-infiltrativos', seta(0.3500, 0.6000, 225),
        rotulo='Ninhos e lençóis de células escamosas atípicas',
        nota='O tumor forma massas e ninhos de células poligonais grandes, de citoplasma eosinofílico denso e limites celulares nítidos, separados por faixas de estroma com linfócitos. A diferenciação escamosa — células que se encostam como as da epiderme, unidas por desmossomos (as "pontes intercelulares") — é o que define o tipo. Nasce no epitélio brônquico que sofreu metaplasia escamosa pela fumaça do cigarro, e por isso costuma ser central.',
        vista=(0.300, 0.550, 0.400, 0.650)),
    pat('atipia', 'atipia-citologica', seta(0.3530, 0.5970, 135),
        rotulo='Núcleos grandes, vesiculosos e pleomórficos, com nucléolo',
        nota='Núcleos muito maiores que os dos linfócitos vizinhos, de forma irregular, cromatina grosseira e nucléolo evidente, alguns bizarros. O citoplasma é abundante e rosa, com membranas celulares bem marcadas.',
        vista=(0.345, 0.590, 0.360, 0.603)),
    pat('necrose', 'necrose-coagulativa', seta(0.3300, 0.6400, 45),
        rotulo='Necrose e restos celulares no centro de massas tumorais',
        vista=(0.300, 0.620, 0.360, 0.660)),
    pat('invasao', 'ninhos-escamosos-infiltrativos', seta(0.4000, 0.4000, 225),
        rotulo='Tumor ocupando a parede e o parênquima, com estroma inflamado',
        vista=(0.300, 0.250, 0.550, 0.550)),
    est('linfocitos', 'linfocito', seta(0.3550, 0.5925, 315),
        rotulo='Linfócitos no estroma entre os ninhos',
        vista=(0.348, 0.588, 0.362, 0.596)),
], achados=[
    achado('ninhos-escamosos-infiltrativos', 'presente', ['ninhos', 'invasao'],
           'Ninhos e lençóis de células escamosas atípicas, de citoplasma eosinofílico e membranas nítidas, infiltrando o tecido.'),
    achado('perola-cornea', 'ausente', [],
           'Nos campos conferidos não se formam pérolas córneas — carcinoma pouco queratinizante.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Núcleos grandes, pleomórficos, com nucléolos evidentes.'),
    achado('necrose-coagulativa', 'presente', ['necrose'],
           'Necrose e restos celulares no centro de massas tumorais.'),
], conferencias=3, resumo='Carcinoma de células escamosas do pulmão: ninhos e lençóis de células poligonais grandes, de citoplasma eosinofílico denso, membranas nítidas e núcleos pleomórficos com nucléolo, em estroma com linfócitos, com focos de necrose. Sem pérolas córneas nos campos conferidos (pouco queratinizante).')
print('ok')
