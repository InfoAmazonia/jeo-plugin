import { useMemo, useRef, useState } from '@wordpress/element';

import { ComboboxControl } from './wp-form-controls';

export function buildAsyncComboboxOptions( {
	items,
	getOptionLabel,
	getOptionValue,
	inputValue,
	selectedValue,
	hasFocus,
	persistFreeText = true,
	suppressEmptyState = false,
} ) {
	const options = items.map( ( item ) => ( {
		item,
		label: getOptionLabel( item ),
		value: String( getOptionValue( item ) ),
	} ) );

	if ( suppressEmptyState && options.length === 0 ) {
		return [
			{
				label: inputValue || ' ',
				value: String( selectedValue ?? inputValue ?? '__jeo-hidden-option__' ),
				__hidden: true,
				disabled: true,
			},
		];
	}

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

export function shouldIgnoreInitialEmptyInputValue( {
	nextValue,
	currentValue,
	shouldIgnoreNextEmpty,
} ) {
	return shouldIgnoreNextEmpty && nextValue === '' && Boolean( currentValue );
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
	suppressEmptyState = false,
} ) {
	const [ hasFocus, setHasFocus ] = useState( false );
	const ignoreNextEmptyInputRef = useRef( false );
	const options = useMemo( () => {
		return buildAsyncComboboxOptions( {
			items,
			getOptionLabel,
			getOptionValue,
			inputValue,
			selectedValue,
			hasFocus,
			persistFreeText,
			suppressEmptyState,
		} );
	}, [
		getOptionLabel,
		getOptionValue,
		hasFocus,
		inputValue,
		items,
		persistFreeText,
		selectedValue,
		suppressEmptyState,
	] );

	const currentValue = selectedValue ?? ( persistFreeText ? inputValue : null );
	const handleInputValueChange = ( nextValue ) => {
		if (
			shouldIgnoreInitialEmptyInputValue( {
				nextValue,
				currentValue,
				shouldIgnoreNextEmpty: ignoreNextEmptyInputRef.current,
			} )
		) {
			ignoreNextEmptyInputRef.current = false;
			return;
		}

		ignoreNextEmptyInputRef.current = false;
		onInputValueChange?.( nextValue );
	};

	return (
		<div
			className={ className }
			onFocusCapture={ () => {
				setHasFocus( true );
				ignoreNextEmptyInputRef.current = Boolean( currentValue );
			} }
			onBlurCapture={ ( event ) => {
				if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
					setHasFocus( false );
					ignoreNextEmptyInputRef.current = false;
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
				onFilterValueChange={ handleInputValueChange }
				onChange={ ( nextValue ) => {
					if ( ! nextValue ) {
						onOptionSelect?.( null );
						return;
					}

					const selectedOption = options.find(
						( option ) =>
							option.value === String( nextValue ) &&
							! option.__freeform &&
							! option.__hidden
					);

					if ( selectedOption ) {
						onOptionSelect?.( selectedOption.item );
					}
				} }
				__experimentalRenderItem={
					renderItem
						? ( { item } ) => {
								if ( item.__hidden ) {
									return (
										<span
											className="jeo-async-combobox__hidden-option"
											aria-hidden="true"
										/>
									);
								}

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
