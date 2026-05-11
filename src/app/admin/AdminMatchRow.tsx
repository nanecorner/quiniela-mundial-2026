'use client'

import { useState, useTransition } from 'react'
import { updateMatchResult } from './actions'

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

export default function AdminMatchRow({ match }: { match: Match }) {
  const [isPending, startTransition] = useTransition()
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() || '0')
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() || '0')
  const [status, setStatus] = useState(match.status)
  const [advancingTeamId, setAdvancingTeamId] = useState<string>(
    (match as any).winner_team_id || ''
  )
  const [message, setMessage] = useState<string | null>(null)

  const isKnockout = match.stage !== 'group_stage'

  const handleSave = () => {
    const formData = new FormData()
    formData.append('match_id', match.id)
    formData.append('home_score', homeScore)
    formData.append('away_score', awayScore)
    formData.append('status', status)
    if (advancingTeamId) formData.append('advancing_team_id', advancingTeamId)

    startTransition(async () => {
      const res = await updateMatchResult(formData)
      if (res.error) {
        setMessage('❌ Error: ' + res.error)
      } else {
        setMessage('✅ Actualizado')
        setTimeout(() => setMessage(null), 2000)
      }
    })
  }

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
        {new Date(match.starts_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="p-4">
        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300 uppercase">
          {match.stage.replace('_', ' ')}
        </span>
      </td>
      <td className="p-4 flex items-center gap-3 justify-center">
        <div className="flex flex-col items-center w-16">
           {match.home_team ? (
             <>
               <img src={match.home_team.flag_url || ''} className="w-6 h-4 object-cover mb-1 rounded-sm" />
               <span className="text-[10px] font-bold truncate w-full text-center">{match.home_team.code}</span>
             </>
           ) : (
             <span className="text-[10px] text-gray-600 font-bold">TBD</span>
           )}
        </div>
        
        <input 
          type="number" 
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
          disabled={!match.home_team}
          className="w-10 h-10 bg-black/40 border border-white/20 rounded text-center text-lg font-bold disabled:opacity-30"
        />
        <span className="text-gray-500">-</span>
        <input 
          type="number" 
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
          disabled={!match.away_team}
          className="w-10 h-10 bg-black/40 border border-white/20 rounded text-center text-lg font-bold disabled:opacity-30"
        />

        <div className="flex flex-col items-center w-16">
           {match.away_team ? (
             <>
               <img src={match.away_team.flag_url || ''} className="w-6 h-4 object-cover mb-1 rounded-sm" />
               <span className="text-[10px] font-bold truncate w-full text-center">{match.away_team.code}</span>
             </>
           ) : (
             <span className="text-[10px] text-gray-600 font-bold">TBD</span>
           )}
        </div>
      </td>
      
      <td className="p-4">
        <select 
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          disabled={!match.home_team || !match.away_team}
          className="bg-black/40 border border-white/20 rounded text-xs p-1 text-white disabled:opacity-30"
        >
          <option value="scheduled">Programado</option>
          <option value="locked">Bloqueado</option>
          <option value="finished">Finalizado</option>
        </select>
      </td>

      <td className="p-4">
        {isKnockout && match.home_team && match.away_team ? (
          <select 
            value={advancingTeamId}
            onChange={(e) => setAdvancingTeamId(e.target.value)}
            className="bg-black/40 border border-white/20 rounded text-[10px] p-1 text-[#CFB53B]"
          >
            <option value="">¿Quién avanza?</option>
            <option value={match.home_team.id}>{match.home_team.name}</option>
            <option value={match.away_team.id}>{match.away_team.name}</option>
          </select>
        ) : (
          <span className="text-gray-700 text-[10px]">N/A</span>
        )}
      </td>

      <td className="p-4 text-right">
        <div className="flex flex-col items-end gap-1">
          <button 
            onClick={handleSave}
            disabled={isPending}
            className="px-3 py-1 bg-[#006847] hover:bg-[#004b36] text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            {isPending ? '...' : 'Guardar'}
          </button>
          {message && <span className="text-[9px] font-bold block">{message}</span>}
        </div>
      </td>
    </tr>
  )
}
