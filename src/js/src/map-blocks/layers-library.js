import { __ } from '@wordpress/i18n';
import { Button, Dashicon, TextControl } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import classNames from 'classnames';

const setLayer = ( id ) => ( { id, use: 'fixed', default: false } );

const LayersLibrary = ( {
	loadingLayers,
	loadedLayers,
	attributes,
	setAttributes,
} ) => {
	const [ editing, setEditing ] = useState( false );
	const [ search, setSearch ] = useState( '' );
	const setLayers = ( layers ) => setAttributes( { ...attributes, layers } );

	if ( loadingLayers ) {
		return <p>{ __( 'Loading layers data...', 'jeo' ) }</p>;
	}

	const options = loadedLayers
		.filter( ( layer ) =>
			layer.title.rendered.toLowerCase().includes( search.toLowerCase() )
		)
		.map( ( layer ) => ( {
			...layer,
			selected: attributes.layers.some(
				( settings ) => settings.id === layer.id
			),
		} ) );

	return (
		<div className="jeo-layers-library">
			<div className="library-controls">
				<TextControl
					type="search"
					label={ __( 'Search for layers ', 'jeo' ) }
					placeholder={ __( 'Search layers', 'jeo' ) }
					value={ search }
					onChange={ setSearch }
				/>
				<span>{ __( 'or', 'jeo' ) }</span>
				<Button isPrimary isLarge onClick={ () => setEditing( true ) }>
					{ __( 'Create New Layer', 'jeo' ) }
				</Button>
			</div>
			<div className="available-layers">
				{ options.map( ( layer ) => (
					<div className="layer" key={ layer.id }>
						<button
							className={ classNames( [
								'layer-button',
								layer.selected ? 'layer-added' : 'layer-add',
							] ) }
							disabled={ layer.selected }
							onClick={ () =>
								setLayers( [ ...attributes.layers, setLayer( layer.id ) ] )
							}
						>
							<Dashicon icon={ layer.selected ? 'yes-alt' : 'plus-alt' } />
							{ layer.selected ? __( 'Added', 'jeo' ) : __( 'Add', 'jeo' ) }
						</button>
						<div className="layer-description">
							<h3>
								<span className="layer-name">{ layer.title.rendered }</span>
								<span className="layer-type"> | { layer.meta.type }</span>
							</h3>
							<p>{ layer.meta.url }</p>
						</div>
						<div className="edit-layer">
							<Dashicon
								icon="welcome-write-blog"
								onClick={ () => setEditing( layer.id ) }
							/>
						</div>
					</div>
				) ) }
			</div>
		</div>
	);
};

export default withSelect( ( select ) => ( {
	loadedLayers: select( 'core' ).getEntityRecords( 'postType', 'map-layer' ),
	loadingLayers: select( 'core/data' ).isResolving(
		'core',
		'getEntityRecords',
		[ 'postType', 'map-layer' ]
	),
} ) )( LayersLibrary );
