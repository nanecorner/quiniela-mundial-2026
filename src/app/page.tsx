import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export default function Home() {
  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Elementos decorativos de fondo (Inspiración Logo Mundial 2026) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#006847]/40 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#da291c]/30 blur-[120px]" />
      
      <div className="z-10 w-full px-4">
        <Suspense fallback={<div className="text-white text-center">Cargando...</div>}>
          <AuthForm />
        </Suspense>
      </div>

      {/* Patrón de puntos (estilo cancha técnica) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
    </main>
  );
}
