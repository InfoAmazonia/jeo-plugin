<?php
/**
 * WordPress user-meta storage for ai-assistant memories.
 *
 * Wraps WP_Storage and strips the redundant user ID from the namespace,
 * since the meta is already scoped to the user via the user_id column.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use HackLab\AIAssistant\Persistence\StorageInterface;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * StorageInterface wrapper for user memories.
 *
 * The ai-assistant library builds memory namespaces as "memories/{userId}".
 * When persisted in WordPress user_meta, the user ID is already implicit in
 * the usermeta.user_id column, so duplicating it in the meta_key is
 * unnecessary and prevents cross-context reuse.
 *
 * This adapter normalises the namespace to "memories" before forwarding to
 * WP_Storage.
 */
class WP_User_Memory_Storage implements StorageInterface {

	/**
	 * Inner storage instance (user meta).
	 *
	 * @var WP_Storage
	 */
	private WP_Storage $storage;

	/**
	 * User ID used to strip the redundant suffix.
	 *
	 * @var int
	 */
	private int $user_id;

	/**
	 * Constructor.
	 *
	 * @param int $user_id WordPress user ID.
	 */
	public function __construct( int $user_id ) {
		$this->user_id = $user_id;
		$this->storage = new WP_Storage( $user_id, 'user' );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Namespace.
	 * @param string $key   Storage key.
	 * @param array  $data  Data to store.
	 */
	public function save( string $space, string $key, array $data ): void {
		$this->storage->save( $this->normalize_space( $space ), $key, $data );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Namespace.
	 * @param string $key   Storage key.
	 */
	public function load( string $space, string $key ): ?array {
		return $this->storage->load( $this->normalize_space( $space ), $key );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Namespace.
	 * @param string $key   Storage key.
	 */
	public function delete( string $space, string $key ): bool {
		return $this->storage->delete( $this->normalize_space( $space ), $key );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Namespace.
	 * @param string $key   Storage key.
	 */
	public function exists( string $space, string $key ): bool {
		return $this->storage->exists( $this->normalize_space( $space ), $key );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space   Namespace.
	 * @param string $pattern Glob-style pattern.
	 */
	public function list( string $space, string $pattern = '*' ): array {
		return $this->storage->list( $this->normalize_space( $space ), $pattern );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space Namespace.
	 * @param string $query Search query string.
	 * @param int    $limit Maximum results to return.
	 */
	public function search( string $space, string $query, int $limit = 10 ): array {
		return $this->storage->search( $this->normalize_space( $space ), $query, $limit );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @param string $space    Namespace.
	 * @param array  $criteria Cleanup criteria.
	 */
	public function cleanup( string $space, array $criteria = array() ): int {
		return $this->storage->cleanup( $this->normalize_space( $space ), $criteria );
	}

	/**
	 * Strip the redundant user-id suffix from the namespace.
	 *
	 * The ai-assistant library uses "memories/{userId}". When stored in
	 * WordPress user_meta the user is already identified by the user_id
	 * column, so we collapse the namespace to just "memories".
	 *
	 * @param string $space Original namespace.
	 * @return string Normalised namespace.
	 */
	private function normalize_space( string $space ): string {
		$expected_suffix = 'memories_' . $this->user_id;
		if ( strtolower( $space ) === $expected_suffix ) {
			return 'memories';
		}

		// Also handle the raw slash form in case the library ever changes.
		$expected_suffix_alt = 'memories/' . $this->user_id;
		if ( strtolower( $space ) === strtolower( $expected_suffix_alt ) ) {
			return 'memories';
		}

		return $space;
	}
}
