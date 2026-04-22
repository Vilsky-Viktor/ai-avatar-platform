module.exports = {
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
  },
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        clipReveal: {
          '0%':   { clipPath: 'inset(50% 2% 50% 2% round 24px)', opacity: '0' },
          '20%':  { opacity: '1' },
          '100%': { clipPath: 'inset(0% 0% 0% 0% round 24px)', opacity: '1' },
        },
        contentFadeUp: {
          '0%, 35%': { opacity: '0', transform: 'translateY(10px)' },
          '100%':    { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'clip-reveal':    'clipReveal 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'content-fade-up': 'contentFadeUp 0.5s ease forwards',
      },
    },
  },
}
