import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { layerUseLabels } from './utils';
import './layers-panel.css';

const decodeHtmlEntity = function ( str ) {
	return str.replace( /&#(\d+);/g, function ( match, dec ) {
		return String.fromCharCode( dec );
	} );
};

export default function ( {
	attributes,
	loadLayer,
	loadingLayers,
	openModal,
	renderPanel: Panel,
} ) {
	const layers = attributes.layers || [];

	return (
		<Panel
			name="map-layers"
			title={ __( 'Map layers', 'jeo' ) }
			className="jeo-layers-panel"
		>
			{ loadingLayers ? (
				<p>{ __( 'Loading layers data...', 'jeo' ) }</p>
			) : (
				<ol>
					{ layers.map( ( layerSettings ) => {
						const settings = loadLayer( layerSettings );
						return (
							settings.layer && (
								<li className="jeo-setting-layer" key={ settings.id }>
									<h2>
										{ decodeHtmlEntity( settings.layer.title.rendered ) } -{ ' ' }
										{ settings.layer.meta.type }
									</h2>
									{ layerUseLabels[ settings.use ] }
									{ settings.use !== 'fixed' &&
										settings.default &&
										' - ' + __( 'Default', 'jeo' ) }
								</li>
							)
						);
					} ) }
				</ol>
			) }
			<Button variant="primary" isLarge onClick={ openModal }>
				{ __( 'Edit layers settings', 'jeo' ) }
			</Button>
		</Panel>
	);
}
