import { useEffect, useRef } from 'react'
import styles from './LogoMark.module.css'

interface LogoMarkProps {
  className?: string
}

// The logo SVG is loaded as markup (not <img src>) so its black linework
// can use fill/stroke="currentColor" and pick up --text per theme, while
// the flag's red fill stays a literal hex and never inverts. An <img> tag
// can't reach inside an external SVG's own attributes this way — only an
// inlined one responds to the page's CSS. Sizeless itself (see
// LogoMark.module.css) — callers size it via their own wrapper.
export function LogoMark({ className }: LogoMarkProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/brand/beating-bogey-flag-red.svg')
      .then((res) => res.text())
      .then((svg) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      })
    return () => {
      cancelled = true
    }
  }, [])

  const markClassName = className ? `${styles.mark} ${className}` : styles.mark
  return <span ref={ref} className={markClassName} aria-hidden="true" />
}
