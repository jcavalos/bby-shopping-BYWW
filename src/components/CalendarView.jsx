import { useEffect, useMemo, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

export default function CalendarView() {
  const [events, setEvents] = useState([])
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()))
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  // --- edición de evento ---
  const [editingEventId, setEditingEventId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDate, setEditDate] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'))
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const ev of events) {
      map[ev.date] = map[ev.date] || []
      map[ev.date].push(ev)
    }
    return map
  }, [events])

  const grid = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7 // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [cursor])

  async function addEvent(e) {
    e.preventDefault()
    if (!title.trim()) return
    await addDoc(collection(db, 'events'), {
      title: title.trim(),
      notes: notes.trim(),
      date: selectedDate,
      createdAt: serverTimestamp(),
    })
    setTitle('')
    setNotes('')
  }

  async function removeEvent(id) {
    await deleteDoc(doc(db, 'events', id))
    if (editingEventId === id) setEditingEventId(null)
  }

  function startEditEvent(ev) {
    setEditingEventId(ev.id)
    setEditTitle(ev.title)
    setEditNotes(ev.notes || '')
    setEditDate(ev.date)
  }

  function cancelEditEvent() {
    setEditingEventId(null)
  }

  async function saveEditEvent(id) {
    if (!editTitle.trim() || !editDate) { setEditingEventId(null); return }
    await updateDoc(doc(db, 'events', id), {
      title: editTitle.trim(),
      notes: editNotes.trim(),
      date: editDate,
    })
    setEditingEventId(null)
  }

  const upcoming = events
    .filter((ev) => ev.date >= toISODate(new Date()))
    .slice(0, 8)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6">
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="text-ink/40 hover:text-ink px-2"
          >
            ‹
          </button>
          <p className="font-display text-lg">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="text-ink/40 hover:text-ink px-2"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink/40 mb-1">
          {DAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((date, i) => {
            if (!date) return <div key={i} />
            const iso = toISODate(date)
            const hasEvents = eventsByDate[iso]?.length > 0
            const isSelected = iso === selectedDate
            const isToday = iso === toISODate(new Date())
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`aspect-square rounded-lg text-sm relative flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-primary text-white' : isToday ? 'bg-accentsoft' : 'hover:bg-white'
                }`}
              >
                {date.getDate()}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={addEvent} className="card p-4 mb-6 space-y-3">
        <p className="text-sm font-medium">
          Agregar evento el {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
        </p>
        <input
          className="input"
          placeholder="Ej. Cita con el ginecólogo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input"
          placeholder="Notas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button className="btn-primary w-full">Guardar evento</button>
      </form>

      <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">Próximos eventos</p>
      <div className="space-y-2">
        {upcoming.map((ev) => (
          <EventRow
            key={ev.id}
            event={ev}
            editing={editingEventId === ev.id}
            editTitle={editTitle}
            editNotes={editNotes}
            editDate={editDate}
            onEditTitleChange={setEditTitle}
            onEditNotesChange={setEditNotes}
            onEditDateChange={setEditDate}
            onRemove={removeEvent}
            onStartEdit={startEditEvent}
            onSaveEdit={saveEditEvent}
            onCancelEdit={cancelEditEvent}
          />
        ))}
        {upcoming.length === 0 && (
          <p className="text-ink/50 text-sm">No hay eventos próximos.</p>
        )}
      </div>
    </div>
  )
}

function EventRow({
  event, editing, editTitle, editNotes, editDate,
  onEditTitleChange, onEditNotesChange, onEditDateChange,
  onRemove, onStartEdit, onSaveEdit, onCancelEdit,
}) {
  if (editing) {
    return (
      <div className="card flex flex-col gap-2 px-4 py-3">
        <input
          className="input"
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          autoFocus
          placeholder="Título"
        />
        <input
          className="input"
          value={editNotes}
          onChange={(e) => onEditNotesChange(e.target.value)}
          placeholder="Notas (opcional)"
        />
        <input
          type="date"
          className="input"
          value={editDate}
          onChange={(e) => onEditDateChange(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSaveEdit(event.id)}
            className="btn-primary flex-1"
          >
            Guardar
          </button>
          <button
            onClick={onCancelEdit}
            className="btn-ghost flex-1"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <div className="text-center w-10 shrink-0">
        <p className="text-[10px] text-ink/40 uppercase">
          {new Date(event.date + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' })}
        </p>
        <p className="font-mono text-sm">{new Date(event.date + 'T00:00:00').getDate()}</p>
      </div>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onStartEdit(event)}
      >
        <p className="text-sm truncate">{event.title}</p>
        {event.notes && <p className="text-xs text-ink/40 truncate">{event.notes}</p>}
      </div>
      <button
        onClick={() => onStartEdit(event)}
        className="text-ink/30 hover:text-ink/70 px-1 shrink-0"
        aria-label="Editar evento"
        title="Editar"
      >
        ✎
      </button>
      <button
        onClick={() => onRemove(event.id)}
        className="text-ink/30 hover:text-danger px-1 shrink-0"
        aria-label="Borrar evento"
      >
        ✕
      </button>
    </div>
  )
}