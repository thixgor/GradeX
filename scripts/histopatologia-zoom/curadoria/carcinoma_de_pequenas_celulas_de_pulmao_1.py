import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('carcinoma-de-pequenas-celulas-de-pulmao-1', [
    pat('lencois', 'celulas-pequenas-com-moldagem-nuclear', seta(0.4400, 0.2000, 45),
        rotulo='Fragmento tomado por células pequenas azuis',
        vista=(0.410, 0.170, 0.480, 0.240)),
    pat('moldagem', 'celulas-pequenas-com-moldagem-nuclear', seta(0.4423, 0.1985, 45),
        rotulo='Núcleos amoldados, sem nucléolo, citoplasma escasso',
        vista=(0.440, 0.195, 0.448, 0.203)),
    pat('esmagamento', 'artefato-de-esmagamento', seta(0.4780, 0.1370, 45),
        rotulo='Esmagamento: cromatina estirada',
        vista=(0.470, 0.130, 0.482, 0.142)),
    pat('infiltracao', 'invasao-estromal', seta(0.5000, 0.1290, 45),
        rotulo='Cordões de células tumorais entre fibras do estroma',
        vista=(0.494, 0.122, 0.506, 0.134)),
], achados=[
    achado('celulas-pequenas-com-moldagem-nuclear', 'presente', ['lencois', 'moldagem'], 'Lençóis de células pequenas com citoplasma escasso, moldagem nuclear, cromatina fina e sem nucléolos visíveis, em vários fragmentos.'),
    achado('artefato-de-esmagamento', 'presente', ['esmagamento'], 'Faixas de cromatina estirada nas bordas de vários fragmentos.'),
    achado('invasao-estromal', 'presente', ['infiltracao'], 'Células tumorais em cordões dissecando o estroma fibroso da parede brônquica.'),
    achado('necrose-coagulativa', 'nao-avaliavel', [], 'Não há área de necrose inequívoca nestes fragmentos; o material vermelho em vários deles é sangue da biópsia.'),
], conferencias=3, resumo='Biópsia brônquica de tumor do lobo superior direito: carcinoma de pequenas células — lençóis de células pequenas com moldagem nuclear e sem nucléolo, infiltrando o estroma, com artefato de esmagamento.')
print('ok')
