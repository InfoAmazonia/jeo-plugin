import {
	buildAsyncComboboxOptions,
	shouldIgnoreInitialEmptyInputValue,
} from './async-combobox-control';

describe( 'buildAsyncComboboxOptions', () => {
	const baseOptions = [
		{ id: 10, label: 'Map One' },
		{ id: 11, label: 'Map Two' },
	];

	const getOptionLabel = ( item ) => item.label;
	const getOptionValue = ( item ) => item.id;

	it( 'keeps the fetched suggestions unchanged while focused', () => {
		expect(
			buildAsyncComboboxOptions( {
				items: baseOptions,
				getOptionLabel,
				getOptionValue,
				inputValue: 'Map',
				selectedValue: null,
				hasFocus: true,
			} )
		).toEqual( [
			{ item: baseOptions[ 0 ], label: 'Map One', value: '10' },
			{ item: baseOptions[ 1 ], label: 'Map Two', value: '11' },
		] );
	} );

	it( 'adds a persisted free-text option after blur when no selection exists', () => {
		expect(
			buildAsyncComboboxOptions( {
				items: baseOptions,
				getOptionLabel,
				getOptionValue,
				inputValue: 'Custom search',
				selectedValue: null,
				hasFocus: false,
			} )
		).toEqual( [
			{
				label: 'Custom search',
				value: 'Custom search',
				__freeform: true,
			},
			{ item: baseOptions[ 0 ], label: 'Map One', value: '10' },
			{ item: baseOptions[ 1 ], label: 'Map Two', value: '11' },
		] );
	} );

	it( 'does not add a free-text option when the selected value already exists', () => {
		expect(
			buildAsyncComboboxOptions( {
				items: baseOptions,
				getOptionLabel,
				getOptionValue,
				inputValue: 'Map One',
				selectedValue: 10,
				hasFocus: false,
			} )
		).toEqual( [
			{ item: baseOptions[ 0 ], label: 'Map One', value: '10' },
			{ item: baseOptions[ 1 ], label: 'Map Two', value: '11' },
		] );
	} );

	it( 'returns a hidden placeholder option when empty state should stay suppressed', () => {
		expect(
			buildAsyncComboboxOptions( {
				items: [],
				getOptionLabel,
				getOptionValue,
				inputValue: 'Rua Example, 123',
				selectedValue: 'Rua Example, 123',
				hasFocus: true,
				persistFreeText: false,
				suppressEmptyState: true,
			} )
		).toEqual( [
			{
				label: 'Rua Example, 123',
				value: 'Rua Example, 123',
				__hidden: true,
				disabled: true,
			},
		] );
	} );
} );

describe( 'shouldIgnoreInitialEmptyInputValue', () => {
	it( 'ignores the initial empty focus reset when a committed value exists', () => {
		expect(
			shouldIgnoreInitialEmptyInputValue( {
				nextValue: '',
				currentValue: 'Av. Paulista, Sao Paulo',
				shouldIgnoreNextEmpty: true,
			} )
		).toBe( true );
	} );

	it( 'does not ignore later empty values when there is no committed value', () => {
		expect(
			shouldIgnoreInitialEmptyInputValue( {
				nextValue: '',
				currentValue: '',
				shouldIgnoreNextEmpty: true,
			} )
		).toBe( false );
	} );
} );
