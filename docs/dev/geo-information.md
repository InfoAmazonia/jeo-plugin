# Geographical Information of a post

Each post can be related to one or more points on the map.

For each point, JEO collects geographical information such as city and country names. For complete information on this, see [Geocoders](geocoders.md).

## How geographical information is stored

Each related point is stored as one entry of the `_related_point` metadata key. Each entry is an object with all the information retrieved by the geocoder.

Here is an example of two entries related to the same post, that could be get using:

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
```

## How to search for posts by geoinformation? (indexes)

When you save geographical information of the points, JEO also creates other metadata that will allow developers to query posts by specific geographical information.

Since each point is stored as a serialized data in the database, this would not allow us to filter posts by `country_code` for example. That's why we create indexes.

For the example above, this post would also have one individual metadata entry for each information, like this:

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

Note: `_s` and `_p` suffixes indicate if the relevance of that information is primary or secondary.

Note 2: Full addresses are not indexed

Now we have all the information as individual metadata and this allows me to query by them, however, the pairs are disconnected (if I had more than one primary point, it would be impossible to know what are the latitude-longitude pairs. That's why the information we actually use is the serialized object).

### Fetching posts by geoinformation

Give me all the posts that have primary points with the country code `'BR'`:

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

Give me all the posts whose city is `'Manaus'`:

```PHP
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
