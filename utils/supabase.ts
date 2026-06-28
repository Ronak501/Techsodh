
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "https://placeholder-project.supabase.co";
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);
        