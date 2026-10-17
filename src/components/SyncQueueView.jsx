import { useEffect, useState } from 'react';
import { getPendingQueue } from '../services/db';
import { processSyncQueue } from '../services/queueManager';

export default function SyncQueueView({ refreshTrigger }) {
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let retryTimer;
    let retryDelay = 5000;

    const loadAndSync = async () => {
      try {
        let items = await getPendingQueue();
        if (!active) return;
        setQueue(items);
        setError('');

        if (navigator.onLine && items.length > 0) {
          setSyncing(true);
          const result = await processSyncQueue();
          items = await getPendingQueue();
          if (!active) return;
          setQueue(items);
          if (result?.synced === false && !result.inProgress) {
            const reason = result.error?.message;
            setError(reason
              ? `Automatic sync failed: ${reason}`
              : result.offline
                ? 'You are offline. Visits are saved and will sync when you reconnect.'
                : 'Automatic sync failed. Visits remain saved on this device.');
            retryTimer = window.setTimeout(() => {
              if (active) loadAndSync();
            }, retryDelay);
            retryDelay = Math.min(retryDelay * 2, 60000);
          } else if (result?.synced) {
            retryDelay = 5000;
          }
        }
      } catch (loadError) {
        console.error('Error loading pending records:', loadError);
        if (active) {
          setError('Could not load or sync your saved visits. Retrying automatically.');
          retryTimer = window.setTimeout(() => {
            if (active) loadAndSync();
          }, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 60000);
        }
      } finally {
        if (active) setSyncing(false);
      }
    };

    loadAndSync();

    return () => {
      active = false;
      window.clearTimeout(retryTimer);
    };
  }, [refreshTrigger]);

  return (
    <section className="panel queue-panel">
      <div className="panel-heading queue-heading">
        <div>
          <h2 className="panel-title">Sync queue</h2>
          <p className="panel-description">
            {syncing ? 'Sending visits securely to Supabase…' : 'Visits sync automatically when you’re online.'}
          </p>
        </div>
        <span className="queue-count">{queue.length} {queue.length === 1 ? 'visit' : 'visits'}</span>
      </div>

      {error && <p className="form-message error" role="alert">{error}</p>}

      {queue.length === 0 ? (
        <div className="queue-empty">
          <span className="empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <strong>You’re all caught up</strong>
          <span>New visits will appear here until they sync.</span>
        </div>
      ) : (
        <>
          <div className="queue-list">
            {queue.map((item) => (
              <article className="queue-item" key={item.local_id}>
                <div className="queue-item-top">
                  <span className="queue-item-name">{item.patient_name}</span>
                  <span className="queue-item-status">
                    {syncing ? 'Syncing…' : navigator.onLine ? 'Waiting to sync' : 'Waiting for connection'}
                  </span>
                </div>
                <div className="queue-item-meta">
                  <span>{item.village_name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.visit_type} visit</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
