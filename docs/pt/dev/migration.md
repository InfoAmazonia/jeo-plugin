# Migração

Notas sobre mudanças na estrutura do banco de dados do JEO antigo que precisarão de migrações a serem escritas.

## `post_meta` de geocodificação

No JEO antigo, algumas `meta_key`s eram prefixadas por um underscore (`_`) e outras não:

- `geocode_address`
- `geocode_latitude`
- `geocode_longitude`
- `_geocode_city`
- `_geocode_country`
- `geocode_viewport`

Vamos fazer com que todas tenham um underscore no início.
