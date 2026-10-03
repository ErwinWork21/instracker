// Supabase configuration
// Replace with your actual Supabase project URL and anon key
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const PROGRAMS = ['Kinder', 'Junior']
export const TERM_OPTIONS = ['Foundation 1', 'Foundation 2', 'Term 1', 'Term 2', 'Term 3', 'Term 4']
export const STATUSES = ['On Progress', 'Completed']
