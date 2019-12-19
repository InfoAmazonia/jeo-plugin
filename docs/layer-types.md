# Adding new Layer Types

This document describes how to register new Layer Types ot be used in maps created with Jeo.

## Introduction

In Jeo, maps are rendered using the [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/api/) javascript library. Any new layer type will have to interact with this library in order to add the layer to the map.

Baically, to add a new layer type, there are 2 simple steps:

1. Register the new Layer type using a PHP hook, informing where is the main javascript file of your Layer Type
2. Create a javascript class implementing methods to add the layer to the map and to describe what are the options a layer of this type has

In short, this is all that is needed to do. In some cases, however, you might need to add extra dependecies to the project. For example, to create a Lyaer Type to suppor Carto's vector layers, we might want to add CartoVL (which is an extension to MapboxGL) to the project.

## Creating a new Layer Type

First, let's register a new Layer Type by hooking up in the `jeo_register_layer_types` action:

```PHP
add_action('jeo_register_layer_types', function($layer_types) {
	$layer_types->register_layer_type('my-layer-type', plugin_dir_url( __FILE__ ) . '/js/layertype.js');
});

```

`register_layer_type` method gets 2 parameters. 

* Layer type slug - A unique sanitized string (make sure to make it unique)
* URL - The absolute URL to your javascript file.

That's all you need to do in the PHP side. All the magic happens on the javascript.

Now, let's create our `layertype.js` file. 

In this file, we are going to register a javascript object using the globally available `window.JeoLayerTypes.registerLayerType`.

The first parameter must be the same slug you defined when you registered your Layer Type on the PHP side, and the second parameter is an object with, at least, three methods.

```Javascript
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

Your Layer Type object MUST implement at least these three methods.

### getSchema(attributes)

**params**: attributes - object with the layer attributes (see section below)
**returns**: Promise with json-schema

This method will tell Jeo which are the options the user have to fill in when creating a new layer of this type.

For example, a raster tile layer-type might have only a URL. A mapbox layer have the Style ID and the optional Access token.

This method must return a Promise with a json-schema representation of the layer type options.

This schema must only include layer-type specific information. Every layer, despite of its type, have a set of common attributes, such as ID and Name.

For example, the "Tile layer" layer type needs only a URL, so that's how its `getSchema` method will look like.

```Javascript

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
