# Adicionando novos tipos de camada

Este documento descreve como registrar novos tipos de camada para serem usados em mapas criados com o JEO.

## Introdução

No JEO, os mapas são renderizados usando [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/API/) (padrão) ou [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/), dependendo da configuração de **runtime de mapa** definida em **Jeo → Configurações**. As duas bibliotecas compartilham uma API compatível baseada na [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/), de modo que qualquer novo tipo de camada funcionará com qualquer um dos runtimes. O objeto `map` inicializado passado aos métodos do tipo de camada é uma instância `Map` do MapLibre GL ou do Mapbox GL — ambas expõem os mesmos métodos principais (`setStyle`, `addLayer`, `addSource`, etc.).

Basicamente, para adicionar um novo tipo de camada, há 2 passos simples:

1. Registrar o novo tipo de camada usando um hook do PHP, informando onde está o arquivo JavaScript principal do seu tipo de camada;
2. Criar uma classe JavaScript implementando métodos para adicionar a camada ao mapa e para descrever quais são as opções que uma camada desse tipo tem.

Em resumo, isto é tudo o que precisa ser feito. Em alguns casos, porém, você pode precisar adicionar dependências extras ao projeto. Por exemplo, para criar um tipo de camada que dê suporte às camadas vetoriais do Carto, podemos querer adicionar o CartoVL (que é uma extensão do MapboxGL) ao projeto.

## Criando um novo tipo de camada

Primeiro, vamos registrar um novo tipo de camada associando uma função à ação `jeo_register_layer_types`:

```php
add_action('jeo_register_layer_types', function($layer_types) {
    $layer_types->register_layer_type( 'my-layer-type', [ 'script_url' => plugin_dir_url( __FILE__ ) . '/js/layertype.js' ] );
});
```

O método `register_layer_type` recebe 2 parâmetros.

- Slug do tipo de camada - Uma string única e sanitizada (certifique-se de torná-la única)
- Opções - Um array com as opções do tipo de camada:
  - `script_url`: Obrigatório. A URL absoluta para o seu arquivo JavaScript.
  - `dependencies`: Opcional. Um array de handles de scripts registrados com [wp_register_script](https://developer.wordpress.org/reference/functions/wp_register_script/) que devem ser carregados como dependência do script principal do tipo de camada

Isso é tudo o que você precisa fazer no lado PHP. Toda a mágica acontece no JavaScript.

Agora, vamos criar o nosso arquivo `layertype.js`.

Neste arquivo, vamos registrar um objeto JavaScript usando o `window.JeoLayerTypes.registerLayerType`, disponível globalmente.

O primeiro parâmetro deve ser o mesmo slug que você definiu ao registrar o seu tipo de camada no lado PHP, e o segundo parâmetro é um objeto com, pelo menos, três métodos.

```js
window.JeoLayerTypes.registerLayerType('tilelayer', {

    addStyle: function(map, attributes) {
        // ...
    },

    addLayer: function(map, attributes) {
        // ...
    },

    getSchema: function(attributes) {
        // ...
    }
});
```

O seu objeto de tipo de camada DEVE implementar pelo menos esses três métodos.

### getSchema(attributes)

**parâmetros**:

- `attributes` - objeto com os atributos da camada (veja a seção abaixo)

**retorna**:

- Promise com um json-schema

Este método informará ao JEO quais são as opções que o usuário deve preencher ao criar uma nova camada deste tipo.

Por exemplo, um tipo de camada de tiles raster pode ter apenas uma URL. Uma camada Mapbox tem o Style ID e o Access token opcional.

Este método deve retornar uma Promise com uma representação em json-schema das opções do tipo de camada.

Este schema deve incluir apenas informações específicas do tipo de camada. Toda camada, independentemente do seu tipo, tem um conjunto de atributos comuns, como ID e Nome.

Por exemplo, o tipo de camada "Tile layer" precisa apenas de uma URL, então é assim que o seu método `getSchema` ficará:

```js
    // ...

    getSchema: function(attributes) {
        return new Promise( function(resolve, reject) {

            resolve({
                "type": "object",
                "required": [
                    "url"
                ],
                "properties": {
                    "url": {
                        "type": "string",
                        "title": "URL"
                    }
                }
            });

        });
    }
```

## addStyle(map, attributes)

**parâmetros**:

- `map` - o objeto [Map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) do MapLibre GL ou [Map](https://docs.mapbox.com/mapbox-gl-js/api/#map) do Mapbox GL já inicializado, dependendo do runtime de mapa configurado
- `attributes` - objeto com os atributos da camada (veja a seção Atributos da camada abaixo)

**retorna**:

- O retorno de uma chamada a [`map.setStyle`](https://docs.mapbox.com/mapbox-gl-js/api/#map#setstyle)

Ambos os runtimes usam a [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/) como camada base. Este método adicionará a camada como o estilo do mapa, usando o método [`setStyle`](https://docs.mapbox.com/mapbox-gl-js/api/#map#setstyle) do objeto `Map`.

Este método será invocado quando uma camada deste tipo for adicionada ao mapa como camada base.

Por exemplo, o tipo de camada "Tile Layer" define o estilo como uma camada raster:

```js
    // ...

    addStyle: function(map, attributes) {
        return map.setStyle({
            'version': 8,
            'sources': {
                'raster-tiles': {
                    'type': 'raster',
                    'tiles': [attributes.layer_type_options.url],
                    'tileSize': 256
                }
            },
            'layers': [{
                id: attributes.layer_id,
                type: 'raster',
                source: 'raster-tiles'
            }]
        })
    }
```

**Observação**: O objeto `attributes.layer_type_options` contém todas as propriedades declaradas no método `getSchema`. É por isso que há um `url` ali! (Veja a seção Atributos da camada abaixo)

## addLayer(map, attributes)

**parâmetros**:

- `map` - o objeto [Map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) do MapLibre GL ou [Map](https://docs.mapbox.com/mapbox-gl-js/api/#map) do Mapbox GL já inicializado, dependendo do runtime de mapa configurado
- `attributes` - objeto com os atributos da camada (veja a seção Atributos da camada abaixo)

**retorna**:

- O retorno de uma chamada a [`map.addLayer`](https://docs.mapbox.com/mapbox-gl-js/api/#map#addlayer)

Este método adicionará a camada ao mapa usando o método [`addLayer`](https://docs.mapbox.com/mapbox-gl-js/api/#map#addlayer) do objeto `Map`.

Este método será invocado quando uma camada deste tipo for adicionada ao mapa.

Por exemplo, o tipo de camada "Tile Layer" adiciona a si mesmo como uma camada raster:

```js
    // ...

    addLayer: function(map, attributes) {
        var layer = {
            id: attributes.layer_id,
            source: {
              type: 'raster',
              tiles: [attributes.layer_type_options.url],
              "tileSize": 256
            },
            type: 'raster'
        };
        if ( ! attributes.visible ) {
            layer.layout = {
                visibility: 'none'
            };
        }
        return map.addLayer(layer);
    }

```

**Observação:** Este método deve verificar o valor de `attributes.visible` para determinar se esta camada deve estar visível quando o mapa for inicializado.

## Atributos da camada

Como você viu, cada um dos métodos acima recebe um argumento `attributes` como entrada. Este argumento contém todas as informações da camada que o usuário está editando ou visualizando.

Alguns atributos são comuns a qualquer tipo de camada e outros são específicos de um tipo de camada. Todo atributo específico de um tipo de camada que uma camada tenha é armazenado sob o atributo `layer_type_options`.

Então estas são as chaves disponíveis no objeto `attributes`:

- `layer_id`: (integer) Um ID único que representa esta camada e a identifica no banco de dados
- `layer_name`: (string) O nome da camada, dado pelo usuário
- `visible`: (boolean) Uma flag que indica se esta camada deve estar visível quando o mapa for inicializado
- `layer_type_options`: (object) Um objeto com todos os atributos específicos do tipo de camada (aqueles registrados no método `getSchema`)
