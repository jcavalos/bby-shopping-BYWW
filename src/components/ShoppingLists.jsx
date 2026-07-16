import { useEffect, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, getDocs,
  onSnapshot, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../firebase'

export default function ShoppingLists() {
  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [items, setItems] = useState([])
  const [newListName, setNewListName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState(1)

  useEffect(() => {
    const q = query(collection(db, 'shoppingLists'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setLists(data)
      setActiveListId((prev) => prev || data[0]?.id || null)
    })
  }, [])

  useEffect(() => {
    if (!activeListId) { setItems([]); return }
    const q = query(
      collection(db, 'shoppingItems'),
      where('listId', '==', activeListId),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [activeListId])

  async function createList(e) {
    e.preventDefault()
    if (!newListName.trim()) return
    const ref = await addDoc(collection(db, 'shoppingLists'), {
      name: newListName.trim(),
      createdAt: serverTimestamp(),
    })
    setNewListName('')
    setActiveListId(ref.id)
  }

  async function deleteList(listId) {
    if (!confirm('¿Borrar esta lista y todos sus artículos?')) return
    const q = query(collection(db, 'shoppingItems'), where('listId', '==', listId))
    const snap = await getDocs(q)
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'shoppingLists', listId))
    setActiveListId(null)
  }

  async function addItem(e) {
    e.preventDefault()
    if (!newItemName.trim() || !activeListId) return
    await addDoc(collection(db, 'shoppingItems'), {
      listId: activeListId,
      name: newItemName.trim(),
      qty: Number(newItemQty) || 1,
      done: false,
      createdAt: serverTimestamp(),
    })
    setNewItemName('')
    setNewItemQty(1)
  }

  async function toggleItem(item) {
    await updateDoc(doc(db, 'shoppingItems', item.id), { done: !item.done })
  }

  async function removeItem(id) {
    await deleteDoc(doc(db, 'shoppingItems', id))
  }

  const pending = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveListId(l.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
              activeListId === l.id
                ? 'bg-ink text-white border-ink'
                : 'border-line text-ink/60 hover:border-ink/30'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      <form onSubmit={createList} className="flex gap-2 mb-6">
        <input
          className="input"
          placeholder="Nueva lista (ej. Supermercado, Farmacia)"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <button className="btn-ghost shrink-0">Crear lista</button>
      </form>

      {!activeListId && (
        <p className="text-ink/50 text-sm">Crea tu primera lista para empezar.</p>
      )}

      {activeListId && (
        <>
          <form onSubmit={addItem} className="flex gap-2 mb-5">
            <input
              className="input flex-1"
              placeholder="¿Qué falta comprar?"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <input
              type="number"
              min="1"
              className="input w-16 text-center"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
            />
            <button className="btn-primary shrink-0">Añadir</button>
          </form>

          <div className="space-y-2">
            {pending.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />
            ))}
          </div>

          {done.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">Ya comprado</p>
              <div className="space-y-2">
                {done.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <p className="text-ink/50 text-sm">Esta lista está vacía. Añade el primer artículo arriba.</p>
          )}

          <button
            onClick={() => deleteList(activeListId)}
            className="text-xs text-danger/70 hover:text-danger mt-8"
          >
            Borrar esta lista
          </button>
        </>
      )}
    </div>
  )
}

function ItemRow({ item, onToggle, onRemove }) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        className="checkbox-round"
        checked={item.done}
        onChange={() => onToggle(item)}
      />
      <span className={`flex-1 text-sm ${item.done ? 'line-through text-ink/40' : ''}`}>
        {item.name}
      </span>
      <span className="text-xs text-ink/40 font-mono">x{item.qty}</span>
      <button onClick={() => onRemove(item.id)} className="text-ink/30 hover:text-danger px-1">
        ✕
      </button>
    </div>
  )
}
