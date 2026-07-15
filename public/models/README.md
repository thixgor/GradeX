# Modelo 3D do coração (opcional)

Coloque um arquivo glTF binário aqui para habilitar o modo **"Modelo 3D"** no
Manual do Eletrocardiograma:

```
public/models/heart.glb
```

Quando o arquivo existe, o componente `components/ecg/heart-3d.tsx` carrega o
modelo, centraliza/escala automaticamente e o exibe com os materiais originais.
Um botão **"Modelo 3D / Procedural"** permite alternar entre o modelo carregado
e o coração procedural (construído em código) a qualquer momento. Se o arquivo
não existir, apenas o coração procedural é usado — sem erros.

## Licença

Produto comercial: use apenas modelos com licença compatível (CC0 ideal; CC-BY
com atribuição). Evite CC-BY-SA / CC-BY-NC e modelos sem licença clara.
