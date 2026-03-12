import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    // Pass URL/Key directly to avoid reliance on mutating process.env in Edge
    const supabase = createMiddlewareClient({ req, res }, {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    });

    try {
        // Refrescar la sesión si el token ha expirado o generar las cookies correctamente
        await supabase.auth.getSession();
    } catch (e) {
        console.error('Middleware Supabase error:', e);
    }

    return res;
}

// Asegurarse de que este middleware corra en todas las rutas de la app
// exceptuando los archivos estáticos de Next.js
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
