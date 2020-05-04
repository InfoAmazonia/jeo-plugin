import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { layerUseLabels } from './utils';
import './layers-panel.css';

export default function( {
	attributes,
	loadLayer,
	loadingLayers,
	openModal,
	renderPanel: Panel,
} ) {
	const layers = attributes.layers || [];

	return (
		<Panel name="map-layers" title={ __( 'Map layers' ) } className="jeo-layers-panel">
			{ loadingLayers ? (
				<p>{ __( 'Loading layers data...' ) }</p>
			) : (
				<ol>
					{ layers.map( ( layerSettings ) => {
						const settings = loadLayer( layerSettings );
						return settings.layer && (
							<li className="jeo-setting-layer" key={ settings.id }>
								<h2>
									{ settings.layer.title.rendered } - { settings.layer.meta.type }
								</h2>
								{ layerUseLabels[ settings.use ] }
								{ settings.use !== 'fixed' &&
									settings.default &&
									' - ' + __( 'Default' ) }
							</li>
						);
					} ) }
				</ol>
			) }
			<Button isPrimary isLarge onClick={ openModal }>
				{ __( 'Edit layers settings' ) }
			</Button>
		</Panel>
	);
}
