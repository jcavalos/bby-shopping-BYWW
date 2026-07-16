import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Header from './components/Header'
import ShoppingLists from './components/ShoppingLists'
import BabyList from './components/BabyList'
import Wishlist from './components/Wishlist'
import CalendarView from './components/CalendarView'

export default function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('compras')

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink/40">Cargando…</div>
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen">
      <Header tab={tab} setTab={setTab} />
      {tab === 'compras' && <ShoppingLists />}
      {tab === 'bebe' && <BabyList />}
      {tab === 'deseos' && <Wishlist />}
      {tab === 'calendario' && <CalendarView />}
    </div>
  )
}
