import { useEffect, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const CATEGORIES = ['Renta', 'Luz', 'Agua', 'Internet', 'Súper', 'Salud', 'Transporte', 'Bebé', 'Otro']
const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'gasto', label: 'Gastos' },
  { id: 'ingreso', label: 'Ingresos' },
]

function currency(n) {
  return Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function isOverdue(dueDate, paid) {
  if (!dueDate || paid) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

export default function Gastos() {
  const [entries, setEntries] = useState([])
  const [filter, setFilter] = useState('todos')

  // formulario nuevo movimiento
  const [concepto, setConcepto] = useState('')
  const [tipo, setTipo] = useState('gasto')
  const [categoria, setCategoria] = useState(CATEGORIES[0])
  const [monto, setMonto] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')

  // edición
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  const totalIngresos = entries.filter((e) => e.tipo === 'ingreso').reduce((s, e) => s + Number(e.monto || 0), 0)
  const totalGastos = entries.filter((e) => e.tipo === 'gasto').reduce((s, e) => s + Number(e.monto || 0), 0)
  const balance = totalIngresos - totalGastos

  const visibles = entries.filter((e) => filter === 'todos' || e.tipo === filter)
  const pendientes = visibles.filter((e) => e.tipo === 'gasto' && !e.paid)
  const resto = visibles.filter((e) => !(e.tipo === 'gasto' && !e.paid))

  async function addEntry(e) {
    e.preventDefault()
    if (!concepto.trim() || !monto) return
    await addDoc(collection(db, 'expenses'), {
      concepto: concepto.trim(),
      tipo,
      categoria,
      monto: Number(monto),
      dueDate: tipo === 'gasto' ? (fechaLimite || null) : null,
      paid: tipo === 'ingreso',
      createdAt: serverTimestamp(),
    })
    setConcepto('')
    setMonto('')
    setFechaLimite('')
  }

  async function togglePaid(entry) {
    await updateDoc(doc(db, 'expenses', entry.id), { paid: !entry.paid })
  }

  async function removeEntry(id) {
    await deleteDoc(doc(db, 'expenses', id))
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setDraft({
      concepto: entry.concepto,
      tipo: entry.tipo,
      categoria: entry.categoria,
      monto: entry.monto,
      dueDate: entry.dueDate || '',
    })
  }

  async function saveEdit(id) {
    if (!draft.concepto.trim() || !draft.monto) { setEditingId(null); return }
    await updateDoc(doc(db, 'expenses', id), {
      concepto: draft.concepto.trim(),
      tipo: draft.tipo,
      categoria: draft.categoria,
      monto: Number(draft.monto),
      dueDate: draft.tipo === 'gasto' ? (draft.dueDate || null) : null,
    })
    setEditingId(null)
    setDraft(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="card px-3 py-3 text-center">
          <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-1">Ingresos</p>
          <p className="font-mono text-sm sm:text-base text-emerald-600 font-semibold truncate">
            {currency(totalIngresos)}
          </p>
        </div>
        <div className="card px-3 py-3 text-center">
          <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-1">Gastos</p>
          <p className="font-mono text-sm sm:text-base text-danger font-semibold truncate">
            {currency(totalGastos)}
          </p>
        </div>
        <div className="card px-3 py-3 text-center">
          <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-1">Balance</p>
          <p className={`font-mono text-sm sm:text-base font-semibold truncate ${balance >= 0 ? 'text-emerald-600' : 'text-danger'}`}>
            {currency(balance)}
          </p>
        </div>
      </div>

      {/* Formulario nuevo movimiento */}
      <form onSubmit={addEntry} className="card p-4 mb-6 space-y-3">
        <div className="flex gap-2">
          {['gasto', 'ingreso'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex-1 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                tipo === t
                  ? t === 'gasto' ? 'bg-danger text-white' : 'bg-emerald-600 text-white'
                  : 'border border-line text-ink/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          className="input w-full"
          placeholder="Concepto (ej. Pago de luz)"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row gap-2">
          {tipo === 'gasto' && (
            <select
              className="input flex-1"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <input
            type="number"
            min="0"
            step="0.01"
            className="input flex-1"
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        {tipo === 'gasto' && (
          <input
            type="date"
            className="input w-full"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
          />
        )}

        <button className="btn-primary w-full">Agregar {tipo}</button>
      </form>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
              filter === f.id
                ? 'bg-ink text-white border-ink'
                : 'border-line text-ink/60 hover:border-ink/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pendientes de pago primero */}
      {pendientes.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">Pendientes de pago</p>
          <div className="space-y-2">
            {pendientes.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                editing={editingId === entry.id}
                draft={draft}
                onDraftChange={setDraft}
                onTogglePaid={togglePaid}
                onRemove={removeEntry}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {resto.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            editing={editingId === entry.id}
            draft={draft}
            onDraftChange={setDraft}
            onTogglePaid={togglePaid}
            onRemove={removeEntry}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
          />
        ))}
      </div>

      {visibles.length === 0 && (
        <p className="text-ink/50 text-sm">Aún no hay movimientos aquí. Agrega el primero arriba.</p>
      )}
    </div>
  )
}

function EntryRow({
  entry, editing, draft, onDraftChange,
  onTogglePaid, onRemove, onStartEdit, onSaveEdit, onCancelEdit,
}) {
  if (editing) {
    return (
      <div className="card p-4 space-y-2">
        <input
          className="input w-full"
          value={draft.concepto}
          onChange={(e) => onDraftChange({ ...draft, concepto: e.target.value })}
          autoFocus
        />
        <div className="flex flex-col sm:flex-row gap-2">
          {draft.tipo === 'gasto' && (
            <select
              className="input flex-1"
              value={draft.categoria}
              onChange={(e) => onDraftChange({ ...draft, categoria: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <input
            type="number"
            min="0"
            step="0.01"
            className="input flex-1"
            value={draft.monto}
            onChange={(e) => onDraftChange({ ...draft, monto: e.target.value })}
          />
        </div>
        {draft.tipo === 'gasto' && (
          <input
            type="date"
            className="input w-full"
            value={draft.dueDate}
            onChange={(e) => onDraftChange({ ...draft, dueDate: e.target.value })}
          />
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancelEdit} className="btn-ghost">Cancelar</button>
          <button onClick={() => onSaveEdit(entry.id)} className="btn-primary">Guardar</button>
        </div>
      </div>
    )
  }

  const overdue = isOverdue(entry.dueDate, entry.paid)

  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      {entry.tipo === 'gasto' && (
        <input
          type="checkbox"
          className="checkbox-round shrink-0"
          checked={entry.paid}
          onChange={() => onTogglePaid(entry)}
          title="Marcar como pagado"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${entry.paid && entry.tipo === 'gasto' ? 'line-through text-ink/40' : ''}`}>
          {entry.concepto}
        </p>
        <p className="text-[11px] text-ink/40 flex gap-2 flex-wrap">
          {entry.tipo === 'gasto' && <span>{entry.categoria}</span>}
          {entry.dueDate && (
            <span className={overdue ? 'text-danger font-medium' : ''}>
              {overdue ? 'Venció: ' : 'Vence: '}
              {new Date(entry.dueDate).toLocaleDateString('es-MX')}
            </span>
          )}
        </p>
      </div>
      <span className={`font-mono text-sm shrink-0 ${entry.tipo === 'ingreso' ? 'text-emerald-600' : 'text-danger'}`}>
        {entry.tipo === 'ingreso' ? '+' : '-'}{currency(entry.monto)}
      </span>
      <button
        onClick={() => onStartEdit(entry)}
        className="text-ink/30 hover:text-ink/70 px-1 shrink-0"
        aria-label="Editar movimiento"
      >
        ✎
      </button>
      <button
        onClick={() => onRemove(entry.id)}
        className="text-ink/30 hover:text-danger px-1 shrink-0"
        aria-label="Borrar movimiento"
      >
        ✕
      </button>
    </div>
  )
}