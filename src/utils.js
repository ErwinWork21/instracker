/**
 * Format a date/timestamp for display.
 * Output: "1 October 2026, 15:32"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  const day = d.getDate()
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hh}:${mm}`
}

/**
 * Format a date only (no time).
 * Output: "1 October 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Returns true if the video editing alert should be shown.
 * Alert shows H+1 after Lesson 10 attendance.
 */
export function shouldShowVideoEditingAlert(lesson10AttendanceAt) {
  if (!lesson10AttendanceAt) return false
  const alertDate = new Date(lesson10AttendanceAt)
  alertDate.setDate(alertDate.getDate() + 1)
  alertDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today >= alertDate
}

/**
 * Count checked attendances from lessons array.
 */
export function countAttendance(lessons) {
  if (!lessons) return 0
  return lessons.filter(l => l.attendance).length
}
