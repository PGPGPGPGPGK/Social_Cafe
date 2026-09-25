import type { Visit } from './types.ts'

export type VisitDraft = Pick<Visit, 'cafeId' | 'text' | 'photos' | 'items' | 'visitedAt' | 'rating' | 'recommends' | 'staffShoutout' | 'companionUserIds'>

/** Today in the user's timezone as YYYY-MM-DD (Swedish locale formats dates as ISO). */
export const localToday = () => new Date().toLocaleDateString('sv')

/** Publish rules for a visit. Returns human-readable problems; empty = valid.
 *  `today` is YYYY-MM-DD. Must be re-checked server-side later (SR-20). */
export function validateVisit(d: VisitDraft, today: string): string[] {
  const errors: string[] = []
  if (!d.cafeId) errors.push('Pick a café.')
  if (d.photos.length < 1) errors.push('Add at least one photo.')
  if (!d.text.trim()) errors.push('Write something about the visit.')
  if (d.visitedAt && d.visitedAt.slice(0, 10) > today) errors.push('Visit date can’t be in the future.')
  if (d.items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1)) errors.push('Item quantities must be at least 1.')
  const itemIds = new Set(d.items.map((i) => i.menuItemId))
  if (d.photos.some((p) => p.menuItemId && !itemIds.has(p.menuItemId))) errors.push('A photo is linked to an item that isn’t in this visit.')
  const s = d.staffShoutout
  if (s) {
    if (!s.name.trim() || !s.message.trim()) errors.push('A staff shout-out needs a name and a message.')
    if (s.name.length > 40 || (s.role?.length ?? 0) > 40 || s.message.length > 280) errors.push('Shout-out is too long.')
  }
  return errors
}
