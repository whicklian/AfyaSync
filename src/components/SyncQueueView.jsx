import { useEffect, useState } from 'react';
import { getAllRecords } from '../services/db';
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
        let items = await getAllRecords();
        if (!active) return;
        setQueue(items);
        setError('');

        if (navigator.onLine && items.some((item) => item.sync_status !== 'synced')) {
          setSyncing(true);
          const result = await processSyncQueue();
          items = await getAllRecords();
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
          <h2 className="panel-title">Visit history</h2>
          <p className="panel-description">
            {syncing ? 'Sending visits securely to Supabase…' : 'Saved visits stay here after they sync.'}
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
          <strong>No visits saved yet</strong>
          <span>Visits you record will be kept here.</span>
        </div>
      ) : (
        <>
          <div className="queue-list">
            {queue.map((item) => (
              <article className="queue-item" key={item.local_id}>
                <div className="queue-item-top">
                  <span className="queue-item-name">{item.patient_name}</span>
                  <span className={`queue-item-status${item.sync_status === 'synced' ? ' synced' : ''}`}>
                    {item.sync_status === 'synced'
                      ? 'Synced'
                      : syncing
                        ? 'Syncing…'
                        : navigator.onLine ? 'Waiting to sync' : 'Waiting for connection'}
                  </span>
                </div>
                <div className="queue-item-meta">
                  <span>{item.village_name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.visit_type} visit</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={item.created_at_local}>{new Date(item.created_at_local).toLocaleString()}</time>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
