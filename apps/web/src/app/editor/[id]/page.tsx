'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editor-store';
import { useAuthStore } from '@/stores/auth-store';
import { presentationsApi, slidesApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Save,
    Download,
    Share2,
    Plus,
    Trash2,
    Copy,
    MoreVertical,
    Sparkles,
    Layout,
    Type,
    List,
    Image as ImageIcon,
    BarChart2,
    Quote,
} from 'lucide-react';

// Slide type icons mapping
const slideTypeIcons: Record<string, any> = {
    TITLE: Type,
    CONTENT: Layout,
    BULLET_LIST: List,
    TWO_COLUMN: Layout,
    IMAGE: ImageIcon,
    CHART: BarChart2,
    QUOTE: Quote,
    SECTION_HEADER: Type,
};

interface DraggableSlideProps {
    slide: any;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onMove: (from: number, to: number) => void;
}

function DraggableSlide({ slide, index, isSelected, onSelect, onMove }: DraggableSlideProps) {
    const [{ isDragging }, drag] = useDrag({
        type: 'SLIDE',
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: 'SLIDE',
        hover: (item: { index: number }) => {
            if (item.index !== index) {
                onMove(item.index, index);
                item.index = index;
            }
        },
    });

    const Icon = slideTypeIcons[slide.type] || Layout;

    // Combine drag and drop refs properly
    const setRefs = (node: HTMLDivElement | null) => {
        drag(drop(node));
    };

    return (
        <div
            ref={setRefs}
            onClick={onSelect}
            className={`slide-panel p-2 cursor-move ${isSelected ? 'active' : ''} ${isDragging ? 'opacity-50' : ''
                }`}
        >
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 rounded flex items-center justify-center mb-2">
                <Icon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 truncate">
                    {index + 1}. {slide.title || 'Untitled'}
                </span>
            </div>
        </div>
    );
}

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const presentationId = params.id as string;
    const { isAuthenticated } = useAuthStore();
    const {
        presentation,
        selectedSlideId,
        isDirty,
        setPresentation,
        setSelectedSlide,
        updateSlide,
        reorderSlides,
        removeSlide,
        setDirty,
    } = useEditorStore();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSlideTypes, setShowSlideTypes] = useState(false);

    const selectedSlide = presentation?.slides.find((s) => s.id === selectedSlideId);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchPresentation();
    }, [presentationId, isAuthenticated]);

    const fetchPresentation = async () => {
        try {
            const response = await presentationsApi.get(presentationId);
            setPresentation({
                id: response.data.id,
                title: response.data.title,
                slides: response.data.slides,
                templateId: response.data.templateId,
            });
        } catch (error) {
            toast({ title: '오류', description: '프레젠테이션을 불러올 수 없습니다.', variant: 'destructive' });
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!presentation || !isDirty) return;
        setSaving(true);
        try {
            // Save slide order changes
            if (presentation.slides.length > 0) {
                await slidesApi.reorder(presentationId, {
                    slideIds: presentation.slides.map((s) => s.id),
                });
            }
            setDirty(false);
            toast({ title: '저장 완료', description: '변경사항이 저장되었습니다.' });
        } catch (error) {
            toast({ title: '저장 실패', description: '저장 중 오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSlide = async () => {
        if (!selectedSlideId || !presentation) return;
        if (presentation.slides.length <= 1) {
            toast({ title: '삭제 불가', description: '최소 1개의 슬라이드가 필요합니다.', variant: 'destructive' });
            return;
        }

        try {
            await slidesApi.delete(presentationId, selectedSlideId);
            removeSlide(selectedSlideId);
            toast({ title: '삭제 완료', description: '슬라이드가 삭제되었습니다.' });
        } catch (error) {
            toast({ title: '삭제 실패', variant: 'destructive' });
        }
    };

    const handleAddSlide = async (type: string) => {
        try {
            const response = await slidesApi.create(presentationId, {
                type,
                order: presentation?.slides.length || 0,
                content: { heading: '새 슬라이드' },
                layout: 'center',
            });
            // Refresh presentation to get new slide
            fetchPresentation();
            setShowSlideTypes(false);
            toast({ title: '슬라이드 추가됨' });
        } catch (error) {
            toast({ title: '슬라이드 추가 실패', variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!presentation) {
        return null;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="h-screen flex flex-col bg-gray-100">
                {/* Header */}
                <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="font-medium">{presentation.title}</h1>
                            <span className="text-xs text-gray-500">
                                {presentation.slides.length} 슬라이드
                                {isDirty && ' • 저장되지 않은 변경사항'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleSave} disabled={!isDirty || saving}>
                            <Save className="h-4 w-4 mr-1" />
                            {saving ? '저장 중...' : '저장'}
                        </Button>
                        <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            공유
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            내보내기
                        </Button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Slide List Panel */}
                    <aside className="w-52 bg-white border-r p-3 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">슬라이드</span>
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setShowSlideTypes(!showSlideTypes)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                {showSlideTypes && (
                                    <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border p-2 z-10">
                                        {Object.entries(slideTypeIcons).map(([type, Icon]) => (
                                            <button
                                                key={type}
                                                onClick={() => handleAddSlide(type)}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm"
                                            >
                                                <Icon className="h-4 w-4 text-gray-500" />
                                                {type.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {presentation.slides.map((slide, index) => (
                                <DraggableSlide
                                    key={slide.id}
                                    slide={slide}
                                    index={index}
                                    isSelected={slide.id === selectedSlideId}
                                    onSelect={() => setSelectedSlide(slide.id)}
                                    onMove={reorderSlides}
                                />
                            ))}
                        </div>
                    </aside>

                    {/* Main Editor Area */}
                    <main className="flex-1 p-6 overflow-auto">
                        <div className="max-w-4xl mx-auto">
                            {/* Slide Preview */}
                            <div className="editor-canvas bg-white shadow-lg rounded-lg overflow-hidden">
                                {selectedSlide ? (
                                    <SlidePreview slide={selectedSlide} />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        슬라이드를 선택하세요
                                    </div>
                                )}
                            </div>

                            {/* Slide Actions */}
                            {selectedSlide && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <Button variant="outline" size="sm">
                                        <Sparkles className="h-4 w-4 mr-1" />
                                        AI로 편집
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Copy className="h-4 w-4 mr-1" />
                                        복제
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDeleteSlide}>
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        삭제
                                    </Button>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Properties Panel */}
                    <aside className="w-72 bg-white border-l p-4 overflow-y-auto">
                        <h3 className="font-medium text-gray-900 mb-4">속성</h3>

                        {selectedSlide ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                                        {selectedSlide.type}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                                    <input
                                        type="text"
                                        value={selectedSlide.title || ''}
                                        onChange={(e) => updateSlide(selectedSlide.id, { title: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">레이아웃</label>
                                    <select
                                        value={selectedSlide.layout || 'center'}
                                        onChange={(e) => updateSlide(selectedSlide.id, { layout: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="center">중앙</option>
                                        <option value="left">왼쪽</option>
                                        <option value="right">오른쪽</option>
                                        <option value="two-column-equal">2단 (균등)</option>
                                        <option value="image-left">이미지 왼쪽</option>
                                        <option value="image-right">이미지 오른쪽</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">노트</label>
                                    <textarea
                                        value={selectedSlide.notes || ''}
                                        onChange={(e) => updateSlide(selectedSlide.id, { notes: e.target.value })}
                                        rows={4}
                                        placeholder="발표자 노트..."
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">슬라이드를 선택하면 속성을 편집할 수 있습니다.</p>
                        )}
                    </aside>
                </div>
            </div>
        </DndProvider>
    );
}

// Slide Preview Component
function SlidePreview({ slide }: { slide: any }) {
    const content = slide.content || {};
    const heading = content.heading || slide.title || '';
    const subheading = content.subheading || '';
    const body = content.body || '';
    const bullets = content.bullets || [];

    // Render based on slide type
    switch (slide.type) {
        case 'TITLE':
            return (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{heading}</h1>
                    {subheading && <p className="text-xl text-gray-600">{subheading}</p>}
                </div>
            );

        case 'SECTION_HEADER':
            return (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800">
                    <h2 className="text-3xl font-bold text-white">{heading}</h2>
                </div>
            );

        case 'QUOTE':
            return (
                <div className="h-full flex items-center justify-center p-12">
                    <blockquote className="text-2xl italic text-gray-700 text-center max-w-2xl">
                        "{body || heading}"
                    </blockquote>
                </div>
            );

        case 'BULLET_LIST':
        case 'CONTENT':
        default:
            return (
                <div className="h-full p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{heading}</h2>
                    {body && <p className="text-gray-600 mb-4">{body}</p>}
                    {bullets.length > 0 && (
                        <ul className="space-y-2">
                            {bullets.map((bullet: any, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-purple-600 font-bold">•</span>
                                    <span className="text-gray-700">{typeof bullet === 'string' ? bullet : bullet.text}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );
    }
}
