import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { getViewerId, listUsers, resetPrototypeData, setViewerId } from './data/api.ts'
import type { User } from './domain/types.ts'
import AddVisit from './screens/AddVisit.tsx'
import CafeDetail from './screens/CafeDetail.tsx'
import Discover from './screens/Discover.tsx'
import Placeholder from './screens/Placeholder.tsx'
import Profile from './screens/Profile.tsx'

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/discover', label: 'Discover', icon: '🧭' },
  { to: '/add', label: 'Add', icon: '＋' },
  { to: '/plans', label: 'Plans', icon: '📅' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

// Prototype-only: switch the mock "logged-in" user to see privacy states from other sides.
function ViewerSwitcher() {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => { listUsers().then(setUsers) }, [])
  return (
    <div className="devbar">
      <label>
        Viewing as{' '}
        <select value={getViewerId()} onChange={(e) => { setViewerId(e.target.value); location.reload() }}>
          {users.map((u) => <option key={u.id} value={u.id}>@{u.username}</option>)}
        </select>
      </label>
      <button onClick={() => { resetPrototypeData(); location.reload() }}>Reset data</button>
    </div>
  )
}

function Shell() {
  return (
    <div className="app">
      <ViewerSwitcher />
      <main className="screen"><Outlet /></main>
      <nav className="tabbar">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={t.to === '/add' ? 'tab tab-add' : 'tab'}>
            <span className="tab-icon" aria-hidden>{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Placeholder title="Home" lines={['Friends’ recent visits', '“You and @omar both want to go to…” nudges', 'Upcoming plans & events near you']} />} />
          <Route path="discover" element={<Discover />} />
          <Route path="cafe/:cafeId" element={<CafeDetail />} />
          <Route path="add" element={<AddVisit />} />
          <Route path="plans" element={<Placeholder title="Plans" lines={['Public: approximate area + time of day', 'Join by answering the host’s question', 'Exact café & time unlock after acceptance']} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="u/:username" element={<Profile />} />
          <Route path="*" element={<Placeholder title="Not found" lines={[]} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
