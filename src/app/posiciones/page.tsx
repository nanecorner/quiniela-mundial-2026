import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0;

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Obtener todos los perfiles (usuarios)
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, name');

  if (profilesError) {
    console.error('Error cargando perfiles:', profilesError);
  }

  // 2. Obtener todas las predicciones y sumar puntos
  // 2. Obtener todas las predicciones y sumar puntos
  let predictions: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data } = await supabase
      .from('predictions')
      .select('user_id, points, match_id, predicted_home_score, predicted_away_score')
      .range(from, from + step - 1);
    if (data && data.length > 0) {
      predictions = predictions.concat(data);
      if (data.length < step) hasMore = false;
      else from += step;
    } else {
      hasMore = false;
    }
  }

  // Obtener partidos terminados para validar marcadores exactos
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .eq('status', 'finished');
  const matchesMap = new Map(finishedMatches?.map(m => [m.id, m]) || []);
  
  // 3. Obtener todos los bonus y sumar puntos
  const { data: bonusPredictions } = await supabase.from('bonus_predictions').select('user_id, points');

  if (!profiles) return <div>Cargando tabla de posiciones...</div>;

  // 4. Calcular el total de puntos por usuario
  const leaderboard = profiles.map(profile => {
    const userPredictions = predictions?.filter(p => p.user_id === profile.id) || [];
    const userBonus = bonusPredictions?.filter(b => b.user_id === profile.id) || [];

    const matchPoints = userPredictions.reduce((sum, p) => sum + (p.points || 0), 0);
    const bonusPoints = userBonus.reduce((sum, b) => sum + (b.points || 0), 0);
    // Marcadores exactos (comparando con el resultado real)
    const exactMatchesCount = userPredictions.filter(p => {
      const match = matchesMap.get(p.match_id);
      if (!match || match.home_score === null || match.away_score === null) return false;
      return p.predicted_home_score === match.home_score && p.predicted_away_score === match.away_score;
    }).length;

    return {
      id: profile.id,
      name: profile.name,
      matchPoints,
      bonusPoints,
      totalPoints: matchPoints + bonusPoints,
      exactMatchesCount
    };
  });

  // 5. Ordenar de mayor a menor puntuación (y desempate por marcadores exactos)
  leaderboard.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints; // Primero por puntos totales
    }
    return b.exactMatchesCount - a.exactMatchesCount; // Segundo por marcadores exactos
  });

  // 6. Calcular posiciones (compartidas si empatan en puntos y marcadores exactos)
  let currentDisplayRank = 1;
  const rankedLeaderboard = leaderboard.map((player, index) => {
    if (index > 0) {
      const prevPlayer = leaderboard[index - 1];
      if (
        player.totalPoints === prevPlayer.totalPoints && 
        player.exactMatchesCount === prevPlayer.exactMatchesCount
      ) {
        // Empate total: mantienen el mismo rango visible
      } else {
        // No hay empate: el rango es su índice real en la lista (index + 1)
        currentDisplayRank = index + 1;
      }
    }
    return { ...player, rank: currentDisplayRank, index };
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#006847] via-[#CFB53B] to-[#da291c]">
              Posiciones
            </h1>
            <p className="text-sm font-bold text-gray-400 tracking-widest mt-1">Tabla General</p>
          </div>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
          >
            Volver al Inicio
          </Link>
        </header>

        {/* Tabla */}
        <div className="bg-black/40 border border-white/10 rounded-3xl p-2 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#CFB53B]/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-bold w-16 text-center">Pos</th>
                  <th className="p-4 font-bold">Jugador</th>
                  <th className="p-4 font-bold text-center hidden sm:table-cell">Pts Partidos</th>
                  <th className="p-4 font-bold text-center hidden sm:table-cell">Pts Bonus</th>
                  <th className="p-4 font-black text-[#CFB53B] text-right text-base">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rankedLeaderboard.map((player) => {
                  const isMe = player.id === user.id;
                  
                  // Estilos especiales para el top 3
                  const rankStyles = 
                    player.rank === 1 ? "bg-[#CFB53B] text-black shadow-[0_0_10px_rgba(207,181,59,0.5)]" :
                    player.rank === 2 ? "bg-gray-300 text-black shadow-[0_0_10px_rgba(209,213,219,0.5)]" :
                    player.rank === 3 ? "bg-[#CD7F32] text-white shadow-[0_0_10px_rgba(205,127,50,0.5)]" :
                    "bg-white/5 text-gray-400";

                  return (
                    <tr 
                      key={player.id} 
                      className={`hover:bg-white/5 transition-colors ${isMe ? 'bg-[#006847]/20 border-l-4 border-[#006847]' : ''}`}
                    >
                      <td className="p-4 text-center">
                        <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full font-black text-sm ${rankStyles}`}>
                          {player.rank}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link href={`/posiciones/${player.id}`} className="group/link block">
                          <p className={`font-bold group-hover/link:underline underline-offset-2 ${isMe ? 'text-[#CFB53B]' : 'text-white'}`}>
                            {player.name}
                            {isMe && <span className="ml-2 text-xs bg-[#006847] text-white px-2 py-0.5 rounded-full">Tú</span>}
                            <span className="ml-2 text-[10px] text-gray-600 group-hover/link:text-gray-400 font-normal transition-colors">ver →</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Marcadores exactos: <strong className="text-[#CFB53B]">{player.exactMatchesCount}</strong>
                          </p>
                        </Link>
                      </td>
                      <td className="p-4 text-center text-gray-400 hidden sm:table-cell">
                        {player.matchPoints}
                      </td>
                      <td className="p-4 text-center text-gray-400 hidden sm:table-cell">
                        {player.bonusPoints}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-2xl font-black text-[#CFB53B]">
                          {player.totalPoints}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {leaderboard.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                Aún no hay jugadores registrados.
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
