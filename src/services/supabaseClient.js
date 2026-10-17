import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY
    ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? import.meta.env.VITE_SUPABSE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function syncRecordsToSupabase(pendingRecords) {
    if (!pendingRecords || pendingRecords.length === 0) {
        console.log('No pending records to sync.');
        return;
    }

    const payload = pendingRecords.map(record => ({
        local_id: record.local_id,
        chw_id: record.chw_id,
        patient_name: record.patient_name,
        village_name: record.village_name,
        visit_type: record.visit_type,
        vitals_bp: record.vitals_bp || null,
        vitals_temp: record.vitals_temp === '' || record.vitals_temp == null
            ? null
            : Number(record.vitals_temp),
        urgency_level: record.urgency_level,
        visit_notes: record.visit_notes,
        created_at_local: record.created_at_local,
    }));

    const{ data, error } = await supabase
        .from('health_visits')
        .upsert(payload, { onConflict: 'local_id' });
        
    if (error) {
        console.error('Error syncing records to Supabase:', error);
    return { success: false, error };
    }

    return { success: true, data };
}