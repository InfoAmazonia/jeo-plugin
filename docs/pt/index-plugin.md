# Plugin JEO

O plugin JEO atua como uma plataforma de geojornalismo que permite que organizações de notícias, blogueiros e ONGs publiquem reportagens como camadas de informação em mapas digitais. Com o JEO, criar a interação entre camadas de dados e informações contextuais é intuitivo e interativo.

Você pode publicar histórias geolocalizadas e criar páginas com design rico para cada uma das histórias destacadas. Ao mesmo tempo, ao configurar camadas hospedadas no Mapbox e escolher entre MapboxGL e MapLibreGL, você pode gerenciar mapas sofisticados sem perder desempenho, adicionar legendas diretamente com HTML e definir os parâmetros do mapa. Tudo diretamente no painel do WordPress.

## Funcionalidades

- Mapas [Mapbox](https://www.mapbox.com/) e [MapLibre](https://maplibre.org/)
- Biblioteca [react-map-gl](https://visgl.github.io/react-map-gl/)
- Camadas de tiles personalizadas
- Opções de filtragem de camadas, permitindo combinar camadas de tiles.
- Geocodificação de posts do WordPress usando OpenStreetMap (Nominatim), com suporte ao tipo de post `Post` e extensibilidade para outros geocodificadores via hook.
- Ícones de marcadores personalizáveis, que podem ser associados a categorias, taxonomias personalizadas ou diretamente a posts.
- Consulta de marcadores de mapa integrada à consulta de posts.
- Suporte aos plugins multilíngues [WPML](https://wpml.org/pt-br/) e [Polylang](https://wordpress.org/plugins/polylang/)
- Georreferenciamento, geolocalização em lote e geração de mapas com IA (múltiplos provedores de IA)
- Bloco Histórias próximas a você com descoberta de posts baseada em geolocalização
- Bloco de mapa assistido por IA (Minimapa) com refinamento por chat e camadas geradas automaticamente

## Tutoriais do usuário

### Primeiros passos

- [Conceitos](concepts.md)
- [Instalando e configurando o plugin](getting-started.md)

### Camadas

- [Criando camadas](layer-post.md)

### Mapas

- [Criando mapas](map-post.md)

### Discovery

- [Usando o Discovery](discovery.md)

### Mapa Narrativo

- [Criando e usando Mapas Narrativos](story-map.md)

### Posts

- [Geolocalização de posts](geolocating-posts.md)
- [Georreferenciamento com IA](ai-georeferencing.md)
- [Geolocalização em lote com IA](ai-bulk-geolocation.md)
- [Usando um shortcode de mapa](map-shortcode.md)
- [Usando um bloco de mapa](map-block.md)
- [Usando um bloco de mapa de uso único](one-time-map-block.md)
- [Usando uma incorporação de mapa](map-embed.md)

### Funcionalidades de IA

- [Configurações de IA](ai-settings.md)
- [Minimapa — Bloco de mapa assistido por IA](minimap.md)

### Histórias próximas a você

- [Bloco Histórias próximas a você](stories-near-you.md)

## Documentação para desenvolvedores

### Tutoriais

- [Adicionando novos tipos de camada](dev/layer-types.md)
- [Informações geográficas de um post](dev/geo-information.md)
- [Escrevendo um geocodificador](dev/geocoders.md)

### Diferenças entre o JEO antigo e o atual

- [Migração](dev/migration.md)
