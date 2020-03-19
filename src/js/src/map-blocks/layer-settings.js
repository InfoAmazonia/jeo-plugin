import { CheckboxControl, Dashicon, SelectControl } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';

import { layerUseLabels } from './utils';

import './layer-settings.css';

const useOptions = [
	{ label: layerUseLabels.fixed, value: 'fixed' },
	{ label: layerUseLabels.swappable, value: 'swappable' },
	{ label: layerUseLabels.switchable, value: 'switchable' },
];

export default forwardRef(
	(
		{
			isDragged,
			isOutOfBounds,
			isSelected,
			removeLayer,
			settings,
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
				<td>
					<CheckboxControl
						label={ __( 'Show legend' ) }
						checked={ settings.show_legend }
						onChange={ switchShowLegend }
					/>
				</td>
				<td className="layer-actions" style={ setWidth( 4 ) }>
					<a href={ `/wp-admin/post.php?post=${ settings.id }&action=edit` } target="_blank" rel="noopener noreferrer">
						<Dashicon icon="welcome-write-blog" />
					</a>
					<Dashicon icon="dismiss" onClick={ removeLayer } />
				</td>
			</tr>
		);
	}
);
