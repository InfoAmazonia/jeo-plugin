# JEO

The JEO plugin acts as a geojournalism platform that allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps.

With JEO, creating the interaction between data layers and contextual information is intuitive and interactive. You can post geotagged stories and create richly designed pages for each one of the featured stories.

At the same time, by simply imputing the ids of layers hosted on [Mapbox](https://www.mapbox.com/), you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All directly at the WordPress dashboard.

## Setting up local environment

First of all, clone this repository.
Note that you can NOT clone it directly in the WordPress `plugins` directory.

```bash
git clone git@github.com:InfoAmazonia/jeo-plugin.git
```

Set up a WordPress installation. This could be a dedicated installation to develop Jeo or you can use an existing instance you have.
(Note: This plugin requires WordPress 5.3+)

Then create a symbolic link inside of `wp-content/plugins/jeo` pointing to the `src` folder in this repository.

```bash
ln -s /path/to/jeo-plugin/src /path/to/wordpress/wp-content/plugins/jeo
```

### Build

When we want to build the plugin, we run `npm run build` to compile all the assets (css and js) to `src/js/build`.
While developing, you might want to run `npm run watch`. This script will watch your development folder for changes and automatically build the plugin so you don't have to do it manually every time you modify a file.

```bash
rsync --archive --progress --human-readable --delete .src/ /path/to/wordpress/wp-content/plugins/jeo
```

## Fixtures

There are few `WP CLI` commands that will generate sample layers and maps useful for development purposes.

(These fixtures uses infoamazonia maps and require infoamazonia Mapbox access token to be configured in the Settings menu)

In order to create or update the fixtures to the latest version, run:

```bash
wp jeo fixtures update
```

The last two lines of output in this command will point you to two pages with sample maps added to it. They are identical, with the difference that one of them is a one-time map, and the other one is a map saved in the Maps Library

There are also other 2 commands available

* `wp jeo fixtures list` - List the fixtures saved to the database and their metadata
* `wp jeo fixtures sample_maps` - Gives you sample DIVs you can use to add the sample maps anywhere you want in your theme.
