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
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @param array  $data  Data to store.
	 */
	public function save( string $space, string $key, array $data ): void {
		$meta_key = $this->build_key( $space, $key );
		update_metadata( $this->meta_type, $this->object_id, $meta_key, $data );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @return array|null Stored data or null.
	 */
	public function load( string $space, string $key ): ?array {
		$meta_key = $this->build_key( $space, $key );
		$meta     = get_metadata( $this->meta_type, $this->object_id, $meta_key, true );
		return is_array( $meta ) ? $meta : null;
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @return bool
	 */
	public function delete( string $space, string $key ): bool {
		$meta_key = $this->build_key( $space, $key );
		return delete_metadata( $this->meta_type, $this->object_id, $meta_key );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @return bool
	 */
	public function exists( string $space, string $key ): bool {
		$meta_key = $this->build_key( $space, $key );
		return metadata_exists( $this->meta_type, $this->object_id, $meta_key );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space   Storage namespace.
	 * @param string $pattern Key pattern for filtering.
	 * @return string[]
	 */
	public function list( string $space, string $pattern = '*' ): array {
		global $wpdb;

		$table  = $this->get_table();
		$column = $this->get_id_column();
		$prefix = $wpdb->esc_like( '_jeo_ai_' . $space . '_' );
		$like   = $prefix . '%';

		$rows = $wpdb->get_col(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table and $column are derived from trusted $wpdb properties.
				"SELECT meta_key FROM {$table} WHERE {$column} = %d AND meta_key LIKE %s",
				$this->object_id,
				$like
			)
		);

		$prefix_len = strlen( '_jeo_ai_' . $space . '_' );
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
	 * @param string $space Storage namespace.
	 * @param string $query Search query string.
	 * @param int    $limit Maximum results to return.
	 * @return array{data: array, score: float}[]
	 */
	public function search( string $space, string $query, int $limit = 10 ): array {
		$all     = $this->list( $space );
		$results = array();

		$query_lower = strtolower( $query );
		$query_words = str_word_count( $query_lower, 1 );

		foreach ( $all as $key ) {
			$data = $this->load( $space, $key );
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
	 * @param string $space     Storage namespace.
	 * @param array  $criteria  Cleanup criteria (max_age_days, max_per_namespace).
	 * @return int Number of entries removed.
	 */
	public function cleanup( string $space, array $criteria = array() ): int {
		$removed = 0;
		$all     = $this->list( $space );

		if ( isset( $criteria['max_age_days'] ) ) {
			$threshold = time() - ( $criteria['max_age_days'] * DAY_IN_SECONDS );
			global $wpdb;

			$table  = $this->get_table();
			$column = $this->get_id_column();

			foreach ( $all as $key ) {
				$meta_key = $this->build_key( $space, $key );
				$mtime    = (int) $wpdb->get_var(
					$wpdb->prepare(
						// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $table and $column are derived from trusted $wpdb properties.
						"SELECT UNIX_TIMESTAMP(meta_id) FROM {$table} WHERE {$column} = %d AND meta_key = %s LIMIT 1",
						$this->object_id,
						$meta_key
					)
				);

				if ( $mtime > 0 && $mtime < $threshold ) {
					$this->delete( $space, $key );
					++$removed;
				}
			}

			$all = $this->list( $space );
		}

		if ( isset( $criteria['max_per_namespace'] ) && count( $all ) > $criteria['max_per_namespace'] ) {
			$to_remove = array_slice( $all, $criteria['max_per_namespace'] );
			foreach ( $to_remove as $key ) {
				$this->delete( $space, $key );
				++$removed;
			}
		}

		return $removed;
	}

	/**
	 * Build the meta key from namespace and key.
	 *
	 * @param string $space Storage namespace.
	 * @param string $key   Storage key.
	 * @return string
	 */
	protected function build_key( string $space, string $key ): string {
		$safe_ns  = preg_replace( '/[^a-z0-9_\-]/', '_', strtolower( $space ) );
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
