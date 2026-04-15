/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'cyber-yellow': '#FCEE0A',
				'cyber-red': '#c5003c',
				'cyber-red-bright': '#FF003C',
				'cyber-cyan': '#02D7F2',
				'cyber-cyan-dim': '#55EAD4',
				'cyber-magenta': '#ED1E79',
				'cyber-purple': '#7700A6',
				'cyber-dark': '#0D0D12',
				'cyber-surface': '#13131D',
				'cyber-card': '#1A1A28',
				'cyber-elevated': '#1E1E30',
				/* Legacy aliases for compatibility */
				'neon-cyan': '#02D7F2',
				'neon-magenta': '#ED1E79',
				'neon-purple': '#7700A6',
				'neon-green': '#39FF14',
				'neon-yellow': '#FCEE0A',
				'neon-red': '#FF003C',
			},
			fontFamily: {
				rajdhani: ['Rajdhani', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
				orbitron: ['Orbitron', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
