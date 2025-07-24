/**
 * Color palette and semantic tokens ported from style.css for both light and dark themes.
 *
 * Mapping:
 * - islamic-primary: #10B981
 * - islamic-primary-dark: #059669
 * - islamic-secondary: #F59E0B
 * - islamic-accent: #92400E
 * - islamic-emerald: #047857
 * - islamic-teal: #0F766E
 * - islamic-deep-green: #134E4A
 * - color-background: #FCFCF9 (light), #1F2121 (dark)
 * - color-surface: #FFFFFD (light), #262828 (dark)
 * - color-text: #13343B (light), #F5F5F5 (dark)
 * - color-primary: #21808D (light), #32B8C6 (dark)
 * - color-secondary: #5E5240 (light), #777C7C (dark)
 * - color-error: #C0152F (light), #FF5459 (dark)
 * - color-success: #21808D (light), #32B8C6 (dark)
 * - color-warning: #A84B2F (light), #E68161 (dark)
 * - color-info: #626C71 (light), #A7A9A9 (dark)
 */

export const Colors = {
  light: {
    text: '#13343B', // --color-text
    background: '#FCFCF9', // --color-background
    surface: '#FFFFFD', // --color-surface
    tint: '#10B981', // --islamic-primary
    primary: '#21808D', // --color-primary
    primaryDark: '#059669', // --islamic-primary-dark
    secondary: '#F59E0B', // --islamic-secondary
    accent: '#92400E', // --islamic-accent
    emerald: '#047857', // --islamic-emerald
    teal: '#0F766E', // --islamic-teal
    deepGreen: '#134E4A', // --islamic-deep-green
    error: '#C0152F', // --color-error
    success: '#21808D', // --color-success
    warning: '#A84B2F', // --color-warning
    info: '#626C71', // --color-info
    cardBorder: '#5E5240', // --color-card-border
    cardBorderInner: '#5E5240', // --color-card-border-inner
    tabIconDefault: '#687076',
    tabIconSelected: '#10B981',
    icon: '#687076',
  },
  dark: {
    text: '#F5F5F5', // white-ish for all text
    background: '#101613', // deep dark green background
    surface: '#18221B', // slightly lighter deep green
    tint: '#134E4A', // deep green as main accent
    primary: '#134E4A', // deep green
    primaryDark: '#0F766E', // even deeper green
    secondary: '#F59E0B', // dark orange
    accent: '#92400E', // deep orange accent
    emerald: '#047857',
    teal: '#0F766E',
    deepGreen: '#134E4A',
    error: '#FF5459',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#A7A9A9',
    cardBorder: '#2C3A2E',
    cardBorderInner: '#2C3A2E',
    tabIconDefault: '#F5F5F5', // white-ish icons
    tabIconSelected: '#F5F5F5', // white-ish for selected
    icon: '#F5F5F5', // all icons close to white
  },
};
