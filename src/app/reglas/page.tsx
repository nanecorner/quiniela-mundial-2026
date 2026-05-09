import Link from 'next/link';

export default function ReglasPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">

        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#CFB53B]/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#006847]/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#006847] via-[#CFB53B] to-[#da291c]">
                Reglamento
              </h1>
              <p className="text-gray-400 mt-2 font-medium">Sistema de puntuación oficial de la quiniela.</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>

          <div className="space-y-8 text-gray-300">

            {/* Sección Partidos Normales */}
            <section>
              <h2 className="text-xl font-bold text-[#CFB53B] mb-4 flex items-center gap-2">
                ⚽ Partidos Normales
              </h2>
              <ul className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5">
                <li className="flex justify-between items-center">
                  <span><strong>Marcador Exacto:</strong> Acertar los goles exactos de ambos equipos.</span>
                  <span className="font-black text-[#CFB53B] text-lg shrink-0 ml-4">5 pts</span>
                </li>
                <li className="flex justify-between items-center">
                  <span><strong>Tendencia y Diferencia:</strong> Acertar el ganador (o empate) y además la diferencia de goles.</span>
                  <span className="font-black text-[#CFB53B] text-lg shrink-0 ml-4">3 pts</span>
                </li>
                <li className="flex justify-between items-center">
                  <span><strong>Solo Tendencia:</strong> Acertar solamente el ganador (o empate).</span>
                  <span className="font-black text-[#CFB53B] text-lg shrink-0 ml-4">2 pts</span>
                </li>
                <li className="flex justify-between items-center">
                  <span><strong>Fallo Total:</strong> No acertar ni el ganador ni el empate.</span>
                  <span className="font-black text-gray-500 text-lg shrink-0 ml-4">0 pts</span>
                </li>
              </ul>

              <div className="mt-4 p-4 bg-[#006847]/10 border border-[#006847]/30 rounded-xl text-sm">
                <p className="font-bold text-[#006847] mb-2">Ejemplo (Marcador Real: México 2 - 1 Alemania):</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Tu pones <strong>2 - 1</strong>: Ganas <strong className="text-white">5 puntos</strong> (Exacto).</li>
                  <li>Tu pones <strong>3 - 2</strong>: Ganas <strong className="text-white">3 puntos</strong> (Acertaste ganador y diferencia de 1 gol).</li>
                  <li>Tu pones <strong>1 - 0</strong>: Ganas <strong className="text-white">3 puntos</strong> (Acertaste ganador y diferencia de 1 gol).</li>
                  <li>Tu pones <strong>3 - 1</strong>: Ganas <strong className="text-white">2 puntos</strong> (Acertaste ganador, pero no la diferencia).</li>
                  <li>Tu pones <strong>1 - 1</strong>: Ganas <strong className="text-gray-500">0 puntos</strong> (Fallaste el resultado).</li>
                </ul>
              </div>
            </section>

            {/* Sección Eliminatorias */}
            <section>
              <h2 className="text-xl font-bold text-[#CFB53B] mb-4 flex items-center gap-2">
                ⚔️ Eliminatorias Directas
              </h2>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                <p className="mb-3">En las fases eliminatorias (Octavos de final en adelante), el sistema de puntos por goles se mantiene igual, pero hay un bono especial:</p>
                <div className="flex justify-between items-center">
                  <span><strong>Equipo que avanza:</strong> Acertar qué equipo clasifica a la siguiente ronda (sin importar si es en tiempo regular, tiempos extra o penales).</span>
                  <span className="font-black text-[#da291c] text-lg shrink-0 ml-4">+2 pts</span>
                </div>
              </div>
            </section>

            {/* Sección Predicciones Bonus */}
            <section>
              <h2 className="text-xl font-bold text-[#CFB53B] mb-4 flex items-center gap-2">
                🏆 Predicciones Bonus
              </h2>
              <div className="bg-gradient-to-r from-[#CFB53B]/10 to-transparent p-5 rounded-2xl border border-[#CFB53B]/30">
                <p className="mb-4 text-sm text-[#CFB53B] font-semibold">
                  ⚠️ Estos puntos deben ingresarse antes de que comience el primer partido del Mundial. Una vez que el torneo inicie, se bloquearán y no podrán ser modificados.
                </p>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span><strong>Campeón del Mundial:</strong> Acertar quién levantará la copa.</span>
                    <span className="font-black text-[#CFB53B] text-lg shrink-0 ml-4">15 pts</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span><strong>Subcampeón:</strong> Acertar quién perderá la final.</span>
                    <span className="font-black text-[#CFB53B] text-lg shrink-0 ml-4">10 pts</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span><strong>Destino de México:</strong> Acertar en qué fase exacta quedará eliminada (o si gana) la Selección Mexicana.</span>
                    <span className="font-black text-[#006847] text-lg shrink-0 ml-4">10 pts</span>
                  </li>
                </ul>
              </div>
            </section>
            {/* Sección Premiación */}
            <section>
              <h2 className="text-xl font-bold text-[#CFB53B] mb-4 flex items-center gap-2">
                💰 Premiación
              </h2>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span><strong>Primer Lugar:</strong></span>
                    <span className="font-black text-[#CFB53B] text-lg shrink-0 ml-4">65%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span><strong>Segundo Lugar:</strong></span>
                    <span className="font-black text-gray-300 text-lg shrink-0 ml-4">25%</span>
                  </li>
                  <li className="flex justify-between items-center text-gray-500">
                    <span>Organización (Host y BD):</span>
                    <span className="font-bold text-sm shrink-0 ml-4">10%</span>
                  </li>
                </ul>

                <div className="pt-4 border-t border-white/10 text-sm space-y-3 text-gray-400">
                  <p>
                    🥇 <strong className="text-white">Empate en 1er lugar:</strong> Si hay empate total en la primera posición, se sumarán los premios de primer y segundo lugar (<strong className="text-white">90%</strong>) y se repartirán equitativamente entre los ganadores.
                  </p>
                  <p>
                    🥈 <strong className="text-white">Empate en 2do lugar:</strong> Si el primer lugar es único pero hay empate en la segunda posición, el <strong className="text-white">25%</strong> se repartirá equitativamente entre los que empaten.
                  </p>
                  <p>
                    ⚙️ <strong className="text-white">Gastos Operativos:</strong> El <strong className="text-white">10%</strong> destinado a la organización se utiliza exclusivamente para cubrir los costos de mantenimiento del servidor, el dominio y el servicio de base de datos que sostienen el aplicativo.
                  </p>
                  <p>
                    🔍 <strong className="text-white">Criterio de Desempate:</strong> El ganador es quien sume más puntos. Si hay empate en puntos, el primer criterio de desempate será la <strong className="text-white">mayor cantidad de marcadores exactos</strong> (5 pts) acertados.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
