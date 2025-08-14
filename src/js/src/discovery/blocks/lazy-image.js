import { useRef } from '@wordpress/element';

import '../style/lazy-image.scss';

const LazyImage = ( { src, alt } ) => {
	const refPlaceholder = useRef( undefined );

	const removePlaceholder = () => {
		refPlaceholder.current.remove();
	};

	return (
		<div className="jeo-lazy-image__wrapper">
			<div className="jeo-lazy-image__placeholder" ref={ refPlaceholder } />
			<div className="jeo-lazy-image"
				onLoad={ removePlaceholder }
				onError={ removePlaceholder }
				src={ src }
				alt={ alt }
				loading="lazy"
			/>
		</div>
	);
};

export default LazyImage;
