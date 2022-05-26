export default function EmbeddedStorymapDisplay ({ attributes }) {
	return (
		<iframe
			className="embed-storymap"
			scrolling="yes"
			seamless={ true }
			src={ `${window.jeo_settings.site_url}/embed/?storymap_id=${attributes.storyID}` }
		/>
	)
}
