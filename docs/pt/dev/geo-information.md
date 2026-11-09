# Informações geográficas de um post

Cada post pode ser relacionado a um ou mais pontos no mapa.

Para cada ponto, o JEO coleta informações geográficas como nomes de cidade e país. Para informações completas sobre isso, consulte [Geocodificadores](geocoders.md).

## Como as informações geográficas são armazenadas

Cada ponto relacionado é armazenado como uma entrada da chave de metadados `_related_point`. Cada entrada é um objeto com todas as informações recuperadas pelo geocodificador ou, ao usar o georreferenciamento por IA, pelo modelo de IA.

Aqui está um exemplo de duas entradas relacionadas ao mesmo post, que poderiam ser obtidas usando:

```php
get_post_meta( $post_id, '_related_point' );
```

```php
'_related_point' => [
    'relevance' => 'primary',
    '_geocode_lat' => '-23,54659435',
    '_geocode_lon' => '-46,644533061712',
    '_geocode_full_address' => 'Edifício Copan, Rua Araújo, Vila Buarque, República, São Paulo, Região Imediata de São Paulo, Região Metropolitana de São Paulo, Região Intermediária de São Paulo, São Paulo, Região Sudeste, 01046-010, Brasil',
    '_geocode_country' => 'Brasil',
    '_geocode_country_code' => '',
    '_geocode_city' => 'São Paulo',
    '_geocode_region_level_2' => 'São Paulo',
    '_geocode_region_level_3' => 'Região Intermediária de São Paulo',
    '_geocode_city_level_1' => 'Vila Buarque',
],
'_related_point' => [
    'relevance' => 'secondary',
    '_geocode_lat' => '-23,183525102463',
    '_geocode_lon' => '-46,898231506348',
    '_geocode_full_address' => 'Rua Jorge Gebran, Parque do Colégio, Chácara Urbana, Jundiaí, Região Imediata de Jundiaí, Região Intermediária de Campinas, São Paulo, Região Sudeste, 13209-090, Brasil',
    '_geocode_country' => 'Brasil',
    '_geocode_country_code' => '',
    '_geocode_city' => 'Jundiaí',
    '_geocode_region_level_2' => 'São Paulo',
    '_geocode_region_level_3' => 'Região Intermediária de Campinas',
    '_geocode_city_level_1' => 'Parque do Colégio',
        ]
    ]
]
```

## Campos de geolocalização gerados por IA

Quando um ponto é gerado pelo georreferenciamento por IA (em vez de geocodificação manual), a entrada `_related_point` inclui um campo adicional:

- `_ai_quote` (string) — o trecho do conteúdo do post que a IA identificou como referência a esse local.

Exemplo:

```php
'_related_point' => [
    'relevance' => 'primary',
    '_geocode_lat' => '-3.1303',
    '_geocode_lon' => '-60.0234',
    '_geocode_full_address' => 'Teatro Amazonas, Manaus, Amazonas, Brasil',
    '_geocode_country' => 'Brasil',
    '_geocode_country_code' => '',
    '_geocode_city' => 'Manaus',
    '_geocode_region_level_2' => 'Amazonas',
    '_geocode_region_level_3' => '',
    '_geocode_city_level_1' => '',
    '_ai_quote' => 'O Teatro Amazonas, localizado no centro de Manaus, reabriu após restauro.',
],
```

A IA também produz uma pontuação de `confidence` (0–100) durante o georreferenciamento, mas ela **não** é armazenada em `_related_point` — é usada apenas durante o fluxo de aprovação no processador em lote. Consulte [Georreferenciamento por IA](../ai-georeferencing.md) e [Geolocalização em lote por IA](../ai-bulk-geolocation.md).

## Como buscar posts por geoinformação? (índices)

Quando você salva as informações geográficas dos pontos, o JEO também cria outros metadados que permitem aos desenvolvedores consultar posts por informações geográficas específicas.

Como cada ponto é armazenado como dados serializados no banco de dados, isso não nos permitiria filtrar posts por `country_code`, por exemplo. É por isso que criamos índices.

Para o exemplo acima, esse post também teria uma entrada de metadado individual para cada informação, assim:

```php
[
    '_geocode_lat_p' => '-23,54659435',
    '_geocode_lon_p' => '-46,644533061712',
    '_geocode_country_p' => 'Brasil',
    '_geocode_country_code_p' => '',
    '_geocode_city_p' => 'São Paulo',
    '_geocode_region_level_2_p' => 'São Paulo',
    '_geocode_region_level_3_p' => 'Região Intermediária de São Paulo',
    '_geocode_city_level_1_p' => 'Vila Buarque',
    '_geocode_lat_s' => '-23,183525102463',
    '_geocode_lon_s' => '-46,898231506348',
    '_geocode_country_s' => 'Brasil',
    '_geocode_country_code_s' => '',
    '_geocode_city_s' => 'Jundiaí',
    '_geocode_region_level_2_s' => 'São Paulo',
    '_geocode_region_level_3_s' => 'Região Intermediária de Campinas',
    '_geocode_city_level_1_s' => 'Parque do Colégio',
]
```

Observação: os sufixos `_s` e `_p` indicam se a relevância dessa informação é primária ou secundária.

Observação 2: endereços completos não são indexados.

Agora temos todas as informações como metadados individuais, e isso me permite consultá-las; no entanto, os pares estão desconectados (se eu tivesse mais de um ponto primário, seria impossível saber quais são os pares de latitude-longitude. É por isso que a informação que realmente usamos é o objeto serializado).

### Buscando posts por geoinformação

Me dê todos os posts que têm pontos primários com o código de país `'BR'`:

```php
$posts = new WP_Query([
    'meta_query' => [
        [
            'key' => '_geocode_country_code_p',
            'value' => 'BR'
        ]
    ]
]);
```

Me dê todos os posts cuja cidade é `'Manaus'`:

```php
$posts = new WP_Query([
    'meta_query' => [
        [
            'key' => '_geocode_city_s',
            'value' => 'Manaus'
        ],
        [
            'key' => '_geocode_city_p',
            'value' => 'Manaus'
        ],
        'relation' => 'OR'
    ]
]);
```
