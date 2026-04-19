import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseStory } from './validateGraph'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('story.json', () => {
  it('可解析且通过图校验', () => {
    const path = join(__dirname, '../../content/story.json')
    const raw = JSON.parse(readFileSync(path, 'utf-8'))
    const story = parseStory(raw)
    expect(story.stages.length).toBeGreaterThanOrEqual(8)
  })
})
