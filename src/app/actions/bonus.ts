'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveBonusPrediction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'No autorizado' }
  }

  // Verificar si el torneo ya empezó (usando la fecha del primer partido)
  const { data: firstMatch } = await supabase
    .from('matches')
    .select('starts_at')
    .order('starts_at', { ascending: true })
    .limit(1)
    .single()

  if (firstMatch && new Date(firstMatch.starts_at) <= new Date()) {
    return { error: 'El torneo ya ha comenzado. Las predicciones bonus están bloqueadas.' }
  }

  const championTeamId = formData.get('champion_team_id') as string
  const runnerUpTeamId = formData.get('runner_up_team_id') as string
  const mexicoStage = formData.get('mexico_stage') as string

  if (!championTeamId || !runnerUpTeamId || !mexicoStage) {
    return { error: 'Faltan campos por completar' }
  }

  if (championTeamId === runnerUpTeamId) {
    return { error: 'El campeón y subcampeón no pueden ser el mismo equipo' }
  }

  const { error } = await supabase
    .from('bonus_predictions')
    .upsert({
      user_id: user.id,
      champion_team_id: championTeamId,
      runner_up_team_id: runnerUpTeamId,
      mexico_stage: mexicoStage,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error saving bonus:', error)
    return { error: error.message || 'Ocurrió un error al guardar tus predicciones bonus.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
