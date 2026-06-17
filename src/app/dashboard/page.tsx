import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import BonusCard from '@/components/BonusCard';

export const revalidate = 0; // Para que no cachee agresivamente esta página y veamos actualizaciones

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Obtener perfil del usuario para mostrar su nombre o apodo
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Obtener los puntos totales (sumando los de las predicciones)
  const { data: predictionsData } = await supabase
    .from('predictions')
    .select('points')
    .eq('user_id', user.id);

  const totalPoints = predictionsData?.reduce((acc, curr) => acc + (curr.points || 0), 0) || 0;

  // Obtener todos los partidos ordenados por fecha
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      id, stage, starts_at, status, home_score, away_score,
      home_team:home_team_id (id, name, code, flag_url),
      away_team:away_team_id (id, name, code, flag_url)
    `)
    .order('starts_at', { ascending: true });

  if (matchesError) {
    console.error('Error cargando partidos:', matchesError);
  }

  // Obtener todos los equipos para los dropdowns
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name');

  // Obtener las predicciones bonus del usuario
  const { data: bonusPrediction } = await supabase
    .from('bonus_predictions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Calcular ranking (Posición del usuario actual comparado con los demás)
  let allPredictions: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data } = await supabase
      .from('predictions')
      .select('user_id, points, match_id, predicted_home_score, predicted_away_score')
      .range(from, from + step - 1);
    if (data && data.length > 0) {
      allPredictions = allPredictions.concat(data);
      if (data.length < step) hasMore = false;
      else from += step;
    } else {
      hasMore = false;
    }
  }
  const { data: allBonus } = await supabase.from('bonus_predictions').select('user_id, points');
  const { data: allProfiles } = await supabase.from('profiles').select('id');

  // Obtener las predicciones del usuario
  const { data: userPredictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id);

  const matchesMap = new Map(matches?.filter((m: any) => m.status === 'finished').map((m: any) => [m.id, m]) || []);

  let myRank = 1;
  const myTotal = totalPoints + (bonusPrediction?.points || 0);
  const myExactMatches = userPredictions?.filter(p => {
    const match = matchesMap.get(p.match_id);
    if (!match || match.home_score === null || match.away_score === null) return false;
    return p.predicted_home_score === match.home_score && p.predicted_away_score === match.away_score;
  }).length || 0;

  if (allProfiles && allPredictions) {
    const leaderStats = allProfiles.map(prof => {
      const userPreds = allPredictions.filter(p => p.user_id === prof.id);
      const pPts = userPreds.reduce((sum, p) => sum + (p.points || 0), 0);
      const bPts = allBonus?.filter(b => b.user_id === prof.id).reduce((sum, b) => sum + (b.points || 0), 0) || 0;
      const exacts = userPreds.filter(p => {
        const match = matchesMap.get(p.match_id);
        if (!match || match.home_score === null || match.away_score === null) return false;
        return p.predicted_home_score === match.home_score && p.predicted_away_score === match.away_score;
      }).length;
      return { total: pPts + bPts, exacts };
    });

    // Contar cuántos están estrictamente arriba de mí
    // Tienen más puntos totales OR (tienen mismos puntos PERO más exactos)
    myRank = leaderStats.filter(s =>
      s.total > myTotal || (s.total === myTotal && s.exacts > myExactMatches)
    ).length + 1;
  }

  // Determinar si el torneo ya empezó (si el primer partido ya pasó su starts_at)
  const isTournamentStarted = matches && matches.length > 0
    ? new Date(matches[0].starts_at) <= new Date()
    : false;

  // Mapear predicciones por match_id para acceso rápido
  const predictionsMap = new Map();
  userPredictions?.forEach(p => predictionsMap.set(p.match_id, p));

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#006847] via-[#CFB53B] to-[#da291c]">
              WORLD CUP 26
            </h1>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">Quiniela</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-400">Jugador</p>
              <p className="font-bold text-white">{profile?.name || user.email}</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <a
                  href="/posiciones"
                  className="flex-1 text-xs text-center font-bold px-3 py-1.5 rounded-lg border border-[#006847] text-[#006847] bg-[#006847]/10 hover:bg-[#006847]/20 transition-colors"
                >
                  Leaderboard
                </a>
                <a
                  href="/reglas"
                  className="flex-1 text-xs text-center font-bold px-3 py-1.5 rounded-lg border border-[#CFB53B] text-[#CFB53B] bg-[#CFB53B]/10 hover:bg-[#CFB53B]/20 transition-colors"
                >
                  Reglamento
                </a>
              </div>
              <form action="/auth/logout" method="post">
                <button className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                  Salir
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[#006847]/20 border border-[#006847]/50 p-4 rounded-2xl">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Mis Puntos Totales</h3>
            <p className="text-4xl font-black text-white">{myTotal}</p>
          </div>
          <div className="bg-[#CFB53B]/20 border border-[#CFB53B]/50 p-4 rounded-2xl">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Posición</h3>
            <p className="text-4xl font-black text-[#CFB53B]">#{myRank}</p>
          </div>
        </div>

        {/* Predicciones Bonus */}
        {teams && teams.length > 0 && (
          <BonusCard
            teams={teams as any}
            bonusPrediction={bonusPrediction as any}
            isLocked={isTournamentStarted}
          />
        )}

        <section>
          <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-[#CFB53B]">Partidos</h2>
            <p className="text-sm text-gray-400">Guarda tu predicción antes de que empiece el partido.</p>
          </div>

          {matches && matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match as any}
                  userPrediction={predictionsMap.get(match.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-black/30 rounded-2xl border border-white/5">
              <p className="text-gray-400">No hay partidos disponibles aún.</p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
