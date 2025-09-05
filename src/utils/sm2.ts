// SM-2 simplificado só para registrar intenção de revisão
type CardState = { lastInterval: number; easiness: number; quality: 0|1|2|3|4|5 };
export function scheduleNext(cs: CardState) {
  const q = cs.quality;
  const e = Math.max(1.3, cs.easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const interval = cs.lastInterval < 1 ? 1 : Math.round(cs.lastInterval * e);
  const due = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
  return { easiness: e, interval, dueAt: due.toISOString() };
}
