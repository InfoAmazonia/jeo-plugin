# JEO

The JEO plugin acts as a geojournalism platform that allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps.

With JEO, creating the interaction between data layers and contextual information is intuitive and interactive. You can post geotagged stories and create richly designed pages for each one of the featured stories. At the same time, by simply imputing the ids of layers hosted on MapBox, you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All directly at the WordPress dashboard.

## Setting up local environment

### Before you start

Jeo is a WordPress plugin, so you will need all the basic dependencies you usually have to run a WordPress site, such as PHP and MySQL.

You wil also need:

* `WP-Cli` to configure the test environment
* `composer` to install the proper phpunit version
* `phpunit` to run tests
* `node` to compile js and css files

* To install WP-Cli, check [the official documentation](https://wp-cli.org/#installing).
* To install Composer, check [the official instructions](https://getcomposer.org/download/).
* To install PHPunit, run `composer install` in the repository folder.
* To install node, we suggest using [n](https://github.com/tj/n).

### Setting up

First of all, clone this repository.
Note that you can NOT clone it directly in the WordPress `plugins` directory.

```bash
git clone git@github.com:EarthJournalismNetwork/jeo-plugin.git
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

### Tests

Jeo uses `phpunit` to run tests for the backend and the API. This is a very important part of the development proccess! Never commit anything before run all the tests to make sure you did not break anything. If you are developing a new feature, you must write tests for it. If you are fixing a bug, you should first write a test that reproduces the bug and then make it pass.

To execute all the tests, simply execute the `phpunit` command from the project root folder. But first you need to configure PHPUnit.

#### Preparing PHPUnit

To run the unit tests it is necessary to create a new MySQL database for your unit tests. This database will be cleaned and restored every time you run PHPUnit.

Install the WordPress test library by running the script provided in the `tests/bin` folder, by running the following command:

```bash
tests/bin/install-wp-tests.sh wordpress_test root root /path/to/wordpress-test-folder localhost latest
```

The parameters are:

* Database name
* MySQL username
* MySQL password
* WordPress Test Directory*
* MySQL host
* WordPress version
* Optional: skip create database

\* `WordPress Test Directory` will be created with 2 sub folders:

* `wordpress-test` - An installation of WordPress
* `wordpress-tests-lib` - As the name says, the WordPress Tests Library

Inside `tests` folder, edit the file called `bootstrap-config-sample.php` and inform the folder where you installed your WordPress Test Library. This will be `/path/to/wordpress-test-folder/wodpress-tests-lib`. Save the file as `bootstrap-config.php`.

Note that the installation script will create a config file in the destination folder with your database credentials. If you have to change it, you will need to edit it there.

You only need to do all this once, and now you are ready to run tests.

#### Running tests

Simply type this command from the project root folder:

```bash
./vendor/bin/phpunit
```

(Note that `phpunit` accepts several parameters, for example if you want to run just a specific group of tests).

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
