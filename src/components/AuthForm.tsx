'use client';

import { useState } from 'react';
import { login, signup } from '@/app/actions';
import { useSearchParams } from 'next/navigation';

import { useFormStatus } from 'react-dom';

function SubmitButton({ isLogin }: { isLogin: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 px-4 bg-gradient-to-r from-[#006847] to-[#004b36] hover:from-[#004b36] hover:to-[#003626] border border-[#CFB53B]/30 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(0,104,71,0.5)] transform transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#CFB53B] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending && (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {pending 
        ? (isLogin ? 'Entrando...' : 'Registrando...') 
        : (isLogin ? 'Entrar a la Cancha' : 'Registrarme')}
    </button>
  );
}

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get('error');
  const successMsg = searchParams.get('message');

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* Tarjeta Glassmorphism */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#006847] via-[#CFB53B] to-[#da291c] drop-shadow-lg">
            WORLD CUP 26
          </h1>
          <h2 className="text-xl font-bold text-white mt-1 tracking-widest uppercase">
            Quiniela
          </h2>
          <p className="text-gray-300 mt-2 font-medium">
            {isLogin ? 'Inicia sesión para predecir' : 'Crea tu cuenta y empieza a jugar'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-[#006847]/40 border border-[#006847] text-white font-semibold text-sm text-center shadow-lg">
            {successMsg}
          </div>
        )}

        <form className="space-y-5" action={isLogin ? login : signup}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="name">
                Nombre o Apodo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#006847] transition-all"
                placeholder="Ej. El Profe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#006847] transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#006847] transition-all"
              placeholder="••••••••"
            />
          </div>

          <SubmitButton isLogin={isLogin} />
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            {isLogin ? '¿Aún no estás en la quiniela?' : '¿Ya tienes cuenta?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 font-bold text-[#CFB53B] hover:text-white transition-colors"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
