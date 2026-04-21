import { useMemo, useRef, useState } from 'react'
import type { Choice, Scene, Story } from '@/engine/schema'
import { useGameStore } from '@/store/gameStore'

function sceneKey(stageId: string, sceneId: string) {
  return `${stageId}::${sceneId}`
}

function visibleWhenLabel(v: Choice['visibleWhen'] | undefined): string {
  if (!v) return '（无）'
  const parts: string[] = []
  if (v.tag) parts.push(`tag=${v.tag}`)
  if (v.flag) parts.push(`flag ${v.flag.key}=${String(v.flag.value)}`)
  if (v.statMin) parts.push(`${v.statMin.stat}>=${v.statMin.value}`)
  if (v.statMax) parts.push(`${v.statMax.stat}<=${v.statMax.value}`)
  return parts.join(' ∧ ')
}

function allScenes(story: Story): Array<{ stageId: string; stageTitle: string; scene: Scene }> {
  const out: Array<{ stageId: string; stageTitle: string; scene: Scene }> = []
  for (const st of story.stages) {
    for (const sc of st.scenes) out.push({ stageId: st.id, stageTitle: st.title, scene: sc })
  }
  return out
}

type SceneRef = {
  stageId: string
  stageTitle: string
  sceneId: string
  sceneTitle?: string
  isEnding?: boolean
  scene: Scene
}

type EdgeInfo =
  | { kind: 'next'; toStageId: string; toSceneId: string }
  | { kind: 'check'; checkId: string; bandIndex: number; bandLabel: string; toStageId: string; toSceneId: string }

type TreeEdge = {
  from: string
  choiceId: string
  label: string
  visibleWhen: string
  edge: EdgeInfo
  toKey?: string
}

function buildSceneIndex(story: Story): Map<string, SceneRef> {
  const map = new Map<string, SceneRef>()
  for (const st of story.stages) {
    for (const sc of st.scenes) {
      const key = sceneKey(st.id, sc.id)
      map.set(key, {
        stageId: st.id,
        stageTitle: st.title,
        sceneId: sc.id,
        sceneTitle: sc.title,
        isEnding: sc.isEnding,
        scene: sc,
      })
    }
  }
  return map
}

function resolveChoiceEdges(fromStageId: string, c: Choice): EdgeInfo[] {
  const chk: any = (c as any).check
  if (chk) {
    const bands: any[] = Array.isArray(chk.bands) ? chk.bands : []
    return bands.map((b, idx) => {
      const n: any = b.next
      const toStageId = n?.kind === 'stage' ? n.stageId : n?.stageId ?? fromStageId
      const toSceneId = n?.sceneId
      return {
        kind: 'check' as const,
        checkId: String(chk.id),
        bandIndex: idx,
        bandLabel: String(b.label ?? `band#${idx}`),
        toStageId: String(toStageId),
        toSceneId: String(toSceneId),
      }
    }).filter((x) => !!x.toSceneId)
  }
  const n: any = (c as any).next
  if (!n) return []
  if (n.kind === 'stage') return [{ kind: 'next', toStageId: n.stageId, toSceneId: n.sceneId }]
  // kind: scene (same stage by default)
  return [{ kind: 'next', toStageId: n.stageId ?? fromStageId, toSceneId: n.sceneId }]
}

function nodeTitle(ref: SceneRef): string {
  const t = ref.sceneTitle?.trim()
  const suf = ref.isEnding ? ' [ENDING]' : ''
  return `${ref.stageId}/${ref.sceneId}${t ? ` · ${t}` : ''}${suf}`
}

function buildTreeFromStart(story: Story) {
  const index = buildSceneIndex(story)
  const startKey = sceneKey(story.meta.start.stageId, story.meta.start.sceneId)

  // 先构建“唯一节点图”（key -> edges）
  const graph = new Map<string, TreeEdge[]>()
  for (const [key, ref] of index.entries()) {
    const edges: TreeEdge[] = []
    for (const c of ref.scene.choices ?? []) {
      const edgeList = resolveChoiceEdges(ref.stageId, c)
      if (!edgeList || edgeList.length === 0) continue
      for (const edge of edgeList) {
        const toKey = sceneKey(edge.toStageId, edge.toSceneId)
        edges.push({
          from: key,
          choiceId: c.id,
          label: c.label,
          visibleWhen: visibleWhenLabel(c.visibleWhen),
          edge,
          toKey,
        })
      }
    }
    graph.set(key, edges)
  }

  // 再从起点做一棵“展开树”（避免环路/重复展开）
  type TreeItem = {
    key: string
    depth: number
    ref: SceneRef
    edges: TreeEdge[]
    children: Array<{ edge: TreeEdge; childKey: string; isRef: boolean; isCycle: boolean }>
  }

  const treeItems: TreeItem[] = []
  const visited = new Set<string>()
  const inPath = new Set<string>()

  const walk = (key: string, depth: number) => {
    const ref = index.get(key)
    if (!ref) return
    const edges = graph.get(key) ?? []

    const isCycleHere = inPath.has(key)
    const isRefHere = visited.has(key)

    // 每个 key 只在树里渲染一次“完整展开”；再次遇到只作为 ref
    const expand = !isCycleHere && !isRefHere
    if (expand) visited.add(key)

    const children: TreeItem['children'] = []
    if (expand) {
      inPath.add(key)
      for (const e of edges) {
        if (!e.toKey) continue
        const isCycle = inPath.has(e.toKey)
        const isRef = visited.has(e.toKey)
        children.push({ edge: e, childKey: e.toKey, isRef, isCycle })
        if (!isCycle && !isRef) walk(e.toKey, depth + 1)
      }
      inPath.delete(key)
    }

    treeItems.push({ key, depth, ref, edges, children })
  }

  walk(startKey, 0)
  return { startKey, index, graph, treeItems }
}

type GraphNode = {
  key: string
  title: string
  depth: number
  x: number
  y: number
}

type GraphEdge = {
  from: string
  to: string
  label: string
  visibleWhen: string
  kind: 'next' | 'check'
}

function buildReachableGraph(tree: ReturnType<typeof buildTreeFromStart>) {
  const { startKey, index, graph } = tree
  const reachable = new Set<string>()
  const depth = new Map<string, number>()

  // BFS shortest depth
  const q: string[] = [startKey]
  reachable.add(startKey)
  depth.set(startKey, 0)
  while (q.length) {
    const cur = q.shift()!
    const d = depth.get(cur) ?? 0
    for (const e of graph.get(cur) ?? []) {
      const to = e.toKey
      if (!to) continue
      if (!reachable.has(to)) {
        reachable.add(to)
        depth.set(to, d + 1)
        q.push(to)
      } else {
        // keep shortest
        const old = depth.get(to)
        if (old == null || d + 1 < old) depth.set(to, d + 1)
      }
    }
  }

  const nodesByDepth = new Map<number, string[]>()
  for (const k of reachable) {
    const d = depth.get(k) ?? 0
    const arr = nodesByDepth.get(d) ?? []
    arr.push(k)
    nodesByDepth.set(d, arr)
  }
  const depths = Array.from(nodesByDepth.keys()).sort((a, b) => a - b)
  for (const d of depths) {
    nodesByDepth.get(d)!.sort()
  }

  const NODE_W = 170
  const NODE_H = 44
  const GAP_X = 230
  const GAP_Y = 68
  const PAD_X = 30
  const PAD_Y = 30

  const nodes: GraphNode[] = []
  for (const d of depths) {
    const arr = nodesByDepth.get(d)!
    for (let i = 0; i < arr.length; i++) {
      const key = arr[i]
      const ref = index.get(key)
      const title = ref ? nodeTitle(ref) : key
      nodes.push({
        key,
        title,
        depth: d,
        x: PAD_X + d * GAP_X,
        y: PAD_Y + i * GAP_Y,
      })
    }
  }

  const nodeMap = new Map(nodes.map((n) => [n.key, n] as const))
  const edges: GraphEdge[] = []
  for (const from of reachable) {
    for (const e of graph.get(from) ?? []) {
      const to = e.toKey
      if (!to || !reachable.has(to)) continue
      edges.push({
        from,
        to,
        label:
          e.edge.kind === 'check'
            ? `${e.choiceId}:${e.edge.checkId}/${e.edge.bandLabel}`
            : `${e.choiceId}:${e.label}`,
        visibleWhen: e.visibleWhen,
        kind: e.edge.kind === 'check' ? 'check' : 'next',
      })
    }
  }

  // Canvas bounds
  let maxX = 0
  let maxY = 0
  for (const n of nodes) {
    maxX = Math.max(maxX, n.x + NODE_W)
    maxY = Math.max(maxY, n.y + NODE_H)
  }

  return {
    nodes,
    edges,
    nodeMap,
    dims: {
      nodeW: NODE_W,
      nodeH: NODE_H,
      width: maxX + PAD_X,
      height: maxY + PAD_Y,
    },
  }
}

export function GmScreen() {
  const story = useGameStore((s) => s.story)
  const goTitle = useGameStore((s) => s.goTitle)
  const gmGo = useGameStore((s) => s.gmGo)
  const gmSetStats = useGameStore((s) => s.gmSetStats)
  const gmToggleFlag = useGameStore((s) => s.gmToggleFlag)
  const gmSetTags = useGameStore((s) => s.gmSetTags)
  const state = useGameStore((s) => s.state)

  const [pick, setPick] = useState<string>(() =>
    sceneKey(story.meta.start.stageId, story.meta.start.sceneId),
  )
  const [treeQuery, setTreeQuery] = useState('')
  const [tagInput, setTagInput] = useState<string>(() => state.tags.join(', '))
  const [flagKeyInput, setFlagKeyInput] = useState<string>('married')
  // 默认放大一档，避免“看起来太小”
  const [pan, setPan] = useState({ x: 24, y: 24 })
  // 基准值调大：默认就更清晰
  const [scale, setScale] = useState(2.4)
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const scenes = useMemo(() => allScenes(story), [story])
  const selected = useMemo(() => {
    const [stageId, sceneId] = pick.split('::')
    const hit = scenes.find((x) => x.stageId === stageId && x.scene.id === sceneId)
    return hit ? { stageId, stageTitle: hit.stageTitle, scene: hit.scene } : null
  }, [pick, scenes])

  const tree = useMemo(() => buildTreeFromStart(story), [story])
  const graph = useMemo(() => buildReachableGraph(tree), [tree])

  const pickRef = useMemo(() => tree.index.get(pick) ?? null, [tree.index, pick])
  const pickEdges = useMemo(() => tree.graph.get(pick) ?? [], [tree.graph, pick])

  // 允许更高倍数（2.6 依然不够清晰）
  const clampScale = (v: number) => Math.max(0.35, Math.min(8, v))

  const zoomBy = (factor: number) => {
    setScale((s) => clampScale(s * factor))
  }

  const resetView = () => {
    setPan({ x: 24, y: 24 })
    setScale(2.4)
  }

  const centerOnNode = (key: string) => {
    const vp = viewportRef.current
    const n = graph.nodeMap.get(key)
    if (!vp || !n) return
    const rect = vp.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const nx = (n.x + graph.dims.nodeW / 2) * scale
    const ny = (n.y + graph.dims.nodeH / 2) * scale
    setPan({ x: cx - nx, y: cy - ny })
  }

  return (
    <div className="screen screen--play">
      <div className="play-frame">
        <div className="play-body" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>GM 调试模式</h2>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
              查看世界树与条件、跳转任意场景、调整任意属性（仅本地调试用）。
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn--ghost" onClick={goTitle}>
                返回标题
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>事件树（图形视图）</h3>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
              这是从起点可达的全量节点连线图。拖拽可平移，滚轮可缩放（按住 Ctrl 更细）。点节点后右侧显示详情与跳转关系。
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <input
                value={treeQuery}
                onChange={(e) => setTreeQuery(e.target.value)}
                placeholder="搜索并高亮：stage/scene/标题（简易）"
                style={{ minWidth: 320 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>
                节点：{graph.nodes.length} · 边：{graph.edges.length}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>
                缩放：{Math.round(scale * 100)}%
              </span>
              <button type="button" className="btn btn--ghost" onClick={() => zoomBy(1.22)}>
                放大 +
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => zoomBy(1 / 1.22)}>
                缩小 -
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => centerOnNode(pick)}>
                居中到当前
              </button>
              <button type="button" className="btn btn--ghost" onClick={resetView}>
                重置视图
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) minmax(360px, 1fr)', gap: 12, marginTop: 12 }}>
              <div
                style={{
                  height: 620,
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: 10,
                  background: 'rgba(255,255,255,0.02)',
                }}
                ref={viewportRef}
                onWheel={(e) => {
                  e.preventDefault()
                  // 更稳的缩放：Ctrl 时更细，普通滚轮也可缩放
                  const delta = -e.deltaY
                  const step = e.ctrlKey ? 1.06 : 1.14
                  const factor = delta > 0 ? step : 1 / step
                  setScale((s) => clampScale(s * factor))
                }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return
                  dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
                }}
                onMouseMove={(e) => {
                  const d = dragRef.current
                  if (!d) return
                  // 缩放越大，同样的鼠标位移“扫过的世界”越少，体感会很慢；
                  // 因此按缩放倍数放大平移量，让高倍时也能快速拖动。
                  const k = Math.max(1, Math.min(6, scale))
                  setPan({
                    x: d.panX + (e.clientX - d.x) * k,
                    y: d.panY + (e.clientY - d.y) * k,
                  })
                }}
                onMouseUp={() => {
                  dragRef.current = null
                }}
                onMouseLeave={() => {
                  dragRef.current = null
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${graph.dims.width} ${graph.dims.height}`}
                  style={{ display: 'block' }}
                >
                  <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
                    {/* edges */}
                    {graph.edges.map((e, idx) => {
                      const a = graph.nodeMap.get(e.from)
                      const b = graph.nodeMap.get(e.to)
                      if (!a || !b) return null
                      const x1 = a.x + graph.dims.nodeW
                      const y1 = a.y + graph.dims.nodeH / 2
                      const x2 = b.x
                      const y2 = b.y + graph.dims.nodeH / 2
                      const dx = Math.max(40, (x2 - x1) * 0.6)
                      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
                      const stroke = e.kind === 'check' ? 'rgba(255,210,120,0.55)' : 'rgba(180,200,255,0.45)'
                      return (
                        <path
                          key={`${e.from}::${e.to}::${idx}`}
                          d={d}
                          fill="none"
                          stroke={stroke}
                          strokeWidth={2}
                        />
                      )
                    })}

                    {/* nodes */}
                    {graph.nodes.map((n) => {
                      const isPicked = pick === n.key
                      const q = treeQuery.trim().toLowerCase()
                      const hit = q ? n.title.toLowerCase().includes(q) : false
                      const fill = isPicked ? 'rgba(226,186,120,0.35)' : hit ? 'rgba(160,190,255,0.22)' : 'rgba(255,255,255,0.06)'
                      // 未选中节点统一加黑色描边，增强可读性
                      const stroke = isPicked ? 'rgba(226,186,120,0.90)' : 'rgba(0,0,0,0.55)'
                      return (
                        <g
                          key={n.key}
                          transform={`translate(${n.x} ${n.y})`}
                          onClick={() => {
                            setPick(n.key)
                            // 点击节点时轻微帮你把视线拉过去（不强行居中，避免“跳屏”）
                            // 只在当前节点不可见时才建议居中，先保持简单：不自动移动
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <rect
                            x={0}
                            y={0}
                            width={graph.dims.nodeW}
                            height={graph.dims.nodeH}
                            rx={10}
                            ry={10}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={isPicked ? 2.6 : 2.2}
                          />
                          <text
                            x={10}
                            y={26}
                            fill="rgba(0,0,0,0.82)"
                            fontSize={12}
                            style={{ userSelect: 'none' }}
                          >
                            {n.title.length > 28 ? `${n.title.slice(0, 28)}…` : n.title}
                          </text>
                        </g>
                      )
                    })}
                  </g>
                </svg>
              </div>

              <div
                style={{
                  maxHeight: 620,
                  overflow: 'auto',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                {!pickRef ? (
                  <div style={{ color: 'var(--text-secondary)' }}>未选中节点</div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{nodeTitle(pickRef)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        stage: {pickRef.stageTitle}
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => gmGo(pickRef.stageId, pickRef.sceneId)}
                        >
                          跳转到此场景
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => centerOnNode(pick)}>
                          居中到当前
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>叙事段落</div>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                        {(pickRef.scene.narrative ?? []).join('\\n\\n')}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>分支（全量：{pickEdges.length}）</div>
                      {pickEdges.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)' }}>（无）</div>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                          {pickEdges.map((e, idx) => (
                            <li key={`${pick}::${e.choiceId}::${idx}`}>
                              <div style={{ fontWeight: 600 }}>
                                {e.choiceId} · {e.label}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                visibleWhen：{e.visibleWhen} ·{' '}
                                {e.edge.kind === 'check' ? (
                                  <>
                                    check:{e.edge.checkId} / {e.edge.bandLabel} → {e.edge.toStageId}/{e.edge.toSceneId}
                                  </>
                                ) : (
                                  <>next:{(e.edge as any).toStageId}/{(e.edge as any).toSceneId}</>
                                )}
                              </div>
                              {e.toKey ? (
                                <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="btn btn--ghost"
                                    onClick={() => setPick(e.toKey!)}
                                  >
                                    选中目标节点
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn--ghost"
                                    onClick={() => {
                                      const [sid, scid] = e.toKey!.split('::')
                                      gmGo(sid, scid)
                                    }}
                                  >
                                    直接跳转到目标
                                  </button>
                                </div>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>跳转到场景</h3>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <select
                value={pick}
                onChange={(e) => setPick(e.target.value)}
                style={{ minWidth: 320 }}
              >
                {scenes.map((x) => (
                  <option
                    key={sceneKey(x.stageId, x.scene.id)}
                    value={sceneKey(x.stageId, x.scene.id)}
                  >
                    {x.stageId}/{x.scene.id} · {x.stageTitle}
                    {x.scene.title ? ` · ${x.scene.title}` : ''}
                    {x.scene.isEnding ? ' · [ENDING]' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  if (!selected) return
                  gmGo(selected.stageId, selected.scene.id)
                }}
              >
                跳转
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>属性</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
              {Object.entries(state.stats).map(([k, v]) => (
                <label key={k} style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{k}</span>
                  <input
                    type="number"
                    value={Number.isFinite(v) ? String(v) : '0'}
                    onChange={(e) => gmSetStats({ [k]: Number(e.target.value) } as any)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Tags / Flags</h3>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>tags（逗号分隔）</span>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onBlur={() =>
                    gmSetTags(
                      tagInput
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  value={flagKeyInput}
                  onChange={(e) => setFlagKeyInput(e.target.value)}
                  placeholder="flag key"
                  style={{ minWidth: 240 }}
                />
                <button type="button" className="btn btn--ghost" onClick={() => gmToggleFlag(flagKeyInput.trim())}>
                  切换 flag
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>
                  当前：{String(state.flags[flagKeyInput.trim()] === true)}
                </span>
              </div>
            </div>
          </div>

          {/* 旧的“当前场景详情”已合并进右侧详情面板，避免重复信息 */}
        </div>
      </div>
    </div>
  )
}

