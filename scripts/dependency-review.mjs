#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const PACKAGE_LOCK_PATH = path.join(ROOT, 'package-lock.json');
const COMPOSER_JSON_PATH = path.join(ROOT, 'composer.json');
const COMPOSER_LOCK_PATH = path.join(ROOT, 'composer.lock');
const OVERRIDES_PATH = path.join(ROOT, 'scripts', 'dependency-review.overrides.json');
const REPORT_MD_PATH = path.join(ROOT, 'docs', 'dev', 'dependency-upgrade-report.md');
const REPORT_JSON_PATH = path.join(ROOT, 'docs', 'dev', 'dependency-upgrade-report.json');

const WRITE_MODE = process.argv.includes('--write');

const MAINTENANCE_LABELS = {
	maintained: 'Maintained',
	deprecated: 'Deprecated',
	'deprecated-archived': 'Deprecated and archived',
	'looking-for-maintainers': 'Low activity / looking for maintainers',
	'peer-mismatch': 'Maintained upstream, but current tree has a peer warning',
	'review-manually': 'Needs manual review',
};

const DECISION_LABELS = {
	replace: 'Replace instead of upgrading in place',
	review: 'Review manually before taking the next batch',
	watch: 'Watch via the parent package batch',
};

const EXECUTION_STATUS_LABELS = {
	planned: 'Planned',
	'tracking-only': 'Tracking only',
	'deferred-replacement-track': 'Deferred replacement track',
	'watch-via-parent-batch': 'Watch via parent batch',
	'ready-for-approval': 'Ready for approval',
	blocked: 'Blocked',
	completed: 'Completed',
	deferred: 'Deferred',
	passed: 'Passed',
	failed: 'Failed',
	skipped: 'Skipped',
};

function commandVersion( command, args = [ '--version' ] ) {
	const result = spawnSync( command, args, {
		cwd: ROOT,
		encoding: 'utf8',
	} );

	if ( result.status !== 0 ) {
		return null;
	}

	const output = `${ result.stdout || '' }\n${ result.stderr || '' }`.trim();

	return output ? output.split( '\n' )[0] : null;
}

function buildBaseline( overrides ) {
	const composerVersion = commandVersion( 'composer' );
	const phpVersion = commandVersion( 'php', [ '-v' ] );
	const toolingCaveats = [];

	if ( composerVersion && phpVersion ) {
		toolingCaveats.push(
			`Local Composer/PHP validation is available in this shell environment (${ composerVersion }; ${ phpVersion }).`
		);
	} else if ( composerVersion ) {
		toolingCaveats.push(
			`Composer is available locally (${ composerVersion }), but PHP was not detected in the current shell environment.`
		);
	} else if ( phpVersion ) {
		toolingCaveats.push(
			`PHP is available locally (${ phpVersion }), but Composer was not detected in the current shell environment.`
		);
	} else {
		toolingCaveats.push(
			'Composer and PHP are not available in the current shell environment, so the report uses composer.lock plus Packagist metadata instead of composer outdated/audit commands.'
		);
	}

	toolingCaveats.push(
		'The npm and Packagist lookups require network access when the report is regenerated.'
	);

	return {
		...overrides.baseline,
		toolingCaveats,
		localValidation: {
			phpAvailable: Boolean( phpVersion ),
			phpVersion,
			composerAvailable: Boolean( composerVersion ),
			composerVersion,
		},
	};
}

function normalizeVersion(rawVersion) {
	if ( ! rawVersion ) {
		return null;
	}

	return String( rawVersion ).trim().replace( /^v/i, '' );
}

function parseVersion(rawVersion) {
	const version = normalizeVersion( rawVersion );

	if ( ! version ) {
		return null;
	}

	const match = version.match( /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/ );

	if ( ! match ) {
		return null;
	}

	return {
		raw: version,
		major: Number( match[1] ),
		minor: Number( match[2] ),
		patch: Number( match[3] ),
		preRelease: match[4] ? match[4].split( '.' ) : [],
	};
}

function compareIdentifiers( left, right ) {
	const leftNumeric = /^\d+$/.test( left );
	const rightNumeric = /^\d+$/.test( right );

	if ( leftNumeric && rightNumeric ) {
		return Number( left ) - Number( right );
	}

	if ( leftNumeric ) {
		return -1;
	}

	if ( rightNumeric ) {
		return 1;
	}

	return left.localeCompare( right );
}

function compareVersions( leftRaw, rightRaw ) {
	const left = parseVersion( leftRaw );
	const right = parseVersion( rightRaw );

	if ( ! left || ! right ) {
		return String( leftRaw || '' ).localeCompare( String( rightRaw || '' ) );
	}

	if ( left.major !== right.major ) {
		return left.major - right.major;
	}

	if ( left.minor !== right.minor ) {
		return left.minor - right.minor;
	}

	if ( left.patch !== right.patch ) {
		return left.patch - right.patch;
	}

	if ( left.preRelease.length === 0 && right.preRelease.length === 0 ) {
		return 0;
	}

	if ( left.preRelease.length === 0 ) {
		return 1;
	}

	if ( right.preRelease.length === 0 ) {
		return -1;
	}

	const maxLength = Math.max( left.preRelease.length, right.preRelease.length );

	for ( let index = 0; index < maxLength; index += 1 ) {
		const leftIdentifier = left.preRelease[ index ];
		const rightIdentifier = right.preRelease[ index ];

		if ( leftIdentifier === undefined ) {
			return -1;
		}

		if ( rightIdentifier === undefined ) {
			return 1;
		}

		const comparison = compareIdentifiers( leftIdentifier, rightIdentifier );

		if ( comparison !== 0 ) {
			return comparison;
		}
	}

	return 0;
}

function isStableVersion( rawVersion ) {
	const parsed = parseVersion( rawVersion );

	return Boolean( parsed ) && parsed.preRelease.length === 0;
}

function sortDescending( versions ) {
	return [ ...versions ].sort( ( left, right ) => compareVersions( right, left ) );
}

function uniqueSorted( versions ) {
	return sortDescending(
		[ ...new Set( versions.map( ( version ) => normalizeVersion( version ) ).filter( Boolean ) ) ]
	);
}

function getUpperBoundForCaret( baseVersion ) {
	const parsed = parseVersion( baseVersion );

	if ( ! parsed ) {
		return null;
	}

	if ( parsed.major > 0 ) {
		return `${ parsed.major + 1 }.0.0`;
	}

	if ( parsed.minor > 0 ) {
		return `0.${ parsed.minor + 1 }.0`;
	}

	return `0.0.${ parsed.patch + 1 }`;
}

function isWithinCaretRange( version, baseVersion ) {
	const upperBound = getUpperBoundForCaret( baseVersion );

	if ( ! upperBound ) {
		return false;
	}

	return compareVersions( version, baseVersion ) >= 0 && compareVersions( version, upperBound ) < 0;
}

function highestVersion( versions ) {
	return sortDescending( versions )[0] || null;
}

function highestSameMajor( versions, referenceVersion ) {
	const reference = parseVersion( referenceVersion );

	if ( ! reference ) {
		return null;
	}

	return highestVersion(
		versions.filter( ( version ) => {
			const parsed = parseVersion( version );
			return parsed && parsed.major === reference.major;
		} )
	);
}

function computeLatestCompatibleNpm( declaredRange, resolvedVersion, allVersions ) {
	const stableVersions = uniqueSorted( allVersions.filter( isStableVersion ) );

	if ( declaredRange === '*' || declaredRange === 'transitive' ) {
		return highestSameMajor( stableVersions, resolvedVersion ) || highestVersion( stableVersions );
	}

	if ( declaredRange.startsWith( '^' ) ) {
		const baseVersion = normalizeVersion( declaredRange.slice( 1 ) );
		return highestVersion(
			stableVersions.filter( ( version ) => isWithinCaretRange( version, baseVersion ) )
		);
	}

	const exactVersion = normalizeVersion( declaredRange );

	return stableVersions.find( ( version ) => version === exactVersion ) || exactVersion;
}

function computeLatestCompatibleComposer( declaredRange, resolvedVersion, allVersions ) {
	const stableVersions = uniqueSorted( allVersions.filter( isStableVersion ) );

	if ( ! declaredRange || declaredRange === '*' || declaredRange === 'transitive' ) {
		return highestSameMajor( stableVersions, resolvedVersion ) || highestVersion( stableVersions );
	}

	if ( declaredRange.startsWith( '^' ) ) {
		const baseVersion = normalizeVersion( declaredRange.slice( 1 ) );
		return highestVersion(
			stableVersions.filter( ( version ) => isWithinCaretRange( version, baseVersion ) )
		);
	}

	const exactVersion = normalizeVersion( declaredRange );

	return stableVersions.find( ( version ) => version === exactVersion ) || exactVersion;
}

function packageScope( packageName, dependencyType ) {
	if (
		[
			'@wordpress/scripts',
			'webpack',
			'css-loader',
			'postcss',
			'sass',
			'sass-loader',
			'style-loader',
			'ajv',
		].includes( packageName )
	) {
		return {
			scope: 'Build tooling',
			impact: 'Asset compilation, webpack config and CI reproducibility on Node 20',
		};
	}

	if ( packageName.startsWith( '@wordpress/' ) ) {
		return {
			scope: 'Gutenberg / editor',
			impact: 'Node 20 build pipeline, Gutenberg editor runtime and React peer alignment',
		};
	}

	if ( packageName === '@ckeditor/ckeditor5-react' || packageName === 'ckeditor5' ) {
		return {
			scope: 'Storymap editor',
			impact: 'CKEditor runtime inside storymap editing flows',
		};
	}

	if (
		[
			'leaflet',
			'map-gl-utils',
			'mapbox-gl',
			'maplibre-gl',
			'maplibregl-mapbox-request-transformer',
			'react-leaflet',
			'react-map-gl',
			'@nazka/map-gl-js-spiderfy',
		].includes( packageName )
	) {
		return {
			scope: 'Map rendering',
			impact: 'Frontend maps, editor previews, Mapbox/MapLibre runtime compatibility',
		};
	}

	if ( dependencyType.startsWith( 'composer' ) ) {
		return {
			scope: 'PHP tooling',
			impact: 'Developer-only PHPCS/WPCS checks; validate PHP 8.0 and WPCS compatibility before majors',
		};
	}

	return {
		scope: dependencyType === 'devDependency' ? 'UI / helper (dev-adjacent)' : 'UI / helper',
		impact: 'Browser runtime and React-driven editor UI behavior',
	};
}

function markdownEscape( value ) {
	return String( value ?? '' )
		.replaceAll( '|', '\\|' )
		.replaceAll( '\n', '<br>' );
}

function markdownCodeList( values ) {
	if ( ! values || values.length === 0 ) {
		return '-';
	}

	return values.map( ( value ) => `\`${ markdownEscape( value ) }\`` ).join( '<br>' );
}

function markdownLinkList( values ) {
	if ( ! values || values.length === 0 ) {
		return '-';
	}

	return values
		.map( ( entry ) => `[${ markdownEscape( entry.label ) }](${ entry.url })` )
		.join( '<br>' );
}

function formatDate( value ) {
	if ( ! value ) {
		return null;
	}

	return new Date( value ).toISOString().slice( 0, 10 );
}

function normalizeRepositoryUrl( repositoryUrl ) {
	return repositoryUrl
		.replace( /^git\+/, '' )
		.replace( /^git:\/\//, 'https://' )
		.replace( /^ssh:\/\/git@github\.com\//, 'https://github.com/' )
		.replace( /^git@github\.com:/, 'https://github.com/' )
		.replace( /\.git$/, '' );
}

function searchUsage( item, override = {} ) {
	const packageName = item.packageName;
	const searchTerms = override.searchTerms || [ packageName ];
	const matchedFiles = new Set();
	const searchRoots =
		override.searchRoots ||
		( item.ecosystem === 'composer'
			? [ 'composer.json', 'composer.lock', 'phpcs.xml.dist', '.github' ]
			: [ 'src/js/src', 'src/includes', 'src/templates', 'webpack.config.js', 'package.json', '.github', 'src/README.txt' ] );

	for ( const term of searchTerms ) {
		const search = spawnSync(
			'rg',
			[
				'-l',
				'-F',
				term,
				...searchRoots,
			],
			{
				cwd: ROOT,
				encoding: 'utf8',
			}
		);

		if ( search.status !== 0 && ! search.stdout ) {
			continue;
		}

		for ( const file of search.stdout.split( '\n' ).map( ( line ) => line.trim() ).filter( Boolean ) ) {
			if ( ! file.startsWith( 'docs/dev/dependency-upgrade-report' ) ) {
				matchedFiles.add( file );
			}
		}
	}

	return [ ...new Set( [ ...( override.usage || [] ), ...matchedFiles ] ) ].slice( 0, 4 );
}

function repositoryUrlFromNpmPackument( packument, latestVersion ) {
	const latestManifest = packument.versions?.[ latestVersion ] || {};
	const repository = latestManifest.repository || packument.repository;
	const repositoryUrl = typeof repository === 'string' ? repository : repository?.url;

	if ( ! repositoryUrl ) {
		return null;
	}

	return normalizeRepositoryUrl( repositoryUrl );
}

function defaultNpmEvidence( packageName, meta ) {
	const evidence = [
		{
			label: 'npm',
			url: `https://www.npmjs.com/package/${ packageName }`,
		},
	];

	if ( meta.repositoryUrl ) {
		evidence.push( {
			label: 'Repository',
			url: meta.repositoryUrl,
		} );
	}

	return evidence;
}

function defaultComposerEvidence( packageName, meta ) {
	const evidence = [
		{
			label: 'Packagist',
			url: `https://packagist.org/packages/${ packageName }`,
		},
	];

	if ( meta.repositoryUrl ) {
		evidence.push( {
			label: 'Repository',
			url: meta.repositoryUrl,
		} );
	}

	return evidence;
}

function maintenanceLabel( override, meta ) {
	if ( override?.maintenanceStatus ) {
		return MAINTENANCE_LABELS[ override.maintenanceStatus ] || override.maintenanceStatus;
	}

	if ( meta.deprecatedMessage ) {
		return 'Deprecated';
	}

	return 'Maintained';
}

function deriveMinorPath( item, override ) {
	if ( override?.minorPath ) {
		return override.minorPath;
	}

	if ( ! item.latestCompatible ) {
		return 'Unavailable';
	}

	if ( compareVersions( item.latestCompatible, item.resolvedVersion ) > 0 ) {
		return `Update to ${ item.latestCompatible }`;
	}

	return 'Already on the latest compatible line';
}

function deriveMajorPath( item, override ) {
	if ( override?.majorPath ) {
		return override.majorPath;
	}

	if ( ! item.latestVersion ) {
		return 'Unavailable';
	}

	const latestMajor = parseVersion( item.latestVersion )?.major;
	const resolvedMajor = parseVersion( item.resolvedVersion )?.major;

	if ( latestMajor !== undefined && resolvedMajor !== undefined && latestMajor > resolvedMajor ) {
		return `Review upgrade path to ${ item.latestVersion }`;
	}

	return 'No newer major detected';
}

function deriveDecision( item, override ) {
	if ( override?.decision ) {
		return DECISION_LABELS[ override.decision ] || override.decision;
	}

	if ( ! item.latestCompatible && ! item.latestVersion ) {
		return 'Collect metadata manually';
	}

	if ( item.latestCompatible && compareVersions( item.latestCompatible, item.resolvedVersion ) > 0 ) {
		return 'Candidate for the minor batch';
	}

	if ( item.latestVersion && compareVersions( item.latestVersion, item.resolvedVersion ) > 0 ) {
		return 'Hold for the major batch';
	}

	return 'Keep current version';
}

function collectNpmInventory( packageJson, packageLock ) {
	const directDependencies = [];

	for ( const dependencyType of [ 'dependencies', 'devDependencies' ] ) {
		for ( const [ packageName, declaredRange ] of Object.entries( packageJson[ dependencyType ] || {} ) ) {
			const lockEntry = packageLock.packages?.[ `node_modules/${ packageName }` ];

			directDependencies.push( {
				ecosystem: 'npm',
				dependencyType: dependencyType === 'dependencies' ? 'dependency' : 'devDependency',
				packageName,
				declaredRange,
				resolvedVersion: normalizeVersion( lockEntry?.version ) || null,
			} );
		}
	}

	return directDependencies;
}

function collectComposerInventory( composerJson, composerLock ) {
	const direct = [];
	const directNames = new Set();

	for ( const section of [ 'require', 'require-dev' ] ) {
		for ( const [ packageName, declaredRange ] of Object.entries( composerJson[ section ] || {} ) ) {
			directNames.add( packageName );

			const lockSection = section === 'require' ? 'packages' : 'packages-dev';
			const lockEntry = ( composerLock[ lockSection ] || [] ).find( ( entry ) => entry.name === packageName );

			direct.push( {
				ecosystem: 'composer',
				dependencyType: section === 'require' ? 'composerDependency' : 'composerDevDependency',
				packageName,
				declaredRange,
				resolvedVersion: normalizeVersion( lockEntry?.version ) || null,
				parentPackage: null,
			} );
		}
	}

	const transitive = [];

	for ( const section of [ 'packages', 'packages-dev' ] ) {
		for ( const entry of composerLock[ section ] || [] ) {
			if ( directNames.has( entry.name ) ) {
				continue;
			}

			transitive.push( {
				ecosystem: 'composer',
				dependencyType: section === 'packages' ? 'composerTransitive' : 'composerTransitiveDev',
				packageName: entry.name,
				declaredRange: 'transitive',
				resolvedVersion: normalizeVersion( entry.version ) || null,
				parentPackage: null,
			} );
		}
	}

	return { direct, transitive };
}

function collectNpmWatchlist( overrides ) {
	return Object.entries( overrides.transitiveWatchlist?.npm || {} ).map( ( [ packageName, config ] ) => ( {
		ecosystem: 'npm',
		dependencyType: 'transitiveWatchlist',
		packageName,
		declaredRange: 'transitive',
		resolvedVersion: null,
		override: config,
	} ) );
}

function resolvePackageLockVersion( packageLock, packageName ) {
	return normalizeVersion( packageLock.packages?.[ `node_modules/${ packageName }` ]?.version ) || null;
}

async function fetchJson( url ) {
	const response = await fetch( url, {
		headers: {
			Accept: 'application/json',
			'User-Agent': 'jeo-dependency-review/1.0',
		},
	} );

	if ( ! response.ok ) {
		throw new Error( `${ response.status } ${ response.statusText }` );
	}

	return response.json();
}

async function fetchNpmMetadata( packageName, declaredRange, resolvedVersion ) {
	const packument = await fetchJson( `https://registry.npmjs.org/${ encodeURIComponent( packageName ) }` );
	const allVersions = Object.keys( packument.versions || {} )
		.map( normalizeVersion )
		.filter( Boolean );
	const latestVersion = normalizeVersion( packument[ 'dist-tags' ]?.latest );
	const latestCompatible = computeLatestCompatibleNpm( declaredRange, resolvedVersion, allVersions );
	const resolvedManifest = packument.versions?.[ resolvedVersion ] || {};
	const latestManifest = packument.versions?.[ latestVersion ] || {};
	const deprecatedMessage = resolvedManifest.deprecated || latestManifest.deprecated || null;

	return {
		latestVersion,
		latestCompatible,
		lastPublished: formatDate( packument.time?.[ latestVersion ] ),
		deprecatedMessage,
		repositoryUrl: repositoryUrlFromNpmPackument( packument, latestVersion ),
	};
}

async function fetchComposerMetadata( packageName, declaredRange, resolvedVersion ) {
	const packument = await fetchJson( `https://repo.packagist.org/p2/${ packageName }.json` );
	const versions = packument.packages?.[ packageName ] || [];
	const stableVersions = versions
		.map( ( version ) => normalizeVersion( version.version ) )
		.filter( isStableVersion );
	const latestVersion = normalizeVersion(
		versions.find( ( version ) => isStableVersion( version.version ) )?.version || null
	);
	const latestCompatible = computeLatestCompatibleComposer( declaredRange, resolvedVersion, stableVersions );
	const latestEntry = versions.find( ( version ) => normalizeVersion( version.version ) === latestVersion );
	const repositoryUrl = latestEntry?.source?.url ? normalizeRepositoryUrl( latestEntry.source.url ) : null;

	return {
		latestVersion,
		latestCompatible,
		lastPublished: formatDate( latestEntry?.time ),
		deprecatedMessage: null,
		repositoryUrl,
	};
}

function resolveInstalledNpmVersion( packageName ) {
	const lookup = spawnSync( 'npm', [ 'ls', packageName, '--all', '--json' ], {
		cwd: ROOT,
		encoding: 'utf8',
	} );

	if ( ! lookup.stdout ) {
		return null;
	}

	try {
		const parsed = JSON.parse( lookup.stdout );
		return findDependencyVersion( parsed, packageName );
	} catch ( error ) {
		return null;
	}
}

function findDependencyVersion( tree, packageName ) {
	if ( ! tree || ! tree.dependencies ) {
		return null;
	}

	if ( tree.dependencies[ packageName ]?.version ) {
		return normalizeVersion( tree.dependencies[ packageName ].version );
	}

	for ( const dependency of Object.values( tree.dependencies ) ) {
		const nestedVersion = findDependencyVersion( dependency, packageName );

		if ( nestedVersion ) {
			return nestedVersion;
		}
	}

	return null;
}

function rowFromItem( item, metadata, overrides, extra = {} ) {
	const override =
		item.dependencyType === 'transitiveWatchlist'
			? item.override
			: overrides[ item.ecosystem ]?.[ item.packageName ] || {};
	const scope = packageScope( item.packageName, item.dependencyType );
	const usage = searchUsage( item, override );
	const evidence =
		override.evidence ||
		( item.ecosystem === 'npm'
			? defaultNpmEvidence( item.packageName, metadata )
			: defaultComposerEvidence( item.packageName, metadata ) );
	const itemWithVersions = {
		...item,
		latestCompatible: metadata.latestCompatible || null,
		latestVersion: metadata.latestVersion || null,
	};
	const minorPath = deriveMinorPath( itemWithVersions, override );
	const majorPath = deriveMajorPath( itemWithVersions, override );
	const decision = deriveDecision( itemWithVersions, override );
	const tracking = deriveExecutionTracking( item, decision, override, overrides );

	return {
		...item,
		...extra,
		scope: scope.scope,
		impact: override.impact || scope.impact,
		latestCompatible: metadata.latestCompatible || null,
		latestVersion: metadata.latestVersion || null,
		lastPublished: metadata.lastPublished || null,
		deprecatedMessage: metadata.deprecatedMessage || null,
		maintenance: maintenanceLabel( override, metadata ),
		minorPath,
		majorPath,
		decision,
		batchId: tracking.batchId,
		batchLabel: tracking.batchLabel,
		executionStatus: tracking.executionStatus,
		executionStatusLabel: tracking.executionStatusLabel,
		executionNotes: tracking.executionNotes,
		evidence,
		usage,
		replacement: override.replacement || null,
		notes: [ ...( override.notes || [] ) ],
	};
}

function asTable( rows ) {
	const header = [
		'Package',
		'Type',
		'Declared / Resolved',
		'Latest compatible',
		'Latest major',
		'Maintenance',
		'Impact',
		'Decision',
		'Batch',
		'Execution',
		'Evidence',
		'Usage',
	];
	const separator = header.map( () => '---' );
	const body = rows.map( ( row ) => [
		markdownEscape( row.packageName ),
		markdownEscape( row.scope ),
		markdownEscape( `${ row.declaredRange } -> ${ row.resolvedVersion || 'Unavailable' }` ),
		markdownEscape( row.minorPath ),
		markdownEscape( row.majorPath ),
		markdownEscape(
			row.lastPublished ? `${ row.maintenance } (latest published ${ row.lastPublished })` : row.maintenance
		),
		markdownEscape( row.impact ),
		markdownEscape( row.decision ),
		markdownEscape( row.batchLabel ),
		markdownEscape( row.executionStatusLabel ),
		markdownLinkList( row.evidence ),
		markdownCodeList( row.usage ),
	] );

	return [ header, separator, ...body ].map( ( row ) => `| ${ row.join( ' | ' ) } |` ).join( '\n' );
}

function renderSmokeTests( smokeTests ) {
	return smokeTests
		.map(
			( smokeTest ) =>
				`- **${ smokeTest.title }**: ${ smokeTest.expected }`
		)
		.join( '\n' );
}

function renderNonMaintainedList( rows ) {
	const riskyRows = rows.filter( ( row ) =>
		[ 'Deprecated', 'Deprecated and archived', 'Low activity / looking for maintainers' ].includes(
			row.maintenance
		)
	);

	if ( riskyRows.length === 0 ) {
		return '- None flagged in the current snapshot.';
	}

	return riskyRows
		.map( ( row ) => {
			const replacement = row.replacement ? ` Replacement target: ${ row.replacement }.` : '';
			const minorPath = row.minorPath.replace( /\.+$/, '' );
			const majorPath = row.majorPath.replace( /\.+$/, '' );
			return `- **${ row.packageName }**: ${ row.maintenance }. Minor path: ${ minorPath }. Major path: ${ majorPath }.${ replacement }`;
		} )
		.join( '\n' );
}

function renderWatchlist( rows ) {
	if ( rows.length === 0 ) {
		return '- No transitive watchlist entries configured.';
	}

	return asTable( rows );
}

function executionStatusLabel( executionStatus ) {
	return EXECUTION_STATUS_LABELS[ executionStatus ] || executionStatus || '-';
}

function batchLookup( overrides ) {
	return new Map( ( overrides.batches || [] ).map( ( batch ) => [ batch.id, batch ] ) );
}

function findBatchByPackageName( packageName, overrides ) {
	return ( overrides.batches || [] ).find( ( batch ) => ( batch.packageNames || [] ).includes( packageName ) ) || null;
}

function defaultBatchIdForDecision( decision ) {
	if ( decision === 'Replace instead of upgrading in place' ) {
		return 'deferred-replacement-track';
	}

	if ( decision === 'Watch via the parent package batch' ) {
		return 'watch-parent-batch';
	}

	return 'monitor-current-line';
}

function batchLabelForRow( batchId, overrides ) {
	if ( ! batchId ) {
		return '-';
	}

	if ( batchId === 'monitor-current-line' ) {
		return 'Monitor';
	}

	if ( batchId === 'watch-parent-batch' ) {
		return 'Watch';
	}

	const batch = batchLookup( overrides ).get( batchId );

	return batch?.phase || batchId;
}

function deriveExecutionTracking( item, decision, override, overrides ) {
	const explicitBatch = override.batchId ? batchLookup( overrides ).get( override.batchId ) || null : null;
	const matchedBatch = explicitBatch || findBatchByPackageName( item.packageName, overrides );
	const batchId = override.batchId || matchedBatch?.id || defaultBatchIdForDecision( decision );
	let executionStatus = override.executionStatus || null;

	if ( ! executionStatus ) {
		if ( decision === 'Replace instead of upgrading in place' ) {
			executionStatus = 'deferred-replacement-track';
		} else if ( decision === 'Watch via the parent package batch' ) {
			executionStatus = 'watch-via-parent-batch';
		} else if ( matchedBatch || batchId.startsWith( 'phase-' ) ) {
			executionStatus = 'planned';
		} else {
			executionStatus = 'tracking-only';
		}
	}

	return {
		batchId,
		batchLabel: batchLabelForRow( batchId, overrides ),
		executionStatus,
		executionStatusLabel: executionStatusLabel( executionStatus ),
		executionNotes: [ ...( override.executionNotes || [] ) ],
	};
}

function renderInlineList( values, { code = false } = {} ) {
	if ( ! values || values.length === 0 ) {
		return 'None';
	}

	return values
		.map( ( value ) => ( code ? `\`${ value }\`` : value ) )
		.join( ', ' );
}

function trimTrailingPeriods( value ) {
	return String( value || '' ).replace( /\.+$/, '' );
}

function renderBatchPlan( batches ) {
	if ( ! batches || batches.length === 0 ) {
		return '- No batches configured.';
	}

	return batches
		.map( ( batch ) => {
			const packages = renderInlineList( batch.packageNames || [], { code: true } );
			const automatedChecks = renderInlineList( batch.automatedChecks || [], { code: true } );
			const manualReviewItems = trimTrailingPeriods( renderInlineList( batch.manualReviewItems || [] ) );
			const approvalNotes = trimTrailingPeriods( renderInlineList( batch.approvalNotes || [] ) );
			const approvalSuffix = approvalNotes === 'None' ? '' : ` Approval notes: ${ approvalNotes }.`;

			return `- **${ batch.phase } - ${ batch.title }** (${ executionStatusLabel( batch.status ) }): ${ batch.scope } Packages: ${ packages }. Automated checks: ${ automatedChecks }. Manual review: ${ manualReviewItems }.${ approvalSuffix }`;
		} )
		.join( '\n' );
}

function renderExecutionCheck( check ) {
	const detail = check.details ? ` (${ check.details })` : '';
	return `${ check.name }: ${ executionStatusLabel( check.status ) }${ detail }`;
}

function renderExecutionLog( executionLog, batches ) {
	if ( ! executionLog || executionLog.length === 0 ) {
		return '- No execution logged yet.';
	}

	const lookup = new Map( ( batches || [] ).map( ( batch ) => [ batch.id, batch ] ) );

	return executionLog
		.map( ( entry ) => {
			const batch = lookup.get( entry.batchId );
			const batchLabel = batch ? `${ batch.phase } - ${ batch.title }` : entry.batchId;
			const automatedChecks = renderInlineList(
				( entry.automatedChecks || [] ).map( renderExecutionCheck )
			);
			const manualReviewItems = renderInlineList( entry.manualReviewItems || [] );
			const documentUpdates = renderInlineList( entry.documentUpdates || [], { code: true } );

			return `- **${ entry.date } - ${ batchLabel }** (${ executionStatusLabel( entry.status ) }): ${ entry.summary } Automated checks: ${ automatedChecks }. Manual review: ${ manualReviewItems }. Documents updated: ${ documentUpdates }.`;
		} )
		.join( '\n' );
}

function renderNotes( rows ) {
	const notes = rows
		.flatMap( ( row ) =>
			[
				...( row.notes || [] ).map( ( note ) => `- **${ row.packageName }**: ${ note }` ),
				...( row.executionNotes || [] ).map(
					( note ) => `- **${ row.packageName }**: Execution: ${ note }`
				),
			]
		);

	return notes.length > 0 ? notes.join( '\n' ) : '- No package-specific notes captured.';
}

function renderMarkdownReport( report ) {
	const generatedDate = report.generatedAt.slice( 0, 10 );

	return `# Dependency Upgrade Review

Generated on ${ generatedDate }.

## Baseline

- Platform baseline: WordPress ${ report.baseline.wordpress }, PHP ${ report.baseline.php }, Node ${ report.baseline.node }.
- Source files: ${ report.baseline.sources.map( ( source ) => `\`${ source }\`` ).join( ', ' ) }.
- Current scope: ${ report.summary.directNpm } direct npm runtime packages, ${ report.summary.directNpmDev } direct npm development packages, ${ report.summary.directComposer } direct Composer packages and ${ report.summary.transitiveComposer } transitive Composer packages.

### Tooling notes

${ report.baseline.notes.map( ( note ) => `- ${ note }` ).join( '\n' ) }

### Local validation

- PHP: ${ report.baseline.localValidation.phpAvailable ? report.baseline.localValidation.phpVersion : 'Unavailable in the current shell environment' }.
- Composer: ${ report.baseline.localValidation.composerAvailable ? report.baseline.localValidation.composerVersion : 'Unavailable in the current shell environment' }.

### Environment caveats

${ report.baseline.toolingCaveats.map( ( note ) => `- ${ note }` ).join( '\n' ) }

## Phase plan

${ renderBatchPlan( report.batches ) }

## Execution log

${ renderExecutionLog( report.executionLog, report.batches ) }

## Non-maintained or high-risk package lines

${ renderNonMaintainedList( report.rows.npm ) }

## npm direct dependencies

${ asTable( report.rows.npm ) }

## Composer direct and transitive dependencies

${ asTable( report.rows.composer ) }

## Transitive watchlist

${ renderWatchlist( report.rows.watchlist ) }

## Smoke tests for each batch

Detailed checklist: \`docs/dev/dependency-upgrade-smoke-tests.md\`.

${ renderSmokeTests( report.smokeTests ) }

## Package notes

${ renderNotes( [ ...report.rows.npm, ...report.rows.composer, ...report.rows.watchlist ] ) }
`;
}

async function readInputs() {
	const [ packageJson, packageLock, composerJson, composerLock, overrides ] = await Promise.all( [
		fs.readFile( PACKAGE_JSON_PATH, 'utf8' ).then( JSON.parse ),
		fs.readFile( PACKAGE_LOCK_PATH, 'utf8' ).then( JSON.parse ),
		fs.readFile( COMPOSER_JSON_PATH, 'utf8' ).then( JSON.parse ),
		fs.readFile( COMPOSER_LOCK_PATH, 'utf8' ).then( JSON.parse ),
		fs.readFile( OVERRIDES_PATH, 'utf8' ).then( JSON.parse ),
	] );

	return { packageJson, packageLock, composerJson, composerLock, overrides };
}

async function main() {
	const { packageJson, packageLock, composerJson, composerLock, overrides } = await readInputs();
	const npmInventory = collectNpmInventory( packageJson, packageLock );
	const composerInventory = collectComposerInventory( composerJson, composerLock );
	const watchlistInventory = collectNpmWatchlist( overrides );
	const baseline = buildBaseline( overrides );

	const npmRows = await Promise.all(
		npmInventory.map( async ( item ) => {
			const metadata = await fetchNpmMetadata(
				item.packageName,
				item.declaredRange,
				item.resolvedVersion
			);
			return rowFromItem( item, metadata, overrides );
		} )
	);

	const composerRows = await Promise.all(
		[ ...composerInventory.direct, ...composerInventory.transitive ].map( async ( item ) => {
			const metadata = await fetchComposerMetadata(
				item.packageName,
				item.declaredRange,
				item.resolvedVersion
			);
			return rowFromItem( item, metadata, overrides );
		} )
	);

	const watchlistRows = await Promise.all(
		watchlistInventory.map( async ( item ) => {
			const resolvedVersion =
				item.resolvedVersion ||
				resolvePackageLockVersion( packageLock, item.packageName ) ||
				resolveInstalledNpmVersion( item.packageName );
			const metadata = await fetchNpmMetadata(
				item.packageName,
				item.declaredRange,
				resolvedVersion
			);
			return rowFromItem( { ...item, resolvedVersion }, metadata, overrides );
		} )
	);

	const report = {
		generatedAt: new Date().toISOString(),
		baseline,
		batches: overrides.batches || [],
		executionLog: overrides.executionLog || [],
		smokeTests: overrides.smokeTests || [],
		summary: {
			directNpm: Object.keys( packageJson.dependencies || {} ).length,
			directNpmDev: Object.keys( packageJson.devDependencies || {} ).length,
			directComposer:
				Object.keys( composerJson.require || {} ).length +
				Object.keys( composerJson[ 'require-dev' ] || {} ).length,
			transitiveComposer: composerInventory.transitive.length,
		},
		rows: {
			npm: sortRows( npmRows ),
			composer: sortRows( composerRows ),
			watchlist: sortRows( watchlistRows ),
		},
	};

	const markdown = renderMarkdownReport( report );
	const json = JSON.stringify( report, null, 2 );

	if ( WRITE_MODE ) {
		await Promise.all( [
			fs.writeFile( REPORT_MD_PATH, markdown ),
			fs.writeFile( REPORT_JSON_PATH, json ),
		] );
		console.log(
			`Wrote ${ path.relative( ROOT, REPORT_MD_PATH ) } and ${ path.relative( ROOT, REPORT_JSON_PATH ) }`
		);
		return;
	}

	console.log( markdown );
}

function sortRows( rows ) {
	return [ ...rows ].sort( ( left, right ) => left.packageName.localeCompare( right.packageName ) );
}

main().catch( ( error ) => {
	console.error( error.stack || String( error ) );
	process.exit( 1 );
} );
