import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import JeoGeocodePosts from './geo-posts';

const JeoGeocodePanel = class JeoGeocodePanel extends React.Component {
	constructor() {
		super();
		this.state = {
			isOpen: false,
		};
	}
	render() {
		const isOpen = this.state.isOpen;
		return (
			<>
				<Button isDefault onClick={ () => this.setState( { isOpen: true } ) }>
					{ __( 'Geolocate this post', 'jeo' ) }
				</Button>
				{ isOpen && (
					<Modal
						title={ __( 'Geolocate this post', 'jeo' ) }
						onRequestClose={ () => this.setState( { isOpen: false } ) }>
						<JeoGeocodePosts
							onSaveLocation={ () => this.setState( { isOpen: false } ) }
							onCancel={ () => this.setState( { isOpen: false } ) }
						/>
					</Modal>
				) }
			</>
		);
	}
};

registerPlugin( 'jeo-posts-sidebar', {
	icon: null,
	render: () => {
		return (
			<PluginDocumentSettingPanel
				title={ __( 'Geolocation', 'jeo' ) }
			>
				<JeoGeocodePanel />
			</PluginDocumentSettingPanel>
		);
	},
} );
