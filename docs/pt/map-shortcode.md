# Shortcode de mapa

Um mapa pode ser inserido em qualquer página ou post usando o shortcode `jeo-map`.

O shortcode aceita três atributos:

- `map_id` (obrigatório): o ID do mapa que você deseja inserir;
- `width` (opcional): a largura do mapa. O padrão será 600px ou o que o tema ativo definir para a classe CSS 'div.jeomap';
- `height` (opcional): a altura do mapa. O padrão será 600px ou o que o tema ativo definir para a classe CSS 'div.jeomap'.

Exemplos:

```html
[jeo-map map_id=99]
```

Você precisa informar pelo menos o ID do mapa que deseja inserir. Por padrão, ele será inserido com um tamanho de 600&times;600px (ou o que o tema ativo definir), mas você também pode alterá-lo:

```html
[jeo-map map_id=99 width="800px" height="800px"]
```
