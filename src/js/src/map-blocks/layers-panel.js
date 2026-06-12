import { Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

import { layerUseLabels, loadLayer } from './utils';
import { decodeHtmlEntity } from '../shared/html';
import './layers-panel.css';

export default function ( {
	attributes,
	loadedLayers,
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
						const settings = loadLayer( loadedLayers, layerSettings );
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
										' - ' + _x( 'Default', 'layer usage default label', 'jeo' ) }
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
