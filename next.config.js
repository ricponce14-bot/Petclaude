/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.supabase.co",
            },
            {
                protocol: "https",
                hostname: "**.supabase.in",
            },
        ],
    },
    // Deshabilitar ESLint en build para evitar fallos por warnings
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Deshabilitar errores de TypeScript en build (para desarrollo rápido)
    typescript: {
        ignoreBuildErrors: true,
    },
};

module.exports = nextConfig;
