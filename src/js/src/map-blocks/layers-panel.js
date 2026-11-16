import { Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

import { layerUseLabels, loadLayer } from './utils';
import { decodeHtmlEntity, decodeHtmlEntities, sanitizeHtml } from '../shared/html';
import LayerOriginBadge, {
	getLayerOrigin,
	shouldShowManualBadge,
} from '../shared/layer-origin-badge';
import './layers-panel.css';

export default function ( {
	attributes,
	loadedLayers,
	loadingLayers,
	openModal,
	renderPanel: Panel,
} ) {
	const layers = attributes.layers || [];
	const origins = layers.map( ( layerSettings ) => {
		const settings = loadLayer( loadedLayers, layerSettings );
		return getLayerOrigin( {
			instance: layerSettings,
			record: settings.layer || {},
		} );
	} );
	const showManual = shouldShowManualBadge( origins );

	return (
		<Panel
			name="map-layers"
			title={ __( 'Map layers', 'jeowp' ) }
			className="jeo-layers-panel"
		>
			{ loadingLayers ? (
				<p role="status" aria-live="polite">
					{ __( 'Loading layers data...', 'jeowp' ) }
				</p>
			) : (
				<>
					{ /* W4 §4: explicit empty state (message + existing action). */ }
					{ layers.length === 0 && (
						<p className="jeo-layers-panel__empty">
							{ __(
								'No layers have been added to this map.',
								'jeowp'
							) }
						</p>
					) }
					<ol>
					{ layers.map( ( layerSettings, index ) => {
						const settings = loadLayer( loadedLayers, layerSettings );
						const attribution = settings.layer?.meta?.attribution || '';
						const themes = layerSettings.themes || settings.layer?.meta?.themes || '';
						const description = settings.layer?.excerpt?.rendered || settings.layer?.content?.rendered || '';
						return (
							settings.layer && (
								<li className="jeo-setting-layer" key={ settings.id }>
									<h2>
										{ decodeHtmlEntity( settings.layer.title.rendered ) }
										<LayerOriginBadge
											origin={ origins[ index ] }
											showManual={ showManual }
										/>{ ' ' }
										— { settings.layer.meta.type }
									</h2>
									{ description && (
										<p className="jeo-layer-description">
											{ decodeHtmlEntities( description.replace( /<[^>]+>/g, '' ) ) }
										</p>
									) }
									{ layerSettings.reason && (
										<p className="jeo-layer-reason">{ layerSettings.reason }</p>
									) }
									{ layerSettings.auto_style && (
										<p className="jeo-layer-autostyle">
											{ __(
												'Automatic style applied (this layer had no saved style). Edit layer settings to customize it.',
												'jeowp'
											) }
										</p>
									) }
									{ themes && (
										<p className="jeo-layer-meta">
											<strong>{ __( 'Themes:', 'jeowp' ) }</strong> { themes }
										</p>
									) }
									{ attribution && (
										<p className="jeo-layer-meta">
											<strong>{ __( 'Source:', 'jeowp' ) }</strong>{ ' ' }
											<span dangerouslySetInnerHTML={ { __html: sanitizeHtml( attribution ) } } />
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
				</>
			) }
			<Button variant="primary" isLarge onClick={ openModal }>
				{ __( 'Edit layers settings', 'jeowp' ) }
			</Button>
		</Panel>
	);
}
