import { createClient } from '@supabase/supabase-js';

// Webpack's DefinePlugin swaps these in at build time. The try/catch keeps the
// app working (browser-only lists) if the bundle was built without them.
let url = '';
let anonKey = '';
try {
  url = process.env.SUPABASE_URL;
  anonKey = process.env.SUPABASE_ANON_KEY;
} catch {
  // not configured
}

// null when Supabase isn't configured: the app then keeps lists in the browser.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
