<?php

namespace Jeo;

class Settings {

	use Singleton;

	public $option_key = 'jeo-settings';

	protected function init() {

		$this->default_options = [
			'enabled_post_types' => [
				'post'
			],
			'active_geocode' => 'nominatim'
		];

	}

	public function get_option( $option_name ) {
		$options = get_option($this->option_key);
		if (!$options) {
			$options = [];
		}
		$options = array_merge($this->default_options, $options);
		if ( isset($options[$option_name]) ) {
			return $options[$option_name];
		}
		return null;
	}


}
