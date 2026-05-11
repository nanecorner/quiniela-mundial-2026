'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateBonusPoints, calculateMatchPoints } from '@/lib/scoring'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@quiniela.com'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

/**
 * Calcula y aplica los puntos bonus a TODOS los usuarios
 * basándose en los resultados reales del torneo.
 */
export async function applyBonusPoints(formData: FormData) {
  // Auth check con cliente normal
  const admin = await getAdminUser()
  if (!admin) {
    return { error: 'No autorizado. Solo el administrador puede ejecutar esta acción.' }
  }

  const actualChampionId = formData.get('actual_champion_id') as string
  const actualRunnerUpId = formData.get('actual_runner_up_id') as string
  const actualMexicoStage = formData.get('actual_mexico_stage') as string

  if (!actualChampionId || !actualRunnerUpId || !actualMexicoStage) {
    return { error: 'Debes seleccionar los tres resultados antes de ejecutar.' }
  }

  if (actualChampionId === actualRunnerUpId) {
    return { error: 'El campeón y el subcampeón no pueden ser el mismo equipo.' }
  }

  const supabase = await createClient()

  // Obtener TODAS las predicciones bonus de todos los usuarios
  const { data: allBonusPredictions, error: fetchError } = await supabase
    .from('bonus_predictions')
    .select('id, user_id, champion_team_id, runner_up_team_id, mexico_stage')

  if (fetchError || !allBonusPredictions) {
    return { error: `Error al obtener predicciones: ${fetchError?.message}` }
  }

  if (allBonusPredictions.length === 0) {
    return { error: 'No hay predicciones bonus registradas aún.' }
  }

  // Calcular y aplicar puntos para cada usuario
  let updatedCount = 0
  const errors: string[] = []

  for (const prediction of allBonusPredictions) {
    const points = calculateBonusPoints(
      prediction.champion_team_id || '',
      actualChampionId,
      prediction.runner_up_team_id || '',
      actualRunnerUpId,
      prediction.mexico_stage || '',
      actualMexicoStage
    )

    const { error: updateError } = await supabase
      .from('bonus_predictions')
      .update({ points })
      .eq('id', prediction.id)

    if (updateError) {
      errors.push(`Error en usuario ${prediction.user_id}: ${updateError.message}`)
    } else {
      updatedCount++
    }
  }

  revalidatePath('/admin')
  revalidatePath('/posiciones')
  revalidatePath('/dashboard')

  if (errors.length > 0) {
    return {
      warning: `Se actualizaron ${updatedCount} de ${allBonusPredictions.length} usuarios. Errores: ${errors.join(', ')}`
    }
  }

  return {
    success: true,
    message: `✅ Puntos bonus aplicados correctamente a ${updatedCount} participante(s).`
  }
}

/**
 * Actualiza el resultado real de un partido y calcula los puntos
 * de todas las predicciones asociadas.
 */
export async function updateMatchResult(formData: FormData) {
  // Auth check con cliente normal
  const admin = await getAdminUser()
  if (!admin) return { error: 'No autorizado' }

  const supabase = await createClient()

  const matchId = formData.get('match_id') as string
  const status = formData.get('status') as 'scheduled' | 'locked' | 'finished'
  const advancingTeamId = formData.get('advancing_team_id') as string || null

  if (!matchId) return { error: 'ID de partido inválido' }

  // Construir el payload de actualización
  const updatePayload: Record<string, any> = { status }

  // Solo actualizar marcadores si el partido está finalizado o bloqueado con marcador
  const homeScoreRaw = formData.get('home_score') as string
  const awayScoreRaw = formData.get('away_score') as string
  const homeScore = parseInt(homeScoreRaw)
  const awayScore = parseInt(awayScoreRaw)

  if (!isNaN(homeScore) && !isNaN(awayScore)) {
    updatePayload.home_score = homeScore
    updatePayload.away_score = awayScore
  }

  if (advancingTeamId) {
    updatePayload.winner_team_id = advancingTeamId
  }

  // 1. Actualizar el partido
  const { error: matchUpdateError } = await supabase
    .from('matches')
    .update(updatePayload)
    .eq('id', matchId)

  if (matchUpdateError) return { error: `Error al actualizar partido: ${matchUpdateError.message}` }

  // 2. Si está finalizado y hay marcador, calcular puntos para todas las predicciones
  if (status === 'finished' && !isNaN(homeScore) && !isNaN(awayScore)) {
    const { data: match } = await supabase
      .from('matches')
      .select('stage')
      .eq('id', matchId)
      .single()

    const isKnockout = match?.stage !== 'group_stage'

    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)

    if (predictions) {
      for (const pred of predictions) {
        const points = calculateMatchPoints(
          pred.predicted_home_score,
          pred.predicted_away_score,
          homeScore,
          awayScore,
          pred.predicted_winner_team_id,
          advancingTeamId,
          isKnockout
        )

        await supabase
          .from('predictions')
          .update({ points })
          .eq('id', pred.id)
      }
    }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/posiciones')
  
  return { success: true }
}
