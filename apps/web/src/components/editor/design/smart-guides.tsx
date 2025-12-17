'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SmartGuidesProps {
    containerRef: React.RefObject<HTMLElement>;
    elements: ElementBounds[];
    activeElementId: string | null;
    snapThreshold?: number;
    onSnap?: (snappedPosition: { x?: number; y?: number }) => void;
}

interface ElementBounds {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface GuideLine {
    type: 'vertical' | 'horizontal';
    position: number;
    start: number;
    end: number;
    snapType: 'edge' | 'center';
}

// 스냅 임계값 (픽셀)
const DEFAULT_SNAP_THRESHOLD = 5;

export function SmartGuides({
    containerRef,
    elements,
    activeElementId,
    snapThreshold = DEFAULT_SNAP_THRESHOLD,
    onSnap,
}: SmartGuidesProps) {
    const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
    const [containerBounds, setContainerBounds] = useState({ width: 0, height: 0 });

    // 컨테이너 크기 업데이트
    useEffect(() => {
        if (!containerRef.current) return;

        const updateBounds = () => {
            if (containerRef.current) {
                setContainerBounds({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        updateBounds();
        const observer = new ResizeObserver(updateBounds);
        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [containerRef]);

    // 가이드라인 계산
    const calculateGuides = useCallback((activeEl: ElementBounds): GuideLine[] => {
        const guides: GuideLine[] = [];
        const otherElements = elements.filter(el => el.id !== activeEl.id);

        // 활성 요소의 중요 포인트
        const activeLeft = activeEl.x;
        const activeRight = activeEl.x + activeEl.width;
        const activeCenterX = activeEl.x + activeEl.width / 2;
        const activeTop = activeEl.y;
        const activeBottom = activeEl.y + activeEl.height;
        const activeCenterY = activeEl.y + activeEl.height / 2;

        // 컨테이너 중앙선
        const containerCenterX = containerBounds.width / 2;
        const containerCenterY = containerBounds.height / 2;

        // 컨테이너 중앙 스냅
        if (Math.abs(activeCenterX - containerCenterX) < snapThreshold) {
            guides.push({
                type: 'vertical',
                position: containerCenterX,
                start: 0,
                end: containerBounds.height,
                snapType: 'center',
            });
            onSnap?.({ x: containerCenterX - activeEl.width / 2 });
        }

        if (Math.abs(activeCenterY - containerCenterY) < snapThreshold) {
            guides.push({
                type: 'horizontal',
                position: containerCenterY,
                start: 0,
                end: containerBounds.width,
                snapType: 'center',
            });
            onSnap?.({ y: containerCenterY - activeEl.height / 2 });
        }

        // 다른 요소들과의 정렬
        otherElements.forEach(other => {
            const otherLeft = other.x;
            const otherRight = other.x + other.width;
            const otherCenterX = other.x + other.width / 2;
            const otherTop = other.y;
            const otherBottom = other.y + other.height;
            const otherCenterY = other.y + other.height / 2;

            // 수직 정렬 (왼쪽, 중앙, 오른쪽)
            const verticalAlignments = [
                { active: activeLeft, other: otherLeft, type: 'edge' as const },
                { active: activeLeft, other: otherRight, type: 'edge' as const },
                { active: activeRight, other: otherLeft, type: 'edge' as const },
                { active: activeRight, other: otherRight, type: 'edge' as const },
                { active: activeCenterX, other: otherCenterX, type: 'center' as const },
            ];

            verticalAlignments.forEach(({ active, other, type }) => {
                if (Math.abs(active - other) < snapThreshold) {
                    const minY = Math.min(activeTop, otherTop);
                    const maxY = Math.max(activeBottom, otherBottom);
                    guides.push({
                        type: 'vertical',
                        position: other,
                        start: minY,
                        end: maxY,
                        snapType: type,
                    });
                }
            });

            // 수평 정렬 (상단, 중앙, 하단)
            const horizontalAlignments = [
                { active: activeTop, other: otherTop, type: 'edge' as const },
                { active: activeTop, other: otherBottom, type: 'edge' as const },
                { active: activeBottom, other: otherTop, type: 'edge' as const },
                { active: activeBottom, other: otherBottom, type: 'edge' as const },
                { active: activeCenterY, other: otherCenterY, type: 'center' as const },
            ];

            horizontalAlignments.forEach(({ active, other, type }) => {
                if (Math.abs(active - other) < snapThreshold) {
                    const minX = Math.min(activeLeft, otherLeft);
                    const maxX = Math.max(activeRight, otherRight);
                    guides.push({
                        type: 'horizontal',
                        position: other,
                        start: minX,
                        end: maxX,
                        snapType: type,
                    });
                }
            });
        });

        return guides;
    }, [elements, containerBounds, snapThreshold, onSnap]);

    // 활성 요소가 변경되면 가이드라인 업데이트
    useEffect(() => {
        if (!activeElementId) {
            setGuideLines([]);
            return;
        }

        const activeElement = elements.find(el => el.id === activeElementId);
        if (!activeElement) {
            setGuideLines([]);
            return;
        }

        setGuideLines(calculateGuides(activeElement));
    }, [activeElementId, elements, calculateGuides]);

    if (!activeElementId || guideLines.length === 0) {
        return null;
    }

    return (
        <svg
            className="absolute inset-0 pointer-events-none z-50"
            width={containerBounds.width}
            height={containerBounds.height}
        >
            <defs>
                <pattern
                    id="guide-pattern"
                    patternUnits="userSpaceOnUse"
                    width="4"
                    height="4"
                >
                    <line x1="0" y1="0" x2="4" y2="0" stroke="#EC4899" strokeWidth="1" />
                </pattern>
            </defs>

            {guideLines.map((guide, idx) => (
                <g key={idx}>
                    {guide.type === 'vertical' ? (
                        <>
                            <line
                                x1={guide.position}
                                y1={guide.start}
                                x2={guide.position}
                                y2={guide.end}
                                stroke={guide.snapType === 'center' ? '#8B5CF6' : '#EC4899'}
                                strokeWidth="1"
                                strokeDasharray={guide.snapType === 'center' ? '4,4' : 'none'}
                            />
                            {/* 끝점 마커 */}
                            <circle
                                cx={guide.position}
                                cy={guide.start}
                                r="3"
                                fill={guide.snapType === 'center' ? '#8B5CF6' : '#EC4899'}
                            />
                            <circle
                                cx={guide.position}
                                cy={guide.end}
                                r="3"
                                fill={guide.snapType === 'center' ? '#8B5CF6' : '#EC4899'}
                            />
                        </>
                    ) : (
                        <>
                            <line
                                x1={guide.start}
                                y1={guide.position}
                                x2={guide.end}
                                y2={guide.position}
                                stroke={guide.snapType === 'center' ? '#8B5CF6' : '#EC4899'}
                                strokeWidth="1"
                                strokeDasharray={guide.snapType === 'center' ? '4,4' : 'none'}
                            />
                            <circle
                                cx={guide.start}
                                cy={guide.position}
                                r="3"
                                fill={guide.snapType === 'center' ? '#8B5CF6' : '#EC4899'}
                            />
                            <circle
                                cx={guide.end}
                                cy={guide.position}
                                r="3"
                                fill={guide.snapType === 'center' ? '#8B5CF6' : '#EC4899'}
                            />
                        </>
                    )}
                </g>
            ))}
        </svg>
    );
}

export default SmartGuides;
