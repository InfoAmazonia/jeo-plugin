import { SelectControl, TextControl } from '@wordpress/components';
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './interaction-settings.css';

export default function InteractionSettings( {
	layer,
} ) {
	const titleOptions = useMemo( () => {
		return [
			{ label: __( 'None', 'jeo' ), value: undefined },
			...Object.keys( layer.fields ).map( ( field ) => {
				return { label: field, value: field };
			} ),
		];
	}, [ layer.fields ] );

	const [ [ firstField, firstPlaceholder ], ...otherFields ] = Object.entries( layer.fields );
	const numFields = otherFields.length + 1;

	return (
		<Fragment>
			<tr className="jeo-interaction-header">
				<td rowSpan={ numFields }>{ layer.id }</td>
				<td rowSpan={ numFields }>
					<SelectControl
						options={ [
							{ label: __( 'Disabled', 'jeo' ), value: 'none' },
							{ label: __( 'Show on click', 'jeo' ), value: 'click' },
							{ label: __( 'Show on hover', 'jeo' ), value: 'mouseover' },
						] }
					/>
				</td>
				<td rowSpan={ numFields }>
					<SelectControl
						options={ titleOptions }
					/>
				</td>
				<td>
					<label htmlFor={ `i_${ layer.id }_${ firstField }` }>
						{ firstField }
					</label>
				</td>
				<td>
					<TextControl
						id={ `i_${ layer.id }_${ firstField }` }
						placeholder={ firstPlaceholder }
					/>
				</td>
			</tr>
			{ otherFields.map( ( [ field, placeholder ] ) => {
				const inputId = `i_${ layer.id }_${ field }`;

				return (
					<tr key={ inputId }>
						<td>
							<label htmlFor={ inputId }>{ field }</label>
						</td>
						<td>
							<TextControl
								id={ inputId }
								placeholder={ placeholder }
							/>
						</td>
					</tr>
				);
			} ) }
		</Fragment>
	);
}
