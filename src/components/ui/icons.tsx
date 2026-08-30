import type { SVGProps } from 'react'

// Small monochrome icons (sourced as flat single-color SVGs, re-exported as
// React components with `currentColor` swapped in so each can pick up
// whatever color its caller sets). GolfFlagIcon/GolferIcon distinguish the
// two halves of the draft roster's archetype pairing (hole vs. player);
// Sun/MoonIcon are used by the nav's theme toggle; CloseIcon by the How to
// Play drawer; StatsIcon by the nav's stats page trigger.

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      {...props}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function GolfFlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" {...props}>
      <path d="M272,320.46V202.3l166.62-75.73a16,16,0,0,0,0-29.14l-176-80A16,16,0,0,0,240,32V191.66c0,.23,0,.47,0,.7v128.1q8-.45,16-.46T272,320.46Z" />
      <path d="M463.33,457.5c-8.56-42.85-35.11-78.74-76.78-103.8C354.05,334.15,313.88,322.4,272,320v79.75a16,16,0,1,1-32,0V320c-41.88,2.4-82.05,14.15-114.55,33.7-41.67,25.06-68.22,60.95-76.78,103.8a32.49,32.49,0,0,0,6.44,27.08C61.13,492,70,496,80,496H432c10,0,18.88-4.05,24.9-11.42A32.49,32.49,0,0,0,463.33,457.5Z" />
    </svg>
  )
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function StatsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  )
}

export function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
    </svg>
  )
}

export function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
    </svg>
  )
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" />
    </svg>
  )
}

export function GolferIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" {...props}>
      <path d="M275.076,93.952c2.991-24.117-14.126-46.108-38.252-49.108c-24.126-3-46.107,14.117-49.107,38.252c-3,24.126,14.126,46.108,38.256,49.107C250.085,135.195,272.076,118.078,275.076,93.952z" />
      <path d="M384.588,229.743c-20.572-32.927-36.882-70.296-41.076-77.557c-2.487-4.316-2.73-7.361-0.78-11.622c8.4-12.144,16.991-24.197,25.685-36.125c7.54-10.352,18.319-21.802,14.202-35.9c-2.364-8.108-9.541-11.486-15.604-16.424c-15.23-12.441-30.414-24.982-45.742-37.333c-4.292-3.45-8.436-7.08-12.783-10.45c-7.068-6.288-17.897-5.658-24.18,1.424c-5.297,5.964-5.617,14.576-1.361,20.9L266.932,43.34c3.928,3.1,7.446,6.658,10.436,10.648l15.987-16.648l40.324,39.126l-31.878,33.954c-17.613,17.252-59.472,42.072-49.891,77.035c7.302,26.648,32.418,72.404,32.418,85.323c0,17.892-9.81,108.287-9.81,108.287c-0.064,0.352-0.081,0.703-0.126,1.063l-28.396,98.143c-3.225,10.612,2.775,21.838,13.4,25.054c10.617,3.225,21.842-2.766,25.063-13.396l34.162-90.873c0.473-1.054,0.892-2.153,1.225-3.297l0.37-0.982c0.518-1.721,18.468-86.8,18.468-86.8l0.798-7.91l-8.586,85.324c-0.248,1.504-0.41,3.027-0.41,4.613l4.207,97.665c0,12.333,9.991,22.333,22.324,22.333c12.33,0,22.333-10,22.333-22.333l5.77-94.134l13.792-86.927C401.889,281.768,405.155,262.67,384.588,229.743z" />
      <path d="M187.676,125.879l-73.224,76.242c-3.734,3.901-4.631,9.712-2.239,14.55l18.554,37.531c1.464,2.991,4.162,5.171,7.379,6.036c3.216,0.847,6.64,0.279,9.396-1.586l13.936-9.397c2.753-1.864,4.568-4.819,4.987-8.117c0.419-3.297-0.608-6.612-2.815-9.099l-24.972-33.594l60.035-62.53C194.64,133.104,190.951,129.717,187.676,125.879z" />
    </svg>
  )
}
