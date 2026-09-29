import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-hepatocelular-1', [
    pat('nodulos', 'trabeculas-hepatocelulares-espessas', seta(0.4300, 0.4200, 45),
        rotulo='Nódulos tumorais sem espaços-porta',
        vista=(0.300, 0.250, 0.650, 0.600)),
    pat('trabeculas', 'trabeculas-hepatocelulares-espessas', seta(0.5500, 0.3550, 45),
        rotulo='Trabéculas grossas e pseudoácinos',
        vista=(0.530, 0.330, 0.570, 0.370)),
    pat('atipia', 'atipia-citologica', seta(0.5498, 0.3585, 45),
        rotulo='Núcleos grandes, escuros, com nucléolo',
        vista=(0.546, 0.355, 0.554, 0.363)),
    pat('capsula', 'pseudocapsula-fibrosa', seta(0.3450, 0.3720, 45),
        rotulo='Cápsula fibrosa do nódulo',
        vista=(0.300, 0.250, 0.650, 0.600)),
    pat('cirrose', 'nodulos-regenerativos', seta(0.6650, 0.4450, 45),
        rotulo='Fígado cirrótico de fundo (nódulo com esteatose)',
        vista=(0.600, 0.420, 0.680, 0.500)),
    est('hepatocitos', 'hepatocito', seta(0.6051, 0.5238, 45), rotulo='Hepatócito não tumoral, para comparar',
        vista=(0.600, 0.520, 0.608, 0.528)),
], achados=[
    achado('trabeculas-hepatocelulares-espessas', 'presente', ['nodulos', 'trabeculas'], 'Nódulos de células hepatocitárias em trabéculas grossas e pseudoácinos, sem espaços-porta nem veias centrais.'),
    achado('atipia-citologica', 'presente', ['atipia'], 'Núcleos muito maiores e mais escuros que os dos hepatócitos do fundo, nucléolos evidentes e relação núcleo/citoplasma alta: moderadamente diferenciado.'),
    achado('pseudocapsula-fibrosa', 'presente', ['capsula'], 'Faixas fibrosas envolvem os nódulos tumorais.'),
    achado('nodulos-regenerativos', 'presente', ['cirrose'], 'Fígado não tumoral cirrótico, com nódulos separados por septos com inflamação e esteatose macrovesicular focal.'),
    achado('invasao-angiolinfatica', 'nao-avaliavel', [], 'Não se identifica tumor dentro de vasos com segurança nesta lâmina.'),
], conferencias=3, resumo='Carcinoma hepatocelular moderadamente diferenciado em fígado cirrótico (ressecção): nódulos encapsulados de hepatócitos atípicos em trabéculas grossas, ao lado de hepatócitos não tumorais para comparação.')
print('ok')
