import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });
    res.headers.set("x-pathname", req.nextUrl.pathname);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Blindaje: si faltan las variables (p.ej. deploy hecho antes de
    // configurarlas), NO tumbar todo el sitio con un 500. Dejar pasar la
    // request y registrar el problema para diagnóstico.
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error(
            "[middleware] Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
            "Configúralas en Vercel y vuelve a desplegar (se incrustan en build)."
        );
        return res;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    req.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    res = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    });
                    res.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    req.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    res = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    });
                    res.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

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
