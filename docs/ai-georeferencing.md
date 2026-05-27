# AI Georeferencing

JEO can automatically georeference your posts using AI. Instead of manually searching and adding geolocation points, the AI analyzes your post content and suggests relevant locations with coordinates and confidence scores.

## How it works

When editing a post, the **Geolocation** sidebar panel includes an **AI Georeference** button. Clicking it sends your post title and content to the configured AI provider, which returns suggested geolocation points.

<!-- TODO: screenshot of AI Georeference button in sidebar -->

### Flow

1. Click **AI Georeference** in the Geolocation sidebar panel.
2. The AI analyzes the post content and identifies geographic references.
3. Suggested points appear with location name, coordinates, and a confidence score.
4. Review and approve or adjust the suggested points.
5. The points are saved as geolocation data for the post.

### Calibration

Under **Jeo → AI**, you can fine-tune georeferencing behavior with calibration settings:

- **Granularity**: Controls the level of geographic detail (e.g., country-level vs. city-level).
- **Confidence threshold**: Minimum confidence score for a point to be suggested.
- **Title weight**: How much the post title influences the AI's location detection.
- **Primary/secondary thresholds**: Different thresholds for primary and secondary geolocation points.
- **Max points**: Limit the number of primary and secondary points the AI can suggest.

<!-- TODO: screenshot of calibration settings -->

## Multi-turn refinement

After the initial georeferencing, you can chat with the AI to refine the results. For example, you can ask it to add a specific city, remove an incorrect point, or adjust the confidence of a suggestion.

The conversation history is preserved per post, so you can continue refining in subsequent editing sessions.

## Georeferencing with custom prompts

You can generate a custom AI prompt tailored to your editorial style using the **Prompt Generator**. This creates optimized instructions for the AI that incorporate your calibration settings. The generated prompt can be reviewed and edited before use.

<!-- TODO: screenshot of prompt generator -->

## Requirements

- An AI provider must be configured in **Jeo → AI** (see [AI Settings](ai-settings.md)).
- The post must have a title and/or content for the AI to analyze.
