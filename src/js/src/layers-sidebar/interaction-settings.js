import { SelectControl, TextControl } from '@wordpress/components';
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './interaction-settings.css';

const eventOptions = [
	{ label: __( 'Disabled', 'jeo' ), value: undefined },
	{ label: __( 'Show on click', 'jeo' ), value: 'click' },
	{ label: __( 'Show on hover', 'jeo' ), value: 'mouseover' },
];

export default function InteractionSettings( {
	interaction,
	interactionId,
	layer,
	onInsert,
	onUpdate,
	onDelete,
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
	const interactive = Boolean( interaction.on );
	const numFields = interaction.on ? otherFields.length + 1 : 1;

	return (
		<Fragment>
			<tr className="jeo-interaction-header">
				<td rowSpan={ numFields }>{ layer.id }</td>
				<td rowSpan={ numFields }>
					<SelectControl
						value={ interaction.on }
						options={ eventOptions }
					/>
				</td>
				{ interactive ? (
					<Fragment>
						<td rowSpan={ numFields }>
							<SelectControl
								value={ interaction.title }
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
					</Fragment>
				) : (
					<td rowSpan={ numFields } colSpan={ 3 } />
				) }
			</tr>
			{ interactive && otherFields.map( ( [ field, placeholder ] ) => {
				const inputId = `i_${ layer.id }_${ field }`;
				const fieldEntry = interaction.fields.find( ( entry ) => entry.field === field );
				const value = fieldEntry ? fieldEntry.label : undefined;

				return (
					<tr key={ inputId }>
						<td>
							<label htmlFor={ inputId }>{ field }</label>
						</td>
						<td>
							<TextControl
								id={ inputId }
								value={ value }
								placeholder={ placeholder }
							/>
						</td>
					</tr>
				);
			} ) }
		</Fragment>
	);
}
