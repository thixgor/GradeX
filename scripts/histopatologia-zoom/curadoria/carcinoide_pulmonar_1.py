import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoide-pulmonar-1', [
    pat('tumor', 'ninhos-neuroendocrinos-organoides', seta(0.4800, 0.9000, 45),
        rotulo='Tumor bem delimitado e uniforme',
        vista=(0.150, 0.450, 0.850, 1.600)),
    pat('ninhos', 'ninhos-neuroendocrinos-organoides', seta(0.3800, 0.5250, 45),
        rotulo='Ninhos organoides separados por septos',
        vista=(0.300, 0.450, 0.450, 0.600)),
    pat('sal-pimenta', 'ninhos-neuroendocrinos-organoides', seta(0.4735, 0.9213, 45),
        rotulo='Núcleos uniformes com cromatina em sal e pimenta',
        vista=(0.470, 0.920, 0.476, 0.926)),
    pat('parede', 'invasao-estromal', seta(0.3400, 0.5300, 45),
        rotulo='Ninhos entre feixes fibrosos na periferia',
        vista=(0.300, 0.450, 0.450, 0.600)),
    est('cartilagem', 'cartilagem-hialina', seta(0.3600, 0.1800, 45), rotulo='Cartilagem brônquica',
        vista=(0.200, 0.050, 0.600, 0.450)),
    est('glandulas', 'glandula-seromucosa', seta(0.3400, 0.4700, 45), rotulo='Glândulas seromucosas',
        vista=(0.300, 0.450, 0.450, 0.600)),
], achados=[
    achado('ninhos-neuroendocrinos-organoides', 'presente', ['tumor', 'ninhos', 'sal-pimenta'], 'Tumor bem delimitado de células uniformes em ninhos e trabéculas, com cromatina finamente granular e citoplasma eosinofílico moderado.'),
    achado('invasao-estromal', 'presente', ['parede'], 'Na periferia, ninhos se estendem entre feixes fibrosos e perto das glândulas brônquicas.'),
    achado('necrose-coagulativa', 'ausente', [], 'Sem necrose, e mitoses raras nos campos examinados — padrão de carcinoide típico.'),
], conferencias=3, resumo='Carcinoide típico do lobo superior esquerdo (ressecção segmentar): tumor bem delimitado, de células uniformes em ninhos organoides com cromatina em sal e pimenta, sem necrose; brônquio com cartilagem e glândulas seromucosas ao lado.')
print('ok')
