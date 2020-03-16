import { Button, PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './interaction-settings.css';

const eventOptions = [
	{ label: __( 'No', 'jeo' ), value: undefined },
	{ label: __( 'On click', 'jeo' ), value: 'click' },
	{ label: __( 'On hover', 'jeo' ), value: 'mouseover' },
];

export default function InteractionSettings( {
	interaction,
	interactionIndex,
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

	const unusedFieldOptions = useMemo( () => {
		return Object.keys( layer.fields ).flatMap( ( key ) => {
			const found = interaction.fields.find( ( { field } ) => {
				return field === key;
			} );
			if ( found ) {
				return [];
			}
			return [ { label: key, value: key } ];
		} );
	}, [ layer.fields, interaction.fields ] );

	const interactive = Boolean( interaction.on );

	return (
		<PanelBody className="jeo-interaction-settings" title={ layer.id } initialOpen={ interactive }>
			<SelectControl
				label={ __( 'Show popup?', 'jeo' ) }
				value={ interaction.on }
				options={ eventOptions }
			/>
			{ interactive && (
				<Fragment>
					<SelectControl
						label={ __( 'Title' ) }
						value={ interaction.title }
						options={ titleOptions }
					/>

					<SelectControl
						label={ __( 'Add field', 'jeo' ) }
						options={ unusedFieldOptions }
					/>
					<Button isPrimary>
						{ __( 'Add' ) }
					</Button>

					<fieldset className="jeo-interaction-fields">
						<legend>{ __( 'Fields', 'jeo' ) }</legend>
						{ interaction.fields.map( ( field ) => (
							<TextControl
								key={ field.field }
								label={ field.field }
								value={ field.label }
								placeholder={ layer.fields[ field.field ] }
							/>
						) ) }
					</fieldset>
				</Fragment>
			) }
		</PanelBody>
	);
}
