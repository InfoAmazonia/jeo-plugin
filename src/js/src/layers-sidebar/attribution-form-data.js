import { normalizeOptionalUrl } from '../shared/url-normalization';

export function normalizeAttributionFormData( formData = {} ) {
	return {
		...formData,
		attribution_name: formData.attribution_name || '',
		attribution: normalizeOptionalUrl( formData.attribution ),
		source_url: normalizeOptionalUrl( formData.source_url ),
	};
}
