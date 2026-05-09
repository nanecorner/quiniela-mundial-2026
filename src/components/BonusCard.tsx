'use client'

import { useState, useTransition } from 'react'
import { saveBonusPrediction } from '@/app/actions/bonus'

type Team = {
  id: string
  name: string
  code: string
}

type BonusPrediction = {
  champion_team_id: string | null
  runner_up_team_id: string | null
  mexico_stage: string | null
  points: number
}

const MEXICO_STAGES = [
  { id: 'group_stage', label: 'Fase de Grupos' },
  { id: 'round_of_32', label: 'Ronda de 32 (Dieciseisavos)' },
  { id: 'round_of_16', label: 'Octavos de Final' },
  { id: 'quarter_finals', label: 'Cuartos de Final' },
  { id: 'semi_finals', label: 'Semifinales' },
  { id: 'final', label: 'Final' },
]

export default function BonusCard({
  teams,
  bonusPrediction,
  isLocked
}: {
  teams: Team[]
  bonusPrediction?: BonusPrediction
  isLocked: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await saveBonusPrediction(formData)
      if (res.error) {
        setMessage({ type: 'error', text: res.error })
      } else {
        setMessage({ type: 'success', text: '¡Predicciones Bonus guardadas!' })
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  // Ordenar equipos alfabéticamente para los dropdowns
  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="bg-[#CFB53B]/10 border border-[#CFB53B]/50 rounded-2xl p-6 shadow-xl backdrop-blur-md mb-10 relative overflow-hidden">

      <div className="absolute top-0 right-0 w-32 h-32 bg-[#CFB53B]/20 rounded-full blur-[50px] -mr-10 -mt-10" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-[#CFB53B] flex items-center gap-2">
              🏆 Predicciones Bonus
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Adivina los finalistas y el destino de México. Se bloquea al iniciar el torneo.
            </p>
          </div>
          {isLocked && (
            <span className="text-xs uppercase font-bold text-[#da291c] tracking-widest bg-[#da291c]/20 px-3 py-1.5 rounded-lg border border-[#da291c]/50">
              Bloqueado
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Campeón */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#CFB53B] uppercase tracking-wider" htmlFor="champion_team_id">
              🥇 Campeón (+15 pts)
            </label>
            <select
              id="champion_team_id"
              name="champion_team_id"
              defaultValue={bonusPrediction?.champion_team_id || ''}
              disabled={isLocked || isPending}
              required
              className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#CFB53B] disabled:opacity-50"
            >
              <option value="" disabled>Selecciona un equipo...</option>
              {sortedTeams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {/* Subcampeón */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-300 uppercase tracking-wider" htmlFor="runner_up_team_id">
              🥈 Subcampeón (+10 pts)
            </label>
            <select
              id="runner_up_team_id"
              name="runner_up_team_id"
              defaultValue={bonusPrediction?.runner_up_team_id || ''}
              disabled={isLocked || isPending}
              required
              className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#CFB53B] disabled:opacity-50"
            >
              <option value="" disabled>Selecciona un equipo...</option>
              {sortedTeams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {/* Etapa México */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#006847] uppercase tracking-wider" htmlFor="mexico_stage">
              🇲🇽 Destino de México (+10 pts)
            </label>
            <select
              id="mexico_stage"
              name="mexico_stage"
              defaultValue={bonusPrediction?.mexico_stage || ''}
              disabled={isLocked || isPending}
              required
              className="w-full bg-black/60 border border-[#006847]/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#006847] disabled:opacity-50"
            >
              <option value="" disabled>¿Hasta dónde llegarán?</option>
              {MEXICO_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </select>
          </div>

          {/* Botón de Guardar y Mensajes */}
          <div className="md:col-span-3 flex justify-between items-center mt-2 border-t border-white/10 pt-4">
            <div className="text-sm font-semibold">
              {message?.type === 'success' && <span className="text-[#006847] bg-[#006847]/20 px-3 py-1 rounded-md">{message.text}</span>}
              {message?.type === 'error' && <span className="text-[#da291c] bg-[#da291c]/20 px-3 py-1 rounded-md">{message.text}</span>}
            </div>

            {!isLocked && (
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-[#CFB53B] to-[#b39b2e] hover:from-[#b39b2e] hover:to-[#968224] text-black font-black rounded-xl transition-all shadow-[0_0_15px_rgba(207,181,59,0.3)] disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : 'Guardar Bonus'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
