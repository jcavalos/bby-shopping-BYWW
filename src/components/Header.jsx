import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const TABS = [
  { id: 'compras', label: 'Compras' },
  { id: 'bebe', label: 'Para el bebé' },
  { id: 'deseos', label: 'Deseos' },
  { id: 'gastos', label: 'Gastos' },   // 👈 nuevo
  { id: 'calendario', label: 'Calendario' },
]

const TOTAL_WEEKS = 40

export default function Header({ tab, setTab }) {
  const { logout } = useAuth()
  const [dueDate, setDueDate] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    return onSnapshot(doc(db, 'meta', 'baby'), (snap) => {
      if (snap.exists()) setDueDate(snap.data().dueDate)
    })
  }, [])

  async function saveDueDate(e) {
    e.preventDefault()
    if (!draft) return
    await setDoc(doc(db, 'meta', 'baby'), { dueDate: draft }, { merge: true })
    setEditing(false)
  }

  let weeksLeft = null
  let progress = 0
  if (dueDate) {
    const msLeft = new Date(dueDate) - new Date()
    weeksLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24 * 7)))
    progress = Math.min(1, Math.max(0, (TOTAL_WEEKS - weeksLeft) / TOTAL_WEEKS))
  }

  const r = 20
  const circumference = 2 * Math.PI * r

  return (
    <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-line">
      <div className="max-w-2xl mx-auto px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setDraft(dueDate || ''); setEditing(true) }}
              className="relative w-12 h-12 shrink-0"
              aria-label="Editar fecha probable de parto"
            >
              <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
                <circle cx="24" cy="24" r={r} fill="none" stroke="#D8CFC0" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r={r} fill="none" stroke="#E8935A" strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  strokeLinecap="round"
                />
              </svg>
              {weeksLeft !== null && (
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-ink">
                  {weeksLeft}s
                </span>
              )}
            </button>
            <div>
              <h1 className="font-display text-xl leading-tight">Nido</h1>
              <p className="text-xs text-ink/50">
                {weeksLeft !== null
                  ? `${weeksLeft} semanas para conocerle`
                  : 'Toca el círculo para poner la fecha'}
              </p>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-ink/40 hover:text-ink/70">
            Salir
          </button>
        </div>

        <nav className="flex gap-1 mt-4 -mx-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-primary text-white' : 'text-ink/60 hover:bg-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/30 flex items-center justify-center z-20 px-6" onClick={() => setEditing(false)}>
          <form
            onSubmit={saveDueDate}
            onClick={(e) => e.stopPropagation()}
            className="card bg-white p-5 w-full max-w-xs space-y-3"
          >
            <p className="text-sm font-medium">Fecha probable de parto</p>
            <input
              type="date"
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancelar</button>
              <button type="submit" className="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
