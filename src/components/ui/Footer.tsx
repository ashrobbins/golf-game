import styles from './Footer.module.css'

// Rendered once from App.tsx (same pattern as NavBar/HowToPlayDrawer), so
// it appears at the bottom of every page regardless of which View is
// active. Copy is the golf-terminology equivalent of the standard
// fan-project disclaimer boilerplate — no official branding/likenesses are
// used anywhere in the app, and this states that explicitly.
export function Footer() {
  return (
    <footer className={styles.footer}>
      <p>© 2026 Beating Bogey. All rights reserved.</p>
      <p>
        Beating Bogey is an independent fan-made golf draft and round simulator. It is not
        affiliated with, endorsed by, sponsored by, licensed by, or otherwise associated with any
        golf tour, championship, club, player association, governing body, organisation, game
        publisher, or ratings provider. All course names, player names, ratings, statistics and
        round data are used for informational, descriptive and editorial purposes only. No
        official logos, crests, player images, likenesses or other official branding are used.
        All trademarks, trade names and other intellectual property rights remain the property of
        their respective owners.
      </p>
    </footer>
  )
}
