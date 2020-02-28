import { __ } from '@wordpress/i18n';
import {
	CheckboxControl,
	Dashicon,
	SelectControl,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import classNames from 'classnames';

const useOptions = [
	{ label: __( 'Fixed' ), value: 'fixed' },
	{ label: __( 'Swappable' ), value: 'swappable' },
	{ label: __( 'Switchable' ), value: 'switchable' },
];

export default forwardRef(
	(
		{
			isDragged,
			removeLayer,
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
				<td className="remove-control" style={ setWidth( 4 ) }>
					<Dashicon icon="dismiss" onClick={ removeLayer } />
				</td>
			</tr>
		);
	}
);
