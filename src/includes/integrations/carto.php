<?php

namespace Jeo\Integrations;

// require __DIR__ . '/aws.phar';
require __DIR__ . '/aws/aws-autoloader.php';
use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

class Carto {
	static $GET_FILE_CONTENT_TIMEOUT = 30;
	static $GET_FILE_CONTENT_REDIRECTS = 5;

	// API settings
	static $carto_settings = [
		'username' => 'infoamazonia',
		'api_key' => '',
		'format' => 'GeoJSON'
	];

	static $mapbox_settings = [
		'username' => 'isaquegmelo',
		'api_key' => '',
	];

	private static function add_api_keys() {
		// This will be retrieved from wp options
		self::$carto_settings['api_key'] = getenv("INFOAMAZONIAAPIKEY");
		self::$mapbox_settings['api_key'] = getenv("MAPBOXAPIKEY");

		return [self::$carto_settings, self::$mapbox_settings];
	}

	public static function carto_integrate_api_callback($params) {
		$api_settings = self::add_api_keys();

		$sql_query = $params['sql_query'];

		$carto_geojson = self::get_geojson_from_sql($sql_query);
		if(self::check_for_errors($carto_geojson)) return $carto_geojson;

		$file_carto_geojson = $carto_geojson['content'];

		$credentials = self::generate_s3_credentials();
		if(self::check_for_errors($credentials)) return $credentials;

		$credentials = json_decode($credentials['content']);

		$uploud_file_state = self::uploud_file_to_s3($credentials, $file_carto_geojson);
		if(self::check_for_errors($uploud_file_state)) return $uploud_file_state;

		$uploud_status = self::uploud_to_mapbox($credentials);
		if(self::check_for_errors($uploud_status)) return $uploud_status;

		return $uploud_status;
	}

	private static function generate_s3_credentials() {
		$mapbox_settings = self::$mapbox_settings;
		$mapbox_credentials_url = "https://api.mapbox.com/uploads/v1/$mapbox_settings[username]/credentials?access_token=$mapbox_settings[api_key]";

		$credentials = self::get_file_content($mapbox_credentials_url, 'POST');

		// $credentials = [
		// 	'content' => '{"bucket":"tilestream-tilesets-production","key":"2d/_pending/gv8pp35tyq52gf1094ph5lgkc/isaquegmelo","accessKeyId":"ASIATNLVGLR2L7AE3YHR","secretAccessKey":"0bommMQgLt7/45nChZp3zwMPuQINdjMN81k6+GHT","sessionToken":"FwoGZXIvYXdzEFwaDLgOiEZxaKXFMu+xwSKcAv+W0ts94s5tiSAVuqJNvaCX6T51vwdJpYDgZgpo68iKJnVFPChUtdYY35LV7qJ0WoACxF9kRdyodrI+2nzT2VBHl0K+sFUZHq9Lt9a7tTGxh87iPBCEnDwMi9Ol6GOqyZPNlAjl70g9Mz8ZzkW1C+WGMSsqPkGbX8nW3LumITy0qiiB+PnVQPLaFsYtOwkKO1kRVjfhgbcGMO6tcd1bpXCBCWeQBEwgRydwiHP8/B6EBuytv8QZxN/GttZnqVFsLbrMrXMdAqXffyPYGKgbJk7TuXogF+/GtiVAj+iQnn+eTe2+Mucw+z52365RxRRnbu7YQYhmuD1FViDMgRKKreiK4IdjaRUrCpsSykW9J9t7FNPM/bvA1NbOnagxKNyax/wFMinM8JNd6VKU0sMQAhNv8hNuo6rp3NG6TfeNFM7BINL62KeP8MWPbyZY0g==","url":"https: //tilestream-tilesets-production.s3.amazonaws.com/2d/_pending/gv8pp35tyq52gf1094ph5lgkc/isaquegmelo"}'
		// ];

		return $credentials;
	}

	private static function uploud_file_to_s3($credentials, $geo_json_file) {
		$bucket = $credentials->bucket;
		$keyname = $credentials->key;
		$access_key_id = $credentials->accessKeyId;
		$secret_access_key = $credentials->secretAccessKey;
		$session_token = $credentials->sessionToken;

		$s3 = S3Client::factory(array(
			'version' => 'latest',
    		'region'  => 'us-east-1',
			'credentials' => array(
				'key'    => $access_key_id,     //accessKeyId
				'secret' => $secret_access_key, //secretAccessKey
				'token'  => $session_token      //sessionToken
			)
		));

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

	private static function uploud_to_mapbox($credentials) {
		$stage_file_url = $credentials->url;

		$username = self::$mapbox_settings['username'];
		$api_key = self::$mapbox_settings['api_key'];

		$url = "https://api.mapbox.com/uploads/v1/{$username}?access_token={$api_key}";
		$random_string = self::generate_string(8);

		return self::get_file_content($url, 'POST', [
			CURLOPT_POSTFIELDS => json_encode([
				"url" => $stage_file_url,
				"tileset" => $username . "." . $random_string,
				"name" => "automated-tileset-{$random_string}",
			]),
			CURLOPT_URL => $url,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_ENCODING => "",
			CURLOPT_MAXREDIRS => 10,
			CURLOPT_TIMEOUT => 30,
			CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			CURLOPT_CUSTOMREQUEST => "POST",
			CURLOPT_HTTPHEADER => [
			  "content-type: application/json"
			],
		]);
	}

	private static function get_geojson_from_sql($sql_query) {
		$sql_query = urlencode($sql_query);
		$carto_settings = self::$carto_settings;

		$carto_sql_url = "https://$carto_settings[username].carto.com/api/v2/sql?q=" . $sql_query . "&api_key=$carto_settings[api_key]&format=$carto_settings[format]";
		$result = self::get_file_content($carto_sql_url);

		return $result;
	}

	private static function get_file_content($url, $method = 'GET', $args = NULL) {
		$GET_FILE_CONTENT_REDIRECTS = self::$GET_FILE_CONTENT_REDIRECTS;
		$GET_FILE_CONTENT_TIMEOUT = self::$GET_FILE_CONTENT_TIMEOUT;
		$curl = curl_init();

		$default_args = [
			CURLOPT_URL => $url,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_ENCODING => "",
			CURLOPT_MAXREDIRS => $GET_FILE_CONTENT_REDIRECTS,
			CURLOPT_TIMEOUT => $GET_FILE_CONTENT_TIMEOUT,
			CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			CURLOPT_CUSTOMREQUEST => $method,
		];

		if(!isset($args)) {
			$args = $default_args;
		}

		curl_setopt_array($curl, $args);

		$response = curl_exec($curl);
		$err = curl_error($curl);
		$reponse_info = curl_getinfo($curl);
		curl_close($curl);

		if ($err) {
			return [
				'error' => $err
			];
		} else {
			if($reponse_info['http_code'] >= 400) {
				return [
					'error' => $response
				];
			}

			return [
				'content' => $response
			];
		}

	}

	private static function check_for_errors($get_file_content_return) {
		return isset($get_file_content_return['error']);
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
