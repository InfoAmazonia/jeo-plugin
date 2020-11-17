import {
	CheckboxControl,
	Dashicon,
	SelectControl,
} from '@wordpress/components';
import { forwardRef, useEffect } from '@wordpress/element';
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

export default forwardRef(
	(
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

		console.log("settings", settings);

		const setWidth = ( index ) =>
			isDragged && widths.length ? { width: widths[ index ] } : {};
		props.style.zIndex = isDragged && 320000;

		return (
			settings.layer && (
				<tr ref={ ref } className={ classes } style={ props.style }>
					<td className="handle" style={ setWidth( 0 ) }>
						<Dashicon className="drag-handle" icon="move" data-movable-handle />
					</td>
					<td className="display" style={ setWidth( 1 ) }>
						<span className="layer-title">
							{ decodeHtmlEntity( settings.layer.title.rendered ) }
						</span>{ ' ' }
						| { settings.layer.meta.type }
					</td>
					<td className="use-control" style={ setWidth( 2 ) }>
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
							<RadioControl
								label={ __( 'Should be displayed by default.' ) }
								checked={ settings.default }
								onChange={ swapDefault }
							/>
						) }
					</td>

					<td className="default-control" style={ setWidth( 3 ) }>
						{ settings.layer.meta.type === 'mapbox' &&
							<CheckboxControl
								label={ __( 'Load as style' ) }
								checked={ settings.load_as_style }
								onChange={ switchUseStyle }
							/>
						}
					</td>

					<td>
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
					</td>
					<td className="layer-actions" style={ setWidth( 4 ) }>
						<a
							href={ `/wp-admin/post.php?post=${ settings.id }&action=edit` }
							target="_blank"
							rel="noopener noreferrer"
						>
							<Dashicon icon="welcome-write-blog" />
						</a>
						<Dashicon icon="dismiss" onClick={ removeLayer } />
					</td>
				</tr>
			)
		);
	}
);
