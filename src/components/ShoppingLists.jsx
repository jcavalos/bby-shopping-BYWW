
Claude terminó la respuesta

import { useEffect, useState } from 'react' import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, } from 'firebase/firestore' import { db } from '../firebase' export default function ShoppingLists() { const [lists, setList

pasted

ayúdame con varias cosas en mi codigo, la primera, la parte de compras, aparece crear lista, depues de que la crear, aparece arriba puedes agregar iten s esa lista pero no se guardan de manera corecta ademas aunque seleccine la lista no se va dentro de ella, quiero que una vez que creas la lista entras en especifico a esa lista y agregas o borras items, ademas puedes agregar las listas que quieras esta mal aregla el codigo hazlo funcional, la parte de gastos tampocoabre esta mal arreglala,   en la parte de calendario no me deja modificar nada una vez creado un recordatorio haz que se pueda modificar o noper una nota, te di un ejemplo de la lista de compras, de como deberia de aparecer manten el formato que tienes solo hazlo funcional y bien, ademas recuerda que todo debe de ser responsivo para  ́poder ver en telefono tablet y laptop, quieres que te ma nde algo mas este es mi trabajo raiz,, vamos a hacer esto por partes primerop te paso el codigo no me digas nada solo dame el descargable, con las funciones que te pedi, el primero es la lista de compras,

Mostrar más

Ejecutó un comando, creó un archivo, archivo leído
Ejecutó un comando, creó un archivo, archivo leído
Listo. Cuando quieras seguimos con gastos y calendario — mándame el código de esa parte.


Shoppinglists
Código · JSX 





Claude es IA y puede cometer errores. Por favor, verifica nuevamente las respuestas.


Shoppinglists · JSX
import { useEffect, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, getDocs,
  onSnapshot, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../firebase'
 
export default function ShoppingLists() {
  const [lists, setLists] = useState([])
  const [view, setView] = useState('lists') // 'lists' | 'detail'
  const [activeListId, setActiveListId] = useState(null)
  const [items, setItems] = useState([])
  const [newListName, setNewListName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState(1)
 
  // --- edición de lista (nombre) ---
  const [editingList, setEditingList] = useState(false)
  const [listDraft, setListDraft] = useState('')
 
  // --- edición de item ---
  const [editingItemId, setEditingItemId] = useState(null)
  const [itemDraftName, setItemDraftName] = useState('')
  const [itemDraftQty, setItemDraftQty] = useState(1)
 
  // Listas
  useEffect(() => {
    const q = query(collection(db, 'shoppingLists'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])
 
  // Items de la lista activa.
  // Nota: se evita combinar where() + orderBy() en la misma consulta porque
  // Firestore exige un índice compuesto para eso y, si no existe, la consulta
  // falla en silencio (onSnapshot nunca dispara con datos): por eso los
  // artículos "no se guardaban". Se ordena en el cliente en su lugar.
  useEffect(() => {
    if (!activeListId) { setItems([]); return }
    const q = query(
      collection(db, 'shoppingItems'),
      where('listId', '==', activeListId),
    )
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
      setItems(data)
    }, (err) => {
      console.error('Error cargando artículos:', err)
    })
  }, [activeListId])
 
  const activeList = lists.find((l) => l.id === activeListId)
 
  async function createList(e) {
    e.preventDefault()
    const name = newListName.trim()
    if (!name) return
    await addDoc(collection(db, 'shoppingLists'), {
      name,
      createdAt: serverTimestamp(),
    })
    setNewListName('')
  }
 
  function openList(listId) {
    setActiveListId(listId)
    setEditingList(false)
    setEditingItemId(null)
    setView('detail')
  }
 
  function goBackToLists() {
    setView('lists')
    setActiveListId(null)
    setEditingList(false)
    setEditingItemId(null)
  }
 
  async function deleteList(listId) {
    if (!confirm('¿Borrar esta lista y todos sus artículos?')) return
    const q = query(collection(db, 'shoppingItems'), where('listId', '==', listId))
    const snap = await getDocs(q)
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'shoppingLists', listId))
    if (activeListId === listId) goBackToLists()
  }
 
  function startEditList() {
    if (!activeList) return
    setListDraft(activeList.name)
    setEditingList(true)
  }
 
  async function saveListName(e) {
    e.preventDefault()
    if (!listDraft.trim() || !activeListId) { setEditingList(false); return }
    await updateDoc(doc(db, 'shoppingLists', activeListId), { name: listDraft.trim() })
    setEditingList(false)
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
 
  function startEditItem(item) {
    setEditingItemId(item.id)
    setItemDraftName(item.name)
    setItemDraftQty(item.qty)
  }
 
  function cancelEditItem() {
    setEditingItemId(null)
  }
 
  async function saveEditItem(id) {
    if (!itemDraftName.trim()) { setEditingItemId(null); return }
    await updateDoc(doc(db, 'shoppingItems', id), {
      name: itemDraftName.trim(),
      qty: Number(itemDraftQty) || 1,
    })
    setEditingItemId(null)
  }
 
  const pending = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)
 
  // ---------- VISTA: LISTADO DE LISTAS ----------
  if (view === 'lists') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6">
        <h1 className="font-display text-xl mb-4">Listas de compras</h1>
 
        <form onSubmit={createList} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            className="input flex-1"
            placeholder="Nueva lista (ej. Supermercado, Farmacia)"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />
          <button className="btn-primary shrink-0">Crear lista</button>
        </form>
 
        {lists.length === 0 && (
          <p className="text-ink/50 text-sm">Crea tu primera lista para empezar.</p>
        )}
 
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lists.map((l) => (
            <div
              key={l.id}
              className="card flex items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:border-ink/30"
              onClick={() => openList(l.id)}
            >
              <span className="font-display text-base truncate">{l.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteList(l.id) }}
                className="text-xs text-danger/70 hover:text-danger shrink-0"
                aria-label="Borrar lista"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }
 
  // ---------- VISTA: DETALLE DE UNA LISTA ----------
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6">
      <button
        onClick={goBackToLists}
        className="text-sm text-ink/50 hover:text-ink mb-4 flex items-center gap-1"
      >
        ← Todas las listas
      </button>
 
      <div className="flex items-center justify-between mb-4 gap-2">
        {editingList ? (
          <form onSubmit={saveListName} className="flex flex-1 gap-2">
            <input
              className="input flex-1"
              value={listDraft}
              onChange={(e) => setListDraft(e.target.value)}
              autoFocus
              onBlur={saveListName}
            />
            <button type="submit" className="btn-primary shrink-0">Guardar</button>
          </form>
        ) : (
          <>
            <h2
              className="font-display text-lg truncate cursor-pointer"
              onClick={startEditList}
              title="Toca para renombrar la lista"
            >
              {activeList?.name}
            </h2>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={startEditList}
                className="text-xs text-ink/40 hover:text-ink/70"
              >
                Renombrar
              </button>
              <button
                onClick={() => deleteList(activeListId)}
                className="text-xs text-danger/70 hover:text-danger"
              >
                Borrar lista
              </button>
            </div>
          </>
        )}
      </div>
 
      <form onSubmit={addItem} className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          className="input flex-1 min-w-0"
          placeholder="¿Qué falta comprar?"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            className="input w-20 text-center shrink-0"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
          />
          <button className="btn-primary shrink-0 flex-1 sm:flex-none">Añadir</button>
        </div>
      </form>
 
      <div className="space-y-2">
        {pending.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            editing={editingItemId === item.id}
            draftName={itemDraftName}
            draftQty={itemDraftQty}
            onDraftNameChange={setItemDraftName}
            onDraftQtyChange={setItemDraftQty}
            onToggle={toggleItem}
            onRemove={removeItem}
            onStartEdit={startEditItem}
            onSaveEdit={saveEditItem}
            onCancelEdit={cancelEditItem}
          />
        ))}
      </div>
 
      {done.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">Ya comprado</p>
          <div className="space-y-2">
            {done.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                editing={editingItemId === item.id}
                draftName={itemDraftName}
                draftQty={itemDraftQty}
                onDraftNameChange={setItemDraftName}
                onDraftQtyChange={setItemDraftQty}
                onToggle={toggleItem}
                onRemove={removeItem}
                onStartEdit={startEditItem}
                onSaveEdit={saveEditItem}
                onCancelEdit={cancelEditItem}
              />
            ))}
          </div>
        </div>
      )}
 
      {items.length === 0 && (
        <p className="text-ink/50 text-sm">Esta lista está vacía. Añade el primer artículo arriba.</p>
      )}
    </div>
  )
}
 
function ItemRow({
  item, editing, draftName, draftQty,
  onDraftNameChange, onDraftQtyChange,
  onToggle, onRemove, onStartEdit, onSaveEdit, onCancelEdit,
}) {
  if (editing) {
    return (
      <div className="card flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-4 py-3">
        <input
          className="input flex-1 min-w-0"
          value={draftName}
          onChange={(e) => onDraftNameChange(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            className="input w-20 text-center shrink-0"
            value={draftQty}
            onChange={(e) => onDraftQtyChange(e.target.value)}
          />
          <button
            onClick={() => onSaveEdit(item.id)}
            className="btn-primary shrink-0"
          >
            Guardar
          </button>
          <button
            onClick={onCancelEdit}
            className="btn-ghost shrink-0"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }
 
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        className="checkbox-round shrink-0"
        checked={item.done}
        onChange={() => onToggle(item)}
      />
      <span
        className={`flex-1 text-sm min-w-0 truncate cursor-pointer ${item.done ? 'line-through text-ink/40' : ''}`}
        onClick={() => onStartEdit(item)}
      >
        {item.name}
      </span>
      <span className="text-xs text-ink/40 font-mono shrink-0">x{item.qty}</span>
      <button
        onClick={() => onStartEdit(item)}
        className="text-ink/30 hover:text-ink/70 px-1 shrink-0"
        aria-label="Editar artículo"
        title="Editar"
      >
        ✎
      </button>
      <button
        onClick={() => onRemove(item.id)}
        className="text-ink/30 hover:text-danger px-1 shrink-0"
        aria-label="Borrar artículo"
      >
        ✕
      </button>
    </div>
  )
}
 
