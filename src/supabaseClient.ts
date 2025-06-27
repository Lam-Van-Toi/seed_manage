
import { createClient } from '@supabase/supabase-js';

// This declaration block is added to fix the TypeScript error:
// "Property 'env' does not exist on type 'ImportMeta'".
// It tells TypeScript about the shape of Vite's `import.meta.env` object.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_SUPABASE_URL: string;
      readonly VITE_SUPABASE_ANON_KEY: string;
    };
  }
}

// Lấy các biến môi trường từ Vite. Các biến này phải bắt đầu bằng VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL và Anon Key phải được cung cấp trong biến môi trường.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'seed_app' } // Specify the default schema
});