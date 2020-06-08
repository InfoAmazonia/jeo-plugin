import { Button, Dashicon, PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { Fragment, useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './interaction-settings.css';

const eventOptions = [
	{ label: __( 'No', 'jeo' ), value: 'none' },
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
	const fieldKeys = useMemo( () => {
		return Object.keys( layer.fields );
	}, [ layer.fields ] );

	const titleOptions = useMemo( () => {
		return [
			{ label: __( 'None', 'jeo' ), value: undefined },
			...fieldKeys.map( ( field ) => {
				return { label: field, value: field };
			} ),
		];
	}, [ fieldKeys ] );

	const unusedFieldOptions = useMemo( () => {
		return fieldKeys.flatMap( ( key ) => {
			const found = interaction.fields.find( ( { field } ) => {
				return field === key;
			} );
			return found ? [] : [ { label: key, value: key } ];
		} );
	}, [ fieldKeys, interaction.fields ] );

	const [ newField, setNewField ] = useState( null );

	useEffect( () => {
		setNewField( unusedFieldOptions.length > 0 ?
			unusedFieldOptions[ 0 ].value :
			null
		);
	}, [ unusedFieldOptions ] );

	const changeEvent = useCallback( ( on ) => {
		if ( interactionIndex !== -1 ) {
			if ( on === 'none' ) {
				onDelete( interaction.id );
			} else {
				onUpdate( interaction.id, { ...interaction, on } );
			}
		} else if ( on !== 'none' ) {
			onInsert( { ...interaction, on } );
		}
	}, [ interaction, interactionIndex, onDelete, onInsert ] );

	const changeTitle = useCallback( ( title ) => {
		if ( ( interaction.title !== 'None' || interaction.title ) && ( title === 'None' || ! title ) ) {
			alert( __( 'A title is required' ) );
			return;
		}
		onUpdate( interaction.id, { ...interaction, title } );
	}, [ interaction, onUpdate ] );

	const addField = useCallback( () => {
		if ( interaction.title === 'None' || ! interaction.title ) {
			alert( __( 'A title is required' ) );
			return;
		}
		onUpdate( interaction.id, {
			...interaction,
			fields: [
				...interaction.fields,
				{ field: newField, label: '' },
			],
		} );
	}, [ interaction, newField, onUpdate ] );

	const updateLabel = ( key ) => ( label ) => {
		onUpdate( interaction.id, {
			...interaction,
			fields: interaction.fields.map( ( field ) => {
				return ( field.field === key ) ? { ...field, label } : field;
			} ),
		} );
	};

	const deleteField = ( key ) => ( ) => {
		onUpdate( interaction.id, {
			...interaction,
			fields: interaction.fields.filter( ( field ) => {
				return field.field !== key;
			} ),
		} );
	};

	const interactive = interaction.on !== 'none';

	return (
		<PanelBody className="jeo-interaction-settings" title={ layer.id } initialOpen={ interactive }>
			<SelectControl
				label={ __( 'Show popup?', 'jeo' ) }
				value={ interaction.on }
				options={ eventOptions }
				onChange={ changeEvent }
			/>
			{ interactive && (
				<Fragment>
					<SelectControl
						label={ __( 'Title' ) }
						value={ interaction.title }
						options={ titleOptions }
						onChange={ changeTitle }
					/>

					{ ( fieldKeys.length > 0 ) && (
						<fieldset className="jeo-interaction-fields">
							<legend>{ __( 'Fields', 'jeo' ) }</legend>

							{ ( interaction.fields.length > 0 ) && (
								<div className="jeo-interaction-fields__grid">
									{ interaction.fields.map( ( { field, label } ) => {
										const inputId = `${ layer.id }_${ field }`;
										return (
											<Fragment key={ field }>
												<label htmlFor={ inputId }>{ field }</label>
												<TextControl
													id={ inputId }
													value={ label }
													placeholder={ layer.fields[ field ] }
													onChange={ updateLabel( field ) }
												/>
												<Button onClick={ deleteField( field ) }>
													<Dashicon icon="dismiss" />
												</Button>
											</Fragment>
										);
									} ) }
								</div>
							) }

							{ ( unusedFieldOptions.length > 0 ) && (
								<div className="jeo-interaction-add-field">
									<label htmlFor={ `${ layer.field }__add-field` }>
										{ __( 'Add field', 'jeo' ) }
									</label>
									<SelectControl
										id={ `${ layer.field }__add-field` }
										value={ newField }
										options={ unusedFieldOptions }
										onChange={ setNewField }
									/>
									<Button isPrimary onClick={ addField }>
										{ __( 'Add', 'jeo' ) }
									</Button>
								</div>
							) }
						</fieldset>
					) }
				</Fragment>
			) }
		</PanelBody>
	);
}
