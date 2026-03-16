import { Eta } from 'eta';

export function compileEtaTemplate( template, config = {} ) {
	const eta = new Eta( config );

	return eta.compile( template ).bind( eta );
}
