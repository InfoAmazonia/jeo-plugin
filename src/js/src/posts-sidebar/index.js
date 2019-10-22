import { registerPlugin } from "@wordpress/plugins";
import { PluginDocumentSettingPanel } from "@wordpress/edit-post";
import { Modal, Button } from "@wordpress/components";
import JeoGeocodePosts from "./geo-posts";
import { __ } from "@wordpress/i18n";

const JeoGeocodePanel = class JeoGeocodePanel extends React.Component {
	constructor() {
		super();
		this.state = {
			isOpen: false
		}
	}
	render() {
		let isOpen = this.state.isOpen;
		return (
			<>
				<Button isDefault onClick={ () => this.setState( { isOpen: true } ) }>Open Modal</Button>
				{ isOpen && (
					<Modal
						title={__('Geolocate this post', 'jeo')}
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



registerPlugin( 'myprefix-sidebar', {
	icon: 'location-alt',
	render: () => {
		return (
			<PluginDocumentSettingPanel
			title={__('Geolocate this post', 'jeo')}
			>
				<JeoGeocodePanel />
			</PluginDocumentSettingPanel>
		)
	}
});
