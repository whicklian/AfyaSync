import { openDB } from 'idb';

const DB_NAME = 'afyasync_local_db';
const STORE_NAME = 'health_queue';

export async function initLocalDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'local_id', autoIncrement: true });
            }
        },
    });
}

export async function saveRecordLocally(recordData){
    const db = await initLocalDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');

    const newRecord = {
        ...recordData,
        local_id: crypto.randomUUID(),
        created_at_local: new Date().toISOString(),
        sync_status: 'pending'
    };

    await tx.store.put(newRecord);
    await tx.done;
    return newRecord;
}

export async function getPendingQueue() {
    const db = await initLocalDB();
    return await db.getAll(STORE_NAME);
}

export async function clearSyncedRecords(localIds) {
    if ( !localIds || localIds.length === 0 ) return;
    
    const db = await initLocalDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');

    for (const id of localIds) {
        await tx.store.delete(id);
    }

    await tx.done;
}
