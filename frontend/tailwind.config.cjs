module.exports = {
	content: ['./index.html','./src/**/*.{js,jsx}'],
	theme: {
		extend: {
			colors: {
				forest: {
					DEFAULT: '#0B5E3A',
					600: '#0A4D31',
					700: '#083D29',
					800: '#042817',
					900: '#02170f'
				},
				gold: {
					DEFAULT: '#C99A58',
					600: '#B58339',
					700: '#A26F20',
					800: '#8A6D21'
				},
				sage: '#D5E8D4',
				mist: '#EAF6EE',
				oasis: '#0F766E',
				stone: '#475569',
				paper: '#F6F3EE'
			},
			boxShadow: {
				'lg-strong': '0 10px 30px rgba(2,6,23,0.08)',
				'soft-glow': '0 18px 50px rgba(7,94,49,0.14)'
			},
			borderRadius: {
				'2xl-lg': '1rem',
				'4xl': '2rem'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: []
}