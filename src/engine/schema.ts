import { z } from 'zod'

export const StatKeySchema = z.enum([
  'stress',
  'healthDebt',
  'support',
  'wealth',
  'career',
  'luck',
])

export type StatId = z.infer<typeof StatKeySchema>

const EffectSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('addStat'),
    stat: StatKeySchema,
    value: z.number(),
  }),
  z.object({
    op: z.literal('setStat'),
    stat: StatKeySchema,
    value: z.number(),
  }),
  z.object({
    op: z.literal('clampStat'),
    stat: StatKeySchema,
    min: z.number(),
    max: z.number(),
  }),
  z.object({
    op: z.literal('setFlag'),
    key: z.string(),
    value: z.boolean(),
  }),
  z.object({
    op: z.literal('addTag'),
    tag: z.string(),
  }),
  z.object({
    op: z.literal('removeTag'),
    tag: z.string(),
  }),
])

export type Effect = z.infer<typeof EffectSchema>

const NextSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('scene'),
    sceneId: z.string(),
    stageId: z.string().optional(),
  }),
  z.object({
    kind: z.literal('stage'),
    stageId: z.string(),
    sceneId: z.string(),
  }),
])

export type Next = z.infer<typeof NextSchema>

const CheckModifiersSchema = z.object({
  addStatWeights: z
    .array(
      z.object({
        stat: StatKeySchema,
        weight: z.number(),
      }),
    )
    .optional(),
  stressPenalty: z.number().optional(),
  luckWeight: z.number().optional(),
})

export const ThresholdCheckSchema = z.object({
  kind: z.literal('threshold'),
  id: z.string(),
  label: z.string(),
  modifiers: CheckModifiersSchema.optional(),
  bands: z
    .array(
      z.object({
        min: z.number(),
        max: z.number(),
        label: z.string(),
        next: NextSchema,
        effects: z.array(EffectSchema).optional(),
      }),
    )
    .min(1),
})

export type ThresholdCheck = z.infer<typeof ThresholdCheckSchema>

const VisibleWhenSchema = z.object({
  tag: z.string().optional(),
  flag: z.object({ key: z.string(), value: z.boolean() }).optional(),
  statMax: z.object({ stat: StatKeySchema, value: z.number() }).optional(),
  statMin: z.object({ stat: StatKeySchema, value: z.number() }).optional(),
})

export const ChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  effects: z.array(EffectSchema).optional(),
  check: ThresholdCheckSchema.optional(),
  next: NextSchema.optional(),
  /** 不满足时不展示该选项（用于分流、标签/属性门槛） */
  visibleWhen: VisibleWhenSchema.optional(),
})

export type Choice = z.infer<typeof ChoiceSchema>

export const SceneSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  narrative: z.array(z.string()),
  choices: z.array(ChoiceSchema).optional(),
  onEnter: z.array(EffectSchema).optional(),
  autoNext: z
    .object({
      next: NextSchema,
      delayMs: z.number().optional(),
    })
    .optional(),
  isEnding: z.boolean().optional(),
})

export type Scene = z.infer<typeof SceneSchema>

export const StageSchema = z.object({
  id: z.string(),
  title: z.string(),
  scenes: z.array(SceneSchema).min(1),
})

export type Stage = z.infer<typeof StageSchema>

const GlobalStateSchema = z.object({
  stats: z.object({
    stress: z.number(),
    healthDebt: z.number(),
    support: z.number(),
    wealth: z.number(),
    career: z.number(),
    luck: z.number(),
  }),
  flags: z.record(z.string(), z.boolean()),
  tags: z.array(z.string()),
})

export const StorySchema = z.object({
  meta: z.object({
    title: z.string(),
    version: z.string(),
    estimatedMinutes: z.tuple([z.number(), z.number()]),
    start: z.object({
      stageId: z.string(),
      sceneId: z.string(),
    }),
    rngSeedDefault: z.string().optional(),
  }),
  initial: GlobalStateSchema,
  stages: z.array(StageSchema).min(1),
})

export type Story = z.infer<typeof StorySchema>
export type StoryMeta = Story['meta']
