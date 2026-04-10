import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_ID_CHUNK_SIZE = 100;

const appendLanguageQuery = ( query = {} ) => {
	const nextQuery = { ...query };

	if (
		typeof window !== 'undefined' &&
		'languageParams' in window &&
		window.languageParams?.currentLang &&
		typeof nextQuery.lang === 'undefined'
	) {
		nextQuery.lang = window.languageParams.currentLang;
	}

	return nextQuery;
};

export const chunkRecordIds = ( ids = [], chunkSize = DEFAULT_ID_CHUNK_SIZE ) => {
	const normalizedIds = Array.from(
		new Set(
			ids
				.map( ( id ) => Number.parseInt( id, 10 ) )
				.filter( ( id ) => Number.isFinite( id ) && id > 0 )
		)
	);
	const chunks = [];

	for ( let index = 0; index < normalizedIds.length; index += chunkSize ) {
		chunks.push( normalizedIds.slice( index, index + chunkSize ) );
	}

	return chunks;
};

export const mergeRecordsByIdOrder = ( ids = [], records = [] ) => {
	const recordsById = new Map(
		records
			.filter( ( record ) => Number.isFinite( Number.parseInt( record?.id, 10 ) ) )
			.map( ( record ) => [ Number.parseInt( record.id, 10 ), record ] )
	);

	return Array.from(
		new Set(
			ids
				.map( ( id ) => Number.parseInt( id, 10 ) )
				.filter( ( id ) => Number.isFinite( id ) && id > 0 )
		)
	)
		.map( ( id ) => recordsById.get( id ) )
		.filter( Boolean );
};

const mergeUniqueRecords = ( currentRecords, nextRecords ) => {
	const recordsById = new Map();

	[ ...currentRecords, ...nextRecords ].forEach( ( record ) => {
		if ( Number.isFinite( Number.parseInt( record?.id, 10 ) ) ) {
			recordsById.set( Number.parseInt( record.id, 10 ), record );
		}
	} );

	return Array.from( recordsById.values() );
};

export const fetchCollection = async ( path, query = {} ) => {
	const response = await apiFetch( {
		path: addQueryArgs( path, appendLanguageQuery( query ) ),
		parse: false,
	} );
	const data = await response.json();

	return {
		data,
		total: Number.parseInt( response.headers.get( 'X-WP-Total' ) || '0', 10 ),
		totalPages: Number.parseInt(
			response.headers.get( 'X-WP-TotalPages' ) || '1',
			10
		),
	};
};

export const useRecordsByIds = ( {
	path,
	ids = [],
	enabled = true,
	query = {},
	chunkSize = DEFAULT_ID_CHUNK_SIZE,
} ) => {
	const normalizedIds = useMemo(
		() =>
			Array.from(
				new Set(
					ids
						.map( ( id ) => Number.parseInt( id, 10 ) )
						.filter( ( id ) => Number.isFinite( id ) && id > 0 )
				)
			),
		[ ids ]
	);
	const idChunks = useMemo(
		() => chunkRecordIds( normalizedIds, chunkSize ),
		[ normalizedIds, chunkSize ]
	);
	const queryKey = JSON.stringify( query );
	const [ records, setRecords ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		let isCancelled = false;

		if ( ! enabled || ! path || normalizedIds.length === 0 ) {
			setRecords( [] );
			setIsLoading( false );
			setError( null );
			return undefined;
		}

		setIsLoading( true );
		setError( null );

		Promise.all(
			idChunks.map( async ( chunk ) => {
				const response = await fetchCollection( path, {
					...query,
					include: chunk,
					orderby: 'include',
					per_page: chunk.length,
				} );

				return response.data;
			} )
		)
			.then( ( chunkedRecords ) => {
				if ( isCancelled ) {
					return;
				}

				setRecords(
					mergeRecordsByIdOrder( normalizedIds, chunkedRecords.flat() )
				);
			} )
			.catch( ( nextError ) => {
				if ( ! isCancelled ) {
					setError( nextError );
					setRecords( [] );
				}
			} )
			.finally( () => {
				if ( ! isCancelled ) {
					setIsLoading( false );
				}
			} );

		return () => {
			isCancelled = true;
		};
	}, [ enabled, idChunks, normalizedIds, path, queryKey ] );

	return { records, isLoading, error };
};

export const usePaginatedRecords = ( {
	path,
	query = {},
	enabled = true,
	pageSize = DEFAULT_PAGE_SIZE,
} ) => {
	const queryKey = JSON.stringify( query );
	const [ page, setPage ] = useState( 1 );
	const [ records, setRecords ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 0 );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		setPage( 1 );
		setRecords( [] );
		setTotal( 0 );
		setTotalPages( 0 );
		setError( null );
	}, [ enabled, pageSize, path, queryKey ] );

	useEffect( () => {
		let isCancelled = false;

		if ( ! enabled || ! path ) {
			setIsLoading( false );
			return undefined;
		}

		setIsLoading( true );

		fetchCollection( path, {
			...query,
			page,
			per_page: pageSize,
		} )
			.then( ( response ) => {
				if ( isCancelled ) {
					return;
				}

				setRecords( ( currentRecords ) =>
					page === 1
						? response.data
						: mergeUniqueRecords( currentRecords, response.data )
				);
				setTotal( response.total );
				setTotalPages( response.totalPages );
				setError( null );
			} )
			.catch( ( nextError ) => {
				if ( ! isCancelled ) {
					setError( nextError );
				}
			} )
			.finally( () => {
				if ( ! isCancelled ) {
					setIsLoading( false );
				}
			} );

		return () => {
			isCancelled = true;
		};
	}, [ enabled, page, pageSize, path, queryKey ] );

	return {
		records,
		total,
		totalPages,
		page,
		isLoading,
		error,
		hasMore: totalPages > page,
		loadMore: () => setPage( ( currentPage ) => currentPage + 1 ),
		reset: () => setPage( 1 ),
	};
};
