import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('neoplasia-intraepitelial-cervical-1', [
    pat('nic3', 'displasia-escamosa-espessura-total', seta(0.3735, 0.0585, 45),
        rotulo='NIC 3: células atípicas em toda a espessura',
        nota='Núcleos grandes, hipercromáticos e desorganizados de baixo a cima; não há células superficiais maduras.',
        vista=(0.365, 0.055, 0.377, 0.067)),
    pat('extensao', 'extensao-glandular-da-nic', seta(0.3745, 0.0745, 45),
        rotulo='Displasia descendo pelas criptas (contorno liso)',
        nota='Bloco arredondado de epitélio displásico sob a superfície, com borda lisa: é extensão às criptas, não invasão.',
        vista=(0.32, 0.02, 0.40, 0.10)),
    pat('superficie', 'displasia-escamosa-espessura-total', seta(0.232, 0.160, 45),
        rotulo='Superfície da zona de transformação tomada pela NIC',
        vista=(0.18, 0.10, 0.30, 0.25)),
    pat('atipia', 'atipia-citologica', seta(0.3695, 0.0575, 45),
        rotulo='Núcleos grandes e hipercromáticos, relação N/C alta',
        vista=(0.365, 0.055, 0.373, 0.063)),
    pat('transicao', 'transicao-abrupta-para-mucosa-normal', seta(0.199, 0.2015, 45),
        rotulo='Transição: epitélio normal à esquerda, NIC à direita',
        vista=(0.18, 0.18, 0.22, 0.22)),
    pat('cervicite', 'infiltrado-linfoplasmocitario', seta(0.3355, 0.0625, 45),
        rotulo='Cervicite crônica sob a lesão',
        vista=(0.32, 0.05, 0.35, 0.08)),
    est('ectocervice', 'epitelio-estratificado-pavimentoso', seta(0.1975, 0.1885, 45), rotulo='Ectocérvice normal: células superficiais maduras',
        vista=(0.190, 0.182, 0.205, 0.197)),
    est('glandula-endocervical', 'epitelio-simples-colunar', seta(0.2635, 0.1935, 45), rotulo='Glândula endocervical (epitélio mucinoso)',
        vista=(0.24, 0.17, 0.29, 0.22)),
], achados=[
    achado('displasia-escamosa-espessura-total', 'presente', ['nic3', 'superficie'], 'Displasia de espessura total ao longo da zona de transformação.'),
    achado('extensao-glandular-da-nic', 'presente', ['extensao'], 'Vários blocos arredondados de NIC nas criptas.'),
    achado('transicao-abrupta-para-mucosa-normal', 'presente', ['transicao'], 'Limite nítido com a ectocérvice normal.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Atipia nuclear acentuada.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['cervicite'], 'Infiltrado linfoplasmocitário no estroma superficial.'),
    achado('invasao-estromal', 'ausente', [], 'Os contornos dos blocos displásicos são lisos, sem células soltas no estroma: não há invasão neste corte.'),
], conferencias=3, resumo='Colo uterino com NIC 3 na zona de transformação: epitélio escamoso displásico em toda a espessura, estendendo-se às criptas endocervicais em blocos de contorno liso, ao lado de ectocérvice normal e glândulas endocervicais. Sem invasão.')
print('ok')
