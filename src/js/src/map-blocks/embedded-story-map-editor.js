import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { Fragment, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import JeoAutosuggest from './jeo-autosuggest';

function EmbeddedStorymapEditor ({ attributes, loadedStory, setAttributes }) {
	const instanceId = useId();
	const inputId = `jeo-storymap-autosuggest-${ instanceId }`

	return (
		<Fragment>
			<label htmlFor={ inputId }>
				{ __( 'Insert a story map from the library', 'jeo' ) + ':' }
			</label>
			<JeoAutosuggest
				inputProps={ {
					id: inputId,
					placeholder: loadedStory ? loadedStory.title.raw : __( 'Type a story name', 'jeo' ),
				} }
				postType="storymap"
				onSuggestionSelected={ ( e, { suggestion } ) => {
					setAttributes({ ...attributes, storyID: suggestion.id })
				} }
			/>
		</Fragment>
	);
}

const applyWithSelect = withSelect( ( select, { attributes } ) => ( {
	loadedStory: attributes.storyID && select( 'core' ).getEntityRecord( 'postType', 'storymap', attributes.storyID ),
} ) );

export default compose( applyWithSelect )( EmbeddedStorymapEditor );
