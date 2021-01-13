import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Form from 'react-jsonschema-form';

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
			<Form
				className="jeo-layer-settings"
				schema={ layerSchema }
				formData={ postMeta }
				onChange={ ( { formData } ) => {
					const regex = new RegExp(
						/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
					);

					let attributionLink = formData.attribution;
					let sourceLink = formData.source_url;

					if (
						formData.attribution &&
						! formData.attribution.includes( 'http' )
					) {
						if ( formData.attribution.match( regex ) ) {
							attributionLink = `https://${ formData.attribution }`;
						}
					}
					formData.attribution = attributionLink;

					if (
						formData.source_url &&
						! formData.source_url.includes( 'http' )
					) {
						if ( formData.source_url.match( regex ) ) {
							sourceLink = `https://${ formData.source_url }`;
						}
					}
					formData.source_url = sourceLink;

					if ( ! formData.attribution_name ) {
						formData.attribution_name = '';
					}
					if ( ! formData.attribution ) {
						formData.attribution = '';
					}

					if ( ! formData.source_url ) {
						formData.source_url = '';
					}

					window.layerFormData = formData;
					setPostMeta( formData );
				} }
			>
				{ /* Hide submit button */ }
				<div />
			</Form>
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
