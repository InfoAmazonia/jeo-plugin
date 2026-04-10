import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

const DOCUMENT_SIDEBAR = 'edit-post/document';
const BLOCK_SIDEBAR = 'edit-post/block';

export default function useDocumentSidebarDefault( enabled ) {
	const { setDefaultComplementaryArea, enableComplementaryArea } =
		useDispatch( 'core/interface' );
	const activeSidebar = useSelect( ( select ) => {
		return select( 'core/interface' )?.getActiveComplementaryArea?.( 'core' );
	}, [] );

	useEffect( () => {
		if (
			! enabled ||
			typeof setDefaultComplementaryArea !== 'function'
		) {
			return;
		}

		setDefaultComplementaryArea( 'core', DOCUMENT_SIDEBAR );
	}, [ enabled, setDefaultComplementaryArea ] );

	useEffect( () => {
		if (
			! enabled ||
			typeof enableComplementaryArea !== 'function'
		) {
			return;
		}

		if ( activeSidebar == null || activeSidebar === BLOCK_SIDEBAR ) {
			enableComplementaryArea( 'core', DOCUMENT_SIDEBAR );
		}
	}, [ activeSidebar, enableComplementaryArea, enabled ] );
}
