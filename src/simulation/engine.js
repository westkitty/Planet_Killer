import { normalizeScenario } from './scenario.js';
import { targetAt } from './target.js';
import { simulateImmediate, applyEntryCoupling, climateEnvelope, ecologicalStress } from './core.js';
import { entryCouplingFactor } from './impactorClasses.js';
import { visualStateAtTime } from './timeline.js';

export function evaluateScenario(input) {
  const scenario = normalizeScenario(input);
  const target = targetAt({ epochId: scenario.epochId, ...scenario.target });
  const result = simulateImmediate(scenario, target);
  const coupling = entryCouplingFactor(scenario.impactor.classId);
  if (coupling !== 1) {
    result.loading = applyEntryCoupling(result.loading, scenario.impactor.classId, coupling);
    result.climate = climateEnvelope(result.loading, scenario.climateOptions);
    result.ecology = ecologicalStress({ impactor: result.impactor, target, regional: result.regional, climate: result.climate });
  }
  return { scenario, target, result, visual: visualStateAtTime(scenario.timelineTime) };
}

export function evaluateAtTime(input, time) {
  const evaluated = evaluateScenario({ ...input, timelineTime: time });
  evaluated.visual = visualStateAtTime(time);
  return evaluated;
}
