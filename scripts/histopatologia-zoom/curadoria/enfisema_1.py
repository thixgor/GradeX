import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('enfisema-1', [
    pat('espacos', 'destruicao-de-septos-alveolares', seta(0.6400, 0.3200, 45),
        rotulo='Espaços aéreos muito alargados e irregulares',
        vista=(0.560, 0.240, 0.720, 0.400)),
    pat('septos-rotos', 'destruicao-de-septos-alveolares', seta(0.6085, 0.3120, 45),
        rotulo='Septo alveolar rompido, com a ponta solta',
        vista=(0.600, 0.300, 0.630, 0.330)),
    pat('septo-fino', 'destruicao-de-septos-alveolares', seta(0.6180, 0.3040, 45),
        rotulo='Septos finos e poucos, com perda da renda alveolar',
        vista=(0.600, 0.300, 0.630, 0.330)),
    pat('antracose', 'antracose', seta(0.6745, 0.2990, 45),
        rotulo='Antracose densa em macrófagos',
        vista=(0.662, 0.285, 0.682, 0.305)),
    est('cartilagem', 'cartilagem-hialina', seta(0.4100, 0.1420, 45), rotulo='Cartilagem do brônquio',
        vista=(0.340, 0.110, 0.460, 0.230)),
    est('glandulas', 'glandula-seromucosa', seta(0.3830, 0.1810, 45), rotulo='Glândulas seromucosas da parede brônquica',
        vista=(0.370, 0.175, 0.400, 0.205)),
    est('epitelio', 'epitelio-respiratorio', seta(0.3930, 0.1920, 45), rotulo='Epitélio respiratório',
        vista=(0.370, 0.175, 0.400, 0.205)),
], achados=[
    achado('destruicao-de-septos-alveolares', 'presente', ['espacos', 'septos-rotos', 'septo-fino'], 'Espaços aéreos muito alargados e irregulares, com septos finos, rompidos e de pontas soltas.'),
    achado('antracose', 'presente', ['antracose'], 'Pigmento antracótico abundante em macrófagos junto a septos, vasos e bronquíolos.'),
], conferencias=3, resumo='Pulmão de homem de 65 anos com tosse produtiva: enfisema com destruição dos septos alveolares e antracose; brônquio com cartilagem, glândulas seromucosas e epitélio respiratório na mesma lâmina.')
print('ok')
