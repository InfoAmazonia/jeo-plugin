# Migración

Notas sobre los cambios en la estructura de la base de datos del JEO antiguo para los que habrá que escribir migraciones.

## `post_meta` de geocodificación

En el JEO antiguo, algunas `meta_key` llevan el prefijo de un guion bajo (`_`) y otras no:

- `geocode_address`
- `geocode_latitude`
- `geocode_longitude`
- `_geocode_city`
- `_geocode_country`
- `geocode_viewport`

Vamos a hacer que todas lleven un guion bajo al principio.
