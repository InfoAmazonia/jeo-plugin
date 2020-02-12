import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { TabPanel } from '../common-components';

const tabs = [
	{ name: 'map', title: __( 'Map Settings' ), className: 'tab-map' },
	{ name: 'layers', title: __( 'Map Layers' ), className: 'tab-layers' },
	{ name: 'library', title: __( 'Layers Library' ), className: 'tab-library' },
];

export default ( { modal, setModal, children } ) => (
	<Modal
		className="jeo-map-editor-modal"
		title={ __( 'Map Editor' ) }
		onRequestClose={ () => setModal( false ) }
	>
		<TabPanel
			className="jeo-tabs"
			activeClass="active-tab"
			tabs={ tabs }
			initialTabName={ modal }
		>
			{ children }
		</TabPanel>
	</Modal>
);
