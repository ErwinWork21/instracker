import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { countAttendance, shouldShowVideoEditingAlert, formatDateTime } from './utils'
import { PROGRAMS } from './config'
import Dashboard from './components/Dashboard'
import StudentModal from './components/StudentModal'
import AddStudentModal from './components/AddStudentModal'
import { Toaster } from 'react-hot-toast'

export default function App() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showAddStudent, setShowAddStudent] = useState(false)

  // Filter state
  const [search, setSearch] = useState('')
  const [filterProgram, setFilterProgram] = useState('')
  const [filterTerm, setFilterTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAlert, setFilterAlert] = useState('')

  const loadStudents = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          terms (
            *,
            lessons ( * ),
            progress_updates ( * ),
            video_editing ( * )
          )
        `)
        .order('name')

      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error('Error loading students:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  // Compute derived info for each student
  const enrichedStudents = students.map(student => {
    const activeTerm = student.terms?.find(t => t.id === student.active_term_id)
    const lessons = activeTerm?.lessons || []
    const attendanceCount = countAttendance(lessons)
    const lesson10 = lessons.find(l => l.lesson_number === 10)
    const progressUpdate = activeTerm?.progress_updates?.[0]
    const videoEditing = activeTerm?.video_editing?.[0]

    const hasProgressAlert = attendanceCount >= 8 && progressUpdate?.status !== 'Completed'
    const hasVideoAlert = shouldShowVideoEditingAlert(lesson10?.attendance_at) && videoEditing?.status !== 'Completed'

    return {
      ...student,
      activeTerm,
      lessons,
      attendanceCount,
      progressUpdate,
      videoEditing,
      hasProgressAlert,
      hasVideoAlert,
    }
  })

  // Apply filters
  const filtered = enrichedStudents.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterProgram && s.program !== filterProgram) return false
    if (filterTerm && s.activeTerm?.term_number !== filterTerm) return false
    if (filterStatus && s.activeTerm?.status !== filterStatus) return false
    if (filterAlert === 'progress' && !s.hasProgressAlert) return false
    if (filterAlert === 'video' && !s.hasVideoAlert) return false
    if (filterAlert === 'any' && !s.hasProgressAlert && !s.hasVideoAlert) return false
    if (filterAlert === 'none' && (s.hasProgressAlert || s.hasVideoAlert)) return false
    return true
  })

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#181c35',
            color: '#e8eaf6',
            border: '1px solid #2a2f52',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />

      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">📚</div>
          <h1>Teacher Tracker</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddStudent(true)}>
            + Add Student
          </button>
        </div>
      </header>

      <main className="main">
        <Dashboard
          students={filtered}
          allStudents={enrichedStudents}
          loading={loading}
          search={search}
          setSearch={setSearch}
          filterProgram={filterProgram}
          setFilterProgram={setFilterProgram}
          filterTerm={filterTerm}
          setFilterTerm={setFilterTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterAlert={filterAlert}
          setFilterAlert={setFilterAlert}
          onSelectStudent={setSelectedStudent}
        />
      </main>

      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onRefresh={() => {
            loadStudents()
            setSelectedStudent(null)
          }}
          onRefreshKeepOpen={async () => {
            await loadStudents()
            // Re-find the updated student from fresh data
          }}
        />
      )}

      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onSaved={() => {
            setShowAddStudent(false)
            loadStudents()
          }}
        />
      )}
    </div>
  )
}
