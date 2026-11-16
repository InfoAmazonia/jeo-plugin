import {
	getAiGateFlags,
	getAiSettingsUrl,
	getGateCopy,
	goToAiSettings,
} from './ai-gate';

describe( 'getAiGateFlags (Contract D, defensive read)', () => {
	afterEach( () => {
		delete globalThis.jeo;
		delete globalThis.jeoMapVars;
		delete globalThis.jeoContext;
	} );

	it( 'reads both flags from the jeo localize', () => {
		globalThis.jeo = { ai_configured: true, can_configure_ai: true };
		expect( getAiGateFlags() ).toEqual( {
			aiConfigured: true,
			canConfigureAi: true,
		} );
	} );

	it( 'falls back to jeoMapVars', () => {
		globalThis.jeoMapVars = { ai_configured: '1', can_configure_ai: '' };
		expect( getAiGateFlags() ).toEqual( {
			aiConfigured: true,
			canConfigureAi: false,
		} );
	} );

	it( 'handles loose boolean shapes from wp_localize_script', () => {
		globalThis.jeo = { ai_configured: 1, can_configure_ai: 0 };
		expect( getAiGateFlags() ).toEqual( {
			aiConfigured: true,
			canConfigureAi: false,
		} );
	} );

	it( 'defaults to the safe gate state when nothing is localized', () => {
		expect( getAiGateFlags() ).toEqual( {
			aiConfigured: false,
			canConfigureAi: false,
		} );
	} );
} );

describe( 'getAiSettingsUrl', () => {
	afterEach( () => {
		delete globalThis.jeo;
		delete globalThis.jeoMapVars;
	} );

	it( 'prefers an explicitly localized URL', () => {
		globalThis.jeo = { ai_settings_url: 'https://site.test/wp-admin/custom' };
		expect( getAiSettingsUrl() ).toBe(
			'https://site.test/wp-admin/custom'
		);
	} );

	it( 'derives from ajax_url when present', () => {
		globalThis.jeo = {
			ajax_url: 'https://site.test/wp-admin/admin-ajax.php',
		};
		expect( getAiSettingsUrl() ).toBe(
			'https://site.test/wp-admin/admin.php?page=jeo-ai-settings&tab=provider'
		);
	} );

	it( 'falls back to a relative admin path from the origin', () => {
		expect( getAiSettingsUrl() ).toContain(
			'/wp-admin/admin.php?page=jeo-ai-settings&tab=provider'
		);
	} );
} );

describe( 'getGateCopy (W4 §1 — single msgid per variant)', () => {
	it( 'interpolates the feature name into both variants', () => {
		const copy = getGateCopy( 'the AI-Assisted Map block' );
		expect( copy.title ).toBe( 'AI Provider Required' );
		expect( copy.messageAdmin ).toContain( 'the AI-Assisted Map block' );
		expect( copy.messageAdmin ).toMatch(
			/configure an AI Provider before you can use/
		);
		expect( copy.messageNonAdmin ).toContain( 'the AI-Assisted Map block' );
		expect( copy.messageNonAdmin ).toContain( 'site administrator' );
		expect( copy.ctaLabel ).toBe( 'Configure AI Provider' );
	} );
} );

describe( 'goToAiSettings', () => {
	afterEach( () => {
		delete globalThis.jeo;
	} );

	it( 'saveFirst + save ok → same tab navigation', async () => {
		const navigate = vi.fn();
		const openNewTab = vi.fn();
		const result = await goToAiSettings( {
			saveFirst: true,
			deps: {
				save: async () => {},
				hasSaveFailed: () => false,
				navigate,
				openNewTab,
			},
		} );
		expect( result ).toEqual( { navigated: true, viaNewTab: false } );
		expect( navigate ).toHaveBeenCalledTimes( 1 );
		expect( openNewTab ).not.toHaveBeenCalled();
	} );

	it( 'saveFirst + save failure → new tab (editor untouched)', async () => {
		const navigate = vi.fn();
		const openNewTab = vi.fn();
		const result = await goToAiSettings( {
			saveFirst: true,
			deps: {
				save: async () => {},
				hasSaveFailed: () => true,
				navigate,
				openNewTab,
			},
		} );
		expect( result ).toEqual( { navigated: true, viaNewTab: true } );
		expect( openNewTab ).toHaveBeenCalledTimes( 1 );
		expect( navigate ).not.toHaveBeenCalled();
	} );

	it( 'saveFirst + save throws → new tab', async () => {
		const openNewTab = vi.fn();
		const result = await goToAiSettings( {
			saveFirst: true,
			deps: {
				save: async () => {
					throw new Error( 'offline' );
				},
				openNewTab,
			},
		} );
		expect( result.viaNewTab ).toBe( true );
		expect( openNewTab ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'saveFirst: false → always a new tab', async () => {
		const openNewTab = vi.fn();
		const save = vi.fn();
		const result = await goToAiSettings( {
			saveFirst: false,
			deps: { save, openNewTab },
		} );
		expect( result.viaNewTab ).toBe( true );
		expect( save ).not.toHaveBeenCalled();
		expect( openNewTab ).toHaveBeenCalledTimes( 1 );
	} );
} );
