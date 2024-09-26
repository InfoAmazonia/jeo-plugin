export function onFirstIntersection ( el, callback ) {
	const { bottom, left, right, top } = el.getBoundingClientRect();
	const { clientHeight, clientWidth } = document.documentElement;
	const { innerHeight: windowHeight, innerWidth: windowWidth } = window;

	if ( top >= 0 && left >= 0 && bottom <= ( windowHeight || clientHeight ) && right <= ( windowWidth || clientWidth ) ) {
		console.debug( 'eager init', el );
		callback();
	} else {
		let observer;
		const innerCallback = ([ intersectionEntry ]) => {
			if ( intersectionEntry?.isIntersecting ) {
				console.debug( 'lazy init', el );
				callback();
				observer?.unobserve( el );
			}
		}
		observer = new IntersectionObserver( innerCallback, { threshold: 0 } );
		observer.observe( el );
	}
}
