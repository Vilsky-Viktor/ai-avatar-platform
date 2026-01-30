export const ThemeColor = {
    Dark: 'dark',
    Light: 'light',
} as const;

export type Theme = typeof ThemeColor[keyof typeof ThemeColor];