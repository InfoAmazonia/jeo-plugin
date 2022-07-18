import { uploadMedia } from '@wordpress/media-utils';

export class CKEditor5UploadAdapter {

	constructor ( loader ) {
		this.loader = loader;
	}

	upload () {
		return this.loader.file.then( ( file ) => {
			return new Promise( ( resolve, reject ) => {
				uploadMedia( {
					filesList: [ file ],
					onError ( err ) {
						reject( err.message );
					},
					onFileChange ( [ media ] ) {
						if ( !media.url.startsWith( 'blob:' ) ) {
							resolve( { default: media.url } );
						}
					},
				} );
			} );
		} );
	}

	abort () {

	}
}

export function createUploadAdapter ( loader ) {
	return new CKEditor5UploadAdapter( loader );
}
