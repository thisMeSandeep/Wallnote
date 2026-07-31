import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Service-worker lifecycle UI.
 *
 * Deliberately a prompt, not an auto-reload: the wall is persisted on a 400ms
 * debounce, so refreshing without asking can discard the stroke or sentence in
 * progress. The user picks the moment.
 */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="swpill" role="status">
      {needRefresh ? (
        <>
          <span>A new version is ready.</span>
          <button className="swpill__go" onClick={() => void updateServiceWorker(true)}>
            Reload
          </button>
        </>
      ) : (
        <span>Wallnote is ready to work offline.</span>
      )}
      <button className="swpill__x" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
