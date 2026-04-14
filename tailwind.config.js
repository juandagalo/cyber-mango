/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'neon-cyan': '#00FFFF',
				'neon-magenta': '#FF00FF',
				'neon-purple': '#BF00FF',
				'neon-green': '#39FF14',
				'neon-yellow': '#FFE600',
				'neon-red': '#FF0040',
			},
			fontFamily: {
				mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
			},
		},
	},
	plugins: [],
};
