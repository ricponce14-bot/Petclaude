import type { Metadata, Viewport } from 'next';
import '@fontsource/metropolis/400.css';
import '@fontsource/metropolis/500.css';
import '@fontsource/metropolis/600.css';
import '@fontsource/metropolis/700.css';
import '@fontsource/metropolis/800.css';
import '@fontsource/metropolis/900.css';
import './globals.css';

export const metadata: Metadata = {
    title: 'Apúntame — Tu negocio agenda solo, por WhatsApp',
    description: 'Mía, tu asistente por WhatsApp, agenda citas, manda recordatorios y registra gastos con un mensaje o una nota de voz. Para barberías, spas, clínicas, estéticas y más.',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#FBF5EC' },
        { media: '(prefers-color-scheme: dark)', color: '#1E1410' },
    ],
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className="scroll-smooth">
            <body className="font-sans bg-background text-ink antialiased selection:bg-mint/20 selection:text-mint-dark">
                {children}
            </body>
        </html>
    );
}
