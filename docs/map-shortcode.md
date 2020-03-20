# Map shortcode

A map can be inserted on any page or post using the `jeo-map` shortcode.

The shortcode accepts three attributes:

- `map_id` (required): The ID of the map you want to insert;
- `width` (optional): The width of the map. It'll default to 600px or whatever the active theme defines for the 'div.jeomap' CSS class;
- `height` (optional): The height of the map. Will default to 600px or whatever the active theme defines for the 'div.jeomap' CSS class.

Examples:

```html
[jeo-map map_id=99]
```

You have to inform at least the ID of the Map you want to insert. By default, it will be inserted with a size of 600&times;600px (or whatever the active theme defines), but you can also change it:

```html
[jeo-map map_id=99 width="800px" height="800px"]
```
