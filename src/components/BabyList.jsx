import { useEffect, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const PRIORITIES = [
  { id: 'alta', label: 'Urgente', color: 'bg-accent text-white' },
  { id: 'media', label: 'Pronto', color: 'bg-accentsoft text-ink' },
  { id: 'baja', label: 'Más adelante', color: 'bg-line/60 text-ink/70' },
]

export default function BabyList() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [priority, setPriority] = useState('media')
  const [price, setPrice] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'babyItems'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function addItem(e) {
    e.preventDefault()
    if (!name.trim()) return
    await addDoc(collection(db, 'babyItems'), {
      name: name.trim(),
      priority,
      price: price ? Number(price) : null,
      bought: false,
      createdAt: serverTimestamp(),
    })
    setName('')
    setPrice('')
  }

  async function toggleBought(item) {
    await updateDoc(doc(db, 'babyItems', item.id), { bought: !item.bought })
  }

  async function removeItem(id) {
    await deleteDoc(doc(db, 'babyItems', id))
  }

  const pending = items.filter((i) => !i.bought)
  const bought = items.filter((i) => i.bought)
  const totalPending = pending.reduce((sum, i) => sum + (i.price || 0), 0)

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <form onSubmit={addItem} className="card p-4 mb-6 space-y-3">
        <input
          className="input"
          placeholder="Ej. Cuna, carriola, pañales talla RN…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <div className="flex gap-1 flex-1">
            {PRIORITIES.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={`flex-1 rounded-lg text-xs py-2 font-medium border transition-colors ${
                  priority === p.id ? `${p.color} border-transparent` : 'border-line text-ink/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            className="input"
            placeholder="Precio estimado (opcional)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button className="btn-primary shrink-0">Añadir</button>
        </div>
      </form>

      {pending.length > 0 && (
        <p className="text-sm text-ink/50 mb-3">
          Pendiente por comprar: <span className="font-medium text-ink">${totalPending.toLocaleString()}</span> aprox.
        </p>
      )}

      <div className="space-y-2">
        {pending.map((item) => (
          <BabyRow key={item.id} item={item} onToggle={toggleBought} onRemove={removeItem} />
        ))}
      </div>

      {bought.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">Ya lo tenemos</p>
          <div className="space-y-2">
            {bought.map((item) => (
              <BabyRow key={item.id} item={item} onToggle={toggleBought} onRemove={removeItem} />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-ink/50 text-sm">Aún no han añadido nada para el bebé.</p>
      )}
    </div>
  )
}

function BabyRow({ item, onToggle, onRemove }) {
  const p = PRIORITIES.find((x) => x.id === item.priority) || PRIORITIES[1]
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        className="checkbox-round"
        checked={item.bought}
        onChange={() => onToggle(item)}
      />
      <span className={`flex-1 text-sm ${item.bought ? 'line-through text-ink/40' : ''}`}>
        {item.name}
      </span>
      {!item.bought && (
        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${p.color}`}>{p.label}</span>
      )}
      {item.price && <span className="text-xs text-ink/40 font-mono">${item.price}</span>}
      <button onClick={() => onRemove(item.id)} className="text-ink/30 hover:text-danger px-1">
        ✕
      </button>
    </div>
  )
}
