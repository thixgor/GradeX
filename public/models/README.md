# Modelo 3D do coração (opcional)

O Manual do Eletrocardiograma renderiza, por padrão, um coração **procedural**
(construído em código com three.js) — não depende de nenhum arquivo externo.

Se você quiser usar um **modelo 3D real** no lugar, basta colocar um arquivo
glTF binário aqui:

```
public/models/heart.glb
```

O componente `components/ecg/heart-3d.tsx` detecta o arquivo automaticamente
(`GLTFLoader`), centraliza/escala o modelo para o enquadramento, aplica o
shader translúcido com a **frente de despolarização** à malha real e mantém por
cima o sistema de condução, as artérias coronárias, os marcadores de parede e o
vetor elétrico. Se o arquivo não existir (ou falhar ao carregar), o coração
procedural continua sendo usado — sem erros.

## Licença (importante)

Este é um produto comercial. **Só inclua modelos com licença compatível**:

- **CC0 / domínio público** — ideal, sem restrições.
- **CC-BY** — permitido, desde que a atribuição do autor seja mantida (adicione
  os créditos neste arquivo e, se aplicável, na interface).
- **Evite CC-BY-SA / CC-BY-NC** e modelos sem licença clara — podem ser
  incompatíveis com uso comercial/redistribuição.

Fontes com modelos anatômicos de licença livre: NIH 3D (muitos CC0),
Smithsonian Open Access (CC0), Sketchfab (filtro CC-BY) e Wikimedia Commons.

Formato recomendado: `.glb` (glTF binário) sem compressão Draco. Se o modelo
usar Draco, será necessário configurar o `DRACOLoader` (decoder em
`public/draco/`).
