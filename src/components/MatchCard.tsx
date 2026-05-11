'use client'

import { useState, useTransition } from 'react'
import { savePrediction } from '@/app/actions/predictions'

type Team = {
  id: string
  name: string
  code: string
  flag_url: string | null
}

type Match = {
  id: string
  stage: string
  starts_at: string
  status: 'scheduled' | 'locked' | 'finished'
  home_score: number | null
  away_score: number | null
  home_team: Team
  away_team: Team
}

type Prediction = {
  predicted_home_score: number
  predicted_away_score: number
  predicted_winner_team_id?: string | null
  points?: number
}

const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'third_place', 'final']

export default function MatchCard({ 
  match, 
  userPrediction 
}: { 
  match: Match
  userPrediction?: Prediction 
}) {
  const [homeScore, setHomeScore] = useState<string>(userPrediction?.predicted_home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState<string>(userPrediction?.predicted_away_score?.toString() ?? '')
  const [predictedWinnerId, setPredictedWinnerId] = useState<string>(
    userPrediction?.predicted_winner_team_id ?? ''
  )
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  const isLocked = match.status !== 'scheduled' || new Date(match.starts_at) <= new Date()
  const isKnockout = KNOCKOUT_STAGES.includes(match.stage)

  const hScoreParsed = parseInt(homeScore)
  const aScoreParsed = parseInt(awayScore)
  const scoresAreValid = !isNaN(hScoreParsed) && !isNaN(aScoreParsed)
  const isDraw = scoresAreValid && hScoreParsed === aScoreParsed

  // Auto-asignar ganador cuando el marcador no es empate
  const getAutoWinnerId = () => {
    if (!scoresAreValid || isDraw || !match.home_team || !match.away_team) return null
    return hScoreParsed > aScoreParsed ? match.home_team.id : match.away_team.id
  }

  const effectiveWinnerId = isDraw ? predictedWinnerId : (getAutoWinnerId() ?? '')

  const dateObj = new Date(match.starts_at)
  const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const handleSave = () => {
    setMessage(null)
    const hScore = parseInt(homeScore)
    const aScore = parseInt(awayScore)

    if (isNaN(hScore) || isNaN(aScore) || hScore < 0 || aScore < 0) {
      setMessage({ type: 'error', text: 'Ingresa un marcador válido' })
      return
    }

    if (isKnockout && isDraw && !predictedWinnerId) {
      setMessage({ type: 'error', text: 'Hay empate — selecciona quién avanza en penales' })
      return
    }

    startTransition(async () => {
      const res = await savePrediction(
        match.id,
        hScore,
        aScore,
        isKnockout ? effectiveWinnerId : undefined
      )
      if (res.error) {
        setMessage({ type: 'error', text: res.error })
      } else {
        setMessage({ type: 'success', text: '¡Guardado!' })
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-[#CFB53B]/50 transition-colors">
      
      {/* Etiqueta de Fase y Fecha */}
      <div className="flex justify-between items-center mb-4 text-xs font-semibold tracking-wider uppercase text-gray-400">
        <span className={`px-2 py-1 rounded-md ${isKnockout ? 'text-[#da291c] bg-[#da291c]/10' : 'text-[#CFB53B] bg-[#CFB53B]/10'}`}>
          {match.stage.replace(/_/g, ' ')}
        </span>
        <span>{dateStr} • {timeStr}</span>
      </div>

      <div className="flex justify-between items-center">
        {/* Equipo Local */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 flex items-center justify-center bg-white/5 text-xl">
            {match.home_team ? (
              match.home_team.flag_url ? (
                <img src={match.home_team.flag_url} alt={match.home_team.name} className="w-full h-full object-cover" />
              ) : (
                <span>{match.home_team.code}</span>
              )
            ) : (
              <span className="text-gray-500 text-sm">?</span>
            )}
          </div>
          <span className="font-bold text-white text-center text-sm">
            {match.home_team ? match.home_team.name : 'Por definir'}
          </span>
        </div>

        {/* Inputs del Marcador */}
        <div className="flex items-center justify-center gap-3 px-4">
          <input 
            type="number" 
            min="0"
            disabled={isLocked || isPending || !match.home_team || !match.away_team}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-12 h-14 bg-black/60 border border-white/20 rounded-xl text-center text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-[#CFB53B] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-gray-500 font-bold">-</span>
          <input 
            type="number" 
            min="0"
            disabled={isLocked || isPending || !match.home_team || !match.away_team}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-12 h-14 bg-black/60 border border-white/20 rounded-xl text-center text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-[#CFB53B] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* Equipo Visitante */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 flex items-center justify-center bg-white/5 text-xl">
            {match.away_team ? (
              match.away_team.flag_url ? (
                <img src={match.away_team.flag_url} alt={match.away_team.name} className="w-full h-full object-cover" />
              ) : (
                <span>{match.away_team.code}</span>
              )
            ) : (
              <span className="text-gray-500 text-sm">?</span>
            )}
          </div>
          <span className="font-bold text-white text-center text-sm">
            {match.away_team ? match.away_team.name : 'Por definir'}
          </span>
        </div>
      </div>

      {/* Selector quien avanza — solo en empate de eliminatorias */}
      {isKnockout && match.home_team && match.away_team && (
        <div className="mt-4 p-3 bg-[#da291c]/5 border border-[#da291c]/20 rounded-xl">
          {isDraw || !scoresAreValid ? (
            // Empate o sin marcador: hay que elegir manualmente
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#da291c] mb-2 text-center">
                ⚔️ Empate — ¿Quién avanza en penales? <span className="text-gray-500">(+2 pts)</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isLocked || isPending}
                  onClick={() => setPredictedWinnerId(match.home_team.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border disabled:cursor-not-allowed disabled:opacity-50 ${
                    predictedWinnerId === match.home_team.id
                      ? 'bg-[#da291c] border-[#da291c] text-white shadow-[0_0_10px_rgba(218,41,28,0.4)]'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:border-[#da291c]/50'
                  }`}
                >
                  {match.home_team.code}
                </button>
                <button
                  type="button"
                  disabled={isLocked || isPending}
                  onClick={() => setPredictedWinnerId(match.away_team.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border disabled:cursor-not-allowed disabled:opacity-50 ${
                    predictedWinnerId === match.away_team.id
                      ? 'bg-[#da291c] border-[#da291c] text-white shadow-[0_0_10px_rgba(218,41,28,0.4)]'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:border-[#da291c]/50'
                  }`}
                >
                  {match.away_team.code}
                </button>
              </div>
            </>
          ) : (
            // Marcador diferente: ganador automático
            <p className="text-[10px] font-bold uppercase tracking-widest text-center">
              ⚔️ Avanza automáticamente:{' '}
              <span className="text-[#da291c]">
                {effectiveWinnerId === match.home_team.id ? match.home_team.name : match.away_team.name}
              </span>
              <span className="text-gray-500 ml-1">(+2 pts si aciertas)</span>
            </p>
          )}
          {isLocked && userPrediction?.predicted_winner_team_id && (
            <p className="text-center text-[10px] text-gray-500 mt-2">
              Elegiste: <strong className="text-[#da291c]">
                {userPrediction.predicted_winner_team_id === match.home_team?.id 
                  ? match.home_team?.name 
                  : match.away_team?.name}
              </strong>
            </p>
          )}
        </div>
      )}

      {/* Footer / Status / Actions */}
      <div className="mt-4 flex justify-between items-center min-h-[2rem]">
        {isLocked ? (
           <div className="flex flex-col w-full text-center">
             <span className="text-xs uppercase font-bold text-[#da291c] tracking-widest bg-[#da291c]/10 py-1 rounded-md">
               {match.status === 'finished' ? 'Finalizado' : 'En Juego (Bloqueado)'}
             </span>
             {match.status === 'finished' && (
                <span className="text-xs mt-2 text-gray-400">
                  Resultado Real: {match.home_score} - {match.away_score} <br/>
                  Tus Puntos: <strong className="text-[#CFB53B]">{userPrediction?.points ?? 0} pts</strong>
                </span>
             )}
           </div>
        ) : (
          <>
            <div className="text-xs font-semibold">
              {message?.type === 'success' && <span className="text-[#006847]">{message.text}</span>}
              {message?.type === 'error' && <span className="text-[#da291c]">{message.text}</span>}
            </div>
            
            <button
              onClick={handleSave}
              disabled={isPending || !homeScore || !awayScore || (isKnockout && isDraw && !predictedWinnerId)}
              className="px-4 py-1.5 bg-[#006847] hover:bg-[#004b36] disabled:bg-gray-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors border border-[#CFB53B]/50 shadow-[0_0_10px_rgba(0,104,71,0.3)]"
            >
              {isPending ? '...' : 'Guardar'}
            </button>
          </>
        )}
      </div>

    </div>
  )
}
