import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseStory } from '../src/engine/validateGraph.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const path = join(__dirname, '../content/story.json')
const raw = JSON.parse(readFileSync(path, 'utf-8'))
parseStory(raw)
console.log('story.json 校验通过')
