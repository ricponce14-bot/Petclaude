import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Ladrido | Gestión de Estéticas Caninas y Veterinarias',
    description: 'Automatiza tus recordatorios, agenda y control de pacientes por WhatsApp. Micro-SaaS para clínicas veterinarias y estéticas caninas en México.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className="scroll-smooth">
            <body className={`${outfit.className} bg-slate-50 text-slate-900 selection:bg-teal-200 selection:text-teal-900`}>
                {children}
            </body>
        </html>
    );
}
