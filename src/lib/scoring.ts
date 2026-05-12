/**
 * @param isKnockoutStage - Indica si el partido es de eliminación directa.
 * NOTA: En eliminatorias, el marcador (actualHomeScore/actualAwayScore) debe incluir 
 * el tiempo regular y el tiempo extra, pero EXCLUIR la tanda de penales.
 */
export function calculateMatchPoints(
  predictedHomeScore: number,
  predictedAwayScore: number,
  actualHomeScore: number,
  actualAwayScore: number,
  predictedAdvancingTeamId: string | null = null,
  actualAdvancingTeamId: string | null = null,
  isKnockoutStage: boolean = false
): number {
  let points = 0;

  // 1. Lógica de Marcadores
  const predictedDiff = predictedHomeScore - predictedAwayScore;
  const actualDiff = actualHomeScore - actualAwayScore;

  const predictedOutcome = predictedDiff > 0 ? 'home' : predictedDiff < 0 ? 'away' : 'tie';
  const actualOutcome = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'tie';

  if (predictedHomeScore === actualHomeScore && predictedAwayScore === actualAwayScore) {
    // Marcador exacto
    points += 5;
  } else if (predictedOutcome === actualOutcome && predictedDiff === actualDiff) {
    // Acertar ganador/empate y diferencia de goles
    points += 3;
  } else if (predictedOutcome === actualOutcome) {
    // Acertar solo ganador/empate
    points += 2;
  }

  // 2. Lógica de Eliminatorias (Equipo que avanza)
  if (isKnockoutStage && actualAdvancingTeamId) {
    if (predictedAdvancingTeamId === actualAdvancingTeamId) {
      points += 2;
    }
  }

  return points;
}

export function calculateBonusPoints(
  predictedChampionId: string,
  actualChampionId: string | null,
  predictedRunnerUpId: string,
  actualRunnerUpId: string | null,
  predictedMexicoStage: string,
  actualMexicoStage: string | null
): number {
  let points = 0;

  if (actualChampionId && predictedChampionId === actualChampionId) {
    points += 15;
  }

  if (actualRunnerUpId && predictedRunnerUpId === actualRunnerUpId) {
    points += 10;
  }

  if (actualMexicoStage && predictedMexicoStage === actualMexicoStage) {
    points += 10;
  }

  return points;
}
