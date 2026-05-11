import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminBonusPanel from './AdminBonusPanel'
import AdminMatchRow from './AdminMatchRow'

export const revalidate = 0

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@quiniela.com'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  // Obtener todos los equipos para los selects
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, code, flag_url')
    .order('name')

  // Obtener todos los partidos
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id (id, name, code, flag_url),
      away_team:away_team_id (id, name, code, flag_url)
    `)
    .order('starts_at', { ascending: true })

  // Obtener stats actuales de bonus
  const { data: bonusPredictions } = await supabase
    .from('bonus_predictions')
    .select('id, user_id, champion_team_id, runner_up_team_id, mexico_stage, points, profiles(name)')

  const totalParticipants = bonusPredictions?.length || 0
  const withPoints = bonusPredictions?.filter(b => (b.points || 0) > 0).length || 0

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <header className="border-b border-white/10 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-[#da291c] uppercase tracking-widest mb-1">
                🔐 Zona Restringida
              </p>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#da291c] via-[#CFB53B] to-[#006847]">
                Panel Admin
              </h1>
              <p className="text-sm text-gray-400 mt-1">World Cup 26 · Quiniela</p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
            >
              ← Dashboard
            </a>
          </div>
        </header>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 border border-white/10 p-5 rounded-2xl">
            <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">Participantes con Bonus</p>
            <p className="text-4xl font-black text-white">{totalParticipants}</p>
          </div>
          <div className="bg-black/40 border border-white/10 p-5 rounded-2xl">
            <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">Ya tienen puntos calculados</p>
            <p className="text-4xl font-black text-[#CFB53B]">{withPoints}</p>
          </div>
        </div>

        {/* Sección de Partidos */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-black uppercase tracking-wider text-white">
              ⚽ Resultados de Partidos
            </h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>
          
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Fase</th>
                    <th className="px-4 py-3 text-center">Marcador Real</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Avanza</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {matches?.map((match) => (
                    <AdminMatchRow key={match.id} match={match as any} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Panel de cálculo masivo Bonus */}
        <AdminBonusPanel teams={teams as any || []} />

        {/* Tabla de predicciones actuales */}
        <section>
          <h2 className="text-xl font-bold text-[#CFB53B] uppercase tracking-wider mb-4">
            Predicciones Registradas
          </h2>
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Participante</th>
                    <th className="px-4 py-3">Campeón (ID)</th>
                    <th className="px-4 py-3">Subcampeón (ID)</th>
                    <th className="px-4 py-3">Fase México</th>
                    <th className="px-4 py-3 text-right text-[#CFB53B]">Puntos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bonusPredictions && bonusPredictions.length > 0 ? (
                    bonusPredictions.map((b: any) => (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-bold text-white">
                          {b.profiles?.name || b.user_id?.slice(0, 8) + '...'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                          {b.champion_team_id?.slice(0, 8) || '—'}...
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                          {b.runner_up_team_id?.slice(0, 8) || '—'}...
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {b.mexico_stage?.replace(/_/g, ' ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-black text-lg ${(b.points || 0) > 0 ? 'text-[#CFB53B]' : 'text-gray-600'}`}>
                            {b.points || 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        No hay predicciones bonus registradas aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
