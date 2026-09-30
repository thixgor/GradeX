import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('meningite-bacteriana-1', [
    pat('sulco', 'exsudato-leptomeningeo', seta(0.4900, 0.2150, 45),
        rotulo='Sulco cheio de exsudato inflamatório',
        vista=(0.460, 0.180, 0.540, 0.260)),
    pat('celulas', 'exsudato-leptomeningeo', seta(0.4990, 0.2205, 45),
        rotulo='Células inflamatórias no espaço subaracnóideo',
        vista=(0.495, 0.215, 0.505, 0.225)),
    pat('perivascular', 'exsudato-leptomeningeo', seta(0.5120, 0.2250, 45),
        rotulo='Exsudato envolvendo os vasos meníngeos',
        vista=(0.460, 0.180, 0.540, 0.260)),
    pat('congestao', 'hiperemia-e-congestao', seta(0.5330, 0.2450, 45),
        rotulo='Vaso meníngeo congesto',
        vista=(0.460, 0.180, 0.540, 0.260)),
], achados=[
    achado('exsudato-leptomeningeo', 'presente', ['sulco', 'celulas', 'perivascular'], 'Espaço subaracnóideo dos sulcos preenchido por exsudato celular denso, que envolve os vasos; o córtex abaixo está preservado.'),
    achado('infiltrado-neutrofilico', 'nao-avaliavel', [], 'No grande aumento predominam células de núcleo redondo ou reniforme (macrófagos, linfócitos, plasmócitos); neutrófilos segmentados não se distinguem com segurança neste scan — compatível com fase não mais inicial.'),
    achado('hiperemia-e-congestao', 'presente', ['congestao'], 'Vasos meníngeos dilatados e cheios de sangue.'),
], conferencias=3, resumo='Cérebro de mulher de 81 anos com cefaleia, vômitos e tontura: meningite bacteriana aguda, com exsudato inflamatório denso nos sulcos e em torno dos vasos do espaço subaracnóideo.')
print('ok')
