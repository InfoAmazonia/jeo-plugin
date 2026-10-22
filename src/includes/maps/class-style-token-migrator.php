<?php
/**
 * Migrates legacy Mapbox token strings to style-spec expressions.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Converts the legacy `{token}` string syntax used by pre-expressions Mapbox
 * styles (e.g. `"text-field": "{name_en}"`) into equivalent style-spec
 * expressions (`["get", "name_en"]`).
 *
 * MapLibre GL JS (the JEO default runtime, v3+) no longer interpolates token
 * strings, so unmigrated values render the literal text `{name_en}` on the
 * map. Only the layer layout properties that historically supported tokens
 * are rewritten, and only strings (plain or nested inside expression
 * values): expression arrays are otherwise preserved, which keeps the
 * migration idempotent. Source definitions are never visited, so tile URL
 * templates such as `{z}/{x}/{y}` are safe.
 */
class Style_Token_Migrator {

	/**
	 * Layout properties that historically supported token interpolation.
	 *
	 * @var string[]
	 */
	const TOKEN_PROPERTIES = array( 'text-field', 'icon-image' );

	/**
	 * Migrate legacy token strings in a decoded style definition.
	 *
	 * Walks layer layout sections only, rewriting both plain string values
	 * and token strings nested inside expression values (legacy function
	 * outputs converted by the composer). The style tree is copied lazily:
	 * when no token is found the original (shared) arrays are returned
	 * untouched.
	 *
	 * @param array $style      Decoded style JSON (associative).
	 * @param int   $conversions Number of migrated values, passed by reference.
	 * @return array Style with token strings replaced by expressions.
	 */
	public static function migrate_style( array $style, &$conversions = 0 ) {
		if ( ! isset( $style['layers'] ) || ! is_array( $style['layers'] ) ) {
			return $style;
		}

		foreach ( $style['layers'] as $index => $layer ) {
			if ( ! is_array( $layer ) || ! isset( $layer['layout'] ) || ! is_array( $layer['layout'] ) ) {
				continue;
			}

			$layout  = $layer['layout'];
			$changed = false;

			foreach ( self::TOKEN_PROPERTIES as $property ) {
				if ( ! array_key_exists( $property, $layout ) ) {
					continue;
				}

				$value = $layout[ $property ];

				if ( is_string( $value ) ) {
					$migrated = self::migrate_string( $value );
					if ( null === $migrated || $migrated === $value ) {
						continue;
					}
				} else {
					$converted_value = false;
					$migrated        = self::migrate_expression( $value, $converted_value );
					if ( ! $converted_value ) {
						continue;
					}
				}

				$layout[ $property ] = $migrated;
				$changed             = true;
				++$conversions;
			}

			if ( $changed ) {
				$style['layers'][ $index ]['layout'] = $layout;
			}
		}

		return $style;
	}

	/**
	 * Migrate token strings nested inside an expression value.
	 *
	 * Legacy zoom functions with token outputs were converted by the
	 * composer into step/interpolate expressions whose operands are still
	 * raw token strings, so expression values are walked recursively. A
	 * nested string is only replaced when it resolves to a valid token
	 * migration; all other operands are preserved. JSON objects are never
	 * entered — in decoded PHP both look like arrays, but objects include
	 * legacy stop functions (whose outputs must stay raw until the composer
	 * converts them) and format style overrides, and neither carries
	 * tokens in expression positions. Copy-on-write: the tree is only
	 * separated when something actually changes.
	 *
	 * @param mixed $value   Expression fragment.
	 * @param bool  $changed Whether any operand was converted, by reference.
	 * @return mixed
	 */
	private static function migrate_expression( $value, &$changed ) {
		if ( ! is_array( $value ) || ! array_is_list( $value ) ) {
			return $value;
		}

		foreach ( $value as $key => $item ) {
			if ( is_string( $item ) ) {
				$migrated = self::migrate_string( $item );
				if ( null !== $migrated && $migrated !== $item ) {
					$value[ $key ] = $migrated;
					$changed       = true;
				}
				continue;
			}

			if ( is_array( $item ) ) {
				$item_changed  = false;
				$migrated_item = self::migrate_expression( $item, $item_changed );
				if ( $item_changed ) {
					$value[ $key ] = $migrated_item;
					$changed       = true;
				}
			}
		}

		return $value;
	}

	/**
	 * Whether a raw style JSON body may contain legacy token strings.
	 *
	 * Cheap pre-decode gate: matches a token-capable property declared as a
	 * JSON string containing an opening brace. False negatives are not
	 * possible for well-formed values, and a false positive only costs the
	 * regular migration walk.
	 *
	 * @param string $raw_body Raw style JSON body.
	 * @return bool
	 */
	public static function raw_body_has_tokens( $raw_body ) {
		if ( ! is_string( $raw_body ) || '' === $raw_body ) {
			return false;
		}

		return 1 === preg_match( '/"(?:text-field|icon-image)"\s*:\s*"(?:[^"\\\\]|\\\\.)*\{/', $raw_body );
	}

	/**
	 * Convert one legacy token string into a style-spec expression.
	 *
	 * Supported syntax: `{token}` placeholders plus the `{{` and `}}` literal
	 * brace escapes. A single placeholder surrounded by nothing else becomes
	 * a feature lookup (for example a `name_en` placeholder becomes a get
	 * expression on that property). Mixed text and placeholders become a
	 * concat expression joining literal strings and get expressions. Strings
	 * whose braces only produce literal text are left untouched (null) so a
	 * second pass cannot misread the result as a token.
	 *
	 * @param string $value Layout property string.
	 * @return array|string|null Expression, replacement string, or null when unchanged.
	 */
	public static function migrate_string( $value ) {
		if ( false === strpos( $value, '{' ) ) {
			return null;
		}

		$length = strlen( $value );
		$parts  = array();
		$buffer = '';
		$tokens = 0;

		for ( $i = 0; $i < $length; $i++ ) {
			$char = $value[ $i ];

			if ( '{' !== $char && '}' !== $char ) {
				$buffer .= $char;
				continue;
			}

			$next = isset( $value[ $i + 1 ] ) ? $value[ $i + 1 ] : '';

			// Escaped literal braces: "{{" -> "{", "}}" -> "}".
			if ( $char === $next ) {
				$buffer .= $char;
				++$i;
				continue;
			}

			if ( '}' === $char ) {
				$buffer .= $char;
				continue;
			}

			// Token candidate: a placeholder resolving to a feature property.
			$closing = strpos( $value, '}', $i + 1 );
			if ( false === $closing ) {
				$buffer .= $char;
				continue;
			}

			$name = substr( $value, $i + 1, $closing - $i - 1 );
			if ( '' === $name || false !== strpos( $name, '{' ) || ! preg_match( '/^[A-Za-z0-9_.:-]+$/', $name ) ) {
				$buffer .= $char;
				continue;
			}

			if ( '' !== $buffer ) {
				$parts[] = $buffer;
				$buffer  = '';
			}

			$parts[] = array( 'get', $name );
			++$tokens;
			$i = $closing;
		}

		if ( '' !== $buffer ) {
			$parts[] = $buffer;
		}

		if ( 0 === $tokens ) {
			return null;
		}

		if ( 1 === $tokens && 1 === count( $parts ) ) {
			return $parts[0];
		}

		return array_merge( array( 'concat' ), $parts );
	}
}
