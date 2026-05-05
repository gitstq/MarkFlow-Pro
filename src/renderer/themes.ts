/**
 * MarkFlow-Pro Theme System
 *
 * Provides built-in themes for consistent document styling.
 * Each theme defines colors, fonts, spacing, and code highlighting styles.
 * Custom themes can be created by implementing the MFTheme interface.
 */

/** Theme configuration interface */
export interface MFTheme {
  /** Unique theme name */
  name: string;
  /** Human-readable theme description */
  description: string;

  /** Color palette */
  colors: {
    /** Primary text color */
    text: string;
    /** Secondary/muted text color */
    textSecondary: string;
    /** Background color */
    background: string;
    /** Code block background */
    codeBackground: string;
    /** Link color */
    link: string;
    /** Border color */
    border: string;
    /** Table header background */
    tableHeader: string;
    /** Heading color */
    heading: string;
  };

  /** Font configuration */
  fonts: {
    /** Body text font family */
    body: string;
    /** Heading font family */
    heading: string;
    /** Code font family */
    code: string;
  };

  /** Spacing configuration */
  spacing: {
    /** Base line height */
    lineHeight: number;
    /** Paragraph spacing (rem) */
    paragraphSpacing: number;
    /** Heading spacing (rem) */
    headingSpacing: number;
  };

  /** Code highlighting style name (for highlight.js) */
  codeHighlightStyle: string;
}

/** Default theme - clean and professional */
export const defaultTheme: MFTheme = {
  name: 'default',
  description: 'Clean and professional default theme',
  colors: {
    text: '#1a1a1a',
    textSecondary: '#6b7280',
    background: '#ffffff',
    codeBackground: '#f6f8fa',
    link: '#2563eb',
    border: '#e0e0e0',
    tableHeader: '#f6f8fa',
    heading: '#111827',
  },
  fonts: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    code: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
  },
  spacing: {
    lineHeight: 1.6,
    paragraphSpacing: 1,
    headingSpacing: 1.5,
  },
  codeHighlightStyle: 'github',
};

/** Dark theme - optimized for dark mode */
export const darkTheme: MFTheme = {
  name: 'dark',
  description: 'Dark theme optimized for low-light environments',
  colors: {
    text: '#e5e7eb',
    textSecondary: '#9ca3af',
    background: '#111827',
    codeBackground: '#1f2937',
    link: '#60a5fa',
    border: '#374151',
    tableHeader: '#1f2937',
    heading: '#f9fafb',
  },
  fonts: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    code: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
  },
  spacing: {
    lineHeight: 1.7,
    paragraphSpacing: 1,
    headingSpacing: 1.5,
  },
  codeHighlightStyle: 'github-dark',
};

/** Ocean theme - blue tones inspired by the sea */
export const oceanTheme: MFTheme = {
  name: 'ocean',
  description: 'Ocean-inspired theme with blue tones',
  colors: {
    text: '#1e293b',
    textSecondary: '#64748b',
    background: '#f0f9ff',
    codeBackground: '#e0f2fe',
    link: '#0284c7',
    border: '#bae6fd',
    tableHeader: '#e0f2fe',
    heading: '#0c4a6e',
  },
  fonts: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    heading: "Georgia, 'Times New Roman', serif",
    code: "'Fira Code', 'Cascadia Code', Consolas, monospace",
  },
  spacing: {
    lineHeight: 1.65,
    paragraphSpacing: 1,
    headingSpacing: 1.5,
  },
  codeHighlightStyle: 'atom-one-light',
};

/** Forest theme - green tones inspired by nature */
export const forestTheme: MFTheme = {
  name: 'forest',
  description: 'Forest-inspired theme with green tones',
  colors: {
    text: '#1a2e1a',
    textSecondary: '#4a6741',
    background: '#f0fdf4',
    codeBackground: '#dcfce7',
    link: '#15803d',
    border: '#bbf7d0',
    tableHeader: '#dcfce7',
    heading: '#14532d',
  },
  fonts: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    heading: "Georgia, 'Times New Roman', serif",
    code: "'Fira Code', 'Cascadia Code', Consolas, monospace",
  },
  spacing: {
    lineHeight: 1.65,
    paragraphSpacing: 1.1,
    headingSpacing: 1.5,
  },
  codeHighlightStyle: 'atom-one-light',
};

/** Sunset theme - warm tones inspired by sunset */
export const sunsetTheme: MFTheme = {
  name: 'sunset',
  description: 'Sunset-inspired theme with warm tones',
  colors: {
    text: '#431407',
    textSecondary: '#9a3412',
    background: '#fffbeb',
    codeBackground: '#fef3c7',
    link: '#c2410c',
    border: '#fed7aa',
    tableHeader: '#fef3c7',
    heading: '#7c2d12',
  },
  fonts: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    heading: "Georgia, 'Times New Roman', serif",
    code: "'Fira Code', 'Cascadia Code', Consolas, monospace",
  },
  spacing: {
    lineHeight: 1.65,
    paragraphSpacing: 1,
    headingSpacing: 1.5,
  },
  codeHighlightStyle: 'atom-one-light',
};

/** Map of all built-in themes by name */
export const builtInThemes: Record<string, MFTheme> = {
  default: defaultTheme,
  dark: darkTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
};

/**
 * Get a built-in theme by name.
 *
 * @param name - Theme name ('default', 'dark', 'ocean', 'forest', 'sunset')
 * @returns The theme, or the default theme if not found
 */
export function getTheme(name: string): MFTheme {
  return builtInThemes[name] || defaultTheme;
}

/**
 * Get all available built-in theme names.
 *
 * @returns Array of theme names
 */
export function getThemeNames(): string[] {
  return Object.keys(builtInThemes);
}

/**
 * Apply a theme and return CSS custom properties as a style string.
 *
 * @param theme - The theme to apply
 * @returns CSS string with custom properties
 */
export function applyTheme(theme: MFTheme): string {
  return `
    :root {
      --mf-text-color: ${theme.colors.text};
      --mf-text-secondary: ${theme.colors.textSecondary};
      --mf-background-color: ${theme.colors.background};
      --mf-code-bg: ${theme.colors.codeBackground};
      --mf-link-color: ${theme.colors.link};
      --mf-border-color: ${theme.colors.border};
      --mf-table-header-bg: ${theme.colors.tableHeader};
      --mf-heading-color: ${theme.colors.heading};
      --mf-font-body: ${theme.fonts.body};
      --mf-font-heading: ${theme.fonts.heading};
      --mf-font-code: ${theme.fonts.code};
      --mf-line-height: ${theme.spacing.lineHeight};
      --mf-paragraph-spacing: ${theme.spacing.paragraphSpacing}rem;
      --mf-heading-spacing: ${theme.spacing.headingSpacing}rem;
    }

    body {
      background-color: ${theme.colors.background};
      color: ${theme.colors.text};
      line-height: ${theme.spacing.lineHeight};
    }

    h1, h2, h3, h4, h5, h6 {
      color: ${theme.colors.heading};
      font-family: ${theme.fonts.heading};
      margin-top: ${theme.spacing.headingSpacing}rem;
      margin-bottom: ${theme.spacing.headingSpacing * 0.5}rem;
    }

    p {
      margin-bottom: ${theme.spacing.paragraphSpacing}rem;
    }

    code, pre {
      font-family: ${theme.fonts.code};
    }
  `;
}

/**
 * Create a custom theme with partial overrides.
 *
 * @param name - Theme name
 * @param overrides - Partial theme configuration to merge with defaults
 * @returns A new theme with defaults filled in
 */
export function createTheme(name: string, overrides: Partial<MFTheme>): MFTheme {
  return {
    ...defaultTheme,
    ...overrides,
    name,
    colors: {
      ...defaultTheme.colors,
      ...overrides.colors,
    },
    fonts: {
      ...defaultTheme.fonts,
      ...overrides.fonts,
    },
    spacing: {
      ...defaultTheme.spacing,
      ...overrides.spacing,
    },
  };
}
