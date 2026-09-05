import { useRef, useState } from 'react'
import { useDraftAnimation } from '../../hooks/useDraftAnimation'
import { useSettingsDrawer } from '../../state/useSettingsDrawer'
import { exportStats, importStats } from '../../game/stats/storage'
import { AnimationIcon, PaintbrushIcon } from '../ui/icons'
import { Drawer } from '../ui/Drawer'
import { ThemeToggle } from './ThemeToggle'
import styles from './SettingsDrawer.module.css'

function downloadBackup() {
  const blob = new Blob([JSON.stringify(exportStats(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `beating-bogey-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// Rendered once (from App.tsx), reading open/closed state from
// SettingsContext so both the desktop cog trigger and the mobile
// hamburger menu's "Settings" row control this one shared instance —
// same pattern as HowToPlayDrawer.
export function SettingsDrawer() {
  const { isOpen, close, openedFromNav, backToNav } = useSettingsDrawer()
  const { enabled: animationEnabled, setEnabled: setAnimationEnabled } = useDraftAnimation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      setImportStatus({ ok: false, message: "That file doesn't look like a Beating Bogey backup." })
      return
    }

    try {
      const { rounds } = importStats(data)
      setImportStatus({ ok: true, message: `Imported ${rounds.length} round${rounds.length === 1 ? '' : 's'} — reloading…` })
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setImportStatus({ ok: false, message: err instanceof Error ? err.message : 'Could not import that file.' })
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={close}
      titleId="settings-heading"
      title="Settings"
      onBack={openedFromNav ? backToNav : undefined}
      backLabel="Menu"
      hideClose
    >
      <p className={styles.groupLabel}>Settings</p>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabelGroup}>
          <PaintbrushIcon className={styles.toggleIcon} />
          <span className={styles.toggleLabel}>Theme</span>
        </span>
        <ThemeToggle />
      </div>
      <div className={styles.toggleRow}>
        <span className={styles.toggleLabelGroup}>
          <AnimationIcon className={styles.toggleIcon} />
          <span className={styles.toggleTextGroup}>
            <span className={styles.toggleLabel}>Spinner animations</span>
            <span className={styles.toggleHint}>Spins instantly when off</span>
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={animationEnabled}
          aria-label={animationEnabled ? 'Turn off spinner animations' : 'Turn on spinner animations'}
          className={animationEnabled ? `${styles.switchTrack} ${styles.switchTrackOn}` : styles.switchTrack}
          onClick={() => setAnimationEnabled(!animationEnabled)}
        >
          <span className={animationEnabled ? `${styles.switchThumb} ${styles.switchThumbOn}` : styles.switchThumb} />
        </button>
      </div>

      <p className={styles.dataLabel}>Data</p>
      <div className={styles.dataRow}>
        <button type="button" className={styles.dataLink} onClick={downloadBackup}>
          Export history
        </button>
        <span className={styles.dataDivider} aria-hidden="true">·</span>
        <button type="button" className={styles.dataLink} onClick={() => fileInputRef.current?.click()}>
          Import history
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className={styles.hiddenFileInput}
          onChange={handleFileSelected}
        />
      </div>
      {importStatus && (
        <p className={importStatus.ok ? styles.dataStatusOk : styles.dataStatusError}>{importStatus.message}</p>
      )}
    </Drawer>
  )
}
