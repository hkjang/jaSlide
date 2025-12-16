'use client';

import { useState } from 'react';
import {
    FileText,
    Layout,
    ChevronDown,
    ChevronUp,
    Edit2,
    Check,
    X,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SlideOutlineItem {
    id: string;
    order: number;
    title: string;
    type: 'title' | 'content' | 'section' | 'chart' | 'image' | 'closing';
    bullets?: string[];
    estimatedDuration?: string;
}

interface SlideOutlinePreviewProps {
    inputContent: string;
    slideCount: number;
    isLoading?: boolean;
    outline?: SlideOutlineItem[];
    onOutlineChange?: (outline: SlideOutlineItem[]) => void;
    onConfirm?: () => void;
    onRegenerate?: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
    title: FileText,
    content: Layout,
    section: FileText,
    chart: Layout,
    image: Layout,
    closing: FileText,
};

const typeLabels: Record<string, string> = {
    title: '표제',
    content: '본문',
    section: '섹션',
    chart: '차트',
    image: '이미지',
    closing: '마무리',
};

// Generate mock outline based on input
function generateMockOutline(content: string, slideCount: number): SlideOutlineItem[] {
    const outline: SlideOutlineItem[] = [];

    // Title slide
    outline.push({
        id: '1',
        order: 1,
        title: content.slice(0, 50) || '프레젠테이션 제목',
        type: 'title',
    });

    // Content slides
    const contentSlides = slideCount - 2;
    for (let i = 0; i < contentSlides; i++) {
        const isSection = i % 3 === 0 && i > 0;
        outline.push({
            id: String(i + 2),
            order: i + 2,
            title: isSection ? `섹션 ${Math.floor(i / 3) + 1}` : `슬라이드 ${i + 2}`,
            type: isSection ? 'section' : 'content',
            bullets: isSection ? undefined : ['핵심 포인트 1', '핵심 포인트 2', '핵심 포인트 3'],
        });
    }

    // Closing slide
    outline.push({
        id: String(slideCount),
        order: slideCount,
        title: '감사합니다',
        type: 'closing',
    });

    return outline;
}

export function SlideOutlinePreview({
    inputContent,
    slideCount,
    isLoading = false,
    outline: providedOutline,
    onOutlineChange,
    onConfirm,
    onRegenerate,
}: SlideOutlinePreviewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const outline = providedOutline || generateMockOutline(inputContent, slideCount);

    const handleEdit = (item: SlideOutlineItem) => {
        setEditingId(item.id);
        setEditValue(item.title);
    };

    const handleSaveEdit = (id: string) => {
        if (onOutlineChange) {
            const newOutline = outline.map((item) =>
                item.id === id ? { ...item, title: editValue } : item
            );
            onOutlineChange(newOutline);
        }
        setEditingId(null);
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-center gap-3 text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent" />
                    <span>슬라이드 개요 생성 중...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <h3 className="font-medium text-gray-900">슬라이드 개요 미리보기</h3>
                    </div>
                    <span className="text-sm text-gray-500">{outline.length}개 슬라이드</span>
                </div>
            </div>

            {/* Outline List */}
            <div className="max-h-80 overflow-y-auto">
                {outline.map((item, index) => {
                    const Icon = typeIcons[item.type] || Layout;
                    const isExpanded = expandedItems.has(item.id);
                    const isEditing = editingId === item.id;

                    return (
                        <div
                            key={item.id}
                            className={`
                                border-b last:border-b-0 transition-colors
                                ${item.type === 'section' ? 'bg-gray-50' : 'bg-white'}
                            `}
                        >
                            <div className="flex items-center gap-3 px-4 py-3">
                                {/* Order number */}
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium flex items-center justify-center">
                                    {item.order}
                                </div>

                                {/* Type icon */}
                                <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />

                                {/* Title */}
                                {isEditing ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSaveEdit(item.id)}
                                            className="p-1 text-green-500 hover:bg-green-50 rounded"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-gray-700 truncate block">
                                                {item.title}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {typeLabels[item.type]}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </button>

                                        {item.bullets && item.bullets.length > 0 && (
                                            <button
                                                onClick={() => toggleExpand(item.id)}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Expanded bullets */}
                            {isExpanded && item.bullets && (
                                <div className="px-4 pb-3 pl-16">
                                    <ul className="space-y-1">
                                        {item.bullets.map((bullet, bIndex) => (
                                            <li
                                                key={bIndex}
                                                className="text-xs text-gray-500 flex items-center gap-2"
                                            >
                                                <span className="w-1 h-1 rounded-full bg-gray-400" />
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={onRegenerate}>
                    다시 생성
                </Button>
                <Button
                    size="sm"
                    onClick={onConfirm}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    이 구조로 생성
                </Button>
            </div>
        </div>
    );
}
