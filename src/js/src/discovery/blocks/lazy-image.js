import { useState } from '@wordpress/element';

import '../style/lazy-image.scss';

const LazyImage = ( { src, alt } ) => {
	const [ isLoaded, setIsLoaded ] = useState( false );

	return (
		<div className="jeo-lazy-image__wrapper">
			{ ! isLoaded && <div className="jeo-lazy-image__placeholder" /> }
			<img
				className="jeo-lazy-image"
				onLoad={ () => setIsLoaded( true ) }
				onError={ () => setIsLoaded( true ) }
				src={ src }
				alt={ alt || '' }
				loading="lazy"
				decoding="async"
			/>
		</div>
	);
};

export default LazyImage;
