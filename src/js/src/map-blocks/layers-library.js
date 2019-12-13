import { __ } from '@wordpress/i18n';
import { Button, Dashicon, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import classNames from 'classnames';

export default ( { layers, selected, setLayers, onCreateLayer } ) => {
	const [ search, setSearch ] = useState( '' );
	const options = layers
		.filter( ( layer ) =>
			layer.title.rendered.toLowerCase().includes( search.toLowerCase() )
		)
		.map( ( layer ) => ( { ...layer, selected: selected.includes( layer.id ) } ) );

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
				<Button isPrimary isLarge onClick={ onCreateLayer }>
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
							onClick={ () => setLayers( [ ...selected, layer.id ] ) }
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
					</div>
				) ) }
			</div>
		</div>
	);
};
