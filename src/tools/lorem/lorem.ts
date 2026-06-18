// Lorem Ipsum generator. Produces words, sentences, or paragraphs of placeholder
// text. When `startWithLorem` is set, the output opens with the canonical
// "Lorem ipsum dolor sit amet…" so it reads like the familiar boilerplate.

const WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
]

const LOREM_START = 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(' ')

export type LoremUnit = 'paragraphs' | 'sentences' | 'words'

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
const pick = () => WORDS[randInt(0, WORDS.length - 1)] as string
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Builds `n` words; if `lead`, the first words are the canonical Lorem opening.
function words(n: number, lead: boolean): string[] {
  return Array.from({ length: n }, (_, i) =>
    lead && i < LOREM_START.length ? (LOREM_START[i] as string) : pick(),
  )
}

function sentence(lead: boolean): string {
  return capitalize(words(randInt(6, 14), lead).join(' ')) + '.'
}

function paragraph(lead: boolean): string {
  const count = randInt(3, 6)
  return Array.from({ length: count }, (_, i) => sentence(lead && i === 0)).join(' ')
}

export function generateLorem(count: number, unit: LoremUnit, startWithLorem = true): string {
  const n = Math.max(1, Math.floor(count))
  if (unit === 'words') return capitalize(words(n, startWithLorem).join(' '))
  if (unit === 'sentences') {
    return Array.from({ length: n }, (_, i) => sentence(startWithLorem && i === 0)).join(' ')
  }
  return Array.from({ length: n }, (_, i) => paragraph(startWithLorem && i === 0)).join('\n\n')
}
