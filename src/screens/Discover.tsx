import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getViewerId, listDiscover } from '../data/api.ts'
import { useApi } from '../data/useApi.ts'
import { WantToGoButton } from '../components/WantToGoButton.tsx'
import { socialLines } from '../components/format.ts'

export default function Discover() {
  const viewerId = getViewerId()
  const [query, setQuery] = useState('')
  const cafes = useApi(() => listDiscover(viewerId, query), [viewerId, query])

  return (
    <div className="discover">
      <h1>Discover</h1>
      <input type="search" className="search" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search cafés, areas, cities" aria-label="Search cafés" />
      {cafes?.length === 0 && <p className="muted">No café matches “{query}”.</p>}
      <div className="discover-list">
        {cafes?.map((s) => {
          const lines = socialLines(s)
          return (
            <Link key={s.cafe.id} to={`/cafe/${s.cafe.id}`} className="discover-card">
              <div className="discover-img">
                <img src={s.cafe.coverPhotoUrl} alt="" />
                <WantToGoButton cafeId={s.cafe.id} active={s.viewerWantsToGo} compact />
              </div>
              <div className="discover-body">
                <b>{s.cafe.name}</b>
                <span className="muted small">{s.cafe.area} · {s.cafe.city}</span>
                {lines.length > 0 && <div className="social">{lines.slice(0, 2).map((l) => <span key={l}>{l}</span>)}</div>}
                <div className="chips">{s.notableItems.map((n) => <span key={n} className="chip">{n}</span>)}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
