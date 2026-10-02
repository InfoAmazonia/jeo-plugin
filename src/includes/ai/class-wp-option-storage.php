<?php
/**
 * WordPress options-backed storage for the ai-assistant library.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use HackLab\AIAssistant\Persistence\StorageInterface;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * StorageInterface implementation backed by wp_options.
 *
 * Stores all entries for a namespace in a single option (autoload=false).
 */
class WP_Option_Storage implements StorageInterface {

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @param array  $data  Data to store.
	 */
	public function save( string $space, string $key, array $data ): void {
		$option_key  = $this->build_option_key( $space );
		$all         = get_option( $option_key, array() );
		$all[ $key ] = array_merge( $data, array( '_saved_at' => time() ) );
		update_option( $option_key, $all, false );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @return array|null Stored data or null.
	 */
	public function load( string $space, string $key ): ?array {
		$option_key = $this->build_option_key( $space );
		$all        = get_option( $option_key, array() );
		if ( ! is_array( $all ) || ! isset( $all[ $key ] ) ) {
			return null;
		}
		return $all[ $key ];
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @return bool
	 */
	public function delete( string $space, string $key ): bool {
		$option_key = $this->build_option_key( $space );
		$all        = get_option( $option_key, array() );
		if ( ! is_array( $all ) || ! isset( $all[ $key ] ) ) {
			return false;
		}
		unset( $all[ $key ] );
		if ( empty( $all ) ) {
			return delete_option( $option_key );
		}
		update_option( $option_key, $all, false );
		return true;
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @return bool
	 */
	public function exists( string $space, string $key ): bool {
		$option_key = $this->build_option_key( $space );
		$all        = get_option( $option_key, array() );
		return is_array( $all ) && isset( $all[ $key ] );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space   Storage namespace.
	 * @param string $pattern Key pattern for filtering.
	 * @return string[]
	 */
	public function list( string $space, string $pattern = '*' ): array {
		$option_key = $this->build_option_key( $space );
		$all        = get_option( $option_key, array() );
		if ( ! is_array( $all ) ) {
			return array();
		}

		$keys = array_keys( $all );

		if ( '*' !== $pattern ) {
			$keys = array_filter(
				$keys,
				function ( string $key ) use ( $pattern ): bool {
					return fnmatch( $pattern, $key );
				}
			);
		}

		return array_values( $keys );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Storage namespace.
	 * @param string $query Search query string.
	 * @param int    $limit Maximum results to return.
	 * @return array{data: array, score: float}[]
	 */
	public function search( string $space, string $query, int $limit = 10 ): array {
		$option_key = $this->build_option_key( $space );
		$all        = get_option( $option_key, array() );
		if ( ! is_array( $all ) ) {
			return array();
		}

		$results     = array();
		$query_lower = strtolower( $query );
		$query_words = str_word_count( $query_lower, 1 );

		foreach ( $all as $key => $data ) {
			if ( ! is_array( $data ) ) {
				continue;
			}

			$text_lower = strtolower( wp_json_encode( $data ) );
			$score      = 0.0;

			if ( str_contains( $text_lower, $query_lower ) ) {
				$score = 1.0;
			} elseif ( ! empty( $query_words ) ) {
				$text_words = str_word_count( $text_lower, 1 );
				$matches    = count( array_intersect( $query_words, $text_words ) );
				$score      = $matches / count( $query_words );
			}

			if ( $score > 0.1 ) {
				$results[] = array(
					'data'  => $data,
					'score' => $score,
				);
			}
		}

		usort(
			$results,
			function ( array $a, array $b ): int {
				return $b['score'] <=> $a['score'];
			}
		);

		return array_slice( $results, 0, $limit );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space    Storage namespace.
	 * @param array  $criteria Cleanup criteria (max_age_days, max_per_namespace).
	 * @return int Number of entries removed.
	 */
	public function cleanup( string $space, array $criteria = array() ): int {
		$option_key = $this->build_option_key( $space );
		$all        = get_option( $option_key, array() );
		if ( ! is_array( $all ) ) {
			return 0;
		}

		$removed = 0;

		if ( isset( $criteria['max_age_days'] ) ) {
			$threshold = time() - ( $criteria['max_age_days'] * DAY_IN_SECONDS );
			foreach ( $all as $key => $data ) {
				$saved_at = $data['_saved_at'] ?? 0;
				if ( $saved_at > 0 && $saved_at < $threshold ) {
					unset( $all[ $key ] );
					++$removed;
				}
			}
		}

		if ( isset( $criteria['max_per_namespace'] ) && count( $all ) > $criteria['max_per_namespace'] ) {
			uasort(
				$all,
				function ( array $a, array $b ): int {
					return ( $b['_saved_at'] ?? 0 ) <=> ( $a['_saved_at'] ?? 0 );
				}
			);
			$to_remove = array_slice( $all, $criteria['max_per_namespace'], null, true );
			foreach ( array_keys( $to_remove ) as $key ) {
				unset( $all[ $key ] );
				++$removed;
			}
		}

		if ( empty( $all ) ) {
			delete_option( $option_key );
		} else {
			update_option( $option_key, $all, false );
		}

		return $removed;
	}

	/**
	 * Build the option key for a namespace.
	 *
	 * @param string $space Storage namespace.
	 * @return string
	 */
	protected function build_option_key( string $space ): string {
		$safe_ns = preg_replace( '/[^a-z0-9_]/', '_', strtolower( $space ) );
		return "jeo_ai_{$safe_ns}";
	}
}
