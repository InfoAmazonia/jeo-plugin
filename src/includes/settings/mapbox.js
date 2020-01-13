import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import olms from 'ol-mapbox-style';
import apply from 'ol-mapbox-style';

// let map = new Map({
//   target: 'test-ol',
//   layers: [
//     new TileLayer({
//       source: new OSM()
//     })
//   ],
//   view: new View({
//     center: [0, 0],
//     zoom: 0
//   })
// });



(function($) {

	$(function(){

		//alert(1);
		//olms('test-ol', 'https://api.mapbox.com/styles/v1/infoamazonia/ck33yfty30o0s1dqpien3edi4?access_token=' + jeo_settings.mapbox_key);
		//mapbox://styles/infoamazonia/ck3bhwd8c1mfa1cnulwdced9p
		// cjvwvumyx5i851coa874sx97e
		// mapbox://styles/infoamazonia/ck1we8l520lxb1crxzend36ca
		// mapbox://styles/infoamazonia/ck0vi3t7f0tmu1coe7f42sre8
		olms('test-ol', 'https://api.mapbox.com/styles/v1/infoamazonia/ck3bhwd8c1mfa1cnulwdced9p?access_token=' + jeo_settings.mapbox_key)
			.then( map => {
				apply(map, 'https://api.mapbox.com/styles/v1/infoamazonia/ck0vi3t7f0tmu1coe7f42sre8?access_token=' + jeo_settings.mapbox_key);
				window.map = map;
				console.log(map);
			});





	});

})(jQuery);
