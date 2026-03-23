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

## Releasing

Release packages are built from `src/`, not from the repository root.

When a stable tag is pushed, the GitHub Actions release workflow:

- runs `npm install` and `npm run build`
- deploys the plugin to WordPress.org
- creates a GitHub Release with GitHub's source-code archives
- attaches a built `jeowp.zip` artifact generated from the contents of `src/`

The attached `jeowp.zip` contains the built plugin files inside a `jeowp/`
directory, ready for manual installation in WordPress.
