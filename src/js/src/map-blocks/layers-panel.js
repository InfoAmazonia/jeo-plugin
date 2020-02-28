import { __ } from '@wordpress/i18n';
import { Button, PanelBody } from '@wordpress/components';
import { layerUseLabels } from './utils';

export default ( { attributes, loadLayer, loadingLayers, setModal } ) => (
	<PanelBody title={ __( 'Map layers' ) } className="jeo-layers-panel">
		{ loadingLayers ? (
			<p>{ __( 'Loading layers data...' ) }</p>
		) : (
			<ol>
				{ attributes.layers.map( ( layerSettings ) => {
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
		<Button isPrimary isLarge onClick={ () => setModal( 'library' ) }>
			{ __( 'Add or remove layers' ) }
		</Button>
	</PanelBody>
);
