import { Eta } from 'eta/core';

export function compileEtaTemplate( template, config = {} ) {
	const eta = new Eta( config );

	return eta.compile( template ).bind( eta );
}
