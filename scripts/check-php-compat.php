#!/usr/bin/env php
<?php

declare(strict_types=1);

$repositoryRoot = dirname(__DIR__);
$targets = array(
	$repositoryRoot . '/src',
	$repositoryRoot . '/trunk',
);

$files = collect_php_files( $targets );
sort( $files );

$report = array(
	'target_range'         => 'PHP 8.0-8.4',
	'primary_support'      => 'PHP 8.2-8.4',
	'backward_compat'      => 'PHP 8.0-8.1',
	'analyzer_php'         => PHP_VERSION,
	'php_binary'           => PHP_BINARY,
	'file_count'           => count( $files ),
	'checks'               => array(),
	'notes'                => array(),
);

$lint_findings = lint_php_files( $files );
$report['checks'][] = summarize_check( 'Syntax lint', $lint_findings );

$removed_function_findings = scan_removed_or_deprecated_functions( $files );
$report['checks'][] = summarize_check( 'Removed/deprecated function scan', $removed_function_findings );

$parameter_findings = scan_optional_before_required_parameters( $files );
$report['checks'][] = summarize_check( 'Optional-before-required parameter scan', $parameter_findings );

$dynamic_property_findings = scan_dynamic_this_property_assignments( $files );
$report['checks'][] = summarize_check( 'Dynamic $this property assignment scan', $dynamic_property_findings );

$metadata_notes = scan_readme_metadata( $repositoryRoot );
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

function lint_php_files( array $files ): array {
	$findings = array();

	foreach ( $files as $file ) {
		$command = escapeshellarg( PHP_BINARY ) . ' -d display_errors=1 -d error_reporting=32767 -l ' . escapeshellarg( $file ) . ' 2>&1';
		$output = array();
		$status = 0;
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

function scan_removed_or_deprecated_functions( array $files ): array {
	$functions = array(
		'create_function'         => 'removed in PHP 8.0',
		'each'                    => 'removed in PHP 8.0',
		'utf8_encode'             => 'deprecated in PHP 8.2 and removed in PHP 8.4',
		'utf8_decode'             => 'deprecated in PHP 8.2 and removed in PHP 8.4',
		'money_format'            => 'removed in PHP 8.0',
		'strftime'                => 'deprecated in PHP 8.1',
		'gmstrftime'              => 'deprecated in PHP 8.1',
		'hebrev'                  => 'deprecated in PHP 8.3',
		'hebrevc'                 => 'deprecated in PHP 8.3',
		'mbereg_replace'          => 'deprecated in PHP 8.4 when using the eval option',
		'set_magic_quotes_runtime'=> 'removed in PHP 8.0',
		'ezmlm_hash'              => 'removed in PHP 8.0',
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
			$previous = null !== $previous_index ? $tokens[ $previous_index ] : null;
			if ( is_array( $previous ) && in_array( $previous[0], array( T_FUNCTION, T_NEW, T_OBJECT_OPERATOR, T_DOUBLE_COLON ), true ) ) {
				continue;
			}

			$next_index = next_meaningful_token_index( $tokens, $index );
			$next = null !== $next_index ? $tokens[ $next_index ] : null;
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
			$name_index = next_meaningful_token_index( $tokens, $index );
			$name_token = null !== $name_index ? $tokens[ $name_index ] : null;
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

			$parameters = parse_parameters( $tokens, $open_index + 1, $close_index - 1 );
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

function extract_class_like_structures( array $tokens ): array {
	$structures = array();
	$count      = count( $tokens );

	for ( $index = 0; $index < $count; $index++ ) {
		$token = $tokens[ $index ];
		if ( ! is_array( $token ) || ! in_array( $token[0], array( T_CLASS, T_TRAIT ), true ) ) {
			continue;
		}

		$name = 'anonymous';
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

function collect_declared_properties( array $tokens, int $start, int $end ): array {
	$properties = array();
	$brace_depth = 0;
	$function_depth = 0;
	$expect_property = false;

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

		if ( is_array( $token ) && in_array( $token[0], array( T_PUBLIC, T_PROTECTED, T_PRIVATE, T_VAR, T_STATIC, T_READONLY ), true ) ) {
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

function collect_this_property_assignments( array $tokens, int $start, int $end ): array {
	$assignments = array();
	$count       = count( $tokens );

	for ( $index = $start; $index <= $end && $index < $count; $index++ ) {
		$token = $tokens[ $index ];

		if ( ! is_array( $token ) || T_VARIABLE !== $token[0] || '$this' !== $token[1] ) {
			continue;
		}

		$operator_index = next_meaningful_token_index( $tokens, $index );
		$operator = null !== $operator_index ? $tokens[ $operator_index ] : null;
		if ( '->' !== token_text( $operator ) ) {
			continue;
		}

		$property_index = null !== $operator_index ? next_meaningful_token_index( $tokens, $operator_index ) : null;
		$property = null !== $property_index ? $tokens[ $property_index ] : null;
		if ( ! is_array( $property ) || T_STRING !== $property[0] ) {
			continue;
		}

		$next_index = null !== $property_index ? next_meaningful_token_index( $tokens, $property_index ) : null;
		$next = null !== $next_index ? $tokens[ $next_index ] : null;
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

function parse_parameters( array $tokens, int $start, int $end ): array {
	$parameters = array();
	$current    = array(
		'name'        => null,
		'line'        => null,
		'has_default' => false,
		'is_variadic' => false,
	);
	$depth = 0;

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
			$current = array(
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

function scan_readme_metadata( string $repositoryRoot ): array {
	$notes = array();
	$files = array(
		$repositoryRoot . '/src/README.txt',
		$repositoryRoot . '/trunk/readme.txt',
	);

	foreach ( $files as $file ) {
		if ( ! is_file( $file ) ) {
			continue;
		}

		$content = file_get_contents( $file );
		if ( preg_match( '/^Requires PHP:\s*(.+)$/mi', $content, $matches ) ) {
			$notes[] = sprintf(
				'%s declares "Requires PHP: %s". This admits PHP 8.2-8.4 but does not explicitly document 8.3/8.4 validation.',
				relative_path( $file ),
				trim( $matches[1] )
			);
		}
	}

	return $notes;
}

function summarize_check( string $name, array $findings ): array {
	return array(
		'name'     => $name,
		'status'   => empty( $findings ) ? 'PASS' : 'FAIL',
		'findings' => $findings,
	);
}

function print_report( array $report ): void {
	printf( "PHP compatibility review\n" );
	printf( "Target range: %s\n", $report['target_range'] );
	printf( "Primary support: %s\n", $report['primary_support'] );
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
	printf( "  - Static compatibility checks cover PHP 8.0-8.4.\n" );
	printf( "  - The stricter deprecation heuristics in this script are focused on PHP 8.2-8.4.\n" );
	printf( "  - Runtime compatibility for WordPress/PHP combinations should be enforced by the WordPress smoke-test workflow.\n" );

	if ( all_checks_passed( $report['checks'] ) ) {
		printf( "\nResult: no blocking PHP 8.0-8.4 compatibility issues were found by the static checks.\n" );
	} else {
		printf( "\nResult: one or more compatibility issues need review before claiming PHP 8.0-8.4 support.\n" );
	}

	printf( "Limitations: static source review only; it does not boot WordPress or exercise runtime behavior.\n" );
}

function all_checks_passed( array $checks ): bool {
	foreach ( $checks as $check ) {
		if ( 'PASS' !== $check['status'] ) {
			return false;
		}
	}

	return true;
}

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

function next_meaningful_token_index( array $tokens, int $index ): ?int {
	$count = count( $tokens );
	for ( $current = $index + 1; $current < $count; $current++ ) {
		$token = $tokens[ $current ];
		if ( is_array( $token ) && in_array( $token[0], array( T_WHITESPACE, T_COMMENT, T_DOC_COMMENT ), true ) ) {
			continue;
		}

		return $current;
	}

	return null;
}

function find_next_token_index_by_text( array $tokens, int $index, string $text ): ?int {
	$count = count( $tokens );
	for ( $current = $index + 1; $current < $count; $current++ ) {
		if ( $text === token_text( $tokens[ $current ] ) ) {
			return $current;
		}
	}

	return null;
}

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

function token_text( $token ): string {
	return is_array( $token ) ? $token[1] : $token;
}

function relative_path( string $path ): string {
	static $root = null;

	if ( null === $root ) {
		$root = dirname(__DIR__) . DIRECTORY_SEPARATOR;
	}

	if ( 0 === strpos( $path, $root ) ) {
		return substr( $path, strlen( $root ) );
	}

	return $path;
}
