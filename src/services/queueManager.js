import { getPendingQueue, clearSyncedRecords } from './db';
import { syncRecordsToSupabase } from './supabaseClient';

let syncInProgress = false;
let syncRequestedAgain = false;

export async function processSyncQueue() {
    if (!navigator.onLine) {
        console.log('Device is offline. Sync will be attempted when back online.');
        return { synced: false, offline: true, count: 0, message: 'Device is offline.' };
    }

    syncRequestedAgain = true;
    if (syncInProgress) {
        return { synced: false, inProgress: true, count: 0, message: 'Sync is already in progress.' };
    }

    syncInProgress = true;
    let syncedCount = 0;

    try {
        while (syncRequestedAgain && navigator.onLine) {
            syncRequestedAgain = false;
            const pendingRecords = await getPendingQueue();

            if (!pendingRecords?.length) {
                if (syncRequestedAgain && navigator.onLine) continue;
                return { synced: true, count: syncedCount, message: 'No pending records to sync.' };
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
            await clearSyncedRecords(syncedIds);
            syncedCount += syncedIds.length;
        }

        return {
            synced: navigator.onLine,
            offline: !navigator.onLine,
            count: syncedCount,
            message: navigator.onLine ? 'Records synced successfully.' : 'Device went offline during sync.',
        };
    } finally {
        syncInProgress = false;
    }
}

export function setupNetworkListeners(onSyncComplete) {
    const handleOnline = async () => {
        console.log('Device is back online. Attempting to sync pending records...');
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
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}
