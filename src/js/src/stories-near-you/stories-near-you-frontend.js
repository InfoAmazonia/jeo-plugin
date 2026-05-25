( function () {
	const CONTAINER_SELECTOR = '.wp-block-jeo-stories-near-you';
	const REST_ENDPOINT = '/wp-json/jeo/v1/stories-near-you';
	const GEOLOCATION_TIMEOUT = 10000;
	const CONSENT_KEY = 'jeo_stories_near_you_consent';

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
			this.excludeIds = [];
			this.renderedPostIds = [];
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

		setExcludeIds( ids ) {
			this.excludeIds = ids;
		}

		getRenderedPostIds() {
			return this.renderedPostIds;
		}

		async init( location ) {
			if ( location !== undefined ) {
				await this.fetchAndRender( location );
				return;
			}

			if ( ! navigator.geolocation ) {
				await this.fetchAndRender( null );
				return;
			}

			if ( window.localStorage && localStorage.getItem( CONSENT_KEY ) === '1' ) {
				const loc = await this.geolocationProvider.getLocation();
				await this.fetchAndRender( loc );
				return;
			}

			this.renderConsentPrompt();
		}

		renderConsentPrompt() {
			const skeleton = this.element.querySelector(
				'.jeo-stories-near-you__skeleton'
			);
			if ( skeleton ) {
				skeleton.remove();
			}

			const consentEl = document.createElement( 'div' );
			consentEl.className = 'jeo-stories-near-you__consent';
			consentEl.innerHTML = `
				<p class="jeo-stories-near-you__consent-text">${ this.attrs.consentText || 'Show stories near my current location.' }</p>
				<button type="button" class="jeo-stories-near-you__consent-button">${ this.attrs.consentButton || 'Use my location' }</button>
				<button type="button" class="jeo-stories-near-you__consent-skip">${ this.attrs.consentSkip || 'Skip' }</button>
			`;

			this.element.insertBefore( consentEl, this.element.querySelector( '.jeo-stories-near-you__error' ) );

			consentEl.querySelector( '.jeo-stories-near-you__consent-button' ).addEventListener( 'click', async () => {
				if ( window.localStorage ) {
					localStorage.setItem( CONSENT_KEY, '1' );
				}
				consentEl.remove();
				this.showSkeleton();
				const location = await this.geolocationProvider.getLocation();
				await this.fetchAndRender( location );
			} );

			consentEl.querySelector( '.jeo-stories-near-you__consent-skip' ).addEventListener( 'click', async () => {
				consentEl.remove();
				await this.fetchAndRender( null );
			} );
		}

		showSkeleton() {
			const skeleton = document.createElement( 'div' );
			skeleton.className = 'jeo-stories-near-you__skeleton jeo-stories-near-you__grid';
			if ( this.attrs.postsPerRow ) {
				skeleton.classList.add( 'jeo-stories-near-you__grid--cols-' + this.attrs.postsPerRow );
			}
			for ( let i = 0; i < ( this.attrs.postsPerPage || 3 ); i++ ) {
				const card = document.createElement( 'article' );
				card.className = 'jeo-stories-near-you__skeleton-card';
				card.innerHTML = '<div class="jeo-stories-near-you__skeleton-thumb"></div><div class="jeo-stories-near-you__skeleton-content"><div class="jeo-stories-near-you__skeleton-line jeo-stories-near-you__skeleton-line--title"></div></div>';
				skeleton.appendChild( card );
			}
			this.element.insertBefore( skeleton, this.element.querySelector( '.jeo-stories-near-you__error' ) );
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
				'showThumbnail',
				'showCategory',
				'showDate',
				'showExcerpt',
				'showAuthor',
				'postLayout',
				'mediaPosition',
				'imageShape',
				'excerptLength',
				'showReadMore',
				'readMoreLabel',
				'showAvatar',
				'colGap',
				'typeScale',
				'imageScale',
				'minHeight',
				'categories',
				'tags',
				'categoryExclusions',
				'tagExclusions',
				'customTaxonomies',
				'postType',
				'imageSize',
				'imageAsLink',
			];

			keys.forEach( ( key ) => {
				if ( this.attrs[ key ] !== undefined && this.attrs[ key ] !== '' ) {
					params.set( key, this.attrs[ key ] );
				}
			} );

			const serverExcludeIds = this.attrs.excludeIds || [];
			const allExclude = [ ...serverExcludeIds, ...this.excludeIds ];
			const uniqueExclude = [ ...new Set( allExclude.map( ( id ) => Number.parseInt( id, 10 ) ) ) ];
			if ( uniqueExclude.length ) {
				params.set( 'excludeIds', uniqueExclude.join( ',' ) );
			}

			try {
				const response = await fetch(
					REST_ENDPOINT + '?' + params.toString()
				);

				if ( ! response.ok ) {
					throw new Error( response.statusText );
				}

				const data = await response.json();
				this.renderedPostIds = [ ...this.renderedPostIds, ...( data.postIds || [] ) ];
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
				const content = temp.firstElementChild;
				if ( content ) {
					this.element.insertBefore(
						content,
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
			const consentEl = this.element.querySelector(
				'.jeo-stories-near-you__consent'
			);

			if ( skeleton ) {
				skeleton.remove();
			}
			if ( consentEl ) {
				consentEl.remove();
			}

			if ( errorEl ) {
				errorEl.classList.remove( 'hidden' );
			}
		}
	}

	async function resolveSharedLocation( provider ) {
		if ( ! navigator.geolocation ) {
			return null;
		}

		if ( window.localStorage && localStorage.getItem( CONSENT_KEY ) === '1' ) {
			return provider.getLocation();
		}

		return undefined;
	}

	async function initAll() {
		const elements = document.querySelectorAll( CONTAINER_SELECTOR );
		const provider = new BrowserGeolocationProvider();

		if ( elements.length <= 1 ) {
			elements.forEach( ( element ) => {
				const instance = new StoriesNearYou( element, provider );
				instance.init();
			} );
			return;
		}

		const sharedLocation = await resolveSharedLocation( provider );
		const allRenderedIds = [];

		for ( const element of elements ) {
			const instance = new StoriesNearYou( element, provider );
			instance.setExcludeIds( allRenderedIds );
			await instance.init( sharedLocation );
			const ids = instance.getRenderedPostIds();
			allRenderedIds.push( ...ids );
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initAll );
	} else {
		initAll();
	}
} )();
