export function mergeLayerTypeOptions(
	coreLayerTypeOptions = [],
	runtimeLayerTypeOptions = []
) {
	const mergedOptions = new Map(
		coreLayerTypeOptions.map( ( option ) => [ option.value, option ] )
	);

	runtimeLayerTypeOptions.forEach( ( option ) => {
		if ( ! option?.value ) {
			return;
		}

		const fallbackOption = mergedOptions.get( option.value ) || {};

		mergedOptions.set( option.value, {
			...fallbackOption,
			...option,
			label: option.label || fallbackOption.label || option.value,
		} );
	} );

	return Array.from( mergedOptions.values() );
}
