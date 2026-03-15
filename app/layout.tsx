import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'] });

export const metadata: Metadata = {
    title: 'Ladrido | Gestión de Estéticas Caninas y Veterinarias',
    description: 'Automatiza tus recordatorios, agenda y control de pacientes por WhatsApp. Micro-SaaS para clínicas veterinarias y estéticas caninas en México.',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#fafafa' },
        { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
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
            <body className={`${nunito.className} bg-gray-50 text-ink selection:bg-mint/20 selection:text-mint-dark`}>
                {children}
            </body>
        </html>
    );
}
