# Información geográfica de una entrada

Cada entrada puede estar relacionada con uno o más puntos en el mapa.

Para cada punto, JEO recopila información geográfica como los nombres de la ciudad y del país. Para información completa sobre esto, consulta [Geocodificadores](geocoders.md).

## Cómo se almacena la información geográfica

Cada punto relacionado se almacena como un registro de la clave de metadatos `_related_point`. Cada registro es un objeto con toda la información recuperada por el geocodificador o, cuando se usa la georreferenciación con IA, por el modelo de IA.

Este es un ejemplo de dos registros relacionados con la misma entrada, que se podrían obtener con:

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

## Campos de geolocalización generados por IA

Cuando un punto es generado por la georreferenciación con IA (en lugar de por geocodificación manual), el registro `_related_point` incluye un campo adicional:

- `_ai_quote` (string) — el fragmento del contenido de la entrada que la IA identificó como referencia a esta ubicación.

Ejemplo:

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

La IA también produce una puntuación `confidence` (0–100) durante la georreferenciación, pero esta **no** se almacena en `_related_point` — se usa únicamente durante el flujo de aprobación en el procesador masivo. Consulta [Georreferenciación con IA](../ai-georeferencing.md) y [Geolocalización masiva con IA](../ai-bulk-geolocation.md).

## ¿Cómo buscar entradas por geoinformación? (índices)

Cuando guardas la información geográfica de los puntos, JEO también crea otros metadatos que permitirán a los desarrolladores consultar entradas por información geográfica específica.

Como cada punto se almacena como un dato serializado en la base de datos, esto no nos permitiría filtrar entradas por `country_code`, por ejemplo. Por eso creamos índices.

Para el ejemplo anterior, esta entrada también tendría un metadato individual para cada dato, así:

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

Nota: los sufijos `_s` y `_p` indican si la relevancia de esa información es primaria o secundaria.

Nota 2: las direcciones completas no se indexan

Ahora tenemos toda la información como metadatos individuales y esto me permite consultar por ellos; sin embargo, los pares están desconectados (si tuviera más de un punto primario, sería imposible saber cuáles son los pares de latitud-longitud. Por eso, la información que realmente usamos es el objeto serializado).

### Consulta de entradas por geoinformación

Dame todas las entradas que tienen puntos primarios con el código de país `'BR'`:

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

Dame todas las entradas cuya ciudad sea `'Manaus'`:

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
