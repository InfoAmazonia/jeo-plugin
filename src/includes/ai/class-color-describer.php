<?php
/**
 * Color describer utility for RAG layer embeddings.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Converts hex colors into human-readable descriptions for RAG embeddings.
 */
class Color_Describer {

	/**
	 * Hue name lookup table.
	 *
	 * @var array<int, array{0: int, 1: string|null}>
	 */
	private static array $hue_names = array(
		array( 0, 'red' ),
		array( 15, 'orange' ),
		array( 40, 'yellow' ),
		array( 65, 'yellow-green' ),
		array( 80, 'green' ),
		array( 160, 'cyan' ),
		array( 190, 'blue' ),
		array( 250, 'purple' ),
		array( 290, 'magenta' ),
		array( 335, 'red' ),
		array( 361, null ),
	);

	/**
	 * Describe a single hex color in human-readable terms.
	 *
	 * @param string $hex Hex color code (with or without #).
	 * @return string Human-readable color description.
	 */
	public static function describe( string $hex ): string {
		$hex = ltrim( $hex, '#' );

		if ( strlen( $hex ) === 3 ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		if ( ! preg_match( '/^[0-9a-fA-F]{6}$/', $hex ) ) {
			return '';
		}

		$r = hexdec( substr( $hex, 0, 2 ) ) / 255;
		$g = hexdec( substr( $hex, 2, 2 ) ) / 255;
		$b = hexdec( substr( $hex, 4, 2 ) ) / 255;

		$max = max( $r, $g, $b );
		$min = min( $r, $g, $b );
		$l   = ( $max + $min ) / 2;

		if ( $max === $min ) {
			$s = 0;
			$h = 0;
		} else {
			$d = $max - $min;
			$s = $l > 0.5 ? $d / ( 2 - $max - $min ) : $d / ( $max + $min );

			if ( $max === $r ) {
				$h = ( ( $g - $b ) / $d + ( $g < $b ? 6 : 0 ) ) * 60;
			} elseif ( $max === $g ) {
				$h = ( ( $b - $r ) / $d + 2 ) * 60;
			} else {
				$h = ( ( $r - $g ) / $d + 4 ) * 60;
			}
		}

		$hue_name = self::hue_name( $h );
		$light    = self::lightness_label( $l );
		$sat      = self::saturation_label( $s );

		return trim( "{$light} {$sat} {$hue_name}" );
	}

	/**
	 * Describe the overall characteristics of a color palette.
	 *
	 * @param array $hex_colors Array of hex color codes.
	 * @return string Palette description.
	 */
	public static function describe_palette( array $hex_colors ): string {
		if ( empty( $hex_colors ) ) {
			return '';
		}

		$warm  = 0;
		$cool  = 0;
		$vivid = 0;
		$muted = 0;
		$light = 0;
		$dark  = 0;

		foreach ( $hex_colors as $hex ) {
			$hsl = self::hex_to_hsl( $hex );
			if ( ! $hsl ) {
				continue;
			}

			$temp = self::temperature( $hsl[0] );
			if ( 'warm' === $temp ) {
				++$warm;
			} elseif ( 'cool' === $temp ) {
				++$cool;
			}

			if ( $hsl[1] > 0.5 ) {
				++$vivid;
			} else {
				++$muted;
			}

			if ( $hsl[2] > 0.6 ) {
				++$light;
			} elseif ( $hsl[2] < 0.35 ) {
				++$dark;
			}
		}

		$parts = array();

		if ( $warm > $cool ) {
			$parts[] = 'warm';
		} elseif ( $cool > $warm ) {
			$parts[] = 'cool';
		} else {
			$parts[] = 'mixed warm/cool';
		}

		if ( $vivid > $muted ) {
			$parts[] = 'mostly vivid';
		} elseif ( $muted > $vivid ) {
			$parts[] = 'mostly muted';
		}

		if ( $dark > $light ) {
			$parts[] = 'darker tones';
		} elseif ( $light > $dark ) {
			$parts[] = 'lighter tones';
		} else {
			$parts[] = 'balanced tones';
		}

		return implode( ', ', $parts );
	}

	/**
	 * Convert a hex color to HSL values.
	 *
	 * @param string $hex Hex color code.
	 * @return array|null Array with [hue, saturation, lightness] or null on failure.
	 */
	private static function hex_to_hsl( string $hex ): ?array {
		$hex = ltrim( $hex, '#' );

		if ( strlen( $hex ) === 3 ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		if ( ! preg_match( '/^[0-9a-fA-F]{6}$/', $hex ) ) {
			return null;
		}

		$r = hexdec( substr( $hex, 0, 2 ) ) / 255;
		$g = hexdec( substr( $hex, 2, 2 ) ) / 255;
		$b = hexdec( substr( $hex, 4, 2 ) ) / 255;

		$max = max( $r, $g, $b );
		$min = min( $r, $g, $b );
		$l   = ( $max + $min ) / 2;

		if ( $max === $min ) {
			return array( 0, 0, $l );
		}

		$d = $max - $min;
		$s = $l > 0.5 ? $d / ( 2 - $max - $min ) : $d / ( $max + $min );

		if ( $max === $r ) {
			$h = ( ( $g - $b ) / $d + ( $g < $b ? 6 : 0 ) ) * 60;
		} elseif ( $max === $g ) {
			$h = ( ( $b - $r ) / $d + 2 ) * 60;
		} else {
			$h = ( ( $r - $g ) / $d + 4 ) * 60;
		}

		return array( $h, $s, $l );
	}

	/**
	 * Get a human-readable name for a hue angle.
	 *
	 * @param float $h Hue angle in degrees.
	 * @return string Hue name.
	 */
	private static function hue_name( float $h ): string {
		foreach ( self::$hue_names as $entry ) {
			if ( $h < $entry[0] ) {
				return $entry[1];
			}
		}
		return 'red';
	}

	/**
	 * Get a human-readable label for a lightness value.
	 *
	 * @param float $l Lightness value (0-1).
	 * @return string Lightness label.
	 */
	private static function lightness_label( float $l ): string {
		if ( $l < 0.2 ) {
			return 'very dark';
		}
		if ( $l < 0.35 ) {
			return 'dark';
		}
		if ( $l > 0.85 ) {
			return 'very light';
		}
		if ( $l > 0.65 ) {
			return 'light';
		}
		return 'medium';
	}

	/**
	 * Get a human-readable label for a saturation value.
	 *
	 * @param float $s Saturation value (0-1).
	 * @return string Saturation label.
	 */
	private static function saturation_label( float $s ): string {
		if ( $s < 0.1 ) {
			return 'gray';
		}
		if ( $s < 0.3 ) {
			return 'muted';
		}
		if ( $s > 0.8 ) {
			return 'vivid';
		}
		return '';
	}

	/**
	 * Classify a hue angle as warm, cool, or neutral.
	 *
	 * @param float $h Hue angle in degrees.
	 * @return string Temperature classification.
	 */
	private static function temperature( float $h ): string {
		if ( $h < 15 || $h > 345 ) {
			return 'warm';
		}
		if ( $h < 45 ) {
			return 'warm';
		}
		if ( $h < 70 ) {
			return 'warm';
		}
		if ( $h >= 180 && $h < 270 ) {
			return 'cool';
		}
		return 'neutral';
	}
}
