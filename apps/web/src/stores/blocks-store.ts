import { create } from 'zustand';

// Types
export interface Block {
    id: string;
    slideId: string;
    type: 'TEXT' | 'IMAGE' | 'CHART' | 'TABLE' | 'ICON' | 'SHAPE';
    order: number;
    content: any;
    style: any;
}

interface BlocksState {
    // State
    blocks: Record<string, Block[]>; // slideId -> blocks[]
    selectedBlockId: string | null;
    isLoadingBlocks: boolean;
    editingBlockId: string | null;

    // Actions
    setBlocksForSlide: (slideId: string, blocks: Block[]) => void;
    getBlocksForSlide: (slideId: string) => Block[];
    addBlock: (slideId: string, block: Block) => void;
    updateBlock: (blockId: string, updates: Partial<Block>) => void;
    removeBlock: (slideId: string, blockId: string) => void;
    reorderBlocks: (slideId: string, fromIndex: number, toIndex: number) => void;
    setSelectedBlock: (blockId: string | null) => void;
    setEditingBlock: (blockId: string | null) => void;
    setLoadingBlocks: (loading: boolean) => void;
    clearBlocksForSlide: (slideId: string) => void;
    reset: () => void;
}

export const useBlocksStore = create<BlocksState>((set, get) => ({
    // Initial state
    blocks: {},
    selectedBlockId: null,
    isLoadingBlocks: false,
    editingBlockId: null,

    setBlocksForSlide: (slideId, blocks) => {
        set((state) => ({
            blocks: {
                ...state.blocks,
                [slideId]: blocks,
            },
        }));
    },

    getBlocksForSlide: (slideId) => {
        return get().blocks[slideId] || [];
    },

    addBlock: (slideId, block) => {
        set((state) => ({
            blocks: {
                ...state.blocks,
                [slideId]: [...(state.blocks[slideId] || []), block],
            },
        }));
    },

    updateBlock: (blockId, updates) => {
        set((state) => {
            const newBlocks = { ...state.blocks };
            for (const slideId in newBlocks) {
                newBlocks[slideId] = newBlocks[slideId].map((b) =>
                    b.id === blockId ? { ...b, ...updates } : b
                );
            }
            return { blocks: newBlocks };
        });
    },

    removeBlock: (slideId, blockId) => {
        set((state) => {
            const slideBlocks = state.blocks[slideId] || [];
            const filtered = slideBlocks.filter((b) => b.id !== blockId);
            // Reorder remaining blocks
            const reordered = filtered.map((b, index) => ({ ...b, order: index }));
            return {
                blocks: {
                    ...state.blocks,
                    [slideId]: reordered,
                },
                selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
            };
        });
    },

    reorderBlocks: (slideId, fromIndex, toIndex) => {
        set((state) => {
            const slideBlocks = [...(state.blocks[slideId] || [])];
            const [moved] = slideBlocks.splice(fromIndex, 1);
            slideBlocks.splice(toIndex, 0, moved);
            const reordered = slideBlocks.map((b, index) => ({ ...b, order: index }));
            return {
                blocks: {
                    ...state.blocks,
                    [slideId]: reordered,
                },
            };
        });
    },

    setSelectedBlock: (blockId) => {
        set({ selectedBlockId: blockId });
    },

    setEditingBlock: (blockId) => {
        set({ editingBlockId: blockId });
    },

    setLoadingBlocks: (loading) => {
        set({ isLoadingBlocks: loading });
    },

    clearBlocksForSlide: (slideId) => {
        set((state) => {
            const newBlocks = { ...state.blocks };
            delete newBlocks[slideId];
            return { blocks: newBlocks };
        });
    },

    reset: () => {
        set({
            blocks: {},
            selectedBlockId: null,
            isLoadingBlocks: false,
            editingBlockId: null,
        });
    },
}));
