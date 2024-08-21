<?php

namespace Jeo\Integrations;

// require __DIR__ . '/aws.phar';
require __DIR__ . '/aws/aws-autoloader.php';
use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

class Carto {
	// API settings
	static $carto_settings = [
		'username' => '',
		'api_key' => '',
		'format' => 'GeoJSON'
	];

	static $mapbox_settings = [
		'username' => '',
		'api_key' => '',
	];

	private static function add_api_keys() {
		self::$carto_settings['api_key'] = \jeo_settings()->get_option( 'carto_key' );
		self::$mapbox_settings['api_key'] = \jeo_settings()->get_option( 'mapbox_private_key' );

		return [self::$carto_settings, self::$mapbox_settings];
	}

	private static function add_api_usernames() {
		self::$carto_settings['username'] = \jeo_settings()->get_option( 'carto_username' );
		self::$mapbox_settings['username'] = \jeo_settings()->get_option( 'mapbox_username' );

		return [self::$carto_settings, self::$mapbox_settings];
	}

	private static function setup_settings() {
		self::add_api_keys();
		self::add_api_usernames();

		return [self::$carto_settings, self::$mapbox_settings];
	}

	public static function carto_integrate_api_callback($params) {
		$api_settings = self::setup_settings();

		$sql_query = $params['sql_query'];
		$previous_tileset_id = $params['tileset_id'];

		$carto_geojson = self::get_geojson_from_sql($sql_query);
		if (self::is_http_error($carto_geojson)) return $carto_geojson;

		$file_carto_geojson = $carto_geojson['content'];

		$credentials = self::generate_s3_credentials();
		if (self::is_http_error($credentials)) return $credentials;

		$credentials = json_decode($credentials['content']);

		$uploud_file_state = self::uploud_file_to_s3($credentials, $file_carto_geojson);
		if (self::is_http_error($uploud_file_state)) return $uploud_file_state;

		// recurrent (wp cron)
		if (isset($params['tileset']) && $params['tileset']) {
			$uploud_status = self::uploud_to_mapbox($credentials, ['tileset' => $params['tileset'], 'title' => $params['title' ] ] );
		} else {
			$uploud_status = self::uploud_to_mapbox($credentials);
		}

		if (self::is_http_error($uploud_status)) return $uploud_status;


		$change_tileset_privacy = self::change_tileset_status($uploud_status['tileset']);
		if (self::is_http_error($change_tileset_privacy)) return $change_tileset_privacy;

		return $uploud_status;
	}

	private static function change_tileset_status($tileset_id) {
		$mapbox_settings = self::$mapbox_settings;
		$legacy_api_url = "https://api.mapbox.com/api/Map/$tileset_id?access_token=$mapbox_settings[api_key]";

		$body = json_encode([
			"tileset" => $tileset_id,
			"private" => false,
			"status" => "available",
			"_type" => "tileset",
		]);

		self::do_http_request('POST', $legacy_api_url, [
			'body' => $body,
			'headers' => [
				'Content-Type' => 'application/json',
			],
			'redirection' => 10,
			'timeout' => 30,
		]);
	}

	private static function generate_s3_credentials() {
		$mapbox_settings = self::$mapbox_settings;
		$mapbox_credentials_url = "https://api.mapbox.com/uploads/v1/$mapbox_settings[username]/credentials?access_token=$mapbox_settings[api_key]";

		$credentials = self::do_http_request('POST', $mapbox_credentials_url);

		return $credentials;
	}

	private static function uploud_file_to_s3($credentials, $geo_json_file) {
		$bucket = $credentials->bucket;
		$keyname = $credentials->key;
		$access_key_id = $credentials->accessKeyId;
		$secret_access_key = $credentials->secretAccessKey;
		$session_token = $credentials->sessionToken;

		$s3 = new S3Client([
			'version' => 'latest',
    		'region'  => 'us-east-1',
			'credentials' => [
				'key'    => $access_key_id,     //accessKeyId
				'secret' => $secret_access_key, //secretAccessKey
				'token'  => $session_token      //sessionToken
			],
		]);

		try {
			// Upload data.
			$result = $s3->putObject([
				'Bucket' => $bucket,
				'Key'    => $keyname,
				'Body'   => $geo_json_file,
			]);

			return ['url' => $result['ObjectURL']];
		} catch (S3Exception $e) {
			return ['error' => $e ];
		}
	}

	private static function uploud_to_mapbox($credentials, $args = null) {
		$stage_file_url = $credentials->url;

		$username = self::$mapbox_settings['username'];
		$api_key = self::$mapbox_settings['api_key'];

		$url = "https://api.mapbox.com/uploads/v1/{$username}?access_token={$api_key}";
		$random_string = self::generate_string(8);

		$body = json_encode([
			"url" => $stage_file_url,
			"tileset" => (isset($args)? $args['tileset'] : $username . "." . $random_string),
			"name" => (isset($args)? $args['title'] : "automated-tileset-{$random_string}"),
			// "private" => false, ENDPOINT BUG
		]);

		return self::do_http_request('POST', $url, [
			'body' => $body,
			'headers' => [
				'Content-Type' => 'application/json',
			],
			'redirection' => 10,
			'timeout' => 30,
		]);
	}

	private static function get_geojson_from_sql($sql_query) {
		$sql_query = urlencode($sql_query);
		$carto_settings = self::$carto_settings;

		$carto_sql_url = "https://$carto_settings[username].carto.com/api/v2/sql?q=" . $sql_query . "&api_key=$carto_settings[api_key]&format=$carto_settings[format]";

		$result = self::do_http_request('GET', $carto_sql_url);

		return $result;
	}

	private static function do_http_request(string $method, string $url, array $args = []) {
		$parsed_args = wp_parse_args($args, [
			'headers' => [],
			'httpversion' => '1.1',
			'method' => $method,
			'redirection' => 5,
			'timeout' => 160,
		]);

		$response = wp_remote_request($url, $parsed_args);

		$http_status = wp_remote_retrieve_response_code($response);
		$body = wp_remote_retrieve_body($response);

		if ($http_status >= 400) {
			return [ 'error' => $body ];
		} else {
			return [ 'content' => $body ];
		}
	}

	private static function is_http_error($http_request_return) {
		return isset($http_request_return['error']);
	}

	private static function generate_string($strength = 16) {
		$input = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		$input_length = strlen($input);
		$random_string = '';
		for($i = 0; $i < $strength; $i++) {
			$random_character = $input[mt_rand(0, $input_length - 1)];
			$random_string .= $random_character;
		}

		return $random_string;
	}

}

function carto_integration_cron_scheduler() {
	if (!wp_next_scheduled ( 'carto_update_layers' )) {
		wp_schedule_event(time(), \jeo_settings()->get_option( 'carto_update_time' ), 'carto_update_layers');
	}

	// wp_clear_scheduled_hook('Jeo\Integrations\carto_integration_update_task');

}

add_action( 'carto_update_layers', 'Jeo\Integrations\carto_integration_update_task' );

function carto_integration_update_task() {
	$args = [
		'post_type' => 'map-layer',
		'meta_key'   => 'use_carto_integration',
		'meta_value' => true
	];

	$required_posts = new \WP_Query($args);
	//var_dump($required_posts->post_count);

	if ( $required_posts->have_posts() ) {
		while ( $required_posts->have_posts() ) {
			$required_posts->the_post();
			$carto_integration_sql = get_post_meta( get_the_ID(), 'carto_integration_sql', true );
			$layer_type_options = get_post_meta( get_the_ID(), 'layer_type_options', true );

			if (empty($carto_integration_sql) || (isset($layer_type_options['tileset_id']) && empty($layer_type_options['tileset_id']))) {
				return;
			}

			$params = [
				'sql_query' => $carto_integration_sql,
				'tileset' => $layer_type_options['tileset_id'],
				'title' => $layer_type_options['source_layer'],
			];

			\Jeo\Integrations\Carto::carto_integrate_api_callback($params);
		}
	}
	/* Restore original Post Data */
	wp_reset_postdata();

	// echo "Esse e o resultado do cron";
}

add_action('init', 'Jeo\Integrations\carto_integration_cron_scheduler');


add_filter( 'cron_schedules', 'Jeo\Integrations\add_custom_invervals' );

function add_custom_invervals( $schedules ) {
    $schedules['five_minutes'] = array(
        'interval' => 100,
		'display'  => esc_html__( 'Every Five Minutes' ), );

	$schedules['monthly'] = array(
		'interval' => 2678400,
		'display'  => esc_html__( 'Monthly' ), );
    return $schedules;
}
