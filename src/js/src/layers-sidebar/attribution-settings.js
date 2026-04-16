import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { normalizeAttributionFormData } from './attribution-form-data';
import SchemaForm from '../shared/schema-form';

const layerSchema = {
	type: 'object',
	properties: {
		source_url: { title: __( 'Source data download link', 'jeo' ), type: 'string' },
		attribution: { title: __( 'Data attribution link', 'jeo' ), type: 'string' },
		attribution_name: { title: __( 'Data attribution name', 'jeo' ), type: 'string' },
	},
};

const AttributionSettings = ( { postMeta, setPostMeta } ) => {
	return (
		<Fragment>
			<SchemaForm
				className="jeo-layer-settings"
				schema={ layerSchema }
				formData={ postMeta }
				onChange={ ( { formData } ) => {
					const normalizedFormData = normalizeAttributionFormData( formData );

					window.layerFormData = normalizedFormData;
					setPostMeta( normalizedFormData );
				} }
			>
				{ /* Hide submit button */ }
				<div />
			</SchemaForm>
		</Fragment>
	);
};

export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		dispatch( 'core/editor' ).editPost( { meta } );
	},
} ) )(
	withSelect( ( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} ) )( AttributionSettings )
);
