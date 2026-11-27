# Conceitos

## Camada

Uma camada é o bloco básico de construção das interações de mapa. Cada camada pode ter suas próprias legendas, atribuições, etc.

O JEO suporta quatro tipos de camada prontos para uso:

- [Estilos do Mapbox](https://docs.mapbox.com/studio-manual/overview/map-styling/)
- [Tilesets do Mapbox](https://docs.mapbox.com/help/glossary/tileset/)
- [Vector tiles do Mapbox](https://docs.mapbox.com/vector-tiles/reference/) (MVTs)
- [TileLayers](https://en.wikipedia.org/wiki/Tiled_web_map)

Além disso, o JEO pode gerar camadas personalizadas usando IA (veja [Mapa gerado por IA](#mapa-gerado-por-ia)).

## Mapa

Um mapa é composto por uma ou mais camadas e pode ser associado a posts geolocalizados relacionados, que serão renderizados como marcadores no mapa.

Um post do tipo mapa é usado para interações de mapa reutilizáveis, que podem ser incorporadas em qualquer post como [shortcode](map-shortcode.md) ou [bloco do Gutenberg](map-block.md).

## Mapa de uso único

Em vez de criar um mapa reutilizável sempre que quiser adicionar uma interação de mapa, você pode criar e configurar um mapa embutido de uso único por meio do [bloco de mapa de uso único](one-time-map-block.md) para o Gutenberg.

## Geolocalização de posts

Posts podem ser geolocalizados manualmente, buscando e adicionando pontos na barra lateral de Geolocalização, ou automaticamente com o georreferenciamento por IA — que analisa o conteúdo do post e sugere localizações com pontuações de confiança. Veja [Geolocalização de posts](geolocating-posts.md) e [Georreferenciamento com IA](ai-georeferencing.md).

## Funcionalidades de IA

As funcionalidades de IA do JEO são alimentadas por um provedor de IA externo configurável, com base de conhecimento integrada (RAG), agentes especializados e saída estruturada. Veja [IA no JEO](ai-in-jeo.md) para uma explicação detalhada de como essas peças funcionam juntas.

## Mapa gerado por IA

Um bloco de mapa assistido por IA que gera mapas contextuais a partir de um prompt de texto ou do conteúdo de um post, com uma interface de chat para refinamento. Ele também pode gerar camadas de mapa personalizadas quando uma chave do Mapbox está configurada. Veja [Minimapa](minimap.md).

## Mapa Narrativo

Um Mapa Narrativo é uma experiência de scrollytelling: cada **slide** tem uma localização, camadas e um texto. Conforme o leitor rola a página, o mapa transita entre os slides. Veja [Mapa Narrativo](story-map.md).

## Discovery

Um mapa interativo de página inteira onde os leitores podem explorar histórias geolocalizadas, alternar camadas de diferentes mapas e compartilhar uma visualização personalizada. Veja [Discovery](discovery.md).

## Histórias próximas a você

Um bloco que exibe os posts geolocalizados mais próximos da localização do leitor, com geolocalização do navegador mediante consentimento e fallback automático. Veja [Histórias próximas a você](stories-near-you.md).
