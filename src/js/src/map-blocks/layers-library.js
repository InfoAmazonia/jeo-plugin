import { __ } from '@wordpress/i18n';
import { Button, Dashicon, TextControl } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import classNames from 'classnames';

import LayerEditor from './layer-editor';

const setLayer = ( id ) => ( { id, use: 'fixed', default: false } );

const LayersLibrary = ( {
	loadingLayers,
	loadedLayers,
	selected,
	setLayers,
} ) => {
	const [ editing, setEditing ] = useState( false );
	const [ search, setSearch ] = useState( '' );

	if ( loadingLayers ) {
		return <p>{ __( 'Loading layers data...' ) }</p>;
	}

	if ( editing ) {
		return (
			<div className="jeo-layers-library">
				<h3>{ __( 'Create a new Layer' ) }</h3>
				<LayerEditor layer={ editing } backToLibrary={ () => setEditing( false ) } />
			</div>
		);
	}

	const options = loadedLayers
		.filter( ( layer ) =>
			layer.title.rendered.toLowerCase().includes( search.toLowerCase() )
		)
		.map( ( layer ) => ( {
			...layer,
			selected: selected.some( ( settings ) => settings.id === layer.id ),
		} ) );

	return (
		<div className="jeo-layers-library">
			<div className="library-controls">
				<TextControl
					type="search"
					label={ __( 'Search for layers ' ) }
					placeholder={ __( 'Search layers' ) }
					value={ search }
					onChange={ setSearch }
				/>
				<span>{ __( 'or' ) }</span>
				<Button isPrimary isLarge onClick={ () => setEditing( true ) }>
					{ __( 'Create New Layer' ) }
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
							onClick={ () => setLayers( [ ...selected, setLayer( layer.id ) ] ) }
						>
							<Dashicon icon={ layer.selected ? 'yes-alt' : 'plus-alt' } />
							{ layer.selected ? __( 'Added' ) : __( 'Add' ) }
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
	loadingLayers: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
		'postType',
		'map-layer',
	] ),
} ) )( LayersLibrary );
