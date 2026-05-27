<?php
/**
 * Central registry for NeuronAI tools used across JEO AI features.
 *
 * Provides a single place to register, discover, and instantiate tools.
 * Eliminates duplication where tools were hardcoded in individual agent configs.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Tool Registry
 *
 * All NeuronAI Tool classes used by JEO should be registered here.
 * The registry supports lazy instantiation (returns class names for
 * AssistantConfig) and eager instantiation (returns Tool objects).
 *
 * Usage:
 *
 *     // Register default tools.
 *     Tool_Registry::defaults();
 *
 *     // Get class names for AssistantConfig.
 *     $tool_classes = Tool_Registry::get_all_classes();
 *
 *     // Get instantiated tools.
 *     $tool_objects = Tool_Registry::get_all_instances();
 *
 *     // Get a specific tool.
 *     $geocode = Tool_Registry::get( 'geocode' );
 */
class Tool_Registry {

	/**
	 * Registered tool class names keyed by tool identifier.
	 *
	 * @var array<string,string>
	 */
	protected static array $tools = array();

	/**
	 * Whether default tools have been registered.
	 *
	 * @var bool
	 */
	protected static bool $defaults_registered = false;

	/**
	 * Register a tool class.
	 *
	 * @param string $id         Unique tool identifier (e.g. 'geocode').
	 * @param string $class_name Fully-qualified class name extending NeuronAI\Tools\Tool.
	 * @return void
	 */
	public static function register( string $id, string $class_name ): void {
		self::$tools[ $id ] = $class_name;
	}

	/**
	 * Get a tool class name by identifier.
	 *
	 * @param string $id Tool identifier.
	 * @return string|null Class name or null if not registered.
	 */
	public static function get( string $id ): ?string {
		self::maybe_register_defaults();
		return self::$tools[ $id ] ?? null;
	}

	/**
	 * Check if a tool is registered.
	 *
	 * @param string $id Tool identifier.
	 * @return bool
	 */
	public static function has( string $id ): bool {
		self::maybe_register_defaults();
		return isset( self::$tools[ $id ] );
	}

	/**
	 * Get all registered tool class names.
	 *
	 * @return array<string,string> Map of id => class_name.
	 */
	public static function get_all_classes(): array {
		self::maybe_register_defaults();
		return self::$tools;
	}

	/**
	 * Get all registered tools as instantiated objects.
	 *
	 * @return array<int,\NeuronAI\Tools\Tool>
	 */
	public static function get_all_instances(): array {
		self::maybe_register_defaults();
		$instances = array();
		foreach ( self::$tools as $class_name ) {
			if ( class_exists( $class_name ) ) {
				$instances[] = new $class_name();
			}
		}
		return $instances;
	}

	/**
	 * Get a subset of tools by identifiers.
	 *
	 * @param array<string> $ids Tool identifiers.
	 * @return array<int,\NeuronAI\Tools\Tool>
	 */
	public static function get_instances_by_id( array $ids ): array {
		self::maybe_register_defaults();
		$instances = array();
		foreach ( $ids as $id ) {
			$class_name = self::$tools[ $id ] ?? null;
			if ( null !== $class_name && class_exists( $class_name ) ) {
				$instances[] = new $class_name();
			}
		}
		return $instances;
	}

	/**
	 * Get class names for a subset of tools (for AssistantConfig).
	 *
	 * @param array<string> $ids Tool identifiers.
	 * @return array<int,string>
	 */
	public static function get_classes_by_id( array $ids ): array {
		self::maybe_register_defaults();
		$classes = array();
		foreach ( $ids as $id ) {
			$class_name = self::$tools[ $id ] ?? null;
			if ( null !== $class_name ) {
				$classes[] = $class_name;
			}
		}
		return $classes;
	}

	/**
	 * Clear all registrations.
	 *
	 * @return void
	 */
	public static function clear(): void {
		self::$tools               = array();
		self::$defaults_registered = false;
	}

	/**
	 * Register the default set of JEO tools if not already done.
	 *
	 * @return void
	 */
	public static function maybe_register_defaults(): void {
		if ( self::$defaults_registered ) {
			return;
		}

		self::register( 'search_layers', Search_Layers_Tool::class );
		self::register( 'geocode', Geocode_Tool::class );
		self::register( 'generate_layer', Generate_Layer_Tool::class );
		self::register( 'get_post_content', Get_Post_Content_Tool::class );
		self::register( 'retrieve_knowledge', Retrieve_Knowledge_Tool::class );

		self::$defaults_registered = true;
	}
}
