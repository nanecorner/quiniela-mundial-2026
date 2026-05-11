'use client'

import { useState, useTransition } from 'react'
import { applyBonusPoints } from './actions'

const MEXICO_STAGES = [
  { id: 'group_stage', label: 'Fase de Grupos' },
  { id: 'round_of_32', label: 'Ronda de 32 (Dieciseisavos)' },
  { id: 'round_of_16', label: 'Octavos de Final' },
  { id: 'quarter_finals', label: 'Cuartos de Final' },
  { id: 'semi_finals', label: 'Semifinales' },
  { id: 'final', label: 'Final' },
]

type Team = {
  id: string
  name: string
  code: string
  flag_url: string | null
}

export default function AdminBonusPanel({ teams }: { teams: Team[] }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'warning'
    text: string
  } | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!confirmed) {
      setResult({ type: 'error', text: '⚠️ Debes marcar la casilla de confirmación antes de ejecutar.' })
      return
    }

    setResult(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await applyBonusPoints(formData)

      if (res.error) {
        setResult({ type: 'error', text: res.error })
      } else if (res.warning) {
        setResult({ type: 'warning', text: res.warning })
      } else if (res.success) {
        setResult({ type: 'success', text: res.message || '¡Puntos aplicados!' })
        setConfirmed(false) // Reset confirmation
      }
    })
  }

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <section className="bg-gradient-to-br from-[#da291c]/10 to-black/40 border border-[#da291c]/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">

      {/* Glow decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#da291c]/10 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10">
        <div className="mb-6 border-b border-white/10 pb-5">
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#da291c] flex items-center gap-2">
            ⚡ Calcular Puntos Bonus
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Selecciona los resultados reales del torneo y aplica los puntos a todos los participantes de una sola vez.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Campeón Real */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#CFB53B] uppercase tracking-wider" htmlFor="actual_champion_id">
                🥇 Campeón Real
              </label>
              <select
                id="actual_champion_id"
                name="actual_champion_id"
                required
                disabled={isPending}
                className="w-full bg-black/60 border border-[#CFB53B]/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#CFB53B] disabled:opacity-50"
              >
                <option value="">Selecciona el campeón...</option>
                {sortedTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Subcampeón Real */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider" htmlFor="actual_runner_up_id">
                🥈 Subcampeón Real
              </label>
              <select
                id="actual_runner_up_id"
                name="actual_runner_up_id"
                required
                disabled={isPending}
                className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
              >
                <option value="">Selecciona el subcampeón...</option>
                {sortedTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Fase de México Real */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#006847] uppercase tracking-wider" htmlFor="actual_mexico_stage">
                🇲🇽 Destino de México
              </label>
              <select
                id="actual_mexico_stage"
                name="actual_mexico_stage"
                required
                disabled={isPending}
                className="w-full bg-black/60 border border-[#006847]/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#006847] disabled:opacity-50"
              >
                <option value="">¿Hasta dónde llegaron?</option>
                {MEXICO_STAGES.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Confirmación de seguridad */}
          <div className="bg-[#da291c]/10 border border-[#da291c]/30 rounded-xl p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={isPending}
              className="mt-1 w-4 h-4 accent-[#da291c] cursor-pointer"
            />
            <label htmlFor="confirm" className="text-sm text-gray-300 cursor-pointer leading-relaxed">
              <strong className="text-[#da291c]">Confirmo</strong> que los datos seleccionados son correctos.
              Esta acción <strong className="text-white">sobreescribirá los puntos bonus de TODOS los participantes</strong> y no se puede deshacer fácilmente.
            </label>
          </div>

          {/* Resultado */}
          {result && (
            <div className={`p-4 rounded-xl text-sm font-semibold ${
              result.type === 'success' ? 'bg-[#006847]/20 border border-[#006847]/50 text-[#4ade80]' :
              result.type === 'warning' ? 'bg-yellow-900/20 border border-yellow-500/50 text-yellow-400' :
              'bg-[#da291c]/20 border border-[#da291c]/50 text-[#f87171]'
            }`}>
              {result.text}
            </div>
          )}

          {/* Botón de ejecución */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3 bg-gradient-to-r from-[#da291c] to-[#b02216] hover:from-[#b02216] hover:to-[#8c1b11] text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(218,41,28,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculando...
                </span>
              ) : (
                '⚡ Aplicar Puntos a Todos'
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
