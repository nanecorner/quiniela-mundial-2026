'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePrediction(matchId: string, homeScore: number, awayScore: number, predictedWinnerId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'No autorizado' }
  }

  // 1. Validar que el partido aún está "scheduled" y no ha empezado
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('status, stage, starts_at')
    .eq('id', matchId)
    .single()

  if (matchError || !match) {
    return { error: 'Partido no encontrado' }
  }

  if (match.status !== 'scheduled') {
    return { error: 'El partido ya ha comenzado o está bloqueado' }
  }

  if (new Date(match.starts_at) <= new Date()) {
    return { error: 'El tiempo límite para predecir este partido ha expirado' }
  }

  // 2. Insertar o actualizar la predicción
  // Usamos upsert basado en el constraint unique (user_id, match_id)
  const payload: any = {
    user_id: user.id,
    match_id: matchId,
    predicted_home_score: homeScore,
    predicted_away_score: awayScore,
    updated_at: new Date().toISOString(),
  }

  if (predictedWinnerId) {
    payload.predicted_winner_team_id = predictedWinnerId
  }

  const { error } = await supabase
    .from('predictions')
    .upsert(payload, { onConflict: 'user_id, match_id' })

  if (error) {
    console.error('Error saving prediction:', error)
    return { error: 'Ocurrió un error al guardar tu predicción. Intenta de nuevo.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
