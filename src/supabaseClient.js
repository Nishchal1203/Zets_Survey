// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wyanslkgrqhrxdtlxukm.supabase.co'; // replace this
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YW5zbGtncnFocnhkdGx4dWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDgwODEsImV4cCI6MjA2OTEyNDA4MX0.V53CZlMnO3QsXJMLvAHTyetZC2hUKdFX41YLXlovW4A'; // replace this

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
