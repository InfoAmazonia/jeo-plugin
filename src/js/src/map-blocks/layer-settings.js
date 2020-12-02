import {
	CheckboxControl,
	Dashicon,
	SelectControl,
} from '@wordpress/components';
import { forwardRef, useEffect, useState } from '@wordpress/element';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';

import RadioControl from './radio-control';
import { layerUseLabels } from './utils';

import './layer-settings.css';

const useOptions = [
	{ label: layerUseLabels.fixed, value: 'fixed' },
	{ label: layerUseLabels.swappable, value: 'swappable' },
	{ label: layerUseLabels.switchable, value: 'switchable' },
];

const decodeHtmlEntity = function ( str ) {
	return str.replace( /&#(\d+);/g, function ( match, dec ) {
		return String.fromCharCode( dec );
	} );
};

const LayerSettings = (
	{
		index: layerIndex,
		isDragged,
		isOutOfBounds,
		isSelected,
		removeLayer,
		settings,
		switchUseStyle,
		swapDefault,
		switchShowLegend,
		updateStyleLayers,
		switchDefault,
		updateUse,
		widths,
		...props
	},
	ref
) => {
	const classes = classNames( [
		'layer',
		{ dragging: isDragged },
		{ selected: isSelected },
		{ isoutofbounds: isOutOfBounds },
	] );

	// console.log("settings", settings);
	const [ showStyleLayers, setshowStyleLayers ] = useState( false );
	// const [ forceStateUpdate, useForceStateUpdate ] = useState( false );
	// const [ innnerSettings, setInnerSettings ] = useState( settings );

	const setWidth = ( index ) =>
		isDragged && widths.length ? { width: widths[ index ] } : {};

	// props.style.zIndex = isDragged && 320000;

	const toggleStyleLayerDisplay = ( layerId ) => {
		const newStyleLayers = settings.style_layers.map( ( styleLayer ) => {
			if ( styleLayer.id === layerId ) {
				const show = !styleLayer.show;
				return { ...styleLayer, show };
			}
			return { ...styleLayer };
		} );

		updateStyleLayers( newStyleLayers );
	};

	return (
		<Draggable
			key={ String( settings.id ) }
			draggableId={ String( settings.id ) }
			index={ layerIndex }
		>
			{ ( provided ) => (
				<div
					ref={ provided.innerRef }
					{ ...provided.draggableProps }
					{ ...provided.dragHandleProps }
					className={ classes }
				>
					<div className="handle" style={ setWidth( 0 ) }>
						<Dashicon className="drag-handle" icon="move" data-movable-handle />
					</div>
					<div className="display" style={ setWidth( 1 ) }>
						<span className="layer-title">
							{ decodeHtmlEntity( settings.layer.title.rendered ) }
						</span>{ ' ' }
						| { settings.layer.meta.type }
					</div>
					<div className="use-control" style={ setWidth( 2 ) }>
						{ layerIndex === 0 ? (
							<span>{ __( 'Base layer should be fixed', 'jeo' ) }</span>
						) : (
							<SelectControl
								label={ __( 'Type' ) }
								value={ settings.use }
								options={ useOptions }
								onChange={ updateUse }
							/>
						) }
					</div>
					<div className="default-control" style={ setWidth( 3 ) }>
						{ settings.use === 'switchable' && (
							<CheckboxControl
								label={ __( 'Should be displayed by default.' ) }
								checked={ settings.default }
								onChange={ switchDefault }
							/>
						) }
						{ settings.use === 'swappable' && (
							<RadioControl
								label={ __( 'Should be displayed by default.' ) }
								checked={ settings.default }
								onChange={ swapDefault }
							/>
						) }
					</div>

					<div className="default-control" style={ setWidth( 4 ) }>
						{ settings.layer.meta.type === 'mapbox' && (
							<RadioControl
								label={ __( 'Load interactions' ) }
								checked={ settings.load_as_style }
								onChange={ switchUseStyle }
							/>
						) }
					</div>

					<div className="default-control" style={ setWidth( 5 ) }>
						{ ! settings.layer.meta.use_legend && (
							<p>
								<em>No Legend</em>
							</p>
						) }
						{ settings.layer.meta.use_legend && (
							<CheckboxControl
								label={ __( 'Show legend' ) }
								checked={ settings.show_legend }
								onChange={ switchShowLegend }
							/>
						) }
					</div>
					<div className="layer-actions" style={ setWidth( 6 ) }>
						{ settings.load_as_style && (
							<button
								onClick={ () => setshowStyleLayers( ! showStyleLayers ) }
								className="show-style-layers"
							>
								{ ! showStyleLayers && (
									<svg
										aria-hidden="true"
										focusable="false"
										data-prefix="fas"
										data-icon="chevron-down"
										role="img"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 448 512"
									>
										<path
											fill="currentColor"
											d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
										></path>
									</svg>
								) }
								{ showStyleLayers && (
									<svg
										aria-hidden="true"
										focusable="false"
										data-prefix="fas"
										data-icon="chevron-up"
										role="img"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 448 512"
									>
										<path
											fill="currentColor"
											d="M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z"
										></path>
									</svg>
								) }
							</button>
						) }
						<a
							href={ `/wp-admin/post.php?post=${ settings.id }&action=edit` }
							target="_blank"
							rel="noopener noreferrer"
						>
							<Dashicon icon="welcome-write-blog" />
						</a>
						<Dashicon icon="dismiss" onClick={ removeLayer } />
					</div>

					{ settings.load_as_style && showStyleLayers && (
						<>
							<div className="informative-message">
								{ __("If the layer is not visible inside Mapbox Studio we will not be able to control the displayment. ", "jeo") }
							</div>

							<div className="layers-selector">
								{ settings.style_layers &&
									settings.style_layers.map( ( styleLayer ) => {
										return (
											<div key={ styleLayer.id } className="style-layer">
												<button
													onClick={ () =>
														toggleStyleLayerDisplay( styleLayer.id )
													}
													className={
														styleLayer.show
															? 'toggle-button active'
															: 'toggle-button'
													}
												>
													{ styleLayer.show ? (
														<svg
															aria-hidden="true"
															focusable="false"
															data-prefix="fas"
															data-icon="toggle-on"
															role="img"
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 576 512"
														>
															<path
																fill="currentColor"
																d="M384 64H192C86 64 0 150 0 256s86 192 192 192h192c106 0 192-86 192-192S490 64 384 64zm0 320c-70.8 0-128-57.3-128-128 0-70.8 57.3-128 128-128 70.8 0 128 57.3 128 128 0 70.8-57.3 128-128 128z"
															></path>
														</svg>
													) : (
														<svg
															aria-hidden="true"
															focusable="false"
															data-prefix="fas"
															data-icon="toggle-off"
															role="img"
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 576 512"
														>
															<path
																fill="currentColor"
																d="M384 64H192C85.961 64 0 149.961 0 256s85.961 192 192 192h192c106.039 0 192-85.961 192-192S490.039 64 384 64zM64 256c0-70.741 57.249-128 128-128 70.741 0 128 57.249 128 128 0 70.741-57.249 128-128 128-70.741 0-128-57.249-128-128zm320 128h-48.905c65.217-72.858 65.236-183.12 0-256H384c70.741 0 128 57.249 128 128 0 70.74-57.249 128-128 128z"
															></path>
														</svg>
													) }
													<span className="style-layer-title">
														{ styleLayer.id }
													</span>
												</button>
											</div>
										);
									} ) }
							</div>
						</>
					) }
				</div>
			) }
		</Draggable>
	);
};

export default LayerSettings;
