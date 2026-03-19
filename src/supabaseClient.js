import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://sjqzqjorkeounayfxccs.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcXpxam9ya2VvdW5heWZ4Y2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTk4MzIsImV4cCI6MjA4OTQzNTgzMn0.Uk6oufLiJupKxRi4KGq2D-CafBuYuQUWsFznh1fritA"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)