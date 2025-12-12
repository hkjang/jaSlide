import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'JaSlide - AI 프레젠테이션 자동 생성',
    description: 'AI 기반 프레젠테이션 자동 생성 시스템',
    keywords: ['프레젠테이션', 'AI', '슬라이드', 'PPT', '자동 생성'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
