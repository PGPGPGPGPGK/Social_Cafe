import type { MouseEvent } from 'react'
import { getViewerId, toggleWantToGo } from '../data/api.ts'

/** Stateless: `active` always comes from api data; the click writes through the api,
 *  which fires `dataChanged` so every mounted screen reloads. */
export function WantToGoButton({ cafeId, active, compact }: { cafeId: string; active: boolean; compact?: boolean }) {
  const click = (e: MouseEvent) => {
    e.preventDefault() // may sit inside a card link
    e.stopPropagation()
    toggleWantToGo(getViewerId(), cafeId)
  }
  return (
    <button type="button" className={`wtg ${active ? 'on' : ''} ${compact ? 'compact' : ''}`} onClick={click} aria-pressed={active}>
      {active ? '✓ Want to go' : '+ Want to go'}
    </button>
  )
}
