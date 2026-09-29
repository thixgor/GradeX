import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('metastase-hepatica-de-adenocarcinoma-1', [
    pat('nodulo', 'glandulas-neoplasicas-complexas', seta(0.1300, 0.4200, 45),
        rotulo='Nódulo metastático bem delimitado',
        vista=(0.080, 0.360, 0.260, 0.540)),
    pat('glandulas', 'glandulas-neoplasicas-complexas', seta(0.1197, 0.4515, 45),
        rotulo='Glândulas cribriformes de epitélio colunar',
        vista=(0.110, 0.440, 0.130, 0.460)),
    pat('necrose', 'necrose-suja', seta(0.1720, 0.4510, 45),
        rotulo='Necrose suja com detritos nucleares',
        vista=(0.160, 0.440, 0.180, 0.460)),
    pat('atipia', 'atipia-citologica', seta(0.1480, 0.4060, 45),
        rotulo='Núcleos alongados, hipercromáticos, estratificados',
        vista=(0.140, 0.400, 0.160, 0.420)),
    pat('fibrose', 'reacao-desmoplasica', seta(0.2040, 0.5025, 45),
        rotulo='Faixa fibrosa entre tumor e fígado',
        vista=(0.195, 0.495, 0.215, 0.515)),
    est('hepatocitos', 'hepatocito', seta(0.2040, 0.5110, 45), rotulo='Hepatócitos comprimidos na borda',
        vista=(0.195, 0.495, 0.215, 0.515)),
], achados=[
    achado('glandulas-neoplasicas-complexas', 'presente', ['nodulo', 'glandulas'], 'Nódulos de glândulas cribriformes e sólidas de epitélio colunar estratificado, bem delimitados do parênquima.'),
    achado('necrose-suja', 'presente', ['necrose'], 'Necrose central com detritos nucleares, típica da origem colorretal.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Núcleos alongados e ovais, hipercromáticos, pleomórficos, estratificados.'),
    achado('reacao-desmoplasica', 'presente', ['fibrose'], 'Faixa de fibrose em volta de cada nódulo, com hepatócitos comprimidos por fora.'),
], conferencias=3, resumo='Metástases hepáticas de adenocarcinoma colorretal (hepatectomia após quimioterapia): nódulos bem delimitados de glândulas cribriformes com necrose suja central, cercados por fibrose; fígado de fundo não cirrótico com esteatose.')
print('ok')
