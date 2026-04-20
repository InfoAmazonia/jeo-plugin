<?php
require_once dirname(dirname(dirname(dirname(__DIR__)))) . '/wp-load.php';
$key = jeo_settings()->get_option('gemini_api_key');
if(!$key) die("No key");

$embed_provider = new \NeuronAI\RAG\Embeddings\GeminiEmbeddingsProvider(key: $key, model: 'text-embedding-004');
try {
	$res = $embed_provider->embedText("Hello world");
	echo "Success! Dimensions: " . count($res) . "\n";
} catch (\Exception $e) {
	echo "Error: " . $e->getMessage() . "\n";
	if (method_exists($e, 'getResponse')) {
		echo "Body: " . $e->getResponse()->getBody() . "\n";
	}
}
