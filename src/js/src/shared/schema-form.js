import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { __ } from '@wordpress/i18n';

import {
	CheckboxControl,
	SelectControl,
	TextControl,
} from './wp-form-controls';

function isPlainObject( value ) {
	return Boolean( value ) && typeof value === 'object' && ! Array.isArray( value );
}

export function mergeSchemaFormData( currentFormData = {}, nextFormData = {} ) {
	if ( ! isPlainObject( currentFormData ) || ! isPlainObject( nextFormData ) ) {
		return nextFormData;
	}

	return Object.entries( nextFormData ).reduce(
		( accumulator, [ key, value ] ) => ( {
			...accumulator,
			[ key ]:
				isPlainObject( accumulator[ key ] ) && isPlainObject( value )
					? mergeSchemaFormData( accumulator[ key ], value )
					: value,
		} ),
		{ ...currentFormData }
	);
}

export function promoteSchemaEnumNamesToUiSchema( schema, uiSchema = {} ) {
	if ( ! schema || typeof schema !== 'object' ) {
		return uiSchema;
	}

	if ( schema.type !== 'object' || ! schema.properties ) {
		return uiSchema;
	}

	return Object.entries( schema.properties ).reduce(
		( accumulator, [ key, property ] ) => {
			const currentUiField = accumulator[ key ] || {};
			const nextUiField = { ...currentUiField };

			if ( Array.isArray( property.enumNames ) && ! nextUiField[ 'ui:enumNames' ] ) {
				nextUiField[ 'ui:enumNames' ] = property.enumNames;
			}

			if ( property.type === 'object' && property.properties ) {
				return {
					...accumulator,
					[ key ]: promoteSchemaEnumNamesToUiSchema( property, nextUiField ),
				};
			}

			return {
				...accumulator,
				[ key ]: nextUiField,
			};
		},
		{ ...uiSchema }
	);
}

export function coerceEnumOptionValue( value, enumOptions = [] ) {
	const matchingOption = enumOptions.find(
		( option ) => String( option.value ) === String( value )
	);

	return matchingOption ? matchingOption.value : value;
}

function CheckboxWidget( {
	id,
	value,
	disabled,
	readonly,
	label,
	onChange,
} ) {
	return (
		<CheckboxControl
			id={ id }
			label={ label }
			checked={ Boolean( value ) }
			disabled={ disabled || readonly }
			onChange={ ( nextValue ) => onChange( nextValue ) }
		/>
	);
}

function TextWidget( {
	id,
	value,
	disabled,
	readonly,
	required,
	autofocus,
	placeholder,
	onChange,
} ) {
	return (
		<TextControl
			id={ id }
			value={ value ?? '' }
			disabled={ disabled || readonly }
			required={ required }
			autoFocus={ autofocus }
			placeholder={ placeholder }
			onChange={ onChange }
		/>
	);
}

function SelectWidget( {
	id,
	value,
	disabled,
	readonly,
	required,
	placeholder,
	options,
	onChange,
} ) {
	const enumOptions = options.enumOptions || [];
	const selectOptions = [
		{
			label: required ? '' : placeholder || __( 'Select an option', 'jeo' ),
			value: '',
			disabled: required,
		},
		...enumOptions.map( ( option ) => ( {
			label: option.label,
			value: String( option.value ),
		} ) ),
	];

	return (
		<SelectControl
			id={ id }
			value={ value === undefined || value === null ? '' : String( value ) }
			disabled={ disabled || readonly }
			options={ selectOptions }
			onChange={ ( nextValue ) => {
				if ( nextValue === '' ) {
					onChange( undefined );
					return;
				}

				onChange( coerceEnumOptionValue( nextValue, enumOptions ) );
			} }
		/>
	);
}

const widgets = {
	CheckboxWidget,
	SelectWidget,
	TextWidget,
};

const templates = {
	ButtonTemplates: {
		SubmitButton: () => null,
	},
};

export default function SchemaForm( {
	schema,
	uiSchema,
	formData,
	onChange,
	children,
	...props
} ) {
	return (
		<Form
			{ ...props }
			validator={ validator }
			schema={ schema }
			uiSchema={ promoteSchemaEnumNamesToUiSchema( schema, uiSchema ) }
			formData={ formData }
			widgets={ widgets }
			templates={ templates }
			noHtml5Validate
			onChange={ ( event, id ) => {
				onChange?.(
					{
						...event,
						formData: mergeSchemaFormData( formData, event.formData ),
					},
					id
				);
			} }
		>
			{ children }
		</Form>
	);
}
