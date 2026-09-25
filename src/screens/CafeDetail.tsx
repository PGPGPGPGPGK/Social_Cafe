import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCafeView, getViewerId } from '../data/api.ts'
import { useApi } from '../data/useApi.ts'
import { WantToGoButton } from '../components/WantToGoButton.tsx'
import { Companions } from '../components/Companions.tsx'
import { fmtDate, socialLines } from '../components/format.ts'
import type { User } from '../domain/types.ts'

function Avatars({ users }: { users: User[] }) {
  return (
    <div className="avatars">
      {users.map((u) => (
        <Link key={u.id} to={`/u/${u.username}`} title={`@${u.username}`}><img src={u.photoUrl} alt={`@${u.username}`} /></Link>
      ))}
    </div>
  )
}

export default function CafeDetail() {
  const viewerId = getViewerId()
  const { cafeId = '' } = useParams()
  const navigate = useNavigate()
  const view = useApi(() => getCafeView(viewerId, cafeId), [viewerId, cafeId])

  if (view === undefined) return <p className="muted pad">Loading…</p>
  if (view === null) return <p className="muted pad">Café not found. <Link to="/discover">Back to Discover</Link></p>

  const { cafe } = view
  const lines = socialLines(view)

  return (
    <article className="cafe-detail">
      <div className="cafe-hero">
        <img src={cafe.coverPhotoUrl} alt="" />
        <button type="button" className="back" onClick={() => navigate(-1)} aria-label="Back">←</button>
      </div>

      <header className="cafe-head">
        <h1>{cafe.name}</h1>
        <p className="muted">📍 {cafe.area}, {cafe.city} · {cafe.country}{cafe.airport && ` · ✈️ ${cafe.airport.code}${cafe.airport.airside ? ' airside' : ''}`}</p>
        <div className="chips">{cafe.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        <div className="cafe-actions">
          <WantToGoButton cafeId={cafe.id} active={view.viewerWantsToGo} />
          <span className="muted small">{view.wantToGoCount} want to go · {view.visitCount} visits</span>
        </div>
        {lines.length > 0 && <div className="social">{lines.map((l) => <span key={l}>{l}</span>)}</div>}
      </header>

      {cafe.claimStatus === 'claimed' ? (
        <section className="official">
          <div className="official-head">
            <h2>From the Café</h2>
            <span className="official-tag">Official · posted by {cafe.name}</span>
          </div>
          {cafe.business?.about && <p>{cafe.business.about}</p>}
          <dl className="biz">
            {cafe.business?.hours && <><dt>Hours</dt><dd>{cafe.business.hours}</dd></>}
            {cafe.business?.website && <><dt>Web</dt><dd>{cafe.business.website}</dd></>}
            {cafe.business?.instagram && <><dt>Instagram</dt><dd>{cafe.business.instagram}</dd></>}
          </dl>
          {view.highlights.map((h) => (
            <div key={h.id} className="highlight">
              <span className="highlight-type">{h.type.icon} {h.type.label}</span>
              <b>{h.title}</b>
              <p className="small">{h.body}</p>
              {(h.startsAt || h.endsAt) && <span className="muted small">{h.startsAt ? fmtDate(h.startsAt) : `Until ${fmtDate(h.endsAt!)}`}</span>}
            </div>
          ))}
        </section>
      ) : (
        <p className="unclaimed muted small">Community page. {cafe.name} hasn’t claimed it yet.</p>
      )}

      <section className="community">
        <h2>From the community</h2>
        <p className="muted small">Posted by visitors. The café can’t edit, sponsor or hide anything here.</p>

        {view.photos.length > 0 && (
          <div className="hscroll photo-strip">
            {view.photos.map((p, i) => (
              <figure key={i}>
                <img src={p.url} alt="" />
                <figcaption>@{p.user.username}{p.itemName && ` · ${p.itemName}`}</figcaption>
              </figure>
            ))}
          </div>
        )}

        {view.visitors.length > 0 && <><h3>People who’ve been here</h3><Avatars users={view.visitors} /></>}
        {view.wantToGoUsers.length > 0 && <><h3>Want to go</h3><Avatars users={view.wantToGoUsers} /></>}

        {view.triedItems.length > 0 && (
          <>
            <h3>Tried here</h3>
            <ul className="tried">
              {view.triedItems.map((t) => (
                <li key={t.item.id}><span>{t.item.name}</span><span className="muted small">{t.people} {t.people === 1 ? 'person' : 'people'} · {t.consumptions}×</span></li>
              ))}
            </ul>
          </>
        )}

        {view.recommendations.length > 0 && (
          <>
            <h3>Recommended by</h3>
            {view.recommendations.map((r) => (
              <p key={r.visit.id} className="rec">
                <Link to={`/u/${r.user.username}`}>@{r.user.username}</Link> recommends {r.items.map((i) => i.name).join(', ') || 'this café'}
              </p>
            ))}
          </>
        )}

        {view.shoutouts.length > 0 && (
          <>
            <h3>People who made visits better</h3>
            {view.shoutouts.map((s, i) => (
              <blockquote key={i} className="shoutout">
                <p>“{s.shoutout.message}”</p>
                <footer className="small">
                  <b>{s.shoutout.name}</b>{s.shoutout.role && `, ${s.shoutout.role}`}
                  <span className="muted"> · shared by <Link to={`/u/${s.user.username}`}>@{s.user.username}</Link> · unverified</span>
                </footer>
              </blockquote>
            ))}
          </>
        )}

        <h3>Visits</h3>
        {view.visits.length === 0 && <p className="muted">No visits yet. <Link to="/add">Be the first.</Link></p>}
        <div className="visits">
          {view.visits.map(({ visit, author: user, items, companions }) => (
            <article key={visit.id} className="visit">
              <div className="visit-photo"><img src={visit.photos[0].url} alt="" /></div>
              <div className="visit-body">
                <Link to={`/u/${user.username}`} className="visit-author"><img src={user.photoUrl} alt="" />@{user.username}</Link>
                <span className="muted small">{fmtDate(visit.visitedAt)}</span>
                <Companions users={companions} />
                <p>{visit.text}</p>
                <div className="chips">{items.map((it, i) => <span key={it.id} className="chip">{it.name}{visit.items[i].quantity > 1 && ` ×${visit.items[i].quantity}`}</span>)}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </article>
  )
}
