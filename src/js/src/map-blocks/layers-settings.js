import { __ } from '@wordpress/i18n';
import {
	CheckboxControl,
	Dashicon,
	SelectControl,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import classNames from 'classnames';
import { List, arrayMove } from 'react-movable';

const useOptions = [
	{ label: __( 'Fixed' ), value: 'fixed' },
	{ label: __( 'Swappable' ), value: 'swappable' },
	{ label: __( 'Switchable' ), value: 'switchable' },
];

const LayerSettings = forwardRef(
	(
		{
			isDragged,
			settings,
			swapDefault,
			switchDefault,
			updateUse,
			widths,
			...props
		},
		ref
	) => {
		const classes = classNames( [ 'layer', { dragging: isDragged } ] );
		const setWidth = ( index ) =>
			isDragged && widths.length ? { width: widths[ index ] } : {};
		props.style.zIndex = isDragged && 320000;

		return (
			<tr { ...props } ref={ ref } className={ classes }>
				<td className="handle" style={ setWidth( 0 ) }>
					<Dashicon className="drag-handle" icon="move" data-movable-handle />
				</td>
				<td className="display" style={ setWidth( 1 ) }>
					<span className="layer-title">{ settings.layer.title.rendered }</span> |{ ' ' }
					{ settings.layer.meta.type }
				</td>
				<td className="use-control" style={ setWidth( 2 ) }>
					<SelectControl
						label={ __( 'Type' ) }
						value={ settings.use }
						options={ useOptions }
						onChange={ updateUse }
					/>
				</td>
				<td className="default-control" style={ setWidth( 3 ) }>
					{ settings.use === 'switchable' && (
						<CheckboxControl
							label={ __( 'Should be displayed by default.' ) }
							checked={ settings.default }
							onChange={ switchDefault }
						/>
					) }
					{ settings.use === 'swappable' && (
						<CheckboxControl
							label={ __( 'Should be displayed by default.' ) }
							help={ __( 'Only one swappable layer is displayed by default.' ) }
							checked={ settings.default }
							onChange={ swapDefault }
						/>
					) }
				</td>
			</tr>
		);
	}
);

const layerLoader = ( layers ) => {
	const layersMap = Object.fromEntries( layers.map( ( l ) => [ l.id, l ] ) );
	return ( settings ) => ( { ...settings, layer: layersMap[ settings.id ] } );
};

export default ( { loadingLayers, layers, selected, setLayers } ) => {
	if ( loadingLayers ) {
		return <p>Loading</p>;
	}
	if ( ! selected.length ) {
		return <p>{ __( 'No layers have been selected for this map.' ) } </p>;
	}

	const loadLayer = layerLoader( layers );
	let widths = [];

	return (
		<List
			values={ selected }
			beforeDrag={ ( { elements, index } ) => {
				const cells = Array.from( elements[ index ].children );
				widths = cells.map( ( cell ) => window.getComputedStyle( cell ).width );
			} }
			onChange={ ( { oldIndex, newIndex } ) =>
				setLayers( arrayMove( selected, oldIndex, newIndex ) )
			}
			renderList={ ( { children, isDragged, props } ) => (
				<table className={ classNames( [ 'jeo-layers-list', { isDragged } ] ) }>
					<tbody { ...props }>{ children }</tbody>
				</table>
			) }
			renderItem={ ( { value, props, ...meta } ) => {
				const switchDefault = ( def ) =>
					setLayers(
						selected.map( ( settings ) =>
							settings.id === value.id ?
								{ ...settings, default: def } :
								settings
						)
					);
				const swapDefault = ( def ) =>
					def && // radio-like behavior: can only be turned on.
					setLayers(
						selected.map( ( settings ) => ( {
							...settings,
							default:
								settings.use === 'swappable' ? // update only the swappable layers
									settings.id === value.id : // radio-like behavior: turn off all other swappable layers
									settings.default,
						} ) )
					);
				const updateUse = ( use ) =>
					setLayers(
						selected.map( ( settings ) =>
							settings.id === value.id ?
								{
									...settings,
									use,
									default:
											use === 'swappable' ? // if there's already a default swappable, turn off
												! selected.some(
													( s ) => s.use === 'swappable' && s.default
												  ) :
												settings.default,
								  } :
								settings
						)
					);
				const row = (
					<LayerSettings
						widths={ widths }
						settings={ loadLayer( value ) }
						switchDefault={ switchDefault }
						swapDefault={ swapDefault }
						updateUse={ updateUse }
						{ ...meta } // includes isDragged
						{ ...props }
					/>
				);
				return meta.isDragged ? (
					<table className="jeo-layers-list dragging" style={ props.style }>
						<tbody>{ row }</tbody>
					</table>
				) : (
					row
				);
			} }
		/>
	);
};
