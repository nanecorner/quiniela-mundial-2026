import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0;

const MEXICO_STAGE_LABELS: Record<string, string> = {
  group_stage: 'Fase de Grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de Final',
  quarter_finals: 'Cuartos de Final',
  semi_finals: 'Semifinales',
  final: 'Final',
};

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'third_place', 'final'];

export default async function PlayerPredictionsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Perfil del jugador
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('id', userId)
    .single();

  if (!profile) notFound();

  // Partidos bloqueados o finalizados con equipos
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, stage, starts_at, status, home_score, away_score, winner_team_id,
      home_team:home_team_id (id, name, code, flag_url),
      away_team:away_team_id (id, name, code, flag_url)
    `)
    .in('status', ['locked', 'finished'])
    .order('starts_at', { ascending: true });

  // Predicciones del jugador
  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, predicted_home_score, predicted_away_score, predicted_winner_team_id, points')
    .eq('user_id', userId);

  // Bonus con JOIN a teams para obtener los nombres
  const { data: bonusPrediction } = await supabase
    .from('bonus_predictions')
    .select(`
      points, mexico_stage,
      champion_team:champion_team_id (id, name, flag_url),
      runner_up_team:runner_up_team_id (id, name, flag_url)
    `)
    .eq('user_id', userId)
    .single();

  // Obtener la bandera de México por código de equipo
  const { data: mexicoTeam } = await supabase
    .from('teams')
    .select('flag_url')
    .eq('code', 'MEX')
    .single();

  // Las predicciones bonus de OTROS solo se revelan cuando ya inició el torneo
  const { data: firstMatch } = await supabase
    .from('matches')
    .select('starts_at')
    .order('starts_at', { ascending: true })
    .limit(1)
    .single();

  const isTournamentStarted = firstMatch
    ? new Date(firstMatch.starts_at) <= new Date()
    : false;

  const isMe = user.id === userId;

  // Solo mostrar bonus si es el propio usuario O si el torneo ya inició
  const showBonus = isMe || isTournamentStarted;

  const predMap = new Map(predictions?.map(p => [p.match_id, p]) ?? []);

  const matchPoints = predictions?.reduce((s, p) => s + (p.points || 0), 0) ?? 0;
  const bonusPoints = bonusPrediction?.points ?? 0;
  const totalPoints = matchPoints + bonusPoints;
  // Exacto = 5pts (marcador exacto) o 7pts (exacto + acertó quién avanza en eliminatoria)
  const exactMatches = predictions?.filter(p => (p.points ?? 0) === 5 || (p.points ?? 0) === 7).length ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="border-b border-white/10 pb-6 flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Predicciones de</p>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#006847] via-[#CFB53B] to-[#da291c]">
              {profile.name}
              {isMe && <span className="ml-3 text-sm normal-case text-[#006847]">(Tú)</span>}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span>Total: <strong className="text-[#CFB53B] text-lg">{totalPoints} pts</strong></span>
              <span className="text-gray-700">•</span>
              <span>Pts. partidos: <strong className="text-white">{matchPoints}</strong></span>
              <span className="text-gray-700">•</span>
              <span>Pts. bonus: <strong className="text-[#CFB53B]">{bonusPoints}</strong></span>
              <span className="text-gray-700">•</span>
              <span>⭐ Marcadores exactos: <strong className="text-[#CFB53B]">{exactMatches}</strong></span>
            </div>
          </div>
          <Link
            href="/posiciones"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors shrink-0"
          >
            ← Posiciones
          </Link>
        </header>

        {/* Predicciones Bonus */}
        {bonusPrediction && showBonus && (
          <section>
            <h2 className="text-lg font-black uppercase tracking-widest text-[#CFB53B] mb-4">
              🏆 Predicciones Bonus
            </h2>
            <div className="bg-[#CFB53B]/10 border border-[#CFB53B]/30 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">

              {/* Campeón */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">🥇 Campeón (+15 pts)</p>
                {(bonusPrediction as any).champion_team ? (
                  <div className="flex items-center gap-2">
                    {(bonusPrediction as any).champion_team.flag_url && (
                      <img src={(bonusPrediction as any).champion_team.flag_url} className="w-8 h-5 object-cover rounded-sm" />
                    )}
                    <span className="font-bold text-white">{(bonusPrediction as any).champion_team.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-600">No elegido</span>
                )}
              </div>

              {/* Subcampeón */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">🥈 Subcampeón (+10 pts)</p>
                {(bonusPrediction as any).runner_up_team ? (
                  <div className="flex items-center gap-2">
                    {(bonusPrediction as any).runner_up_team.flag_url && (
                      <img src={(bonusPrediction as any).runner_up_team.flag_url} className="w-8 h-5 object-cover rounded-sm" />
                    )}
                    <span className="font-bold text-white">{(bonusPrediction as any).runner_up_team.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-600">No elegido</span>
                )}
              </div>

              {/* Fase México */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase font-bold tracking-wider">
                  {mexicoTeam?.flag_url && (
                    <img src={mexicoTeam.flag_url} className="w-6 h-4 object-cover rounded-sm inline" />
                  )}
                  <span>Fase de México (+10 pts)</span>
                </div>
                <span className="font-bold text-white">
                  {bonusPrediction.mexico_stage
                    ? MEXICO_STAGE_LABELS[bonusPrediction.mexico_stage] ?? bonusPrediction.mexico_stage
                    : <span className="text-gray-600">No elegido</span>}
                </span>
              </div>

              {/* Puntos bonus obtenidos */}
              {bonusPoints > 0 && (
                <div className="sm:col-span-3 border-t border-[#CFB53B]/20 pt-3 flex justify-end">
                  <span className="text-sm font-black text-[#CFB53B]">
                    +{bonusPoints} pts bonus obtenidos
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Predicciones por Partido */}
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4">
            ⚽ Partidos Bloqueados / Finalizados
          </h2>

          {!matches || matches.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-black/20 rounded-2xl border border-white/5">
              Aún no hay partidos bloqueados o finalizados.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match: any) => {
                const pred = predMap.get(match.id);
                const isFinished = match.status === 'finished';
                const isKnockout = KNOCKOUT_STAGES.includes(match.stage);

                // Badge simplificado: ⭐ si fue marcador exacto + pts totales
                let pointsBadge = null;
                if (isFinished && pred !== undefined) {
                  const pts = pred?.points ?? 0;
                  const isExact = pts === 5 || pts === 7;
                  pointsBadge = {
                    label: `${isExact ? '⭐ ' : ''}${pts} pts`,
                    color: isExact
                      ? 'text-[#CFB53B] bg-[#CFB53B]/20 border-[#CFB53B]/40'
                      : pts >= 2
                        ? 'text-green-400 bg-green-900/20 border-green-700/30'
                        : 'text-gray-600 bg-white/5 border-white/10'
                  };
                }

                // Equipo que el jugador predijo que avanzaría
                const predictedWinnerId = pred?.predicted_winner_team_id;
                const predictedWinnerName =
                  predictedWinnerId === match.home_team?.id ? match.home_team?.name :
                    predictedWinnerId === match.away_team?.id ? match.away_team?.name :
                      null;

                // Equipo que realmente avanzó (del campo winner_team_id del partido)
                const actualWinnerId = match.winner_team_id;
                const actualWinnerName =
                  actualWinnerId === match.home_team?.id ? match.home_team?.name :
                    actualWinnerId === match.away_team?.id ? match.away_team?.name :
                      null;

                return (
                  <div
                    key={match.id}
                    className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
                  >
                    {/* Fila principal */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                      {/* Fase y fecha */}
                      <div className="text-xs uppercase font-bold tracking-wider text-gray-500 sm:w-32 shrink-0">
                        <span className={`block ${isKnockout ? 'text-[#da291c]' : 'text-[#CFB53B]'}`}>
                          {match.stage.replace(/_/g, ' ')}
                        </span>
                        <span>{new Date(match.starts_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                      </div>

                      {/* Equipos y marcadores */}
                      <div className="flex-1 flex items-center justify-center gap-4">
                        {/* Local */}
                        <div className="flex flex-col items-center gap-1 w-20">
                          {match.home_team?.flag_url && (
                            <img src={match.home_team.flag_url} className="w-8 h-5 object-cover rounded-sm" />
                          )}
                          <span className="text-xs font-bold text-white text-center leading-tight">
                            {match.home_team?.code ?? '?'}
                          </span>
                        </div>

                        {/* Predicción */}
                        <div className="text-center">
                          <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Predicción</p>
                          {pred ? (
                            <span className="text-xl font-black text-white">
                              {pred.predicted_home_score} - {pred.predicted_away_score}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-700 font-bold">—</span>
                          )}
                        </div>

                        {/* Visitante */}
                        <div className="flex flex-col items-center gap-1 w-20">
                          {match.away_team?.flag_url && (
                            <img src={match.away_team.flag_url} className="w-8 h-5 object-cover rounded-sm" />
                          )}
                          <span className="text-xs font-bold text-white text-center leading-tight">
                            {match.away_team?.code ?? '?'}
                          </span>
                        </div>

                        {/* Resultado real */}
                        {isFinished && match.home_score !== null && (
                          <div className="text-center border-l border-white/10 pl-4 ml-2">
                            <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Real</p>
                            <span className="text-xl font-black text-gray-300">
                              {match.home_score} - {match.away_score}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Badge de puntos */}
                      <div className="sm:w-28 shrink-0 flex sm:justify-end">
                        {pointsBadge ? (
                          <span className={`text-xs font-black px-3 py-1 rounded-full border ${pointsBadge.color}`}>
                            {pointsBadge.label}
                          </span>
                        ) : match.status === 'locked' ? (
                          <span className="text-xs text-gray-700 font-bold uppercase">En juego</span>
                        ) : (
                          <span className="text-xs text-gray-700 font-bold">—</span>
                        )}
                      </div>
                    </div>

                    {/* Fila extra: quién avanza (solo en eliminatorias) */}
                    {isKnockout && pred && (
                      <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-xs">
                        <span className="text-gray-600 uppercase font-bold tracking-wide">⚔️ Avanza:</span>
                        <span className={`font-bold ${isFinished && actualWinnerId
                            ? predictedWinnerId === actualWinnerId
                              ? 'text-green-400'   // Acertó
                              : 'text-[#da291c]'   // Falló
                            : 'text-white'          // Aún no se sabe
                          }`}>
                          {predictedWinnerName ?? 'No eligió'}
                        </span>
                        {isFinished && actualWinnerName && (
                          <>
                            <span className="text-gray-700">→ Real:</span>
                            <span className="font-bold text-gray-300">{actualWinnerName}</span>
                            {predictedWinnerId === actualWinnerId && (
                              <span className="text-green-400 font-black">+2 pts ✓</span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
