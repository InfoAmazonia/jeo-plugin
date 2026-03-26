# JEO

The JEO plugin acts as a geojournalism platform that allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps.

With JEO, creating the interaction between data layers and contextual information is intuitive and interactive. You can post geotagged stories and create richly designed pages for each one of the featured stories.

At the same time, by simply imputing the ids of layers hosted on [Mapbox](https://www.mapbox.com/), you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All directly at the WordPress dashboard.

## 🤖 What's new in v3.5.0 (AI Georeferencing)
JEO now features an **AI Co-Pilot** that can autonomously analyze your post's content and title to find mentioned locations and extract their exact coordinates!

- **Supported LLMs:** Google Gemini (2.5 Flash), OpenAI (GPT-4o), and DeepSeek.
- **Smart Approvals:** Visual validation modal to review, approve, or discard AI suggestions before adding them to the map.
- **Prompt Engineering Studio:** A dedicated Settings panel where you can chat with the active LLM to generate highly optimized, strict System Prompts tailored to your editorial rules.
- **Authoritative Knowledge Base:** Over 10 embedded data dictionaries for Brazilian territories (Biomes, Indigenous Lands, Quilombolas, and more).
- **Interactive Experience:** Professional [Welcome Guide](https://github.com/InfoAmazonia/jeo-plugin) (built-in) and a cinematic [Geographic Dashboard](https://github.com/InfoAmazonia/jeo-plugin) to visualize your entire project's impact.
- **Robust Debugging:** A dedicated AI Debug Logs page to inspect every prompt sent and raw JSON received.

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
