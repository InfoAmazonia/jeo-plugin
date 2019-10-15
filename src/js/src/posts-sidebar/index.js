import { registerPlugin } from "@wordpress/plugins";
import { PluginDocumentSettingPanel } from "@wordpress/edit-post";
import { Modal, Button } from "@wordpress/components";
import { withState } from "@wordpress/compose";
import JeoGeocodePosts from "../geo-posts";
//const { PluginDocumentSettingPanel } = wp.editPost;
import { __ } from "@wordpress/i18n";


const MyModal = withState( {
    isOpen: false,
} )( ( { isOpen, setState } ) => (
    <div>
        <Button isDefault onClick={ () => setState( { isOpen: true } ) }>Open Modal</Button>
        { isOpen && (
            <Modal
                title="This is my modal"
                onRequestClose={ () => setState( { isOpen: false } ) }>
                <JeoGeocodePosts />
                <Button isDefault onClick={ () => setState( { isOpen: false } ) }>
                    My custom close button
                </Button>
            </Modal>
        ) }
    </div>
) );

registerPlugin( 'myprefix-sidebar', {
  icon: 'location-alt',
  render: () => {
    return (
        <PluginDocumentSettingPanel
          title={__('Meta Options', 'textdomain')}
        >
            <MyModal />
        </PluginDocumentSettingPanel>
    )
  }
})