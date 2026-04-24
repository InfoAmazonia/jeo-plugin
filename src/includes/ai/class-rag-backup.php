<?php
/**
 * RAG index backup and restore.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use Jeo\Singleton;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * RAG Backup Class
 *
 * Manages ZIP backups of the Vector Store before resets.
 */
class RAG_Backup {

	use Singleton;

	/**
	 * Init hooks.
	 */
	protected function init() {
		// Synchronous only. No Cron allowed for backups per Mandate 4.2.
	}

	/**
	 * Perform the backup (ZIP store and info files).
	 */
	public function do_backup() {
		$uploads    = wp_upload_dir();
		$store_dir  = $uploads['basedir'] . '/jeo-ai-store';
		$backup_dir = $store_dir . '/backups';

		if ( ! class_exists( 'ZipArchive' ) ) {
			return new \WP_Error( 'missing_ziparchive', __( 'The PHP ZipArchive extension is required to create backups.', 'jeo' ) );
		}

		if ( ! file_exists( $backup_dir ) ) {
			wp_mkdir_p( $backup_dir );
			file_put_contents( $backup_dir . '/index.php', '' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_put_contents_file_put_contents

			$htaccess_file = $backup_dir . '/.htaccess';
			if ( ! file_exists( $htaccess_file ) ) {
				$htaccess_content = "Order Deny,Allow\nDeny from all\n";
				file_put_contents( $htaccess_file, $htaccess_content ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_put_contents_file_put_contents
			}
		}

		$timestamp = current_time( 'Y-m-d_H-i-s' );
		$zip_file  = $backup_dir . '/jeo-rag-backup-' . $timestamp . '.zip';

		$zip = new \ZipArchive();
		if ( $zip->open( $zip_file, \ZipArchive::CREATE ) === true ) {
			$files_added = false;
			// Add production store.
			if ( file_exists( $store_dir . '/jeo_knowledge.store' ) ) {
				$zip->addFile( $store_dir . '/jeo_knowledge.store', 'jeo_knowledge.store' );
				$files_added = true;
			}
			if ( file_exists( $store_dir . '/jeo_knowledge.model_info' ) ) {
				$zip->addFile( $store_dir . '/jeo_knowledge.model_info', 'jeo_knowledge.model_info' );
			}
			// Add test store.
			if ( file_exists( $store_dir . '/jeo_knowledge_test.store' ) ) {
				$zip->addFile( $store_dir . '/jeo_knowledge_test.store', 'jeo_knowledge_test.store' );
			}
			if ( file_exists( $store_dir . '/jeo_knowledge_test.model_info' ) ) {
				$zip->addFile( $store_dir . '/jeo_knowledge_test.model_info', 'jeo_knowledge_test.model_info' );
			}
			$zip->close();

			if ( ! $files_added ) {
				wp_delete_file( $zip_file );
				return new \WP_Error( 'empty_store', __( 'No vector store found to backup.', 'jeo' ) );
			}

			$this->rotate_backups( $backup_dir );
			return true;
		}

		return new \WP_Error( 'zip_failed', __( 'Failed to create the ZIP archive.', 'jeo' ) );
	}
	/**
	 * Keep only the 3 latest backups.
	 *
	 * @param string $backup_dir Path to the backup directory.
	 */
	private function rotate_backups( $backup_dir ) {
		$files = glob( $backup_dir . '/jeo-rag-backup-*.zip' );
		if ( count( $files ) > 3 ) {
			usort(
				$files,
				function ( $a, $b ) {
					return filemtime( $b ) - filemtime( $a );
				}
			);

			$files_to_delete = array_slice( $files, 3 );
			foreach ( $files_to_delete as $f ) {
				wp_delete_file( $f );
			}
		}
	}

	/**
	 * Get list of available backups.
	 */
	public function get_backups() {
		$uploads    = wp_upload_dir();
		$backup_dir = $uploads['basedir'] . '/jeo-ai-store/backups';
		$backup_url = $uploads['baseurl'] . '/jeo-ai-store/backups';

		$files = glob( $backup_dir . '/jeo-rag-backup-*.zip' );
		if ( ! $files ) {
			return array();
		}

		usort(
			$files,
			function ( $a, $b ) {
				return filemtime( $b ) - filemtime( $a );
			}
		);

		$data = array();
		foreach ( $files as $f ) {
			$data[] = array(
				'filename' => basename( $f ),
				'url'      => $backup_url . '/' . basename( $f ),
				'date'     => gmdate( 'Y-m-d H:i:s', filemtime( $f ) ),
				'size'     => size_format( filesize( $f ) ),
			);
		}

		return $data;
	}
}
