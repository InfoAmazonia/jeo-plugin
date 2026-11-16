import { PluginPostStatusInfo } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { TextControl } from '../shared/wp-form-controls';

import './map-embed-url.css';

export default function MapEmbedUrl( { url } ) {
	return (
		<PluginPostStatusInfo className="jeo-embed-url">
			<span>{ __( 'Embed URL', 'jeowp' ) } </span>
			{ /* W4 §6.3: the full URL is always reachable via the native
			     tooltip while the field truncates visually. */ }
			<TextControl readOnly value={ url } title={ url } />
		</PluginPostStatusInfo>
	);
}
