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
			title={ __( 'Map layers', 'jeowp' ) }
			className="jeo-layers-panel"
		>
			{ loadingLayers ? (
				<p>{ __( 'Loading layers data...', 'jeowp' ) }</p>
			) : (
				<ol>
					{ layers.map( ( layerSettings ) => {
						const settings = loadLayer( loadedLayers, layerSettings );
						const attribution = settings.layer?.meta?.attribution || '';
						const themes = layerSettings.themes || settings.layer?.meta?.themes || '';
						return (
							settings.layer && (
								<li className="jeo-setting-layer" key={ settings.id }>
									<h2>
										{ decodeHtmlEntity( settings.layer.title.rendered ) } -{ ' ' }
										{ settings.layer.meta.type }
									</h2>
									{ layerSettings.reason && (
										<p className="jeo-layer-reason">{ layerSettings.reason }</p>
									) }
									{ themes && (
										<p className="jeo-layer-meta">
											<strong>{ __( 'Themes:', 'jeowp' ) }</strong> { themes }
										</p>
									) }
									{ attribution && (
										<p className="jeo-layer-meta">
											<strong>{ __( 'Source:', 'jeowp' ) }</strong> { attribution }
										</p>
									) }
									{ layerUseLabels[ settings.use ] }
									{ settings.use !== 'fixed' &&
										settings.default &&
										' - ' + _x( 'Default', 'layer usage default label', 'jeowp' ) }
								</li>
							)
						);
					} ) }
				</ol>
			) }
			<Button variant="primary" isLarge onClick={ openModal }>
				{ __( 'Edit layers settings', 'jeowp' ) }
			</Button>
		</Panel>
	);
}
