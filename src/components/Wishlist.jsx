import { useEffect, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [link, setLink] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'wishlistItems'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  async function addItem(e) {
    e.preventDefault()
    if (!name.trim()) return
    await addDoc(collection(db, 'wishlistItems'), {
      name: name.trim(),
      link: link.trim() || null,
      bought: false,
      createdAt: serverTimestamp(),
    })
    setName('')
    setLink('')
  }

  async function toggleBought(item) {
    await updateDoc(doc(db, 'wishlistItems', item.id), { bought: !item.bought })
  }

  async function removeItem(id) {
    await deleteDoc(doc(db, 'wishlistItems', id))
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <form onSubmit={addItem} className="card p-4 mb-6 space-y-3">
        <input
          className="input"
          placeholder="Algo que nos gustaría tener…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Link (opcional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <button className="btn-primary shrink-0">Añadir</button>
        </div>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="card flex items-center gap-3 px-4 py-3">
            <input
              type="checkbox"
              className="checkbox-round"
              checked={item.bought}
              onChange={() => toggleBought(item)}
            />
            <div className={`flex-1 text-sm ${item.bought ? 'line-through text-ink/40' : ''}`}>
              {item.link ? (
                <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                  {item.name}
                </a>
              ) : (
                item.name
              )}
            </div>
            <button onClick={() => removeItem(item.id)} className="text-ink/30 hover:text-danger px-1">
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-ink/50 text-sm">Su lista de deseos está vacía por ahora.</p>
        )}
      </div>
    </div>
  )
}
