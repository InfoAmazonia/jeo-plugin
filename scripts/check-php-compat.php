#!/usr/bin/env php
<?php
/**
 * CLI PHP compatibility review for repository-owned code.
 *
 * @package Jeo
 */

declare(strict_types=1);

// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents,WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec -- This is a CLI-only diagnostic script, not a WordPress runtime endpoint.

$repository_root = dirname( __DIR__ );
$scan_targets    = array(
	$repository_root . '/src',
	$repository_root . '/trunk',
);

$files = collect_php_files( $scan_targets );
sort( $files );

$report = array(
	'target_range'         => 'PHP 8.0-8.5',
	'primary_support'      => 'PHP 8.2-8.4',
	'experimental_monitor' => 'PHP 8.5',
	'backward_compat'      => 'PHP 8.0-8.1',
	'analyzer_php'         => PHP_VERSION,
	'php_binary'           => PHP_BINARY,
	'file_count'           => count( $files ),
	'checks'               => array(),
	'notes'                => array(),
);

$lint_findings      = lint_php_files( $files );
$report['checks'][] = summarize_check( 'Syntax lint', $lint_findings );

$removed_function_findings = scan_removed_or_deprecated_functions( $files );
$report['checks'][]        = summarize_check( 'Removed/deprecated function scan', $removed_function_findings );

$parameter_findings = scan_optional_before_required_parameters( $files );
$report['checks'][] = summarize_check( 'Optional-before-required parameter scan', $parameter_findings );

$dynamic_property_findings = scan_dynamic_this_property_assignments( $files );
$report['checks'][]        = summarize_check( 'Dynamic $this property assignment scan', $dynamic_property_findings );

$backtick_findings  = scan_backtick_shell_execution( $files );
$report['checks'][] = summarize_check( 'Backtick shell-execution scan', $backtick_findings );

$cast_findings      = scan_non_canonical_casts( $files );
$report['checks'][] = summarize_check( 'Non-canonical cast scan', $cast_findings );

$case_syntax_findings = scan_case_semicolon_syntax( $files );
$report['checks'][]   = summarize_check( 'Case-semicolon syntax scan', $case_syntax_findings );

$legacy_magic_method_findings = scan_legacy_sleep_wakeup_methods( $files );
$report['checks'][]           = summarize_check( 'Legacy __sleep/__wakeup scan', $legacy_magic_method_findings );

$metadata_notes  = scan_readme_metadata( $repository_root );
$report['notes'] = array_merge( $report['notes'], $metadata_notes );

print_report( $report );

$has_errors = false;
foreach ( $report['checks'] as $check ) {
	if ( ! empty( $check['findings'] ) ) {
		$has_errors = true;
		break;
	}
}

exit( $has_errors ? 1 : 0 );

/**
 * Collect all PHP files within the target directories.
 *
 * @param array $targets Directories to scan.
 * @return array
 */
function collect_php_files( array $targets ): array {
	$files = array();

	foreach ( $targets as $target ) {
		if ( ! is_dir( $target ) ) {
			continue;
		}

		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $target, FilesystemIterator::SKIP_DOTS )
		);

		foreach ( $iterator as $file ) {
			if ( $file->isFile() && 'php' === strtolower( $file->getExtension() ) ) {
				$files[] = $file->getPathname();
			}
		}
	}

	return $files;
}

/**
 * Run `php -l` against every discovered PHP file.
 *
 * @param array $files PHP file paths.
 * @return array
 */
function lint_php_files( array $files ): array {
	$findings = array();

	foreach ( $files as $file ) {
		$command = escapeshellarg( PHP_BINARY ) . ' -d display_errors=1 -d error_reporting=32767 -l ' . escapeshellarg( $file ) . ' 2>&1';
		$output  = array();
		$status  = 0;
		exec( $command, $output, $status );

		if ( 0 !== $status ) {
			$findings[] = array(
				'file'    => relative_path( $file ),
				'line'    => null,
				'message' => trim( implode( "\n", $output ) ),
			);
		}
	}

	return $findings;
}

/**
 * Scan for removed or deprecated PHP functions.
 *
 * @param array $files PHP file paths.
 * @return array
 */
function scan_removed_or_deprecated_functions( array $files ): array {
	$functions = array(
		'create_function'          => 'removed in PHP 8.0',
		'each'                     => 'removed in PHP 8.0',
		'utf8_encode'              => 'deprecated in PHP 8.2 and removed in PHP 8.4',
		'utf8_decode'              => 'deprecated in PHP 8.2 and removed in PHP 8.4',
		'money_format'             => 'removed in PHP 8.0',
		'strftime'                 => 'deprecated in PHP 8.1',
		'gmstrftime'               => 'deprecated in PHP 8.1',
		'hebrev'                   => 'deprecated in PHP 8.3',
		'hebrevc'                  => 'deprecated in PHP 8.3',
		'mbereg_replace'           => 'deprecated in PHP 8.4 when using the eval option',
		'set_magic_quotes_runtime' => 'removed in PHP 8.0',
		'ezmlm_hash'               => 'removed in PHP 8.0',
	);

	$findings = array();

	foreach ( $files as $file ) {
		$tokens = token_get_all( file_get_contents( $file ) );
		$count  = count( $tokens );

		for ( $index = 0; $index < $count; $index++ ) {
			$token = $tokens[ $index ];
			if ( ! is_array( $token ) || T_STRING !== $token[0] ) {
				continue;
			}

			$name = strtolower( $token[1] );
			if ( ! isset( $functions[ $name ] ) ) {
				continue;
			}

			$previous_index = previous_meaningful_token_index( $tokens, $index );
			$previous       = null !== $previous_index ? $tokens[ $previous_index ] : null;
			if ( is_array( $previous ) && in_array( $previous[0], array( T_FUNCTION, T_NEW, T_OBJECT_OPERATOR, T_DOUBLE_COLON ), true ) ) {
				continue;
			}

			$next_index = next_meaningful_token_index( $tokens, $index );
			$next       = null !== $next_index ? $tokens[ $next_index ] : null;
			if ( '(' !== token_text( $next ) ) {
				continue;
			}

			$findings[] = array(
				'file'    => relative_path( $file ),
				'line'    => $token[2],
				'message' => sprintf( 'Uses %s(), %s.', $name, $functions[ $name ] ),
			);
		}
	}

	return $findings;
}

/**
 * Scan for required parameters declared after optional ones.
 *
 * @param array $files PHP file paths.
 * @return array
 */
function scan_optional_before_required_parameters( array $files ): array {
	$findings = array();

	foreach ( $files as $file ) {
		$tokens = token_get_all( file_get_contents( $file ) );
		$count  = count( $tokens );

		for ( $index = 0; $index < $count; $index++ ) {
			$token = $tokens[ $index ];
			if ( ! is_array( $token ) || T_FUNCTION !== $token[0] ) {
				continue;
			}

			$function_name = 'anonymous';
			$name_index    = next_meaningful_token_index( $tokens, $index );
			$name_token    = null !== $name_index ? $tokens[ $name_index ] : null;
			if ( is_array( $name_token ) && T_STRING === $name_token[0] ) {
				$function_name = $name_token[1];
			}

			$open_index = find_next_token_index_by_text( $tokens, $index, '(' );
			if ( null === $open_index ) {
				continue;
			}

			$close_index = find_matching_parenthesis( $tokens, $open_index );
			if ( null === $close_index ) {
				continue;
			}

			$parameters    = parse_parameters( $tokens, $open_index + 1, $close_index - 1 );
			$seen_optional = false;

			foreach ( $parameters as $parameter ) {
				if ( empty( $parameter['name'] ) ) {
					continue;
				}

				if ( $parameter['has_default'] ) {
					$seen_optional = true;
					continue;
				}

				if ( $seen_optional && ! $parameter['is_variadic'] ) {
					$findings[] = array(
						'file'    => relative_path( $file ),
						'line'    => $parameter['line'],
						'message' => sprintf(
							'Function %s() declares required parameter $%s after an optional parameter.',
							$function_name,
							$parameter['name']
						),
					);
				}
			}

			$index = $close_index;
		}
	}

	return $findings;
}

/**
 * Scan for undeclared dynamic `$this` property assignments.
 *
 * @param array $files PHP file paths.
 * @return array
 */
function scan_dynamic_this_property_assignments( array $files ): array {
	$findings = array();

	foreach ( $files as $file ) {
		$tokens  = token_get_all( file_get_contents( $file ) );
		$classes = extract_class_like_structures( $tokens );

		foreach ( $classes as $class ) {
			foreach ( $class['assignments'] as $assignment ) {
				if ( isset( $class['properties'][ $assignment['property'] ] ) ) {
					continue;
				}

				$findings[] = array(
					'file'    => relative_path( $file ),
					'line'    => $assignment['line'],
					'message' => sprintf(
						'Class %s assigns $this->%s without declaring the property.',
						$class['name'],
						$assignment['property']
					),
				);
			}
		}
	}

	return $findings;
}

/**
 * Scan for backtick shell-execution usage.
 *
 * @param array $files PHP file paths.
 * @return array
 */
function scan_backtick_shell_execution( array $files ): array {
	$findings = array();

	foreach ( $files as $file ) {
		$tokens           = token_get_all( file_get_contents( $file ) );
		$count            = count( $tokens );
		$inside_backticks = false;

		for ( $index = 0; $index < $count; $index++ ) {
			if ( '`' !== token_text( $tokens[ $index ] ) ) {
				continue;
			}

			if ( ! $inside_backticks ) {
				$findings[] = array(
					'file'    => relative_path( $file ),
					'line'    => token_line( $tokens, $index ),
					'message' => 'Uses the backtick shell-execution operator, deprecated in PHP 8.5.',
				);
			}

			$inside_backticks = ! $inside_backticks;
		}
	}

	return $findings;
}

/**
 * Scan for non-canonical casts deprecated in PHP 8.5.
 *
 * @param array $files PHP file paths.
 * @return array
 */
function scan_non_canonical_casts( array $files ): array {
	$deprecated_casts = array(
		T_BOOL_CAST   => '(boolean)',
		T_INT_CAST    => '(integer)',
		T_DOUBLE_CAST => '(double)',
		T_STRING_CAST => '(binary)',
	);
	$findings         = array();

	foreach ( $files as $file ) {
		$tokens = token_get_all( file_get_contents( $file ) );

		foreach ( $tokens as $token ) {
			if ( ! is_array( $token ) || ! isset( $deprecated_casts[ $token[0] ] ) ) {
				continue;
			}

			if ( strtolower( $token[1] ) !== $deprecated_casts[ $token[0] ] ) {
				continue;
			}

			$findings[] = array(
				'file'    => relative_path( $file ),
				'line'    => $token[2],
				'message' => sprintf(
					'Uses non-canonical cast %s, deprecated in PHP 8.5.',
					$token[1]
				),
			);
		}
	}

	return $findings;
}

/**
 * Scan for `case ...;` syntax deprecated in PHP 8.5.
 *
 * @param array $files PHP file paths.
 * @return array
 */
function scan_case_semicolon_syntax( array $files ): array {
	$findings = array();

	foreach ( $files as $file ) {
		$tokens = token_get_all( file_get_contents( $file ) );
		$count  = count( $tokens );

		for ( $index = 0; $index < $count; $index++ ) {
			$token = $tokens[ $index ];
			if ( ! is_array( $token ) || T_CASE !== $token[0] ) {
				continue;
			}

			$next_index = next_meaningful_token_index( $tokens, $index );
			while ( null !== $next_index ) {
				$next_text = token_text( $tokens[ $next_index ] );

				if ( ':' === $next_text ) {
					break;
				}

				if ( ';' === $next_text ) {
					$findings[] = array(
						'file'    => relative_path( $file ),
						'line'    => $token[2],
						'message' => 'Uses case syntax with a trailing semicolon instead of a colon, deprecated in PHP 8.5.',
					);
					break;
				}

				$next_index = next_meaningful_token_index( $tokens, $next_index );
			}
		}
	}

	return $findings;
}

/**
 * Scan for legacy `__sleep()` and `__wakeup()` magic methods.
 *
 * @param array $files PHP file paths.
 * @return array
 */
function scan_legacy_sleep_wakeup_methods( array $files ): array {
	$findings = array();

	foreach ( $files as $file ) {
		$tokens = token_get_all( file_get_contents( $file ) );
		$count  = count( $tokens );

		for ( $index = 0; $index < $count; $index++ ) {
			$token = $tokens[ $index ];
			if ( ! is_array( $token ) || T_FUNCTION !== $token[0] ) {
				continue;
			}

			$name_index = next_meaningful_token_index( $tokens, $index );
			$name_token = null !== $name_index ? $tokens[ $name_index ] : null;
			if ( ! is_array( $name_token ) || T_STRING !== $name_token[0] ) {
				continue;
			}

			$name = strtolower( $name_token[1] );
			if ( ! in_array( $name, array( '__sleep', '__wakeup' ), true ) ) {
				continue;
			}

			$findings[] = array(
				'file'    => relative_path( $file ),
				'line'    => $name_token[2],
				'message' => sprintf(
					'Defines %s(), which is soft-deprecated in PHP 8.5 in favor of __serialize() and __unserialize().',
					$name_token[1]
				),
			);
		}
	}

	return $findings;
}

/**
 * Extract classes and traits plus their declared properties and assignments.
 *
 * @param array $tokens PHP token stream.
 * @return array
 */
function extract_class_like_structures( array $tokens ): array {
	$structures = array();
	$count      = count( $tokens );

	for ( $index = 0; $index < $count; $index++ ) {
		$token = $tokens[ $index ];
		if ( ! is_array( $token ) || ! in_array( $token[0], array( T_CLASS, T_TRAIT ), true ) ) {
			continue;
		}

		$name       = 'anonymous';
		$name_index = next_meaningful_token_index( $tokens, $index );
		$name_token = null !== $name_index ? $tokens[ $name_index ] : null;
		if ( is_array( $name_token ) && T_STRING === $name_token[0] ) {
			$name = $name_token[1];
		}

		$open_index = find_next_token_index_by_text( $tokens, $index, '{' );
		if ( null === $open_index ) {
			continue;
		}

		$close_index = find_matching_brace( $tokens, $open_index );
		if ( null === $close_index ) {
			continue;
		}

		$structures[] = array(
			'name'        => $name,
			'properties'  => collect_declared_properties( $tokens, $open_index + 1, $close_index - 1 ),
			'assignments' => collect_this_property_assignments( $tokens, $open_index + 1, $close_index - 1 ),
		);

		$index = $close_index;
	}

	return $structures;
}

/**
 * Collect declared properties inside a class-like structure.
 *
 * @param array $tokens PHP token stream.
 * @param int   $start Start index.
 * @param int   $end End index.
 * @return array
 */
function collect_declared_properties( array $tokens, int $start, int $end ): array {
	$properties               = array();
	$brace_depth              = 0;
	$function_depth           = 0;
	$expect_property          = false;
	$property_modifier_tokens = array( T_PUBLIC, T_PROTECTED, T_PRIVATE, T_VAR, T_STATIC );

	if ( defined( 'T_READONLY' ) ) {
		$property_modifier_tokens[] = T_READONLY;
	}

	for ( $index = $start; $index <= $end; $index++ ) {
		$token = $tokens[ $index ];
		$text  = token_text( $token );

		if ( '{' === $text ) {
			++$brace_depth;
			continue;
		}

		if ( '}' === $text ) {
			$brace_depth = max( 0, $brace_depth - 1 );
			if ( 0 === $brace_depth ) {
				$function_depth = 0;
			}
			continue;
		}

		if ( 0 !== $brace_depth ) {
			continue;
		}

		if ( is_array( $token ) && T_FUNCTION === $token[0] ) {
			++$function_depth;
			$expect_property = false;
			continue;
		}

		if ( $function_depth > 0 ) {
			continue;
		}

		if ( is_array( $token ) && in_array( $token[0], $property_modifier_tokens, true ) ) {
			$expect_property = true;
			continue;
		}

		if ( $expect_property && is_array( $token ) && T_VARIABLE === $token[0] ) {
			$properties[ ltrim( $token[1], '$' ) ] = true;
			continue;
		}

		if ( ';' === $text ) {
			$expect_property = false;
		}
	}

	return $properties;
}

/**
 * Collect `$this->property = ...` assignments inside a class-like structure.
 *
 * @param array $tokens PHP token stream.
 * @param int   $start Start index.
 * @param int   $end End index.
 * @return array
 */
function collect_this_property_assignments( array $tokens, int $start, int $end ): array {
	$assignments = array();
	$count       = count( $tokens );

	for ( $index = $start; $index <= $end && $index < $count; $index++ ) {
		$token = $tokens[ $index ];

		if ( ! is_array( $token ) || T_VARIABLE !== $token[0] || '$this' !== $token[1] ) {
			continue;
		}

		$operator_index = next_meaningful_token_index( $tokens, $index );
		$operator       = null !== $operator_index ? $tokens[ $operator_index ] : null;
		if ( '->' !== token_text( $operator ) ) {
			continue;
		}

		$property_index = null !== $operator_index ? next_meaningful_token_index( $tokens, $operator_index ) : null;
		$property       = null !== $property_index ? $tokens[ $property_index ] : null;
		if ( ! is_array( $property ) || T_STRING !== $property[0] ) {
			continue;
		}

		$next_index           = null !== $property_index ? next_meaningful_token_index( $tokens, $property_index ) : null;
		$next                 = null !== $next_index ? $tokens[ $next_index ] : null;
		$assignment_operators = array( '=', '+=', '-=', '*=', '/=', '.=', '%=', '&=', '|=', '^=', '??=' );
		if ( ! in_array( token_text( $next ), $assignment_operators, true ) ) {
			continue;
		}

		$assignments[] = array(
			'property' => $property[1],
			'line'     => $property[2],
		);
	}

	return $assignments;
}

/**
 * Parse function parameters from a token range.
 *
 * @param array $tokens PHP token stream.
 * @param int   $start Start index.
 * @param int   $end End index.
 * @return array
 */
function parse_parameters( array $tokens, int $start, int $end ): array {
	$parameters = array();
	$current    = array(
		'name'        => null,
		'line'        => null,
		'has_default' => false,
		'is_variadic' => false,
	);
	$depth      = 0;

	for ( $index = $start; $index <= $end; $index++ ) {
		$token = $tokens[ $index ];
		$text  = token_text( $token );

		if ( in_array( $text, array( '(', '[', '{' ), true ) ) {
			++$depth;
			continue;
		}

		if ( in_array( $text, array( ')', ']', '}' ), true ) ) {
			$depth = max( 0, $depth - 1 );
			continue;
		}

		if ( 0 === $depth && ',' === $text ) {
			$parameters[] = $current;
			$current      = array(
				'name'        => null,
				'line'        => null,
				'has_default' => false,
				'is_variadic' => false,
			);
			continue;
		}

		if ( is_array( $token ) && T_ELLIPSIS === $token[0] ) {
			$current['is_variadic'] = true;
			continue;
		}

		if ( is_array( $token ) && T_VARIABLE === $token[0] ) {
			$current['name'] = ltrim( $token[1], '$' );
			$current['line'] = $token[2];
			continue;
		}

		if ( 0 === $depth && '=' === $text ) {
			$current['has_default'] = true;
		}
	}

	if ( null !== $current['name'] ) {
		$parameters[] = $current;
	}

	return $parameters;
}

/**
 * Read README metadata notes relevant to PHP compatibility messaging.
 *
 * @param string $repository_root Repository root path.
 * @return array
 */
function scan_readme_metadata( string $repository_root ): array {
	$notes = array();
	$files = array(
		$repository_root . '/src/readme.txt',
	);

	foreach ( $files as $file ) {
		if ( ! is_file( $file ) ) {
			continue;
		}

		$content = file_get_contents( $file );
		if ( preg_match( '/^Requires PHP:\s*(.+)$/mi', $content, $matches ) ) {
			$documents_experimental_php85 = ( false !== stripos( $content, 'Experimental monitoring: PHP 8.5' ) )
				|| ( false !== stripos( $content, 'experimental WordPress smoke coverage on PHP 8.5' ) );

			if ( $documents_experimental_php85 ) {
				continue;
			}

			$notes[] = sprintf(
				'%s declares "Requires PHP: %s". This admits PHP 8.2-8.5 but does not explicitly document the repository\'s PHP 8.5 experimental validation line.',
				relative_path( $file ),
				trim( $matches[1] )
			);
		}
	}

	return $notes;
}

/**
 * Build a report row for a named compatibility check.
 *
 * @param string $name Check label.
 * @param array  $findings Findings collected by the check.
 * @return array
 */
function summarize_check( string $name, array $findings ): array {
	return array(
		'name'     => $name,
		'status'   => empty( $findings ) ? 'PASS' : 'FAIL',
		'findings' => $findings,
	);
}

/**
 * Print the CLI compatibility report.
 *
 * @param array $report Report payload.
 * @return void
 */
function print_report( array $report ): void {
	printf( "PHP compatibility review\n" );
	printf( "Target range: %s\n", $report['target_range'] );
	printf( "Primary support: %s\n", $report['primary_support'] );
	printf( "Experimental monitoring: %s\n", $report['experimental_monitor'] );
	printf( "Backward-compat coverage: %s\n", $report['backward_compat'] );
	printf( "Analyzer PHP: %s\n", $report['analyzer_php'] );
	printf( "PHP binary: %s\n", $report['php_binary'] );
	printf( "Files checked: %d\n\n", $report['file_count'] );

	foreach ( $report['checks'] as $check ) {
		printf( "[%s] %s\n", $check['status'], $check['name'] );
		foreach ( $check['findings'] as $finding ) {
			$location = $finding['file'];
			if ( null !== $finding['line'] ) {
				$location .= ':' . $finding['line'];
			}
			printf( "  - %s: %s\n", $location, $finding['message'] );
		}
	}

	if ( ! empty( $report['notes'] ) ) {
		printf( "\nNotes\n" );
		foreach ( $report['notes'] as $note ) {
			printf( "  - %s\n", $note );
		}
	}

	printf( "\nPolicy\n" );
	printf( "  - Static compatibility checks cover PHP 8.0-8.5.\n" );
	printf( "  - The stricter deprecation heuristics in this script are focused on PHP 8.2-8.5.\n" );
	printf( "  - Runtime compatibility for WordPress/PHP combinations should be enforced by the WordPress smoke-test workflow.\n" );

	if ( all_checks_passed( $report['checks'] ) ) {
		printf( "\nResult: no blocking PHP 8.0-8.5 compatibility issues were found by the static checks.\n" );
	} else {
		printf( "\nResult: one or more compatibility issues need review before claiming PHP 8.0-8.5 support.\n" );
	}

	printf( "Limitations: static source review only; it does not boot WordPress or exercise runtime behavior.\n" );
}

/**
 * Determine whether every collected check passed.
 *
 * @param array $checks Check rows.
 * @return bool
 */
function all_checks_passed( array $checks ): bool {
	foreach ( $checks as $check ) {
		if ( 'PASS' !== $check['status'] ) {
			return false;
		}
	}

	return true;
}

/**
 * Find the previous non-whitespace, non-comment token index.
 *
 * @param array $tokens PHP token stream.
 * @param int   $index Current index.
 * @return int|null
 */
function previous_meaningful_token_index( array $tokens, int $index ): ?int {
	for ( $current = $index - 1; $current >= 0; $current-- ) {
		$token = $tokens[ $current ];
		if ( is_array( $token ) && in_array( $token[0], array( T_WHITESPACE, T_COMMENT, T_DOC_COMMENT ), true ) ) {
			continue;
		}

		return $current;
	}

	return null;
}

/**
 * Find the next non-whitespace, non-comment token index.
 *
 * @param array $tokens PHP token stream.
 * @param int   $index Current index.
 * @return int|null
 */
function next_meaningful_token_index( array $tokens, int $index ): ?int {
	$count = count( $tokens );
	for ( $current = $index + 1; $count > $current; $current++ ) {
		$token = $tokens[ $current ];
		if ( is_array( $token ) && in_array( $token[0], array( T_WHITESPACE, T_COMMENT, T_DOC_COMMENT ), true ) ) {
			continue;
		}

		return $current;
	}

	return null;
}

/**
 * Find the next token with a given text value.
 *
 * @param array  $tokens PHP token stream.
 * @param int    $index Current index.
 * @param string $text Token text to match.
 * @return int|null
 */
function find_next_token_index_by_text( array $tokens, int $index, string $text ): ?int {
	$count   = count( $tokens );
	$current = $index + 1;
	while ( $count > $current ) {
		// phpcs:ignore WordPress.PHP.YodaConditions.NotYoda -- False positive while comparing against a parsed token value.
		if ( $text === token_text( $tokens[ $current ] ) ) {
			return $current;
		}

		++$current;
	}

	return null;
}

/**
 * Find the matching closing parenthesis for an opening parenthesis token.
 *
 * @param array $tokens PHP token stream.
 * @param int   $open_index Opening parenthesis index.
 * @return int|null
 */
function find_matching_parenthesis( array $tokens, int $open_index ): ?int {
	$depth = 0;
	$count = count( $tokens );

	for ( $index = $open_index; $index < $count; $index++ ) {
		$text = token_text( $tokens[ $index ] );
		if ( '(' === $text ) {
			++$depth;
			continue;
		}

		if ( ')' === $text ) {
			--$depth;
			if ( 0 === $depth ) {
				return $index;
			}
		}
	}

	return null;
}

/**
 * Find the matching closing brace for an opening brace token.
 *
 * @param array $tokens PHP token stream.
 * @param int   $open_index Opening brace index.
 * @return int|null
 */
function find_matching_brace( array $tokens, int $open_index ): ?int {
	$depth = 0;
	$count = count( $tokens );

	for ( $index = $open_index; $index < $count; $index++ ) {
		$text = token_text( $tokens[ $index ] );
		if ( '{' === $text ) {
			++$depth;
			continue;
		}

		if ( '}' === $text ) {
			--$depth;
			if ( 0 === $depth ) {
				return $index;
			}
		}
	}

	return null;
}

/**
 * Normalize a token into plain text.
 *
 * @param mixed $token Token array or raw string token.
 * @return string
 */
function token_text( $token ): string {
	return is_array( $token ) ? $token[1] : $token;
}

/**
 * Calculate the source line for a token index.
 *
 * @param array $tokens PHP token stream.
 * @param int   $index Token index.
 * @return int|null
 */
function token_line( array $tokens, int $index ): ?int {
	$current_line = 1;

	for ( $current = 0; $current <= $index; $current++ ) {
		$token = $tokens[ $current ];

		if ( is_array( $token ) ) {
			$current_line = $token[2];
			continue;
		}

		$current_line += substr_count( $token, "\n" );
	}

	return $current_line;
}

/**
 * Convert an absolute path into a repository-relative path.
 *
 * @param string $path Absolute file path.
 * @return string
 */
function relative_path( string $path ): string {
	static $root = null;

	if ( null === $root ) {
		$root = dirname( __DIR__ ) . DIRECTORY_SEPARATOR;
	}

	if ( 0 === strpos( $path, $root ) ) {
		return substr( $path, strlen( $root ) );
	}

	return $path;
}

// phpcs:enable
