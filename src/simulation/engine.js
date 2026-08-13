import { normalizeScenario } from './scenario.js';
import { targetAt } from './target.js';
import { simulateImmediate } from './core.js';
import { visualStateAtTime } from './timeline.js';

export function evaluateScenario(input) {
  const scenario = normalizeScenario(input);
  const target = targetAt({ epochId: scenario.epochId, ...scenario.target });
  const result = simulateImmediate(scenario, target);
  return { scenario, target, result, visual: visualStateAtTime(scenario.timelineTime) };
}

export function evaluateAtTime(input, time) {
  const evaluated = evaluateScenario({ ...input, timelineTime: time });
  evaluated.visual = visualStateAtTime(time);
  return evaluated;
}
