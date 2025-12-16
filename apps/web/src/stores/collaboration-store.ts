import { create } from 'zustand';

// Types
export interface Comment {
    id: string;
    presentationId: string;
    slideId?: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    content: string;
    parentId?: string;
    isResolved: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Collaborator {
    id: string;
    presentationId: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
    joinedAt: string;
}

interface CollaborationState {
    // Comments
    comments: Comment[];
    isLoadingComments: boolean;
    selectedCommentId: string | null;
    showResolvedComments: boolean;

    // Collaborators
    collaborators: Collaborator[];
    owner: { id: string; name: string; email: string; image?: string } | null;
    isLoadingCollaborators: boolean;

    // Panels
    showCommentsPanel: boolean;
    showCollaboratorsPanel: boolean;

    // Comment Actions
    setComments: (comments: Comment[]) => void;
    addComment: (comment: Comment) => void;
    updateComment: (id: string, updates: Partial<Comment>) => void;
    removeComment: (id: string) => void;
    setSelectedComment: (id: string | null) => void;
    setLoadingComments: (loading: boolean) => void;
    toggleResolvedComments: () => void;

    // Collaborator Actions
    setCollaborators: (collaborators: Collaborator[], owner?: any) => void;
    addCollaborator: (collaborator: Collaborator) => void;
    updateCollaborator: (id: string, updates: Partial<Collaborator>) => void;
    removeCollaborator: (id: string) => void;
    setLoadingCollaborators: (loading: boolean) => void;

    // Panel Actions
    toggleCommentsPanel: () => void;
    toggleCollaboratorsPanel: () => void;
    closeAllPanels: () => void;

    // Reset
    reset: () => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
    // Initial state
    comments: [],
    isLoadingComments: false,
    selectedCommentId: null,
    showResolvedComments: false,

    collaborators: [],
    owner: null,
    isLoadingCollaborators: false,

    showCommentsPanel: false,
    showCollaboratorsPanel: false,

    // Comment Actions
    setComments: (comments) => {
        set({ comments });
    },

    addComment: (comment) => {
        set((state) => ({
            comments: [...state.comments, comment],
        }));
    },

    updateComment: (id, updates) => {
        set((state) => ({
            comments: state.comments.map((c) =>
                c.id === id ? { ...c, ...updates } : c
            ),
        }));
    },

    removeComment: (id) => {
        set((state) => ({
            comments: state.comments.filter((c) => c.id !== id),
            selectedCommentId: state.selectedCommentId === id ? null : state.selectedCommentId,
        }));
    },

    setSelectedComment: (id) => {
        set({ selectedCommentId: id });
    },

    setLoadingComments: (loading) => {
        set({ isLoadingComments: loading });
    },

    toggleResolvedComments: () => {
        set((state) => ({ showResolvedComments: !state.showResolvedComments }));
    },

    // Collaborator Actions
    setCollaborators: (collaborators, owner) => {
        set({ collaborators, owner: owner || null });
    },

    addCollaborator: (collaborator) => {
        set((state) => ({
            collaborators: [...state.collaborators, collaborator],
        }));
    },

    updateCollaborator: (id, updates) => {
        set((state) => ({
            collaborators: state.collaborators.map((c) =>
                c.id === id ? { ...c, ...updates } : c
            ),
        }));
    },

    removeCollaborator: (id) => {
        set((state) => ({
            collaborators: state.collaborators.filter((c) => c.id !== id),
        }));
    },

    setLoadingCollaborators: (loading) => {
        set({ isLoadingCollaborators: loading });
    },

    // Panel Actions
    toggleCommentsPanel: () => {
        set((state) => ({
            showCommentsPanel: !state.showCommentsPanel,
            showCollaboratorsPanel: false,
        }));
    },

    toggleCollaboratorsPanel: () => {
        set((state) => ({
            showCollaboratorsPanel: !state.showCollaboratorsPanel,
            showCommentsPanel: false,
        }));
    },

    closeAllPanels: () => {
        set({
            showCommentsPanel: false,
            showCollaboratorsPanel: false,
        });
    },

    // Reset
    reset: () => {
        set({
            comments: [],
            isLoadingComments: false,
            selectedCommentId: null,
            showResolvedComments: false,
            collaborators: [],
            owner: null,
            isLoadingCollaborators: false,
            showCommentsPanel: false,
            showCollaboratorsPanel: false,
        });
    },
}));
