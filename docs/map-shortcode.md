# Map Shortcode

A Map can be inserted in any page or post using the Shortcode `jeo-map`. 


Accepetd attributes:

* `map_id` (required) - The ID of the map you want to insert
* `width` (optional) - The width of the map. Will default to 600px or whatever the active theme defines for the 'div.jeomap' css class
* `height` (optional) - The height of the map. Will default to 600px or whatever the active theme defines for the 'div.jeomap' css class

Examples:


```
[jeo-map map_id=99]
```

You have to inform at least the ID of the Map you want to insert. By default, it will be inserted with a size of 600x600px (or whatever the active theme defines), but you can also change it:

```
[jeo-map map_id=99 width="800px" height="800px"]
```

