import { FormTokenField } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

export function TokensSelector( {
	collection,
	label,
	loadingCollection,
	onChange: _onChange,
	value,
} ) {
	const suggestions = useMemo( () => {
		if ( loadingCollection ) {
			return [];
		}
		return collection.map( ( item ) => item.name );
	}, [ collection, loadingCollection ] );

	const displayTransform = useCallback(
		( item ) => {
			const found = collection.find( ( x ) => x.id === item );
			return found ? found.name : item;
		},
		[ collection ]
	);

	const saveTransform = useCallback(
		( item ) => {
			const found = collection.find( ( x ) => x.name === item.trim() );
			return String( found ? found.id : item );
		},
		[ collection ]
	);

	const onChange = useCallback(
		( e ) => {
			// remove invalid ids
			e = e.filter(id => !isNaN(id));
			_onChange( e.map( Number ) );
		},
		[ _onChange ]
	);

	return (
		<FormTokenField
			label={ label }
			value={ value }
			suggestions={ suggestions }
			displayTransform={ displayTransform }
			saveTransform={ saveTransform }
			onChange={ onChange }
		/>
	);
}
