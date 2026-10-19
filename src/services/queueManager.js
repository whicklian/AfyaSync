import { getPendingQueue, markSyncedRecords } from './db';
import { syncRecordsToSupabase } from './supabaseClient';

let syncInProgress = false;
let syncRequestedAgain = false;
let lastSyncTimestamp = 0;
let debounceTimer = null;
const COOLDOWN_PERIOD = 5000; // 5 seconds cooldown between sync attempts

export async function processSyncQueue() {
    if (!navigator.onLine) {
        console.log('Device is offline. Sync will be attempted when back online.');
        return { synced: false, offline: true, count: 0, message: 'Device is offline.' };
    }

    if (syncInProgress) {
        syncRequestedAgain = true;
        return { synced: false, inProgress: true, count: 0, message: 'Sync is already in progress.' };
    }

    const now = Date.now();
    if (now - lastSyncTimestamp < COOLDOWN_PERIOD) {
        return { synced: false, cooldown: true, count: 0, message: 'Sync is on cooldown.Rate limiting in effect.' };
    }

    syncInProgress = true;
    let syncedCount = 0;
    lastSyncTimestamp = now;

    try {
        do {
            syncRequestedAgain = false;
            const pendingRecords = await getPendingQueue();

            if (!pendingRecords?.length) {
                break;
            }

            const result = await syncRecordsToSupabase(pendingRecords);
            if (!result?.success) {
                console.error('Error syncing records:', result?.error);
                return {
                    synced: false,
                    count: syncedCount,
                    error: result?.error,
                    message: 'Error syncing records.',
                };
            }

            const syncedIds = pendingRecords.map((record) => record.local_id);
            await markSyncedRecords(syncedIds);
            syncedCount += syncedIds.length;
        } while (syncRequestedAgain && navigator.onLine);

        return {
            synced: navigator.onLine,
            offline: !navigator.onLine,
            count: syncedCount,
            message: syncedCount
                ? navigator.onLine ? 'Records synced successfully.' : 'Device went offline during sync.'
                : 'No pending records to sync.',
        };
    } finally {
        syncInProgress = false;
    }
}

export function setupNetworkListeners(onSyncComplete) {
    const handleOnline = async () => {
        console.log('Device is back online. Attempting to sync pending records...');

        if (debounceTimer) clearTimeout(debounceTimer);
        // wait 2 seconds after connection stabilizes before triggering sync
        debounceTimer = setTimeout(async () => {
            const outcome = await processSyncQueue();

            if (onSyncComplete)  onSyncComplete(outcome);
        }, 2000);
        try {
            const syncResult = await processSyncQueue();
            onSyncComplete?.(syncResult);
        } catch (error) {
            console.error('Error during automatic sync:', error);
            onSyncComplete?.({
                synced: false,
                error,
                message: 'Automatic sync failed.',
            });
        }
    };
    const handleOffline = () => {
        console.log('Device is offline. Sync will be attempted when back online.');

        if (debounceTimer) clearTimeout(debounceTimer);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}
