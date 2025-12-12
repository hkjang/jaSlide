import { Injectable, Logger } from '@nestjs/common';

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
}

export interface TypographyRules {
    titleFont: string;
    bodyFont: string;
    titleSizes: { h1: number; h2: number; h3: number };
    bodySizes: { large: number; normal: number; small: number };
    lineHeight: number;
    maxCharsPerLine: number;
}

export interface DesignTheme {
    name: string;
    palette: ColorPalette;
    typography: TypographyRules;
    spacing: { small: number; medium: number; large: number };
}

// Predefined color palettes
const COLOR_PALETTES = {
    professional: {
        primary: '#1E3A5F',
        secondary: '#3D5A80',
        accent: '#EE6C4D',
        background: '#FFFFFF',
        text: '#293241',
        muted: '#6B7280',
    },
    modern: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#06B6D4',
        background: '#0F172A',
        text: '#F8FAFC',
        muted: '#94A3B8',
    },
    creative: {
        primary: '#F472B6',
        secondary: '#A855F7',
        accent: '#FCD34D',
        background: '#FFFFFF',
        text: '#1F2937',
        muted: '#9CA3AF',
    },
    minimal: {
        primary: '#18181B',
        secondary: '#27272A',
        accent: '#71717A',
        background: '#FFFFFF',
        text: '#18181B',
        muted: '#A1A1AA',
    },
    nature: {
        primary: '#065F46',
        secondary: '#047857',
        accent: '#84CC16',
        background: '#ECFDF5',
        text: '#064E3B',
        muted: '#6B7280',
    },
    corporate: {
        primary: '#1E40AF',
        secondary: '#3B82F6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#111827',
        muted: '#6B7280',
    },
};

// Typography presets
const TYPOGRAPHY_PRESETS = {
    modern: {
        titleFont: 'Inter, sans-serif',
        bodyFont: 'Inter, sans-serif',
        titleSizes: { h1: 44, h2: 32, h3: 24 },
        bodySizes: { large: 20, normal: 16, small: 14 },
        lineHeight: 1.5,
        maxCharsPerLine: 70,
    },
    classic: {
        titleFont: 'Georgia, serif',
        bodyFont: 'Georgia, serif',
        titleSizes: { h1: 48, h2: 36, h3: 28 },
        bodySizes: { large: 22, normal: 18, small: 14 },
        lineHeight: 1.6,
        maxCharsPerLine: 65,
    },
    tech: {
        titleFont: 'JetBrains Mono, monospace',
        bodyFont: 'Inter, sans-serif',
        titleSizes: { h1: 40, h2: 30, h3: 22 },
        bodySizes: { large: 18, normal: 16, small: 14 },
        lineHeight: 1.5,
        maxCharsPerLine: 80,
    },
    playful: {
        titleFont: 'Poppins, sans-serif',
        bodyFont: 'Nunito, sans-serif',
        titleSizes: { h1: 52, h2: 38, h3: 28 },
        bodySizes: { large: 20, normal: 17, small: 15 },
        lineHeight: 1.6,
        maxCharsPerLine: 60,
    },
};

@Injectable()
export class DesignEngineService {
    private readonly logger = new Logger(DesignEngineService.name);

    /**
     * Generate a color palette based on a seed color
     */
    generateColorPalette(seedColor: string): ColorPalette {
        const hsl = this.hexToHsl(seedColor);

        return {
            primary: seedColor,
            secondary: this.hslToHex({ ...hsl, l: Math.min(hsl.l + 15, 90) }),
            accent: this.hslToHex({ ...hsl, h: (hsl.h + 180) % 360, s: Math.min(hsl.s + 20, 100) }),
            background: hsl.l > 50 ? '#FFFFFF' : '#0F172A',
            text: hsl.l > 50 ? '#1F2937' : '#F8FAFC',
            muted: this.hslToHex({ ...hsl, s: 20, l: 50 }),
        };
    }

    /**
     * Get a predefined color palette
     */
    getPalette(name: keyof typeof COLOR_PALETTES): ColorPalette {
        return COLOR_PALETTES[name] || COLOR_PALETTES.professional;
    }

    /**
     * Get all available palettes
     */
    getAllPalettes(): Record<string, ColorPalette> {
        return COLOR_PALETTES;
    }

    /**
     * Get typography rules preset
     */
    getTypography(preset: keyof typeof TYPOGRAPHY_PRESETS): TypographyRules {
        return TYPOGRAPHY_PRESETS[preset] || TYPOGRAPHY_PRESETS.modern;
    }

    /**
     * Get all typography presets
     */
    getAllTypography(): Record<string, TypographyRules> {
        return TYPOGRAPHY_PRESETS;
    }

    /**
     * Generate a complete design theme
     */
    generateTheme(
        paletteName: keyof typeof COLOR_PALETTES,
        typographyName: keyof typeof TYPOGRAPHY_PRESETS,
    ): DesignTheme {
        return {
            name: `${paletteName}-${typographyName}`,
            palette: this.getPalette(paletteName),
            typography: this.getTypography(typographyName),
            spacing: { small: 8, medium: 16, large: 32 },
        };
    }

    /**
     * Recommend a theme based on content type
     */
    recommendTheme(contentType: string): DesignTheme {
        const recommendations: Record<string, { palette: keyof typeof COLOR_PALETTES; typography: keyof typeof TYPOGRAPHY_PRESETS }> = {
            business: { palette: 'corporate', typography: 'modern' },
            tech: { palette: 'modern', typography: 'tech' },
            education: { palette: 'minimal', typography: 'classic' },
            creative: { palette: 'creative', typography: 'playful' },
            nature: { palette: 'nature', typography: 'modern' },
        };

        const rec = recommendations[contentType] || { palette: 'professional', typography: 'modern' };
        return this.generateTheme(rec.palette, rec.typography);
    }

    /**
     * Analyze text contrast and recommend adjustments
     */
    analyzeContrast(textColor: string, backgroundColor: string): {
        ratio: number;
        passes: { AA: boolean; AAA: boolean };
        recommendation?: string;
    } {
        const ratio = this.getContrastRatio(textColor, backgroundColor);

        return {
            ratio,
            passes: {
                AA: ratio >= 4.5,
                AAA: ratio >= 7,
            },
            recommendation: ratio < 4.5
                ? 'Consider using a higher contrast color for better readability'
                : undefined,
        };
    }

    /**
     * Calculate text size based on slide layout
     */
    calculateTextSize(
        textLength: number,
        areaWidth: number,
        areaHeight: number,
        typography: TypographyRules,
    ): { fontSize: number; lineCount: number } {
        const avgCharWidth = 0.6; // Average character width ratio
        const chars = textLength;
        const charsPerLine = Math.floor(areaWidth / (typography.bodySizes.normal * avgCharWidth));
        const lineCount = Math.ceil(chars / charsPerLine);
        const maxLines = Math.floor(areaHeight / (typography.bodySizes.normal * typography.lineHeight));

        let fontSize = typography.bodySizes.normal;

        if (lineCount > maxLines) {
            // Reduce font size to fit
            fontSize = Math.max(typography.bodySizes.small, fontSize * (maxLines / lineCount));
        } else if (lineCount < maxLines / 2) {
            // Increase font size for emphasis
            fontSize = Math.min(typography.bodySizes.large, fontSize * 1.2);
        }

        return { fontSize: Math.round(fontSize), lineCount };
    }

    // Color conversion utilities
    private hexToHsl(hex: string): { h: number; s: number; l: number } {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    private hslToHex(hsl: { h: number; s: number; l: number }): string {
        const { h, s, l } = hsl;
        const sNorm = s / 100;
        const lNorm = l / 100;

        const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = lNorm - c / 2;

        let r = 0, g = 0, b = 0;

        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }

    private getContrastRatio(color1: string, color2: string): number {
        const lum1 = this.getLuminance(color1);
        const lum2 = this.getLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    private getLuminance(hex: string): number {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const transform = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

        return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
    }
}
