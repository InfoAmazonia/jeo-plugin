# Migration

Notes on changes in DB structure from old JEO that will need to have migrations written.

## Geocode `post_meta`

On old JEO, some `meta_key`s are prefixed by an underscore (`_`) and others aren't:

- `geocode_address`
- `geocode_latitude`
- `geocode_longitude`
- `_geocode_city`
- `_geocode_country`
- `geocode_viewport`

Let's have them all with a underscore at the beginning.
