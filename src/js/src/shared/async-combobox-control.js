import { useMemo, useState } from '@wordpress/element';

import { ComboboxControl } from './wp-form-controls';

export function buildAsyncComboboxOptions( {
	items,
	getOptionLabel,
	getOptionValue,
	inputValue,
	selectedValue,
	hasFocus,
	persistFreeText = true,
} ) {
	const options = items.map( ( item ) => ( {
		item,
		label: getOptionLabel( item ),
		value: String( getOptionValue( item ) ),
	} ) );

	if ( ! persistFreeText || hasFocus || ! inputValue ) {
		return options;
	}

	const currentValue = selectedValue ?? inputValue;

	if ( options.some( ( option ) => option.value === String( currentValue ) ) ) {
		return options;
	}

	return [
		{
			label: inputValue,
			value: String( currentValue ),
			__freeform: true,
		},
		...options,
	];
}

export default function AsyncComboboxControl( {
	className,
	items = [],
	inputValue = '',
	selectedValue = null,
	isLoading = false,
	placeholder,
	ariaLabel,
	getOptionLabel,
	getOptionValue,
	onInputValueChange,
	onOptionSelect,
	renderItem,
	allowReset = false,
	persistFreeText = true,
} ) {
	const [ hasFocus, setHasFocus ] = useState( false );
	const options = useMemo( () => {
		return buildAsyncComboboxOptions( {
			items,
			getOptionLabel,
			getOptionValue,
			inputValue,
			selectedValue,
			hasFocus,
			persistFreeText,
		} );
	}, [
		getOptionLabel,
		getOptionValue,
		hasFocus,
		inputValue,
		items,
		persistFreeText,
		selectedValue,
	] );

	const currentValue = selectedValue ?? ( persistFreeText ? inputValue : null );

	return (
		<div
			className={ className }
			onFocusCapture={ () => setHasFocus( true ) }
			onBlurCapture={ ( event ) => {
				if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
					setHasFocus( false );
				}
			} }
		>
			<ComboboxControl
				className="jeo-async-combobox"
				label={ ariaLabel || placeholder }
				hideLabelFromVision
				value={ currentValue ? String( currentValue ) : null }
				options={ options }
				placeholder={ placeholder }
				isLoading={ isLoading }
				allowReset={ allowReset }
				expandOnFocus={ false }
				onFilterValueChange={ onInputValueChange }
					onChange={ ( nextValue ) => {
						if ( ! nextValue ) {
							onOptionSelect?.( null );
							return;
						}

						const selectedOption = options.find(
							( option ) =>
								option.value === String( nextValue ) && ! option.__freeform
					);

					if ( selectedOption ) {
						onOptionSelect?.( selectedOption.item );
					}
				} }
				__experimentalRenderItem={
					renderItem
						? ( { item } ) => {
								if ( item.__freeform ) {
									return null;
								}

								return renderItem( item.item );
						  }
						: undefined
				}
			/>
		</div>
	);
}
