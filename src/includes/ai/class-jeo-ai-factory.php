<?php
/**
 * Unified AI factory for JEO.
 *
 * Creates HackLab\AIAssistant\Assistant instances with shared configuration,
 * storage adapters, and tool registries. This is the central entry point for
 * all AI agent construction in the JEO plugin.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use HackLab\AIAssistant\Assistant;
use HackLab\AIAssistant\AssistantConfig;
use HackLab\AIAssistant\Logging\StderrLogger;
use NeuronAI\Providers\AIProviderInterface;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * JEO AI Factory
 *
 * Provides a single, consistent way to build Assistant instances across all
 * JEO AI features (georeferencing, minimap, minilayer, prompt engineering).
 *
 * The factory centralises:
 * - Provider resolution via Neuron_Factory
 * - Logger configuration
 * - Storage adapter selection (post_meta, user_meta, wp_options)
 * - Tool registration via Tool_Registry
 * - Structured output class mapping
 *
 * Usage:
 *
 *     $assistant = JEO_AI_Factory::create_assistant(
 *         instructions: 'Extract locations from this text...',
 *         tools: array( Geocode_Tool::class ),
 *         outputClass: Georeference_Result::class,
 *     );
 */
class JEO_AI_Factory {

	/**
	 * Default context window size for all assistants.
	 *
	 * @var int
	 */
	const DEFAULT_CONTEXT_WINDOW = 200000;

	/**
	 * Default number of retries for structured output.
	 *
	 * @var int
	 */
	const DEFAULT_STRUCTURED_RETRIES = 3;

	/**
	 * Create a fully configured Assistant instance.
	 *
	 * @param string                   $instructions        System prompt.
	 * @param array<string>            $tools               Class names of NeuronAI Tool instances.
	 * @param string|null              $output_class        Fully-qualified structured output DTO class.
	 * @param array<string,mixed>      $sub_agents          Map of sub-agent ID to SubAgentConfig.
	 * @param AIProviderInterface|null $provider         Override provider (defaults to active).
	 * @param int|null                 $context_window      Max context window (defaults to 200k).
	 * @param int|null                 $structured_retries  Max retries for structured output.
	 * @param bool                     $auto_learn          Enable auto-learning.
	 * @param bool                     $auto_delegate       Enable auto-delegation to sub-agents.
	 * @return Assistant
	 */
	public static function create_assistant(
		string $instructions,
		array $tools = array(),
		?string $output_class = null,
		array $sub_agents = array(),
		?AIProviderInterface $provider = null,
		?int $context_window = null,
		?int $structured_retries = null,
		bool $auto_learn = false,
		bool $auto_delegate = false
	): Assistant {
		if ( null === $provider ) {
			$provider = Neuron_Factory::get_active_provider( true );
		}

		$tool_instances = array();
		foreach ( $tools as $tool_class ) {
			if ( is_string( $tool_class ) && class_exists( $tool_class ) ) {
				$tool_instances[] = new $tool_class();
			}
		}

		$fallback_storage = new WP_Option_Storage();

		$config = new AssistantConfig(
			logger:               new StderrLogger(),
			provider:             $provider,
			storage:              $fallback_storage,
			instructions:         $instructions,
			contextWindow:        $context_window ?? self::DEFAULT_CONTEXT_WINDOW,
			tools:                $tool_instances,
			subAgents:            $sub_agents,
			autoLearn:            $auto_learn,
			autoDelegate:         $auto_delegate,
			outputClass:          $output_class,
			structuredMaxRetries: $structured_retries ?? self::DEFAULT_STRUCTURED_RETRIES,
		);

		return Assistant::configure( $config );
	}

	/**
	 * Create an Assistant pre-configured for georeferencing tasks.
	 *
	 * @param string                   $instructions   System prompt (usually calibration-aware).
	 * @param AIProviderInterface|null $provider    Override provider.
	 * @return Assistant
	 */
	public static function create_georeferencing_assistant(
		string $instructions,
		?AIProviderInterface $provider = null
	): Assistant {
		return self::create_assistant(
			instructions:        $instructions,
			outputClass:         Structured\Georeference_Result::class,
			provider:            $provider,
			structuredRetries:   self::DEFAULT_STRUCTURED_RETRIES,
		);
	}

	/**
	 * Create an Assistant pre-configured for prompt-engineering tasks.
	 *
	 * @param string                   $instructions   System prompt.
	 * @param AIProviderInterface|null $provider    Override provider.
	 * @return Assistant
	 */
	public static function create_prompt_engineer_assistant(
		string $instructions,
		?AIProviderInterface $provider = null
	): Assistant {
		return self::create_assistant(
			instructions:        $instructions,
			provider:            $provider,
			structuredRetries:   1,
		);
	}
}
