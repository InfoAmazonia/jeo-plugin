# JEO BRAINS — Landing page

Landing page responsiva do **JEO BRAINS** — Inteligência Artificial para criar e
publicar geojornalismo interativo no WordPress. Construída como reprodução fiel
do layout em `../desktop.png`.

## Stack

- **React 18** + **Vite 5**
- **Tailwind CSS 3** (tema customizado: paleta dark + teal da marca)
- **Framer Motion** — microinterações e animações de scroll
- **lucide-react** — ícones

## Como rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # serve o build de produção
```

## Estrutura

```
src/
├── App.jsx                  # composição das seções + barra de progresso de scroll
├── index.css                # base Tailwind, tokens e componentes utilitários
└── components/
    ├── Hero.jsx             # capa com fundo topográfico animado
    ├── WhySection.jsx       # "Por que..." — comparativos Atualmente × JEO
    ├── FeaturesSection.jsx  # 4 recursos inteligentes
    ├── WordPressSection.jsx # banner de integração + passos 1–4
    ├── ReadySection.jsx     # "Tudo pronto..." + mock do editor Gutenberg
    ├── NewsletterSection.jsx# formulário de inscrição (com estado)
    ├── WorkshopsSection.jsx # próximas oficinas
    ├── TransparencySection.jsx
    ├── Footer.jsx
    └── ui/                  # peças reutilizáveis (logo, ícones, reveal, fundo)
```

## Microinterações

- Barra de progresso de leitura fixa no topo
- Entrada das seções com fade + slide ao entrar na viewport (`Reveal`)
- Cards que levantam no hover, com brilho/sheen e borda teal
- Banner do WordPress com gradiente animado
- Mock do editor flutuando suavemente
- Checkboxes e botões animados; estado de sucesso no formulário
- Respeita `prefers-reduced-motion`
