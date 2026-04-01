# JEO

The JEO plugin acts as a geojournalism platform that allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps.

With JEO, creating the interaction between data layers and contextual information is intuitive and interactive. You can post geotagged stories and create richly designed pages for each one of the featured stories.

## 🤖 What's new in v3.6.0 (Neuron AI Integration)
JEO has evolved its AI capabilities by integrating the **Neuron AI Framework**, providing a more robust, stable, and transparent georeferencing experience.

- **Unified AI Engine:** Now powered by Neuron AI for standardized interactions and structured outputs.
- **10 Supported LLMs:** Google Gemini, OpenAI (GPT-4o), DeepSeek, Anthropic Claude, Ollama (Local), Mistral AI, Zhipu AI (GLM), HuggingFace, Grok (xAI), and Cohere.
- **Cost & Token Dashboard:** A new private dashboard to monitor real-time token consumption (Input/Output) for every AI request, stored natively in WordPress.
- **PHP 8.2 Core:** Upgraded infrastructure requiring PHP 8.2 or higher for maximum performance and security.
- **Smart Approvals:** Enhanced visual validation modal to review AI-extracted locations before publishing.
- **Authoritative Knowledge Base:** Over 10 embedded data dictionaries for Brazilian territories (Biomes, Indigenous Lands, Quilombolas, and more).

## 🕹️ Navigating the JEO Panel
The WordPress admin menu is organized for a professional Geo-Editorial workflow:
1. **Welcome / Boas-vindas:** Your living documentation and getting started guide.
2. **Experimental (Dashboard):** A birds-eye view of all your geolocated content.
3. **Maps:** Manage your map instances and layouts.
4. **Layers:** Connect your data sources (Mapbox, TileLayers, etc).
5. **Storymaps:** Create immersive scroll-telling narratives.
6. **Settings:** Global setup for AI Providers (10 options), Geocoders, and Maps.
7. **AI Logs (Costs):** Detailed dashboard for token usage and technical auditing.

---

## 🛠️ Setting up Local Environment (Development)

The easiest way to develop JEO is using our modern Docker stack.

### Prerequisites:
- Docker and Docker Compose (v2+)
- PHP 8.2+ and Composer (locally for dependencies)

### Quick Start:
1. Clone the repository:
   ```bash
   git clone git@github.com:InfoAmazonia/jeo-plugin.git
   cd jeo-plugin
   ```
2. Run the setup script:
   ```bash
   ./setup.sh
   ```
3. Access your local site:
   👉 **http://localhost:8072/wp-admin** (User: `admin` / Pass: `admin`)

### Testing Compatibility:
You can test JEO against different WordPress or PHP versions using the setup parameters:
```bash
./setup.sh --test-env 6.9-php8.5-apache
```

---

## 🏗️ Build & Production
JEO uses React and Webpack for Gutenberg blocks and requires Composer for AI features.

### Generating a Release Package:
To generate a clean, production-ready `.zip` file for manual upload to WordPress:
```bash
./build.sh
```
*This script will compile assets, install optimized dependencies, and package the plugin into a zip file.*

### Manual Development (Non-Docker):
1. Install Node dependencies: `npm install`
2. Install PHP dependencies: `composer install`
3. Run development watcher: `npm run start`
4. Build assets: `npm run build`

---
**Maintained by InfoAmazonia / hacklab/**
