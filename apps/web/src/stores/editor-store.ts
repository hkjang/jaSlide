import { create } from 'zustand';

interface Slide {
    id: string;
    order: number;
    type: string;
    title?: string;
    content: any;
    layout: string;
    notes?: string;
}

interface Presentation {
    id: string;
    title: string;
    slides: Slide[];
    templateId?: string;
}

interface EditorState {
    presentation: Presentation | null;
    selectedSlideId: string | null;
    isEditing: boolean;
    isDirty: boolean;

    // Actions
    setPresentation: (presentation: Presentation) => void;
    setSelectedSlide: (slideId: string | null) => void;
    updateSlide: (slideId: string, updates: Partial<Slide>) => void;
    addSlide: (slide: Slide) => void;
    removeSlide: (slideId: string) => void;
    reorderSlides: (fromIndex: number, toIndex: number) => void;
    setDirty: (dirty: boolean) => void;
    reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    presentation: null,
    selectedSlideId: null,
    isEditing: false,
    isDirty: false,

    setPresentation: (presentation) => {
        set({
            presentation,
            selectedSlideId: presentation.slides[0]?.id || null,
            isDirty: false,
        });
    },

    setSelectedSlide: (slideId) => {
        set({ selectedSlideId: slideId });
    },

    updateSlide: (slideId, updates) => {
        const { presentation } = get();
        if (!presentation) return;

        const updatedSlides = presentation.slides.map((slide) =>
            slide.id === slideId ? { ...slide, ...updates } : slide
        );

        set({
            presentation: { ...presentation, slides: updatedSlides },
            isDirty: true,
        });
    },

    addSlide: (slide) => {
        const { presentation } = get();
        if (!presentation) return;

        set({
            presentation: {
                ...presentation,
                slides: [...presentation.slides, slide],
            },
            selectedSlideId: slide.id,
            isDirty: true,
        });
    },

    removeSlide: (slideId) => {
        const { presentation, selectedSlideId } = get();
        if (!presentation) return;

        const filteredSlides = presentation.slides.filter((s) => s.id !== slideId);
        const newSelectedId =
            selectedSlideId === slideId
                ? filteredSlides[0]?.id || null
                : selectedSlideId;

        set({
            presentation: { ...presentation, slides: filteredSlides },
            selectedSlideId: newSelectedId,
            isDirty: true,
        });
    },

    reorderSlides: (fromIndex, toIndex) => {
        const { presentation } = get();
        if (!presentation) return;

        const slides = [...presentation.slides];
        const [moved] = slides.splice(fromIndex, 1);
        slides.splice(toIndex, 0, moved);

        // Update order property
        const reorderedSlides = slides.map((slide, index) => ({
            ...slide,
            order: index,
        }));

        set({
            presentation: { ...presentation, slides: reorderedSlides },
            isDirty: true,
        });
    },

    setDirty: (dirty) => {
        set({ isDirty: dirty });
    },

    reset: () => {
        set({
            presentation: null,
            selectedSlideId: null,
            isEditing: false,
            isDirty: false,
        });
    },
}));
