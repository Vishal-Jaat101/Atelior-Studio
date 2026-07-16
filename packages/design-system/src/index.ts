export const tokens = {
  colors: {
    canvasBackground: 'hsl(240, 10%, 3.9%)',
    sidebarBackground: 'hsl(240, 10%, 6%)',
    sidebarBorder: 'hsl(240, 5%, 15%)',
    cardBackground: 'hsla(240, 10%, 10%, 0.6)',
    cardBorder: 'hsla(240, 5%, 20%, 0.4)',
    primaryAccent: 'hsl(263, 70%, 50%)',
    secondaryAccent: 'hsl(190, 90%, 45%)',
    textPrimary: 'hsl(0, 0%, 100%)',
    textSecondary: 'hsl(240, 5%, 65%)',
    status: {
      success: 'hsl(142, 70%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      danger: 'hsl(0, 84%, 60%)',
    },
  },
  typography: {
    brandFonts: {
      title: 'Outfit, sans-serif',
      body: 'Inter, sans-serif',
      code: 'JetBrains Mono, monospace',
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
    glassmorphism: {
      blur: '12px',
      backgroundOpacity: '0.6',
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
