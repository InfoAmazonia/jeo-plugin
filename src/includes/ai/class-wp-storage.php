<?php
/**
 * WordPress-backed storage for the ai-assistant library.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use HackLab\AIAssistant\Persistence\StorageInterface;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * StorageInterface implementation backed by WordPress metadata (post_meta or user_meta).
 */
class WP_Storage implements StorageInterface {

	/**
	 * Metadata type: 'post' or 'user'.
	 *
	 * @var string
	 */
	protected string $meta_type;

	/**
	 * Object ID (post ID or user ID).
	 *
	 * @var int
	 */
	protected int $object_id;

	/**
	 * Constructor.
	 *
	 * @param int    $object_id Post ID or user ID.
	 * @param string $meta_type 'post' or 'user'.
	 */
	public function __construct( int $object_id, string $meta_type = 'post' ) {
		$this->object_id = $object_id;
		$this->meta_type = $meta_type;
	}

	/**
	 * {@inheritdoc}
	 */
	public function save( string $namespace, string $key, array $data ): void {
		$meta_key = $this->build_key( $namespace, $key );
		update_metadata( $this->meta_type, $this->object_id, $meta_key, $data );
	}

	/**
	 * {@inheritdoc}
	 */
	public function load( string $namespace, string $key ): ?array {
		$meta_key = $this->build_key( $namespace, $key );
		$meta     = get_metadata( $this->meta_type, $this->object_id, $meta_key, true );
		return is_array( $meta ) ? $meta : null;
	}

	/**
	 * {@inheritdoc}
	 */
	public function delete( string $namespace, string $key ): bool {
		$meta_key = $this->build_key( $namespace, $key );
		return delete_metadata( $this->meta_type, $this->object_id, $meta_key );
	}

	/**
	 * {@inheritdoc}
	 */
	public function exists( string $namespace, string $key ): bool {
		$meta_key = $this->build_key( $namespace, $key );
		return metadata_exists( $this->meta_type, $this->object_id, $meta_key );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @return string[]
	 */
	public function list( string $namespace, string $pattern = '*' ): array {
		global $wpdb;

		$table  = $this->get_table();
		$column = $this->get_id_column();
		$prefix = $wpdb->esc_like( '_jeo_ai_' . $namespace . '_' );
		$like   = $prefix . '%';

		$rows = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT meta_key FROM {$table} WHERE {$column} = %d AND meta_key LIKE %s",
				$this->object_id,
				$like
			)
		);

		$prefix_len = strlen( '_jeo_ai_' . $namespace . '_' );
		$results    = array();

		foreach ( $rows as $meta_key ) {
			$raw_key = substr( $meta_key, $prefix_len );
			if ( '*' === $pattern || fnmatch( $pattern, $raw_key ) ) {
				$results[] = $raw_key;
			}
		}

		return $results;
	}

	/**
	 * {@inheritdoc}
	 *
	 * @return array{data: array, score: float}[]
	 */
	public function search( string $namespace, string $query, int $limit = 10 ): array {
		$all     = $this->list( $namespace );
		$results = array();

		$query_lower = strtolower( $query );
		$query_words = str_word_count( $query_lower, 1 );

		foreach ( $all as $key ) {
			$data = $this->load( $namespace, $key );
			if ( null === $data ) {
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
			function ( array $a, array $b ) {
				return $b['score'] <=> $a['score'];
			}
		);

		return array_slice( $results, 0, $limit );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param array{max_age_days?: int, max_per_namespace?: int} $criteria
	 * @return int
	 */
	public function cleanup( string $namespace, array $criteria = array() ): int {
		$removed = 0;
		$all     = $this->list( $namespace );

		if ( isset( $criteria['max_age_days'] ) ) {
			$threshold = time() - ( $criteria['max_age_days'] * DAY_IN_SECONDS );
			global $wpdb;

			$table  = $this->get_table();
			$column = $this->get_id_column();

			foreach ( $all as $key ) {
				$meta_key = $this->build_key( $namespace, $key );
				$mtime    = (int) $wpdb->get_var(
					$wpdb->prepare(
						"SELECT UNIX_TIMESTAMP(meta_id) FROM {$table} WHERE {$column} = %d AND meta_key = %s LIMIT 1",
						$this->object_id,
						$meta_key
					)
				);

				if ( $mtime > 0 && $mtime < $threshold ) {
					$this->delete( $namespace, $key );
					++$removed;
				}
			}

			$all = $this->list( $namespace );
		}

		if ( isset( $criteria['max_per_namespace'] ) && count( $all ) > $criteria['max_per_namespace'] ) {
			$to_remove = array_slice( $all, $criteria['max_per_namespace'] );
			foreach ( $to_remove as $key ) {
				$this->delete( $namespace, $key );
				++$removed;
			}
		}

		return $removed;
	}

	/**
	 * Build the meta key from namespace and key.
	 *
	 * @param string $namespace Storage namespace.
	 * @param string $key       Storage key.
	 * @return string
	 */
	protected function build_key( string $namespace, string $key ): string {
		$safe_ns  = preg_replace( '/[^a-z0-9_\-]/', '_', strtolower( $namespace ) );
		$safe_key = preg_replace( '/[^a-z0-9_\-]/', '_', strtolower( $key ) );
		return "_jeo_ai_{$safe_ns}_{$safe_key}";
	}

	/**
	 * Get the metadata table name.
	 *
	 * @return string
	 */
	protected function get_table(): string {
		global $wpdb;
		return 'user' === $this->meta_type ? $wpdb->usermeta : $wpdb->postmeta;
	}

	/**
	 * Get the ID column name.
	 *
	 * @return string
	 */
	protected function get_id_column(): string {
		return 'user' === $this->meta_type ? 'user_id' : 'post_id';
	}
}
