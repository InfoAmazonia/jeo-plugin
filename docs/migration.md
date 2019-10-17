# Migration

Notes on changes in db structure from old Jeo that will need to have migrations written

## geocode postmeta

Old Jeo have some with a `_` at the beginning of the name and some without:

```
+-------------------+
| meta_key          |
+-------------------+
| geocode_address   |
| geocode_latitude  |
| geocode_longitude |
| _geocode_city     |
| _geocode_country  |
| geocode_viewport  |

```
Let's have them all with a underscore at the beginning;