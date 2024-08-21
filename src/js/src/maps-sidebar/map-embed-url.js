import { TextControl } from '@wordpress/components';
import { PluginPostStatusInfo } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

import './map-embed-url.css';

export default function MapEmbedUrl( { url } ) {
	return (
		<PluginPostStatusInfo className="jeo-embed-url">
			<span>{ __( 'Embed URL', 'jeo' ) } </span>
			<TextControl readOnly value={ url } />
		</PluginPostStatusInfo>
	);
}
