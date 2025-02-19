import type { Metadata, Viewport } from 'next/types';
import './styles.css';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <html>
      <head>
        <title>Liquid Metal • Paper</title>
      </head>
      <body>{children}</body>
    </html>
  );
}

export const metadata: Metadata = {
  title: 'Paper',
  icons: {
    icon: process.env.NODE_ENV === 'production' ? '/favicon.ico' : '/favicon-dev.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  themeColor: '#000',
};
