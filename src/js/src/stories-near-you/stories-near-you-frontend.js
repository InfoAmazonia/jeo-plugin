( function () {
	const CONTAINER_SELECTOR = '.wp-block-jeo-stories-near-you';
	const REST_ENDPOINT = '/wp-json/jeo/v1/stories-near-you';
	const GEOLOCATION_TIMEOUT = 10000;

	class BrowserGeolocationProvider {
		getLocation() {
			if ( ! navigator.geolocation ) {
				return Promise.resolve( null );
			}

			return new Promise( ( resolve ) => {
				navigator.geolocation.getCurrentPosition(
					( position ) => {
						resolve( {
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						} );
					},
					() => {
						resolve( null );
					},
					{
						enableHighAccuracy: false,
						timeout: GEOLOCATION_TIMEOUT,
						maximumAge: 300000,
					}
				);
			} );
		}
	}

	class StoriesNearYou {
		constructor( element, geolocationProvider ) {
			this.element = element;
			this.geolocationProvider = geolocationProvider;
			this.attrs = this.parseAttributes();
		}

		parseAttributes() {
			const script = this.element.querySelector(
				'.jeo-stories-near-you-attrs'
			);
			if ( ! script ) {
				return {};
			}
			try {
				return JSON.parse( script.textContent );
			} catch ( e ) {
				return {};
			}
		}

		async init() {
			const location = await this.geolocationProvider.getLocation();
			await this.fetchAndRender( location );
		}

		async fetchAndRender( location ) {
			const params = new URLSearchParams();

			if ( location ) {
				params.set( 'lat', location.lat );
				params.set( 'lng', location.lng );
			}

			const keys = [
				'postsPerPage',
				'postsPerRow',
				'category',
				'tag',
				'showThumbnail',
				'showCategory',
				'showDate',
				'showExcerpt',
				'showAuthor',
			];

			keys.forEach( ( key ) => {
				if ( this.attrs[ key ] !== undefined ) {
					params.set( key, this.attrs[ key ] );
				}
			} );

			try {
				const response = await fetch(
					REST_ENDPOINT + '?' + params.toString()
				);

				if ( ! response.ok ) {
					throw new Error( response.statusText );
				}

				const data = await response.json();
				this.renderResponse( data.html );
			} catch ( e ) {
				this.showError();
			}
		}

		renderResponse( html ) {
			const skeleton = this.element.querySelector(
				'.jeo-stories-near-you__skeleton'
			);
			const errorEl = this.element.querySelector(
				'.jeo-stories-near-you__error'
			);

			if ( skeleton ) {
				skeleton.remove();
			}

			if ( errorEl ) {
				errorEl.classList.add( 'hidden' );
			}

			if ( html ) {
				const temp = document.createElement( 'div' );
				temp.innerHTML = html;
				const grid = temp.firstElementChild;
				if ( grid ) {
					this.element.insertBefore(
						grid,
						this.element.querySelector(
							'.jeo-stories-near-you__error'
						)
					);
				}
			}
		}

		showError() {
			const skeleton = this.element.querySelector(
				'.jeo-stories-near-you__skeleton'
			);
			const errorEl = this.element.querySelector(
				'.jeo-stories-near-you__error'
			);

			if ( skeleton ) {
				skeleton.remove();
			}

			if ( errorEl ) {
				errorEl.classList.remove( 'hidden' );
			}
		}
	}

	function initAll() {
		const elements = document.querySelectorAll( CONTAINER_SELECTOR );
		const provider = new BrowserGeolocationProvider();

		elements.forEach( ( element ) => {
			const instance = new StoriesNearYou( element, provider );
			instance.init();
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initAll );
	} else {
		initAll();
	}
} )();
