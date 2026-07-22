export const tokens = {
  colors: {
    // Drafting Table color definitions
    ink900: '#161B22',
    paper050: '#F1EEE7',
    blueprint600: '#28456B',
    pencil400: '#8A93A3',
    correction500: '#E8A33D',
    verified600: '#2F6F6B',

    // Semantic roles for building clean, non-generic layouts
    canvasBackground: '#F1EEE7', // paper-050 (Drafting Table light/paper mode default)
    canvasBackgroundDark: '#161B22', // ink-900 (for high contrast dark canvases)
    textPrimary: '#161B22', // ink-900
    textPrimaryInverse: '#F1EEE7', // paper-050
    textSecondary: '#8A93A3', // pencil-400
    primaryAccent: '#28456B', // blueprint-600
    secondaryAccent: '#8A93A3', // pencil-400
    sidebarBackground: '#F1EEE7',
    sidebarBorder: '#8A93A3',
    cardBackground: '#F1EEE7',
    cardBorder: '#8A93A3',

    status: {
      success: '#2F6F6B', // verified-600
      warning: '#E8A33D', // correction-500
      danger: '#E8A33D', // correction-500 used for high attention/warning
    },
    qa: {
      passed: '#2F6F6B',    // verified-600
      failed: '#DC2626',    // red for failures
      retrying: '#E8A33D',  // correction-500 for retry state
      deployed: '#059669',  // emerald for deployment success
    },
  },
  typography: {
    brandFonts: {
      title: '"Space Grotesk", "Cabinet Grotesk", sans-serif', // Technical grotesk display face
      body: '"Plus Jakarta Sans", "Satoshi", "IBM Plex Sans", sans-serif', // Humanist sans body face
      code: '"Space Mono", "JetBrains Mono", monospace', // Monospace for data/annotations
    },
    scale: {
      label: '12px',
      body: '16px',
      header: '32px',
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
      hover: '150ms',
      tabTransition: '200ms',
      panelSlide: '400ms',
    },
    ease: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: {
        stiffness: 100,
        damping: 15,
      },
    },
  },
};
