'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    Send,
    X,
    Loader2,
    History,
    ChevronDown,
} from 'lucide-react';

interface AiNaturalEditProps {
    slideId: string;
    onSubmit: (prompt: string) => Promise<void>;
    isProcessing?: boolean;
    recentCommands?: string[];
}

const SUGGESTED_COMMANDS = [
    '이 슬라이드 더 간결하게',
    '핵심 포인트 3개로 요약',
    '전문적인 톤으로 변경',
    '글머리 기호 추가',
    '제목을 더 눈에 띄게',
    '데이터 시각화 추가',
    '결론 문장 추가',
    '문장을 더 짧게',
];

export function AiNaturalEdit({
    slideId,
    onSubmit,
    isProcessing = false,
    recentCommands = [],
}: AiNaturalEditProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt.trim() || isProcessing) return;

        await onSubmit(prompt.trim());
        setPrompt('');
        setIsOpen(false);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="group hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
            >
                <Sparkles className="h-4 w-4 mr-1 group-hover:text-purple-500" />
                AI로 편집
            </Button>
        );
    }

    return (
        <div className="bg-white rounded-xl border shadow-lg p-4 w-full max-w-md animate-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">AI 자연어 편집</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="mb-3">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="예: 이 슬라이드 더 간결하게"
                        disabled={isProcessing}
                        className="w-full px-4 py-2.5 pr-12 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
                    />
                    <button
                        type="submit"
                        disabled={!prompt.trim() || isProcessing}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </form>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-2">
                <button
                    onClick={() => { setShowSuggestions(true); setShowHistory(false); }}
                    className={`text-xs px-2 py-1 rounded ${showSuggestions ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    추천 명령
                </button>
                <button
                    onClick={() => { setShowHistory(true); setShowSuggestions(false); }}
                    className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${showHistory ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <History className="h-3 w-3" />
                    최근 사용
                </button>
            </div>

            {/* Suggestions */}
            {showSuggestions && (
                <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_COMMANDS.map((command) => (
                        <button
                            key={command}
                            onClick={() => handleSuggestionClick(command)}
                            className="text-xs px-2.5 py-1.5 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 rounded-full border border-gray-200 hover:border-purple-300 transition-colors"
                        >
                            {command}
                        </button>
                    ))}
                </div>
            )}

            {/* History */}
            {showHistory && (
                <div className="space-y-1.5">
                    {recentCommands.length > 0 ? (
                        recentCommands.slice(0, 5).map((command, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(command)}
                                className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg"
                            >
                                {command}
                            </button>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-4">
                            최근 사용한 명령이 없습니다
                        </p>
                    )}
                </div>
            )}

            {/* Tips */}
            <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-400">
                    💡 자연어로 원하는 변경사항을 설명하면 AI가 자동으로 적용합니다
                </p>
            </div>
        </div>
    );
}
