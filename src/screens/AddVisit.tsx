import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { addMenuItem, createVisit, getCafeMenu, getViewerId, listCafes, listDemoPhotos, listUsers } from '../data/api.ts'
import type { Cafe, MenuItem, User, Visit, VisitItem } from '../domain/types.ts'
import { localToday, validateVisit, type VisitDraft } from '../domain/visits.ts'

type DemoPhoto = Awaited<ReturnType<typeof listDemoPhotos>>[number]
type Picked = { demoId: string; url: string; menuItemId?: string }

export default function AddVisit() {
  const navigate = useNavigate()
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [demoPhotos, setDemoPhotos] = useState<DemoPhoto[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [people, setPeople] = useState<User[]>([])

  const [cafeId, setCafeId] = useState('')
  const [cafeQuery, setCafeQuery] = useState('')
  const [photos, setPhotos] = useState<Picked[]>([])
  const [items, setItems] = useState<VisitItem[]>([])
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [rating, setRating] = useState<Visit['rating']>()
  const [recommends, setRecommends] = useState(false)
  const [companionIds, setCompanionIds] = useState<string[]>([])
  const [shout, setShout] = useState({ name: '', role: '', message: '' })
  const [newItem, setNewItem] = useState('')
  const [submitted, setSubmitted] = useState(false) // show errors live only after the first attempt
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    listCafes().then(setCafes)
    listDemoPhotos().then(setDemoPhotos)
    listUsers().then((us) => setPeople(us.filter((u) => u.id !== getViewerId())))
  }, [])

  // Items and photo links belong to one café's menu; switching café clears them.
  function changeCafe(id: string) {
    setCafeId(id)
    setItems([])
    setPhotos((ps) => ps.map((p) => ({ ...p, menuItemId: undefined })))
    setMenu([])
    if (id) getCafeMenu(id).then(setMenu)
  }

  const q = cafeQuery.trim().toLowerCase()
  const cafeMatches = cafes.filter((c) => `${c.name} ${c.area} ${c.city} ${c.country}`.toLowerCase().includes(q))
  const selectedCafe = cafes.find((c) => c.id === cafeId)

  const itemName = (id: string) => menu.find((m) => m.id === id)?.name ?? id
  const qty = (id: string) => items.find((i) => i.menuItemId === id)?.quantity ?? 0

  function togglePhoto(d: DemoPhoto) {
    setPhotos((ps) => ps.some((p) => p.demoId === d.id) ? ps.filter((p) => p.demoId !== d.id) : [...ps, { demoId: d.id, url: d.url }])
  }
  function linkPhoto(demoId: string, menuItemId: string) {
    setPhotos((ps) => ps.map((p) => (p.demoId === demoId ? { ...p, menuItemId: menuItemId || undefined } : p)))
  }
  function setQty(menuItemId: string, quantity: number) {
    setItems((is) => quantity < 1
      ? is.filter((i) => i.menuItemId !== menuItemId)
      : is.some((i) => i.menuItemId === menuItemId)
        ? is.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i))
        : [...is, { menuItemId, quantity }])
    if (quantity < 1) setPhotos((ps) => ps.map((p) => (p.menuItemId === menuItemId ? { ...p, menuItemId: undefined } : p)))
  }
  async function addCustomItem() {
    if (!cafeId || !newItem.trim()) return
    const created = await addMenuItem(cafeId, newItem)
    setMenu(await getCafeMenu(cafeId))
    if (!qty(created.id)) setQty(created.id, 1)
    setNewItem('')
  }

  const draft: VisitDraft = {
    cafeId, text: text.trim(), items, rating, recommends: recommends || undefined,
    visitedAt: date || null,
    companionUserIds: companionIds,
    staffShoutout: shout.name.trim() || shout.message.trim()
      ? { name: shout.name.trim(), role: shout.role.trim() || undefined, message: shout.message.trim() }
      : undefined,
    photos: photos.map((p) => ({ id: p.demoId, url: p.url, menuItemId: p.menuItemId })),
  }
  const errors = submitted ? validateVisit(draft, localToday()) : []

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (validateVisit(draft, localToday()).length) return
    try {
      const photos = draft.photos.map((p) => ({ ...p, id: `${p.id}_${crypto.randomUUID()}` }))
      await createVisit(getViewerId(), { ...draft, photos })
      navigate('/profile')
    } catch (err) {
      setSaveError((err as Error).message)
    }
  }

  return (
    <form className="add-visit" onSubmit={submit} noValidate>
      <h1>Add a visit</h1>

      <fieldset>
        <legend>Photos <span className="req">at least 1</span></legend>
        <p className="muted small">Demo photos stand in for uploads for now.</p>
        <div className="photo-pick">
          {demoPhotos.map((d) => {
            const picked = photos.find((p) => p.demoId === d.id)
            return (
              <div key={d.id} className={`photo-tile ${picked ? 'picked' : ''}`}>
                <button type="button" onClick={() => togglePhoto(d)} aria-pressed={!!picked} aria-label={`${picked ? 'Remove' : 'Select'} ${d.label}`}>
                  <img src={d.url} alt={d.label} />
                  {picked && <span className="photo-check">✓</span>}
                </button>
                {picked && items.length > 0 && (
                  <select value={picked.menuItemId ?? ''} onChange={(e) => linkPhoto(d.id, e.target.value)} aria-label={`Item shown in ${d.label}`}>
                    <option value="">No item</option>
                    {items.map((i) => <option key={i.menuItemId} value={i.menuItemId}>{itemName(i.menuItemId)}</option>)}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Café <span className="req">required</span></legend>
        {selectedCafe ? (
          <div className="cafe-pick selected">
            <img src={selectedCafe.coverPhotoUrl} alt="" />
            <span><b>{selectedCafe.name}</b><span className="muted small">{selectedCafe.area}, {selectedCafe.city}</span></span>
            <button type="button" className="link-btn" onClick={() => changeCafe('')}>Change</button>
          </div>
        ) : (
          <>
            <input type="search" value={cafeQuery} onChange={(e) => setCafeQuery(e.target.value)} placeholder="Search by name, area or city" aria-label="Search cafés" />
            <div className="cafe-results">
              {cafeMatches.map((c) => (
                <button type="button" key={c.id} className="cafe-pick" onClick={() => changeCafe(c.id)}>
                  <img src={c.coverPhotoUrl} alt="" />
                  <span><b>{c.name}</b><span className="muted small">{c.area}, {c.city}</span></span>
                </button>
              ))}
              {cafeMatches.length === 0 && <p className="muted small">No café matches “{cafeQuery}”.</p>}
            </div>
          </>
        )}
      </fieldset>

      {cafeId && (
        <fieldset>
          <legend>What did you have?</legend>
          <div className="chips">
            {menu.map((m) => (
              <button type="button" key={m.id} className={`chip chip-btn ${qty(m.id) ? 'on' : ''}`} onClick={() => setQty(m.id, qty(m.id) ? 0 : 1)}>
                {m.name}
              </button>
            ))}
          </div>
          <div className="inline">
            <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Not listed? Add an item"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem() } }} />
            <button type="button" onClick={addCustomItem} disabled={!newItem.trim()}>Add</button>
          </div>
          {items.map((i) => (
            <div key={i.menuItemId} className="qty-row">
              <span>{itemName(i.menuItemId)}</span>
              <div className="stepper">
                <button type="button" onClick={() => setQty(i.menuItemId, i.quantity - 1)} aria-label="Less">−</button>
                <b>{i.quantity}</b>
                <button type="button" onClick={() => setQty(i.menuItemId, i.quantity + 1)} aria-label="More">+</button>
              </div>
            </div>
          ))}
        </fieldset>
      )}

      <fieldset>
        <legend>Your story <span className="req">required</span></legend>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="How was it?" />
      </fieldset>

      <fieldset>
        <legend>When did you go?</legend>
        <input type="date" value={date} max={localToday()} onChange={(e) => setDate(e.target.value)} />
        <p className="muted small">Optional. Leave empty for an old visit you can’t date.</p>
      </fieldset>

      <fieldset>
        <legend>Rating</legend>
        <div className="stars">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button type="button" key={n} className={rating && n <= rating ? 'on' : ''} onClick={() => setRating(rating === n ? undefined : n)} aria-label={`${n} stars`}>★</button>
          ))}
        </div>
        <label className="check"><input type="checkbox" checked={recommends} onChange={(e) => setRecommends(e.target.checked)} /> I recommend this café</label>
      </fieldset>

      <fieldset>
        <legend>Who were you with? <span className="muted small">(optional)</span></legend>
        <div className="people-pick">
          {people.map((u) => {
            const on = companionIds.includes(u.id)
            return (
              <button type="button" key={u.id} className={`person ${on ? 'on' : ''}`} aria-pressed={on}
                onClick={() => setCompanionIds(on ? companionIds.filter((id) => id !== u.id) : [...companionIds, u.id])}>
                <img src={u.photoUrl} alt="" />@{u.username}
              </button>
            )
          })}
        </div>
      </fieldset>

      <details className="shoutout-form">
        <summary>Shout out someone who made your visit better <span className="muted small">(optional)</span></summary>
        <p className="muted small">Positive notes only. Shared publicly with the café’s community page.</p>
        <input value={shout.name} maxLength={40} onChange={(e) => setShout({ ...shout, name: e.target.value })} placeholder="Their first name" aria-label="Staff name" />
        <input value={shout.role} maxLength={40} onChange={(e) => setShout({ ...shout, role: e.target.value })} placeholder="Role, e.g. barista (optional)" aria-label="Staff role" />
        <textarea rows={2} value={shout.message} maxLength={280} onChange={(e) => setShout({ ...shout, message: e.target.value })} placeholder="What did they do that made it better?" aria-label="Shout-out message" />
      </details>

      {(errors.length > 0 || saveError) && (
        <ul className="errors" role="alert">{[...errors, saveError].filter(Boolean).map((e) => <li key={e}>{e}</li>)}</ul>
      )}
      <button type="submit" className="primary">Post visit</button>
    </form>
  )
}
