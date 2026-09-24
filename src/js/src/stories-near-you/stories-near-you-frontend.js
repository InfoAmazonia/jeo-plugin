import { __ } from '@wordpress/i18n';

( function () {
	const CONTAINER_SELECTOR = '.wp-block-jeo-stories-near-you';
	const REST_ENDPOINT = '/wp-json/jeo/v1/stories-near-you';
	const GEOLOCATION_TIMEOUT = 15000;
	const GEOLOCATION_OVERALL_TIMEOUT = 25000;
	const CONSENT_KEY = 'jeo_stories_near_you_consent';

	class BrowserGeolocationProvider {
		getLocation() {
			if ( ! navigator.geolocation ) {
				return Promise.reject( { error: 'not_supported' } );
			}

			const attemptPromise = this.tryGetCurrentPosition( true ).catch( ( e ) => {
				if ( e.error === 'denied' ) {
					throw e;
				}
				return this.tryGetCurrentPosition( false );
			} );

			const overallTimeoutPromise = new Promise( ( resolve, reject ) => {
				setTimeout( () => reject( { error: 'timeout' } ), GEOLOCATION_OVERALL_TIMEOUT );
			} );

			return Promise.race( [ attemptPromise, overallTimeoutPromise ] );
		}

		tryGetCurrentPosition( enableHighAccuracy ) {
			const precision = globalThis.jeo_snu_config?.geolocationPrecision || 2;

			return new Promise( ( resolve, reject ) => {
				navigator.geolocation.getCurrentPosition(
					( position ) => {
						resolve( {
							lat: Number.parseFloat( position.coords.latitude.toFixed( precision ) ),
							lng: Number.parseFloat( position.coords.longitude.toFixed( precision ) ),
						} );
					},
					( error ) => {
						if ( error.code === error.PERMISSION_DENIED ) {
							localStorage.removeItem( CONSENT_KEY );
							reject( { error: 'denied' } );
						} else {
							reject( { error: 'unavailable' } );
						}
					},
					{
						enableHighAccuracy,
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
			this.hasRendered = false;
			this.waterfallTrigger = null;
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

		setWaterfallTrigger( fn ) {
			this.waterfallTrigger = fn;
		}

		getRenderedPostIds() {
			return this.renderedPostIds;
		}

		getManualLocation() {
			const lat = parseFloat( this.attrs.lat );
			const lng = parseFloat( this.attrs.lng );
			if ( Number.isNaN( lat ) || Number.isNaN( lng ) ) {
				return null;
			}
			if ( lat === 0 && lng === 0 ) {
				return null;
			}
			return { lat, lng };
		}

		async init( location ) {
			if ( location !== undefined ) {
				await this.fetchAndRender( location );
				return;
			}

			const manualLocation = this.getManualLocation();
			if ( manualLocation ) {
				await this.fetchAndRender( manualLocation );
				return;
			}

			if ( ! navigator.geolocation ) {
				this.showError( 'not_supported' );
				return;
			}

			if ( localStorage.getItem( CONSENT_KEY ) === '1' ) {
				try {
					const loc = await this.geolocationProvider.getLocation();
					await this.fetchAndRender( loc );
				} catch ( e ) {
					this.showError( e?.error );
				}
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
			const hasManualLocation = this.getManualLocation() !== null;
			consentEl.innerHTML = `
				<p class="jeo-stories-near-you__consent-text">${ this.attrs.consentText || ( hasManualLocation ? 'Show stories near the configured location.' : 'Show stories near my current location.' ) }</p>
				<button type="button" class="jeo-stories-near-you__consent-button">${ this.attrs.consentButton || ( hasManualLocation ? 'Use configured location' : 'Use my location' ) }</button>
				<button type="button" class="jeo-stories-near-you__consent-skip">${ this.attrs.consentSkip || 'Skip' }</button>
			`;

			this.element.insertBefore( consentEl, this.element.querySelector( '.jeo-stories-near-you__error' ) );

			consentEl.querySelector( '.jeo-stories-near-you__consent-button' ).addEventListener( 'click', async () => {
				if ( this.waterfallTrigger ) {
					await this.waterfallTrigger();
					return;
				}
				localStorage.setItem( CONSENT_KEY, '1' );
				consentEl.remove();
				this.showSkeleton();
				try {
					const location = await this.geolocationProvider.getLocation();
					await this.fetchAndRender( location );
				} catch ( e ) {
					this.showError( e?.error );
				}
			} );

			consentEl.querySelector( '.jeo-stories-near-you__consent-skip' ).addEventListener( 'click', async () => {
				consentEl.remove();
				const manualLocation = this.getManualLocation();
				await this.fetchAndRender( manualLocation );
			} );
		}

		showSkeleton() {
			const skeleton = document.createElement( 'ul' );
			skeleton.className = 'wp-block-latest-posts__list jeo-stories-near-you__skeleton';
			if ( this.attrs.postLayout !== 'list' && this.attrs.postsPerRow ) {
				skeleton.classList.add( 'is-grid', 'columns-' + this.attrs.postsPerRow );
			}
			for ( let i = 0; i < ( this.attrs.postsPerPage || 3 ); i++ ) {
				const card = document.createElement( 'li' );
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
				'radius',
				'orderBy',
				'maxAgeDays',
				'distanceWeight',
				'dateWeight',
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
				this.hasRendered = true;
				this.renderResponse( data.html );
			} catch ( e ) {
				this.showError( 'network' );
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
				const errorRef = this.element.querySelector(
					'.jeo-stories-near-you__error'
				);
				while ( temp.firstChild ) {
					this.element.insertBefore( temp.firstChild, errorRef );
				}
			}
		}

		getErrorMessage( errorType ) {
			const messages = {
				denied: __( 'You denied location access. Please enable location permissions in your browser settings.', 'jeowp' ),
				unavailable: __( 'Your browser could not determine your location. This may be due to strict privacy settings or because GPS is unavailable on your device.', 'jeowp' ),
				timeout: __( 'Location request timed out. Please try again or use the configured location.', 'jeowp' ),
				not_supported: __( 'This browser does not support location services.', 'jeowp' ),
				network: __( 'Unable to load stories. Please check your connection and try again.', 'jeowp' ),
			};
			return messages[ errorType ] || __( 'Unable to load stories near you.', 'jeowp' );
		}

		showError( errorType ) {
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
				const messageEl = errorEl.querySelector( 'p' );
				if ( messageEl ) {
					messageEl.textContent = this.getErrorMessage( errorType );
				}
				errorEl.classList.remove( 'hidden' );
			}
		}
	}

	async function resolveSharedLocation( provider ) {
		if ( ! navigator.geolocation ) {
			throw { error: 'not_supported' };
		}

		if ( localStorage.getItem( CONSENT_KEY ) === '1' ) {
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
				const manual = instance.getManualLocation();
				instance.init( manual !== null ? manual : undefined );
			} );
			return;
		}

		const instances = [];
		let waterfallPromise = null;

		const triggerWaterfall = async () => {
			if ( waterfallPromise ) {
				return waterfallPromise;
			}

			localStorage.setItem( CONSENT_KEY, '1' );

			waterfallPromise = ( async () => {
				let location;
				try {
					location = await provider.getLocation();
				} catch ( e ) {
					for ( const inst of instances ) {
						const consentEl = inst.element.querySelector( '.jeo-stories-near-you__consent' );
						if ( consentEl ) {
							consentEl.remove();
						}
						const skeleton = inst.element.querySelector( '.jeo-stories-near-you__skeleton' );
						if ( skeleton ) {
							skeleton.remove();
						}
						inst.showError( e?.error );
					}
					return;
				}

				for ( const inst of instances ) {
					const consentEl = inst.element.querySelector( '.jeo-stories-near-you__consent' );
					if ( consentEl ) {
						consentEl.remove();
					}
					if ( ! inst.hasRendered && ! inst.element.querySelector( '.jeo-stories-near-you__skeleton' ) ) {
						inst.showSkeleton();
					}
				}

				const allRenderedIds = [];
				for ( const inst of instances ) {
					if ( inst.hasRendered ) {
						allRenderedIds.push( ...inst.getRenderedPostIds() );
						continue;
					}
					inst.setExcludeIds( allRenderedIds );
					await inst.fetchAndRender( location );
					const ids = inst.getRenderedPostIds();
					allRenderedIds.push( ...ids );
				}
			} )();

			return waterfallPromise;
		};

		for ( const element of elements ) {
			const instance = new StoriesNearYou( element, provider );
			instance.setWaterfallTrigger( triggerWaterfall );
			instances.push( instance );
		}

		let sharedError = null;
		const sharedLocation = await resolveSharedLocation( provider ).catch( ( error ) => {
			console.error( error );
			sharedError = error?.error || 'not_supported';
			return null;
		} );
		const allRenderedIds = [];

		if ( sharedLocation === null ) {
			for ( const instance of instances ) {
				instance.showError( sharedError );
			}
			return;
		}

		for ( const instance of instances ) {
			instance.setExcludeIds( allRenderedIds );
			const manual = instance.getManualLocation();
			await instance.init( manual !== null ? manual : sharedLocation );
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
