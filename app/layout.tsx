import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '电机与拖动 · 课堂讲义',
  description: '电机与拖动课程教学网站，支持 16:9 全屏课堂演示。',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
