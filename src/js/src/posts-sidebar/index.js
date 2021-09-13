import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { Component, Fragment } from '@wordpress/element';
import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import JeoGeocodePosts from './geo-posts';
import { useSelect } from '@wordpress/data';


const JeoGeocodePanel = class JeoGeocodePanel extends Component {
	constructor() {
		super();
		this.state = {
			isOpen: false,
		};
	}
	render() {
		const isOpen = this.state.isOpen;
		return (
			<Fragment>
				<Button isDefault onClick={ () => this.setState( { isOpen: true } ) }>
					{ __( 'Geolocate this post', 'jeo' ) }
				</Button>
				{ isOpen && (
					<Modal
						title={ __( 'Geolocate this post', 'jeo' ) }
						onRequestClose={ () => this.setState( { isOpen: false } ) }
					>
						<JeoGeocodePosts
							onSaveLocation={ () => this.setState( { isOpen: false } ) }
							onCancel={ () => this.setState( { isOpen: false } ) }
						/>
					</Modal>
				) }
			</Fragment>
		);
	}
};

registerPlugin( 'jeo-posts-sidebar', {
	icon: null,
	render: () => {

	const currentPostType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType()
	}, [] );
	console.log( currentPostType );

	return (
		<div>
			{ currentPostType ? 
				<PluginDocumentSettingPanel title={ __( 'Geolocation', 'jeo' ) }>
					<JeoGeocodePanel />
				</PluginDocumentSettingPanel>
			: null };
		</div>
	)
	},
} );
