import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-escamoso-de-pulmao-1', [
    pat('tumor-na-luz', 'ninhos-escamosos-infiltrativos', seta(0.3300, 0.7200, 45),
        rotulo='Tumor ocupando a luz do brônquio',
        vista=(0.200, 0.550, 0.400, 0.750)),
    pat('ninhos', 'ninhos-escamosos-infiltrativos', seta(0.2950, 0.7150, 45),
        rotulo='Ninhos de células escamosas separados por estroma',
        vista=(0.280, 0.700, 0.320, 0.740)),
    pat('atipia', 'atipia-citologica', seta(0.3030, 0.7180, 45),
        rotulo='Núcleos grandes, pleomórficos',
        vista=(0.300, 0.715, 0.306, 0.721)),
    pat('necrose', 'necrose-coagulativa', seta(0.3550, 0.6760, 45),
        rotulo='Necrose com lamelas de queratina',
        vista=(0.345, 0.665, 0.365, 0.685)),
    est('epitelio', 'epitelio-respiratorio', seta(0.2150, 0.6920, 45), rotulo='Epitélio respiratório do brônquio',
        vista=(0.200, 0.660, 0.260, 0.720)),
    est('cartilagem', 'cartilagem-hialina', seta(0.2400, 0.6350, 45), rotulo='Cartilagem brônquica',
        vista=(0.200, 0.550, 0.400, 0.750)),
    est('glandulas', 'glandula-seromucosa', seta(0.2080, 0.6780, 45), rotulo='Glândulas seromucosas',
        vista=(0.200, 0.660, 0.260, 0.720)),
], achados=[
    achado('ninhos-escamosos-infiltrativos', 'presente', ['tumor-na-luz', 'ninhos'], 'Ninhos e lençóis de células escamosas de citoplasma eosinofílico ocupam as luzes brônquicas e invadem a parede.'),
    achado('perola-cornea', 'nao-avaliavel', [], 'Há queratinização de células isoladas e lamelas de queratina misturadas à necrose na luz, mas não se encontram pérolas córneas bem formadas dentro dos ninhos — compatível com tumor moderadamente diferenciado.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Núcleos grandes, ovais a fusiformes, hipercromáticos, com nucléolos e mitoses.'),
    achado('necrose-coagulativa', 'presente', ['necrose'], 'Necrose com células-fantasma e queratina na superfície do tumor dentro da luz.'),
], conferencias=3, resumo='Carcinoma escamoso moderadamente diferenciado, endobrônquico: ninhos de células escamosas atípicas enchendo as luzes brônquicas, com necrose e queratina; epitélio respiratório, glândulas seromucosas e cartilagem do brônquio para comparação.')
print('ok')
