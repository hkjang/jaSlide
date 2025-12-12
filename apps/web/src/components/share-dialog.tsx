'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { presentationsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Copy, Check, Link, Globe } from 'lucide-react';

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
    presentationId: string;
    presentationTitle: string;
}

export function ShareDialog({
    open,
    onClose,
    presentationId,
    presentationTitle,
}: ShareDialogProps) {
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateShareLink = async () => {
        setGenerating(true);
        try {
            const response = await presentationsApi.share(presentationId);
            setShareToken(response.data.shareToken);
        } catch (error) {
            toast({ title: '공유 링크 생성 실패', variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    const shareUrl = shareToken
        ? `${window.location.origin}/shared/${shareToken}`
        : null;

    const copyToClipboard = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({ title: '복사됨', description: '공유 링크가 클립보드에 복사되었습니다.' });
        } catch {
            toast({ title: '복사 실패', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>프레젠테이션 공유</DialogTitle>
                    <DialogDescription>
                        공유 링크를 생성하여 다른 사람과 프레젠테이션을 공유하세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {!shareToken ? (
                        <div className="text-center py-8">
                            <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">
                                공유 링크를 생성하면 누구나 이 프레젠테이션을 볼 수 있습니다.
                            </p>
                            <Button onClick={generateShareLink} disabled={generating}>
                                <Link className="h-4 w-4 mr-2" />
                                {generating ? '생성 중...' : '공유 링크 생성'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={shareUrl || ''}
                                    readOnly
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                이 링크를 가진 모든 사람이 프레젠테이션을 볼 수 있습니다.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        닫기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
