import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('doenca-de-alzheimer-1', [
    pat('emaranhados-ca1', 'emaranhados-neurofibrilares', seta(0.6560, 0.4250, 45),
        rotulo='Muitos neurônios com emaranhados no hipocampo',
        vista=(0.640, 0.400, 0.680, 0.440)),
    pat('chama', 'emaranhados-neurofibrilares', seta(0.6042, 0.4247, 45),
        rotulo='Emaranhado em "chama de vela"',
        vista=(0.603, 0.4235, 0.607, 0.4275)),
    pat('placa', 'placas-neuriticas', elipse(0.6053, 0.4265, 0.0009, 0.0009),
        rotulo='Placa neurítica: coroa de neuritos distróficos',
        vista=(0.603, 0.4235, 0.607, 0.4275)),
    pat('placa-medio', 'placas-neuriticas', elipse(0.6724, 0.4244, 0.0010, 0.0010),
        rotulo='Placa neurítica',
        vista=(0.640, 0.400, 0.680, 0.440)),
    pat('fios', 'fios-do-neuropilo', seta(0.6058, 0.4245, 45),
        rotulo='Fios do neurópilo',
        vista=(0.603, 0.4235, 0.607, 0.4275)),
    est('neuronio', 'neuronio-piramidal', seta(0.6014, 0.4213, 45), rotulo='Neurônio piramidal sem tau, para comparar',
        vista=(0.600, 0.420, 0.612, 0.432)),
], achados=[
    achado('emaranhados-neurofibrilares', 'presente', ['emaranhados-ca1', 'chama'], 'Emaranhados em grande número nos neurônios piramidais do hipocampo e do córtex temporal vizinho, em chama de vela e globosos, além de emaranhados extracelulares.'),
    achado('placas-neuriticas', 'presente', ['placa', 'placa-medio'], 'Placas arredondadas formadas por neuritos distróficos marcados pela tau, espalhadas pelo córtex.'),
    achado('fios-do-neuropilo', 'presente', ['fios'], 'Neurópilo tomado por fios de tau em todo o córtex — patologia avançada (Braak VI).'),
], conferencias=3, resumo='Lobo temporal medial (hipocampo e córtex) de homem de 72 anos com doença de Alzheimer, imuno-histoquímica para tau: emaranhados neurofibrilares abundantes, placas neuríticas e fios do neurópilo — estágio VI de Braak. A lâmina H&E do mesmo caso quase não mostra estas lesões.')
print('ok')
