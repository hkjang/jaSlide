// Template types

export interface Template {
    id: string;
    name: string;
    description?: string;
    thumbnail: string;
    category: TemplateCategory;
    config: TemplateConfig;
    isPublic: boolean;
    organizationId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum TemplateCategory {
    BUSINESS = 'BUSINESS',
    EDUCATION = 'EDUCATION',
    CREATIVE = 'CREATIVE',
    MINIMAL = 'MINIMAL',
    TECH = 'TECH',
    MARKETING = 'MARKETING',
    CUSTOM = 'CUSTOM',
}

export interface TemplateConfig {
    colors: ColorPalette;
    typography: TypographyConfig;
    layouts: LayoutConfig;
    backgrounds: BackgroundConfig;
}

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textSecondary: string;
    success?: string;
    warning?: string;
    error?: string;
}

export interface TypographyConfig {
    titleFont: string;
    bodyFont: string;
    titleSize: FontSizeConfig;
    bodySize: FontSizeConfig;
    lineHeight: number;
    letterSpacing?: number;
}

export interface FontSizeConfig {
    xl: number;
    lg: number;
    md: number;
    sm: number;
    xs: number;
}

export interface LayoutConfig {
    margins: MarginConfig;
    spacing: number;
    contentWidth: number;
    contentAlignment: 'left' | 'center' | 'right';
}

export interface MarginConfig {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface BackgroundConfig {
    type: 'solid' | 'gradient' | 'image' | 'pattern';
    value: string;
    overlay?: string;
    opacity?: number;
}

export interface CreateTemplateInput {
    name: string;
    description?: string;
    thumbnail?: string;
    category: TemplateCategory;
    config: TemplateConfig;
    isPublic?: boolean;
}

export interface UpdateTemplateInput {
    name?: string;
    description?: string;
    thumbnail?: string;
    category?: TemplateCategory;
    config?: Partial<TemplateConfig>;
    isPublic?: boolean;
}
