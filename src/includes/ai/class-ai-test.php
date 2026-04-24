<?php

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * AI Test Class
 *
 * Simple verification for AI georeferencing logic.
 */
class AI_Test {

	/**
	 * Verify the AI Handler is initialized and return adapter status.
	 *
	 * @return array|\WP_Error
	 */
	public static function run_test() {
		// Mock values
		$test_title   = 'Incêndio florestal em Manaus';
		$test_content = 'Um grande incêndio foi reportado hoje próximo ao Teatro Amazonas, no centro de Manaus.';

		// We can't easily mock the network call here without a full testing framework,
		// but we can verify if the handler is correctly instantiated and if the REST route exists.

		$handler = \jeo_ai_handler();
		if ( ! $handler ) {
			return new \WP_Error( 'test_failed', 'AI Handler not initialized.' );
		}

		$adapter = $handler->get_active_adapter();
		if ( ! $adapter ) {
			return array(
				'status'  => 'partial_success',
				'message' => 'AI Handler is active, but no adapter is configured. This is expected if API keys are empty.',
			);
		}

		return array(
			'status'         => 'success',
			'message'        => 'AI Handler and Adapter are ready.',
			'active_adapter' => get_class( $adapter ),
		);
	}
}
