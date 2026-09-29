import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('amebiase-1', [
    pat('exsudato', 'ulceracao-da-mucosa', seta(0.5450, 0.1450, 45),
        rotulo='Úlcera com exsudato necrótico',
        vista=(0.430, 0.080, 0.590, 0.200)),
    pat('amebas', 'trofozoitos-de-entamoeba', seta(0.5597, 0.1652, 45),
        rotulo='Trofozoítos no exsudato',
        vista=(0.545, 0.160, 0.565, 0.180)),
    pat('eritrofagocitose', 'trofozoitos-de-entamoeba', seta(0.5570, 0.1668, 45),
        rotulo='Trofozoíto com hemácias fagocitadas',
        vista=(0.545, 0.160, 0.565, 0.180)),
    pat('ameba', 'trofozoitos-de-entamoeba', seta(0.5548, 0.1685, 45),
        rotulo='Citoplasma espumoso, núcleo pequeno',
        vista=(0.552, 0.166, 0.558, 0.172)),
    pat('neutrofilos', 'infiltrado-neutrofilico', seta(0.5510, 0.1720, 45),
        rotulo='Neutrófilos na borda da úlcera',
        vista=(0.545, 0.160, 0.565, 0.180)),
    est('criptas', 'cripta-de-lieberkuhn', seta(0.5550, 0.3450, 45), rotulo='Criptas preservadas',
        vista=(0.500, 0.210, 0.700, 0.370)),
], achados=[
    achado('trofozoitos-de-entamoeba', 'presente', ['amebas', 'eritrofagocitose', 'ameba'], 'Muitos trofozoítos grandes, de citoplasma espumoso e núcleo pequeno, vários com hemácias fagocitadas, no exsudato da superfície. A lâmina original tem PAS de apoio.'),
    achado('ulceracao-da-mucosa', 'presente', ['exsudato'], 'Superfície substituída por exsudato necrótico e fibrinoso, onde ficam as amebas.'),
    achado('infiltrado-neutrofilico', 'presente', ['neutrofilos'], 'Neutrófilos e restos nucleares na borda da úlcera.'),
], conferencias=3, resumo='Biópsias de ceco de homem de 54 anos com diarreia e ceco inflamado e polipoide: colite amebiana com úlcera e exsudato cheio de trofozoítos de Entamoeba histolytica com eritrofagocitose.')
print('ok')
