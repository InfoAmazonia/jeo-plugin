import { Button, SelectControl, CheckboxControl, TextareaControl } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// import { useDebounce } from 'use-debounce';

const CartoIntegration = ( { postMeta, setPostMeta }) => {
	const [ useCartoIntegration, setUseCartoInteration ] = useState(postMeta.use_carto_integration)
	const [ cartoSQLQuery, setCartoSQLQuery ] = useState(postMeta.carto_integration_sql);

	// console.log(postMeta);

	return (
		<>
			<CheckboxControl
				label={ __( 'Use integration' ) }
				checked={ useCartoIntegration }
				onChange={ () => {
					setUseCartoInteration(!postMeta.use_carto_integration);
					setPostMeta( {
						...postMeta,
						use_carto_integration: !postMeta.use_carto_integration
					 } )
				} }
			/>

			{ useCartoIntegration &&
				<>
					<TextareaControl
						label={ __( 'SQL Query' ) }
						value={ cartoSQLQuery }
						onChange={ ( value ) => {
							setCartoSQLQuery(value);
							setPostMeta( {
								...postMeta,
								carto_integration_sql: value
							} )
						} }
						type="textarea"
					/>
					{ cartoSQLQuery.length > 0 &&
						<Button isSecondary onClick={ () => {

						} }>
							{ __("Syncronize") }
						</Button>
					}

				</>
			}
		</>
	)
}

export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		dispatch( 'core/editor' ).editPost( { meta } );
	},
} ) )(
	withSelect( ( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} ) )( CartoIntegration )
);
