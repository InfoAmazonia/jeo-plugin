<?php
/**
 * RAG index background worker (unified multi-pipeline).
 *
 * @package Jeo
 */

namespace Jeo\AI;

use Jeo\Singleton;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * RAG index background worker (unified multi-pipeline).
 *
 * Manages cron-based and manual indexing of posts and layers into
 * NeuronAI vector stores for semantic search and layer suggestions.
 */
class RAG_Worker {

	use Singleton;

	/**
	 * Registered pipeline configs.
	 *
	 * @var RAG_Pipeline_Config[]
	 */
	private array $pipelines = array();

	/**
	 * Init the worker.
	 */
	protected function init() {
		$this->pipelines = array(
			'posts'  => RAG_Pipeline_Config::posts(),
			'layers' => RAG_Pipeline_Config::layers(),
		);

		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'jeo_rag_index_cron_hook', array( $this, 'process_all_pipelines' ) );
		add_action( 'update_option_jeo-settings', array( $this, 'maybe_schedule_cron' ), 10, 2 );
		add_filter( 'cron_schedules', array( $this, 'add_cron_intervals' ) ); // phpcs:ignore WordPress.WP.CronInterval.CronSchedulesInterval
		add_action( 'save_post_map-layer', array( $this, 'on_layer_save' ), 10, 2 );
	}

	/**
	 * Get a pipeline config by name.
	 *
	 * @param string $name Pipeline name.
	 */
	public function get_pipeline( string $name ): ?RAG_Pipeline_Config {
		return $this->pipelines[ $name ] ?? null;
	}

	/**
	 * Add custom cron intervals.
	 *
	 * @param array $schedules Existing cron schedules.
	 * @return array
	 */
	public function add_cron_intervals( $schedules ) {
		if ( ! isset( $schedules['every_minute'] ) ) {
			$schedules['every_minute'] = array(
				'interval' => 60,
				'display'  => __( 'Every Minute', 'jeowp' ),
			);
		}
		if ( ! isset( $schedules['every_5_mins'] ) ) {
			$schedules['every_5_mins'] = array(
				'interval' => 300,
				'display'  => __( 'Every 5 Minutes', 'jeowp' ),
			);
		}
		if ( ! isset( $schedules['every_15_mins'] ) ) {
			$schedules['every_15_mins'] = array(
				'interval' => 900,
				'display'  => __( 'Every 15 Minutes', 'jeowp' ),
			);
		}
		return $schedules;
	}

	/**
	 * Append a timestamped cron log entry, keeping the 5 most recent.
	 *
	 * @param string $message    Log message.
	 * @param bool   $is_error   Whether this is an error entry.
	 * @param string $log_option Option key for the log.
	 */
	private function log_cron_run( $message, $is_error = false, string $log_option = 'jeo_rag_cron_logs' ) {
		$logs = get_option( $log_option, array() );
		if ( ! is_array( $logs ) ) {
			$logs = array();
		}

		$time   = current_time( 'Y-m-d H:i:s' );
		$source = current_action() === 'jeo_rag_index_cron_hook' ? 'Cron' : 'Manual';
		$status = $is_error ? __( 'Error', 'jeowp' ) : __( 'Success', 'jeowp' );

		array_unshift( $logs, compact( 'time', 'source', 'status', 'message' ) );
		$logs = array_slice( $logs, 0, 5 );
		update_option( $log_option, $logs, false );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jeo/v1',
			'/ai-rag-run-manual',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_run_manual' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-layer-rag-run-manual',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_run_layer_manual' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-suggest-layers',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_suggest_layers' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * REST Callback: Run one batch manually for posts.
	 */
	public function api_run_manual() {
		$result = $this->process_batch( 'posts' );
		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				400
			);
		}
		return new \WP_REST_Response(
			array(
				'success' => true,
				'message' => $result,
			),
			200
		);
	}

	/**
	 * REST Callback: Run one batch manually for layers.
	 */
	public function api_run_layer_manual() {
		$result = $this->process_batch( 'layers' );
		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				400
			);
		}
		return new \WP_REST_Response(
			array(
				'success' => true,
				'message' => $result,
			),
			200
		);
	}

	/**
	 * REST Callback: Suggest layers matching a post.
	 *
	 * @param \WP_REST_Request $request REST request.
	 */
	public function api_suggest_layers( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$top_k   = (int) $request->get_param( 'top_k' ) ? (int) $request->get_param( 'top_k' ) : 5;
		$query   = $request->get_param( 'query' );

		if ( empty( $post_id ) && empty( $query ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Either post_id or query is required.', 'jeowp' ),
				),
				400
			);
		}

		$search_text = $query;

		if ( ! empty( $post_id ) ) {
			$post = get_post( $post_id );
			if ( ! $post ) {
				return new \WP_REST_Response(
					array(
						'success' => false,
						'message' => __( 'Post not found.', 'jeowp' ),
					),
					404
				);
			}

			if ( empty( $search_text ) ) {
				$search_text = $post->post_title . "\n\n" . $post->post_content;
			}
		}

		try {
			$results = self::find_matching_layers( $search_text, $top_k );
			return new \WP_REST_Response(
				array(
					'success'     => true,
					'results'     => $results,
					'total_found' => count( $results ),
				),
				200
			);
		} catch ( \Exception $e ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $e->getMessage(),
				),
				500
			);
		}
	}

	/**
	 * Maybe schedule the cron job.
	 *
	 * @param mixed $old_value The old option value.
	 * @param mixed $new_value The new option value.
	 */
	public function maybe_schedule_cron( $old_value, $new_value ) {
		$is_active = isset( $new_value['jeo_rag_auto_index'] ) ? (bool) $new_value['jeo_rag_auto_index'] : false;
		$interval  = isset( $new_value['jeo_rag_cron_interval'] ) ? $new_value['jeo_rag_cron_interval'] : 'hourly';

		if ( $is_active ) {
			if ( ! wp_next_scheduled( 'jeo_rag_index_cron_hook' ) ) {
				wp_schedule_event( time(), $interval, 'jeo_rag_index_cron_hook' );
			} else {
				$schedule = wp_get_schedule( 'jeo_rag_index_cron_hook' );
				if ( $schedule !== $interval ) {
					wp_clear_scheduled_hook( 'jeo_rag_index_cron_hook' );
					wp_schedule_event( time(), $interval, 'jeo_rag_index_cron_hook' );
				}
			}
		} else {
			wp_clear_scheduled_hook( 'jeo_rag_index_cron_hook' );
		}
	}

	/**
	 * Process all pipelines on a cron tick.
	 */
	public function process_all_pipelines() {
		if ( ! \jeo_settings()->get_option( 'jeo_rag_auto_index', false ) ) {
			return;
		}

		foreach ( $this->pipelines as $name => $config ) {
			$this->process_batch( $name );
		}
	}

	/**
	 * Auto-index a single layer on save.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 */
	public function on_layer_save( $post_id, $post ) {
		if ( wp_is_post_revision( $post_id ) || 'publish' !== $post->post_status ) {
			return;
		}

		$config = $this->pipelines['layers'];

		try {
			$current_model = \jeo_settings()->get_option( 'ai_embedding_model' );
			$locked_model  = RAG_Agent::get_locked_model( $config->store_name );

			if ( ! empty( $locked_model ) && ! empty( $current_model ) && $locked_model !== $current_model ) {
				return;
			}

			if ( empty( $locked_model ) && ! empty( $current_model ) ) {
				RAG_Agent::setup_store_model( $config->store_name, $current_model );
			}

			$rag       = new RAG_Agent( $config->store_name );
			$documents = $config->data_loader_class::load( array( $post ) );

			if ( ! empty( $documents ) ) {
				$store = $rag->resolveVectorStore();
				if ( $store instanceof \NeuronAI\RAG\VectorStore\DeleteByInterface ) {
					$store->deleteBy( 'layer', (string) $post_id );
				}
				$rag->addDocuments( $documents );
				update_post_meta( $post_id, $config->meta_key, current_time( 'mysql' ) );
			}
		} catch ( \Exception $e ) {
			return;
		}
	}

	/**
	 * Process a batch for a named pipeline.
	 *
	 * @param string $pipeline_name The pipeline name ('posts' or 'layers').
	 */
	public function process_batch( string $pipeline_name = 'posts' ) {
		if ( current_action() === 'jeo_rag_index_cron_hook' && ! \jeo_settings()->get_option( 'jeo_rag_auto_index', false ) ) {
			return;
		}

		$config = $this->pipelines[ $pipeline_name ] ?? null;
		if ( ! $config ) {
			/* translators: %s: pipeline name */
			return new \WP_Error( 'invalid_pipeline', sprintf( __( 'Unknown pipeline: %s', 'jeowp' ), $pipeline_name ) );
		}

		return $this->process_batch_for_config( $config );
	}

	/**
	 * Process a batch using the given pipeline config.
	 *
	 * @param RAG_Pipeline_Config $config Pipeline configuration.
	 */
	private function process_batch_for_config( RAG_Pipeline_Config $config ) {
		$post_types = 'posts' === $config->name
			? \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) )
			: $config->post_types;

		$batch_size = (int) \jeo_settings()->get_option( 'jeo_rag_batch_size', 10 );

		$current_model = \jeo_settings()->get_option( 'ai_embedding_model' );
		$locked_model  = RAG_Agent::get_locked_model( $config->store_name );

		$current_model_basename = $current_model;
		if ( ! empty( $current_model ) && strpos( $current_model, ':' ) !== false ) {
			$parts                  = explode( ':', $current_model, 2 );
			$current_model_basename = $parts[1];
		}

		if ( ! empty( $locked_model ) && ! empty( $current_model ) ) {
			if ( $locked_model !== $current_model && $locked_model !== $current_model_basename ) {
				/* translators: 1: locked model name, 2: current model name */
				$err_msg = sprintf( __( 'Vector Store mismatch for %1$s! Expected %2$s, found %3$s.', 'jeowp' ), $config->name, $locked_model, $current_model );
				$this->log_cron_run( $err_msg, true, $config->cron_log_option );
				return new \WP_Error( 'model_mismatch', $err_msg );
			}
		}

		if ( empty( $locked_model ) ) {
			RAG_Agent::setup_store_model( $config->store_name, $current_model );
		}

		$query_args = array(
			'post_type'      => $post_types,
			'post_status'    => 'publish',
			'posts_per_page' => $batch_size,
			'meta_query'     => array(
				array(
					'key'     => $config->meta_key,
					'compare' => 'NOT EXISTS',
				),
			),
		);

		$query = new \WP_Query( $query_args );

		if ( ! $query->have_posts() ) {
			/* translators: %s: pipeline name */
			$msg = sprintf( __( 'No more %s to vectorize.', 'jeowp' ), $config->name );
			$this->log_cron_run( $msg, false, $config->cron_log_option );
			return $msg;
		}

		try {
			$rag       = new RAG_Agent( $config->store_name );
			$posts     = $query->posts;
			$documents = $config->data_loader_class::load( $posts );

			if ( ! empty( $documents ) ) {
				$batch_char_length = 0;
				foreach ( $documents as $doc ) {
					$batch_char_length += strlen( $doc->getContent() );
				}

				$rag->addDocuments( $documents );
				\jeo_ai_logger()->add_embedding_tokens( 'vectorize_' . $config->name, $batch_char_length );

				$now = current_time( 'mysql' );
				foreach ( $posts as $post ) {
					update_post_meta( $post->ID, $config->meta_key, $now );
				}

				/* translators: %d: number of items vectorized */
				$msg = sprintf( __( 'Successfully vectorized %1$d %2$s.', 'jeowp' ), count( $posts ), $config->name );
				$this->log_cron_run( $msg, false, $config->cron_log_option );
				return $msg;
			} else {
				$now = current_time( 'mysql' );
				foreach ( $posts as $post ) {
					update_post_meta( $post->ID, $config->meta_key, $now );
				}
				/* translators: %s: pipeline name */
				$msg = sprintf( __( 'Batch skipped for %s (no content found).', 'jeowp' ), $config->name );
				$this->log_cron_run( $msg, false, $config->cron_log_option );
				return $msg;
			}
		} catch ( \Exception $e ) {
			$this->log_cron_run( $e->getMessage(), true, $config->cron_log_option );
			return new \WP_Error( 'rag_error', $e->getMessage() );
		}
	}

	/**
	 * Find layers that match the given text using a hybrid search.
	 *
	 * Combines semantic RAG results with a direct text search on layer titles
	 * and content. Returns up to $top_k unique results, giving priority to
	 * semantic matches while ensuring literal keyword hits are included.
	 *
	 * @param string $text  Text to search against the layer store.
	 * @param int    $top_k Number of results to return.
	 * @return array Array of matched documents with metadata.
	 */
	public static function find_matching_layers( string $text, int $top_k = 5 ): array {
		$semantic = self::find_matching_layers_semantic( $text, $top_k );
		$textual  = self::find_matching_layers_by_text( $text, $top_k * 2 );

		$by_id = array();
		foreach ( $semantic as $r ) {
			$by_id[ $r['layer_id'] ] = $r;
		}

		$max_semantic_score = 0.0;
		foreach ( $semantic as $r ) {
			if ( $r['score'] > $max_semantic_score ) {
				$max_semantic_score = $r['score'];
			}
		}
		$fallback_score = $max_semantic_score > 0 ? $max_semantic_score * 0.8 : 0.5;

		foreach ( $textual as $r ) {
			$layer_id = $r['layer_id'];
			if ( ! isset( $by_id[ $layer_id ] ) ) {
				$r['score']         = $fallback_score;
				$by_id[ $layer_id ] = $r;
			}
		}

		uasort(
			$by_id,
			function ( $a, $b ) {
				$b_score = $b['score'] ?? 0;
				$a_score = $a['score'] ?? 0;
				return $b_score <=> $a_score;
			}
		);

		return array_slice( array_values( $by_id ), 0, $top_k );
	}

	/**
	 * Find layers that semantically match the given text.
	 *
	 * @param string $text  Text to search against the layer store.
	 * @param int    $top_k Number of results to return.
	 * @return array Array of matched documents with metadata.
	 */
	private static function find_matching_layers_semantic( string $text, int $top_k = 5 ): array {
		$config = RAG_Pipeline_Config::layers();

		$rag = new RAG_Agent( $config->store_name );

		$retrieval      = $rag->resolveRetrieval();
		$retrieved_docs = $retrieval->retrieve( new \NeuronAI\Chat\Messages\UserMessage( $text ) );

		\jeo_ai_logger()->add_embedding_tokens( 'suggest_layers', strlen( $text ) );

		$results = array();
		$count   = 0;
		foreach ( $retrieved_docs as $doc ) {
			if ( $count >= $top_k ) {
				break;
			}

			$layer_id = (int) ( $doc->metadata['layer_id'] ?? 0 );
			$post     = $layer_id ? get_post( $layer_id ) : null;

			$results[] = array(
				'layer_id'   => $layer_id,
				'title'      => $post ? $post->post_title : ( $doc->metadata['title'] ?? '' ),
				'layer_type' => $doc->metadata['layer_type'] ?? '',
				'source_url' => $doc->metadata['source_url'] ?? '',
				'score'      => $doc->getScore(),
				'content'    => mb_strimwidth( $doc->getContent(), 0, 300, '...' ),
				'edit_url'   => $layer_id ? get_edit_post_link( $layer_id, 'raw' ) : '',
			);
			++$count;
		}

		return $results;
	}

	/**
	 * Find layers by searching titles and content via WP_Query.
	 *
	 * @param string $text  Text to search.
	 * @param int    $top_k Number of results to return.
	 * @return array Array of matched layer metadata.
	 */
	private static function find_matching_layers_by_text( string $text, int $top_k = 5 ): array {
		$query = new \WP_Query(
			array(
				'post_type'      => 'map-layer',
				'post_status'    => 'publish',
				'posts_per_page' => $top_k,
				's'              => sanitize_text_field( $text ),
			)
		);

		$results = array();
		foreach ( $query->posts as $post ) {
			$results[] = array(
				'layer_id'   => $post->ID,
				'title'      => $post->post_title,
				'layer_type' => get_post_meta( $post->ID, 'layer_type', true ),
				'source_url' => get_post_meta( $post->ID, 'source_url', true ),
				'score'      => 0,
				'content'    => mb_strimwidth( wp_strip_all_tags( $post->post_content ), 0, 300, '...' ),
				'edit_url'   => get_edit_post_link( $post->ID, 'raw' ),
			);
		}

		return $results;
	}
}
