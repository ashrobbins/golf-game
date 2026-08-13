import { getSurname } from '../../content/formatName'
import type { Golfer, Hole, OutcomeTier } from '../../content/types'
import type { Rng } from '../rng'

interface TemplateSet {
  templates: string[]
  // Inclusive feet range for any {dist} placeholder used by this set.
  distanceRange?: [number, number]
}

// Matched = the golfer's archetype fits the hole (the "expected" outcome
// framing); unmatched = a mismatch (the "upset/scramble" framing). Keeping
// these as separate pools is what lets the commentary narrate the
// archetype-fit drama, not just the outcome tier.
const COMMENTARY: Record<OutcomeTier, { matched: TemplateSet; unmatched: TemplateSet }> = {
  hole_in_one: {
    matched: {
      templates: [
        '{name} strikes it pure and holes the tee shot — an ace!',
        '{name} knocks it straight in the cup for a hole-in-one!',
        'Incredible scenes — {name} makes an ace!',
      ],
    },
    unmatched: {
      templates: [
        'Against all odds, {name} holes the tee shot for an ace!',
        "Nobody saw this coming — {name} makes a hole-in-one out of nowhere!",
      ],
    },
  },
  eagle: {
    matched: {
      templates: [
        '{name} goes flag-hunting and cards a brilliant eagle.',
        'A towering {shot} sets up an eagle for {name}.',
        '{name} rolls in a {dist}-foot putt for a well-earned eagle.',
      ],
      distanceRange: [12, 35],
    },
    unmatched: {
      templates: [
        'Somehow {name} conjures an unlikely eagle out of nowhere!',
        '{name} holes a stunning {shot} for an eagle no one expected.',
      ],
    },
  },
  birdie: {
    matched: {
      templates: [
        '{name} sticks the {shot} to {dist} feet and cans the putt for birdie.',
        '{name} sets himself up for a great birdie by sticking the {shot} to {dist} feet.',
        'A confident {dist}-foot putt drops for {name} — birdie.',
      ],
      distanceRange: [3, 20],
    },
    unmatched: {
      templates: [
        'Against the run of play, {name} scrambles a birdie from {dist} feet!',
        '{name} finds a way to birdie despite a tricky lie.',
        "A lucky bounce sets {name} up for a surprise birdie from {dist} feet.",
      ],
      distanceRange: [6, 22],
    },
  },
  par: {
    matched: {
      templates: [
        '{name} plays it safe, two-putting from {dist} feet for par.',
        'A tidy {shot} leaves {name} a simple par.',
        '{name} rolls a routine {dist}-foot putt in for par.',
      ],
      distanceRange: [4, 15],
    },
    unmatched: {
      templates: [
        '{name} scrambles beautifully, holing a {dist}-foot putt to save par.',
        'A wayward {shot}, but {name} recovers superbly to save par.',
        '{name} grinds out a hard-earned par.',
      ],
      distanceRange: [5, 18],
    },
  },
  bogey_plus: {
    matched: {
      templates: [
        'A rare off day — {name} drops a shot here.',
        "Even {name} can't escape trouble on this one — bogey.",
      ],
    },
    unmatched: {
      templates: [
        '{name} finds trouble off the tee and can\'t recover — bogey.',
        'A tough lie leaves {name} unable to save par.',
        '{name} three-putts from {dist} feet for a bogey.',
      ],
      distanceRange: [6, 12],
    },
  },
}

function shotIntoGreenLabel(par: number): string {
  return par === 3 ? 'tee shot' : 'approach'
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}

export function generateHoleCommentary(
  golfer: Golfer,
  hole: Hole,
  outcomeTier: OutcomeTier,
  archetypeMatched: boolean,
  rng: Rng = Math.random,
): string {
  const set = COMMENTARY[outcomeTier][archetypeMatched ? 'matched' : 'unmatched']
  const template = set.templates[Math.floor(rng() * set.templates.length)]
  const [min, max] = set.distanceRange ?? [0, 0]
  const dist = Math.round(min + rng() * (max - min))

  return fillTemplate(template, {
    name: getSurname(golfer.name),
    dist: String(dist),
    shot: shotIntoGreenLabel(hole.par),
  })
}
