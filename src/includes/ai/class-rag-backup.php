<?php

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
		add_action( 'jeo_ai_run_backup_cron', array( $this, 'do_backup' ) );
	}

	/**
	 * Schedule a backup via Cron.
	 */
	public function schedule_backup() {
		if ( ! wp_next_scheduled( 'jeo_ai_run_backup_cron' ) ) {
			wp_schedule_single_event( time(), 'jeo_ai_run_backup_cron' );
		}
	}

	/**
	 * Perform the backup (ZIP store and info files).
	 */
	public function do_backup() {
		$uploads = wp_upload_dir();
		$store_dir = $uploads['basedir'] . '/jeo-ai-store';
		$backup_dir = $store_dir . '/backups';

		if ( ! file_exists( $backup_dir ) ) {
			wp_mkdir_p( $backup_dir );
			file_put_contents( $backup_dir . '/index.php', '' );
		}

		$timestamp = current_time( 'Y-m-d_H-i-s' );
		$zip_file = $backup_dir . '/jeo-rag-backup-' . $timestamp . '.zip';

		$zip = new \ZipArchive();
		if ( $zip->open( $zip_file, \ZipArchive::CREATE ) === TRUE ) {
			// Add production store
			if ( file_exists( $store_dir . '/jeo_knowledge.store' ) ) {
				$zip->addFile( $store_dir . '/jeo_knowledge.store', 'jeo_knowledge.store' );
			}
			if ( file_exists( $store_dir . '/jeo_knowledge.model_info' ) ) {
				$zip->addFile( $store_dir . '/jeo_knowledge.model_info', 'jeo_knowledge.model_info' );
			}
			// Add test store
			if ( file_exists( $store_dir . '/jeo_knowledge_test.store' ) ) {
				$zip->addFile( $store_dir . '/jeo_knowledge_test.store', 'jeo_knowledge_test.store' );
			}
			if ( file_exists( $store_dir . '/jeo_knowledge_test.model_info' ) ) {
				$zip->addFile( $store_dir . '/jeo_knowledge_test.model_info', 'jeo_knowledge_test.model_info' );
			}
			$zip->close();
			
			$this->rotate_backups( $backup_dir );
			return true;
		}

		return false;
	}

	/**
	 * Keep only the 3 latest backups.
	 */
	private function rotate_backups( $backup_dir ) {
		$files = glob( $backup_dir . '/jeo-rag-backup-*.zip' );
		if ( count( $files ) > 3 ) {
			usort( $files, function( $a, $b ) {
				return filemtime( $b ) - filemtime( $a );
			} );

			$files_to_delete = array_slice( $files, 3 );
			foreach ( $files_to_delete as $f ) {
				unlink( $f );
			}
		}
	}

	/**
	 * Get list of available backups.
	 */
	public function get_backups() {
		$uploads = wp_upload_dir();
		$backup_dir = $uploads['basedir'] . '/jeo-ai-store/backups';
		$backup_url = $uploads['baseurl'] . '/jeo-ai-store/backups';

		$files = glob( $backup_dir . '/jeo-rag-backup-*.zip' );
		if ( ! $files ) return array();

		usort( $files, function( $a, $b ) {
			return filemtime( $b ) - filemtime( $a );
		} );

		$data = array();
		foreach ( $files as $f ) {
			$data[] = array(
				'filename' => basename( $f ),
				'url'      => $backup_url . '/' . basename( $f ),
				'date'     => date( 'Y-m-d H:i:s', filemtime( $f ) ),
				'size'     => size_format( filesize( $f ) )
			);
		}

		return $data;
	}
}