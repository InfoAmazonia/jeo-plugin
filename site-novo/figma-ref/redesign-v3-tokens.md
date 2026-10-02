# Redesign v3 — Tokens (landing JEO Maps)

Fonte: Figma "JEO MAPS entregas", página "entrega 15/9/26", frame `jeo-maps-landing-redesign` (133:1531, 1920×8448).
Extraído em 15/09/2026 via `figma-desktop_*` (design context em nodes-folha) + amostragem de pixels em `figma-ref/desktop-v3.png`.
Obs.: o arquivo Figma não usa variables/tokens nomeados — apenas text styles (H1–H5, P, small, `<title>`). Valores abaixo foram lidos node a node.

## Paleta de cores

| Hex | Papel |
|---|---|
| `#0A1628` | Fundo escuro principal (Navbar, slider de recursos, Live Demo, base do footer) e texto de headings sobre fundo claro |
| `#0C182A` | Fundo do Hero (variação sutil do navy; possível gradiente) |
| `#101C2E` | Fundo da faixa superior do Footer |
| `#FAFAF8` | Fundo claro principal (Features, How It Works, cards) e texto claro sobre fundo escuro |
| `#F1F5F0` | Fundo claro alternado (Feature row 1) |
| `#E8F0E8` | Fundo claro alternado verde-menta (Feature rows 3 e 5, Workshops, Community Box, texto secundário do hero) |
| `#00DBA6` | Verde brand / CTA primário (botão "Instalar Plugin", elementos da ilustração do hero) |
| `#019875` | Verde do CTA secundário ("Quero testar o JEO", Live Demo) |
| `#00A67E` | Verde de acento em texto (eyebrow "Um projeto da") |
| `#1C6C73` | Teal escuro — traços das ilustrações e ícones sobre fundo escuro |
| `#2FBAC6` | Ciano — sparkles/acentos da ilustração do hero |
| `#5B5F62` | Texto corrido secundário sobre fundo claro (lead de seção) |
| `#084043`–`#092A35` | Texto escuro sobre botão verde (amostrado; núcleo do glifo ≈ `#0A1628`) |

Notas:
- Nav links: `#FAFAF8` com opacidade 0,9.
- O wordmark da navbar/footer é branco (`#FFFFFF`) com strokes brancos nos vetores do "J".
- Fundos escuros do slider card: `#0A1629` (praticamente igual ao navy base).

## Tipografia

Famílias: **Open Sans Condensed** (Bold) para headings; **Open Sans** (Regular/Bold) para corpo, navegação e botões.

| Papel | Família / peso | Tamanho | Line-height | Cor | Outros |
|---|---|---|---|---|---|
| H1 (hero) | Open Sans Condensed Bold | 64px | 110% | `#FAFAF8` | uppercase visual no layout |
| H2 (título de seção) | Open Sans Condensed Bold | 64px | 120% | `#0A1628` | centralizado |
| H3 (feature/card) | Open Sans Condensed Bold | 40px | 120–150% | `#0A1628` | |
| Subtítulo hero | Open Sans Regular | 24px | 150% | `#E8F0E8` | |
| Lead de seção | Open Sans (Regular) | 20px | 150% | `#5B5F62` | centralizado, max-w 1152px |
| Destaque feature (sub) | Open Sans Bold | 20px | 150% | `#0A1628` | |
| Corpo feature | Open Sans Regular | 18px | 150% | `#0A1628` | |
| Nav links | Open Sans Bold | 20px | 150% | `#FAFAF8` @ 90% | |
| Label de botão | Open Sans Bold | 18px | 150% | navy sobre `#00DBA6` | centralizado |
| Eyebrow | Open Sans Bold | 12px | auto | `#00A67E` | letter-spacing 1,5px |
| Wordmark "JEO Maps" | (texto vivo) | ~29px navbar / ~58px footer | — | `#FFFFFF` | letter-spacing −1,44px (navbar) |

## Raios, espaçamentos e métricas recorrentes

| Token | Valor |
|---|---|
| Raio de botão primário | ~8px |
| Altura de botões | 57–68px (nav 59px, hero 57–62px, demo 68px) |
| Margem lateral do container | 160px (conteúdo 1600px em 1920px) |
| Padding superior de seção | 80–120px (Hero 80, slider/HIW/Workshops 100, Demo 120) |
| Gap header → conteúdo | ~64px |
| Ícones das tabs | 32×32px |
| Alturas de seção | Navbar 118 · Hero 790 · Slider 1108 · Features 3345 · How It Works 878 · Live Demo 1133 · Workshops 711 · Footer 365 |
| Cards de passo (HIW) | 512px largura, padding interno 32px, badge numérico 48×48 |
| Mídias de feature | 600–692 × 384–418px |
| Print da demo | 982×552 dentro de "browser chrome" 982×617 |

## Limitações da extração

- `get_variable_defs` não retornou variables (o arquivo não as usa); text styles existem mas sem valores expostos — tipografia foi lida node a node.
- `get_design_context` falha em containers que incluem instâncias de componentes com erro ("Component set for node has existing errors") — Navbar, Hero e botões não puderam ser lidos diretamente; valores de botão/raio foram medidos por amostragem de pixels no screenshot.
- Cores de fundo amostradas do render (`desktop-v3.png`), não de fills declarados.
