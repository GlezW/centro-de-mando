export type Units = 'lb' | 'kg'
const LB_PER_KG = 2.2046226218

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d

/** lb (almacenado) -> unidad mostrada */
export function fromLb(lb: number, units: Units): number {
  return units === 'kg' ? round(lb / LB_PER_KG, 1) : round(lb, 1)
}
/** valor escrito por el usuario -> lb (almacenado) */
export function toLb(value: number, units: Units): number {
  return units === 'kg' ? round(value * LB_PER_KG, 2) : round(value, 2)
}
export function fmtWeight(lb: number, units: Units): string {
  return `${fromLb(lb, units)} ${units}`
}
