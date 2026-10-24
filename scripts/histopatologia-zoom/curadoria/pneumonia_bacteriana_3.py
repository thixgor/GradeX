import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 1456, caso 23 — "Lobular pneumonia, partly organized (Staphylococcus aureus obtained on culture)".
salvar('pneumonia-bacteriana-3', [
    pat('exsudato', 'exsudato-alveolar-neutrofilico', seta(0.1700, 0.2700, 45),
        rotulo='Alvéolos entupidos de neutrófilos: consolidação',
        nota='Os espaços que deveriam conter ar estão cheios de neutrófilos, fibrina e restos celulares, e os septos alveolares continuam de pé em volta — é a consolidação da pneumonia bacteriana. A cultura deste caso cresceu Staphylococcus aureus. O tom azulado incomum do exsudato é próprio desta lâmina antiga; massas basofílicas assim podem corresponder a colônias bacterianas, o que só um Gram confirma.',
        vista=(0.130, 0.220, 0.250, 0.330)),
    pat('exsudato-2', 'exsudato-alveolar-neutrofilico', seta(0.2300, 0.2650, 135),
        rotulo='Outro alvéolo cheio de pus, com septo preservado',
        vista=(0.210, 0.240, 0.250, 0.290)),
    pat('organizacao', 'tecido-de-granulacao', seta(0.1300, 0.0800, 225),
        rotulo='Organização: tecido conjuntivo jovem invadindo os alvéolos',
        nota='Em parte do lobo o exsudato não foi removido e está sendo substituído por fibroblastos e colágeno frouxo que crescem dentro dos alvéolos e alargam os septos. Quando a fibrina não é digerida pelas enzimas dos neutrófilos, a pneumonia "se organiza" e pode deixar cicatriz — o "partly organized" do diagnóstico original.',
        vista=(0.100, 0.050, 0.180, 0.120)),
    pat('congestao', 'hiperemia-e-congestao', seta(0.1350, 0.1000, 45),
        rotulo='Rolhas de fibrina e sangue nos alvéolos',
        vista=(0.120, 0.090, 0.160, 0.115)),
    pat('antracose', 'antracose', seta(0.1430, 0.0800, 315),
        rotulo='Pigmento de carvão nos septos',
        vista=(0.135, 0.070, 0.150, 0.090)),
    est('veia', 'veia', seta(0.6760, 0.3300, 0),
        rotulo='Vaso pulmonar calibroso, com sangue e fibrina na luz',
        vista=(0.640, 0.260, 0.740, 0.400)),
    est('pneumocitos', 'alveolo-pulmonar', seta(0.1280, 0.0930, 315),
        rotulo='Septo alveolar revestido por pneumócitos reativos',
        vista=(0.120, 0.085, 0.135, 0.098)),
], achados=[
    achado('exsudato-alveolar-neutrofilico', 'presente', ['exsudato', 'exsudato-2'],
           'Alvéolos preenchidos por neutrófilos e fibrina, com septos preservados, em todo o lobo.'),
    achado('hiperemia-e-congestao', 'presente', ['congestao'],
           'Rolhas de fibrina com hemácias e capilares septais cheios.'),
    achado('exsudato-fibrinopurulento', 'nao-avaliavel', [],
           'A pleura não está incluída neste corte.'),
    achado('abscesso', 'ausente', [],
           'Nos campos conferidos os septos estão preservados; não há cavidade com destruição do parênquima.'),
    achado('tecido-de-granulacao', 'presente', ['organizacao'],
           'Áreas de organização, com tecido conjuntivo jovem nos alvéolos e septos alargados.'),
    achado('antracose', 'presente', ['antracose'],
           'Pigmento de carvão disperso nos septos.'),
], conferencias=3, resumo='Pneumonia lobular estafilocócica parcialmente organizada: alvéolos entupidos de neutrófilos e fibrina com septos preservados (consolidação), áreas em que o exsudato é substituído por tecido conjuntivo jovem (organização), rolhas de fibrina com sangue e antracose discreta. Um vaso pulmonar calibroso atravessa o lobo à direita.')
print('ok')
