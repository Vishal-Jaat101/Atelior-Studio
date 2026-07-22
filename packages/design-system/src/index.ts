export const tokens = {
  colors: {
    // Nocturne Core Palette
    obsidian950: '#0B0D12',     // Deep mysterious canvas
    charcoal900: '#14171F',     // Panel / card background surface
    charcoal800: '#1E2330',     // Elevated surface / border outline
    warmWhite050: '#F2F0EC',    // Primary high-contrast text & accents
    warmWhite200: '#C4C0B6',    // Secondary body text
    warmWhite400: '#7E7A72',    // Muted annotations & captions
    antiqueGold500: '#C9A227',  // Single signature accent (hero focus)
    antiqueGold600: '#A6841C',  // Gold hover/active state
    sapphire700: '#2B4C7E',     // Secondary interactive states & badges
    sapphire800: '#1D3559',     // Subtle sapphire background fills

    // Semantic roles mapped to Nocturne theme
    canvasBackground: '#0B0D12',
    canvasBackgroundDark: '#0B0D12',
    surfaceBackground: '#14171F',
    cardBackground: '#14171F',
    cardBorder: 'rgba(201, 162, 39, 0.2)', // Hairline gold border accent
    cardBorderSubtle: 'rgba(255, 255, 255, 0.07)',
    sidebarBackground: '#0E1017',
    sidebarBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#F2F0EC',
    textPrimaryInverse: '#0B0D12',
    textSecondary: '#C4C0B6',
    textMuted: '#7E7A72',
    primaryAccent: '#C9A227',
    secondaryAccent: '#2B4C7E',

    status: {
      success: '#2D6A4F',
      warning: '#C9A227',
      danger: '#9E2A2B',
    },
    qa: {
      passed: '#2D6A4F',
      failed: '#9E2A2B',
      retrying: '#C9A227',
      deployed: '#2D6A4F',
    },
  },

  typography: {
    brandFonts: {
      title: '"Fraunces", "Canela", "Playfair Display", Georgia, serif', // Editorial serif display
      headline: '"Fraunces", "Canela", "Playfair Display", Georgia, serif',
      body: '"Inter", "Neue Montreal", system-ui, sans-serif', // Humanist sans body
      code: '"JetBrains Mono", "Fira Code", monospace', // Data & annotations
    },
    scale: {
      display: '48px',
      h1: '36px',
      h2: '28px',
      h3: '22px',
      body: '15px',
      caption: '12px',
    },
  },

  layout: {
    spacing: {
      unit: '4px',
      padding: '24px',
    },
  },

  motion: {
    duration: {
      hover: '300ms',
      fade: '500ms',
      parallax: '800ms',
      tabTransition: '500ms',
      panelSlide: '600ms',
    },
    ease: {
      default: 'cubic-bezier(0.16, 1, 0.3, 1)',
      deliberate: 'cubic-bezier(0.16, 1, 0.3, 1)',
      smooth: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  },
};
