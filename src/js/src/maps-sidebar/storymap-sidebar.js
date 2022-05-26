import { withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import MapEmbedUrl from './map-embed-url';

function StoryMapSidebar( {
	postId
} ) {

	const embedUrl =
		postId && `${ window.jeo_settings.site_url }/embed/?storymap_id=${ postId }`;

	return (
		<Fragment>

			{ embedUrl && <MapEmbedUrl url={ embedUrl } /> }

		</Fragment>
	);
}

export default withSelect( ( select ) => ( {
	postId: select( 'core/editor' ).getCurrentPostId()
	} ) )( StoryMapSidebar )
