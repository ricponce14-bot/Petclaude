import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    // Crear un cliente de Supabase para el middleware que lee y escribe las cookies
    const supabase = createMiddlewareClient({ req, res });

    // Refrescar la sesión si el token ha expirado o generar las cookies correctamente
    await supabase.auth.getSession();

    return res;
}

// Asegurarse de que este middleware corra en todas las rutas de la app
// exceptuando los archivos estáticos de Next.js
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
