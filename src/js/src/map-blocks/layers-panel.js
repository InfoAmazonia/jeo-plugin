import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { layerUseLabels } from './utils';

export default function( { attributes, loadLayer, loadingLayers, panel: Panel, setModal } ) {
	const layers = attributes.layers || [];

	return (
		<Panel title={ __( 'Map layers' ) } className="jeo-layers-panel">
			{ loadingLayers ? (
				<p>{ __( 'Loading layers data...' ) }</p>
			) : (
				<ol>
					{ layers.map( ( layerSettings ) => {
						const settings = loadLayer( layerSettings );
						return (
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
			<Button isPrimary isLarge onClick={ () => setModal( 'layers' ) }>
				{ __( 'Edit layers settings' ) }
			</Button>
		</Panel>
	);
}
