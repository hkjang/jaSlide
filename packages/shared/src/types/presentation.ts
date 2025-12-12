// Presentation types

export enum PresentationStatus {
    DRAFT = 'DRAFT',
    GENERATING = 'GENERATING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum SourceType {
    TEXT = 'TEXT',
    DOCX = 'DOCX',
    PDF = 'PDF',
    MARKDOWN = 'MARKDOWN',
    CSV = 'CSV',
    URL = 'URL',
}

export interface Presentation {
    id: string;
    title: string;
    description?: string;
    userId: string;
    templateId?: string;
    slides: Slide[];
    status: PresentationStatus;
    sourceType: SourceType;
    sourceContent?: string;
    metadata?: PresentationMetadata;
    createdAt: Date;
    updatedAt: Date;
}

export interface PresentationMetadata {
    language?: string;
    slideCount?: number;
    estimatedDuration?: number;
    keywords?: string[];
    outline?: { order: number; title: string; keyPoints: string[] }[];
}

export interface CreatePresentationInput {
    title?: string;
    sourceType: SourceType;
    content: string;
    templateId?: string;
    slideCount?: number;
    language?: string;
}

export interface UpdatePresentationInput {
    title?: string;
    description?: string;
    templateId?: string;
}

// Re-export Slide for convenience
import { Slide } from './slide';
export type { Slide };
