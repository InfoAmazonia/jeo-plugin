/**
 * Distinct block icons for the inserter disambiguation kit (W2 — C2-06).
 *
 * The 5 map/story blocks used to share the same map icon, making them
 * indistinguishable in the inserter. `jeo/map` keeps the original map icon
 * and `jeo/onetime-map` uses the existing layers icon; the three below are
 * new. 24×24, stroke `currentColor`, same visual language as the existing
 * icons in this directory.
 */

export function AiMapIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 512 512"
		>
			<path
				d="M313.27 124.64L198.73 51.36a32 32 0 0 0-29.28.35L56.51 127.49A16 16 0 0 0 48 141.63v295.8a16 16 0 0 0 23.49 14.14l97.82-63.79a32 32 0 0 1 29.5-.24l111.86 73a32 32 0 0 0 29.27-.11l115.43-75.94a16 16 0 0 0 8.63-14.2V74.57a16 16 0 0 0-23.49-14.14l-98 63.86a32 32 0 0 1-29.24.35z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="36"
			/>
			<path
				d="M256 176l14.9 40.1L311 231l-40.1 14.9L256 286l-14.9-40.1L201 231l40.1-14.9z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function StoryMapIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 512 512"
		>
			<path
				d="M313.27 124.64L198.73 51.36a32 32 0 0 0-29.28.35L56.51 127.49A16 16 0 0 0 48 141.63v295.8a16 16 0 0 0 23.49 14.14l97.82-63.79a32 32 0 0 1 29.5-.24l111.86 73a32 32 0 0 0 29.27-.11l115.43-75.94a16 16 0 0 0 8.63-14.2V74.57a16 16 0 0 0-23.49-14.14l-98 63.86a32 32 0 0 1-29.24.35z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="36"
			/>
			<path d="M216 200l112 56-112 56z" fill="currentColor" />
		</svg>
	);
}

export function EmbeddedStoryMapIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 512 512"
		>
			<rect
				x="48"
				y="96"
				width="416"
				height="320"
				rx="16"
				fill="none"
				stroke="currentColor"
				strokeWidth="36"
			/>
			<path d="M216 200l112 56-112 56z" fill="currentColor" />
			<path
				d="M48 176h416"
				fill="none"
				stroke="currentColor"
				strokeWidth="36"
			/>
		</svg>
	);
}
