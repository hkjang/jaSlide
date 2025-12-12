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
import { exportApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Download, FileText, File, Loader2 } from 'lucide-react';

interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
    presentationId: string;
    presentationTitle: string;
}

export function ExportDialog({
    open,
    onClose,
    presentationId,
    presentationTitle,
}: ExportDialogProps) {
    const [exporting, setExporting] = useState<string | null>(null);

    const handleExport = async (format: 'pptx' | 'pdf') => {
        setExporting(format);
        try {
            let response;
            if (format === 'pptx') {
                response = await exportApi.pptx(presentationId);
            } else {
                response = await exportApi.pdf(presentationId);
            }

            // Create download link
            const blob = new Blob([response.data], {
                type: format === 'pptx'
                    ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    : 'application/pdf',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${presentationTitle}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({ title: '내보내기 완료', description: `${format.toUpperCase()} 파일이 다운로드됩니다.` });
            onClose();
        } catch (error) {
            toast({ title: '내보내기 실패', description: '파일 생성 중 오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setExporting(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>프레젠테이션 내보내기</DialogTitle>
                    <DialogDescription>
                        원하는 형식으로 프레젠테이션을 내보내세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <button
                        onClick={() => handleExport('pptx')}
                        disabled={exporting !== null}
                        className="flex flex-col items-center gap-3 p-6 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                        {exporting === 'pptx' ? (
                            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                        ) : (
                            <FileText className="h-8 w-8 text-orange-500" />
                        )}
                        <div className="text-center">
                            <div className="font-medium">PowerPoint</div>
                            <div className="text-xs text-gray-500">.pptx</div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={exporting !== null}
                        className="flex flex-col items-center gap-3 p-6 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                        {exporting === 'pdf' ? (
                            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                        ) : (
                            <File className="h-8 w-8 text-red-500" />
                        )}
                        <div className="text-center">
                            <div className="font-medium">PDF</div>
                            <div className="text-xs text-gray-500">.pdf</div>
                        </div>
                    </button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        취소
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
