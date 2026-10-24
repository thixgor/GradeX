import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 319, caso 4 — "Epidermoid (squamous cell) carcinoma".
salvar('carcinoma-espinocelular-2', [
    pat('ninhos', 'ninhos-escamosos-infiltrativos', seta(0.4040, 0.2650, 135),
        rotulo='Massas e línguas de epitélio escamoso atípico descendo para a derme',
        nota='Em vez de uma epiderme com base reta e membrana basal contínua, o epitélio desce em línguas largas e irregulares, de bordas desfiadas, que se ramificam e se separam em ninhos dentro da derme. A célula é escamosa (citoplasma rosa, pontes intercelulares, tendência a queratinizar): é o carcinoma do queratinócito.',
        vista=(0.300, 0.100, 0.500, 0.300)),
    pat('perola', 'perola-cornea', seta(0.4400, 0.1850, 315),
        rotulo='Pérola córnea: queratina em lamelas concêntricas no centro do ninho',
        nota='As células do centro do ninho amadurecem até virar queratina, que se acumula em camadas concêntricas cor-de-rosa — como uma cebola cortada. Pérolas abundantes indicam carcinoma bem diferenciado: o tumor ainda "lembra" como fazer epiderme, só que no lugar errado.',
        vista=(0.420, 0.160, 0.470, 0.210)),
    pat('perola-2', 'perola-cornea', seta(0.3400, 0.1750, 225),
        rotulo='Outra pérola córnea',
        vista=(0.320, 0.155, 0.360, 0.195)),
    pat('atipia', 'atipia-citologica', seta(0.4210, 0.2340, 135),
        rotulo='Núcleos grandes, pleomórficos, com nucléolo; células disqueratóticas',
        nota='Os núcleos variam muito de tamanho e forma, são hipercromáticos e têm nucléolos evidentes. Há células queratinizando sozinhas, de citoplasma rosa vivo (disqueratose) — maturação fora de hora, típica da neoplasia escamosa.',
        vista=(0.405, 0.225, 0.425, 0.240)),
    pat('invasao', 'invasao-estromal', seta(0.3600, 0.2650, 45),
        rotulo='Frente de invasão: ninhos soltos na derme',
        vista=(0.320, 0.230, 0.420, 0.290)),
    est('epiderme', 'epitelio-estratificado-pavimentoso', seta(0.0300, 0.2000, 0),
        rotulo='Epiderme da borda da lesão',
        vista=(0.000, 0.120, 0.080, 0.300)),
], achados=[
    achado('ninhos-escamosos-infiltrativos', 'presente', ['ninhos'],
           'Massas e ninhos irregulares de epitélio escamoso atípico ocupam a derme em toda a lesão.'),
    achado('perola-cornea', 'presente', ['perola', 'perola-2'],
           'Pérolas córneas numerosas — carcinoma bem diferenciado e queratinizante.'),
    achado('atipia-citologica', 'presente', ['atipia'],
           'Pleomorfismo nuclear, nucléolos evidentes e disqueratose.'),
    achado('invasao-estromal', 'presente', ['invasao'],
           'Ninhos destacados do epitélio de superfície, soltos na derme.'),
    achado('infiltrado-linfoplasmocitario', 'nao-avaliavel', [],
           'O estroma entre os ninhos é escasso e, nos campos conferidos, pouco celular; não se forma um infiltrado avaliável.'),
    achado('ulceracao-da-mucosa', 'ausente', [],
           'A superfície é coberta por queratina compacta, sem úlcera com fibrina e neutrófilos.'),
], conferencias=3, resumo='Carcinoma espinocelular bem diferenciado da pele: massas e ninhos de epitélio escamoso atípico invadem a derme, com numerosas pérolas córneas, células disqueratóticas e núcleos pleomórficos com nucléolo evidente. A superfície é recoberta por queratina.')
print('ok')
