# 当前世界树（v2.6.0，草稿）

> 本文是从 `content/story.json`（`meta.version: 2.6.0`）抽象出的**世界树视图**，用于讨论“增加广度、不增加深度”的分支设计。  
> 事件细节与条件表仍以 [`EVENT_BRANCHES.draft.md`](EVENT_BRANCHES.draft.md) §11 为准。

---

## 1. 全量结构（主干 + 散叶）

```mermaid
flowchart TB
  %% 学业与高考
  subgraph School["学业 → 高考（分流起点）"]
    E01["birth_hello"] --> E03["pri_school"] --> E04["ms_fork"]
    E04 --> E06["high_night"] --> GK["gk_gate"]
  end

  GK -->|艺考成功| UA["uni_art_y1 (art_admit)"]
  GK -->|回主路| GB["gk_before (gaokao_main)"]
  GB --> RL["gk_rl"]
  GB --> RM["gk_rm"]
  GB --> RH["gk_rh"]
  RL -->|专科分支| JC1["juniorCollege jc_y1"] --> JCg["jc_grad"]

  %% 大学：广度主要发生在 P01/P02
  subgraph Uni["大学枢纽（P01/P02）"]
    U1["uni_y1"] -->|u_intern| IC["P02 uni_intern_crunch"]
    U1 -->|u_club/u_gpa| MF["P01 uni_major_fork"]
    IC --> MF
    UA --> MF
    RL --> U1
    RM --> U1
    RH --> U1
    MF --> Ug["uni_grad"]
  end

  %% 毕业：P03
  Ug -->|u_work/u_public| OC["P03 offer_compare"]
  Ug -->|u_phd| PhD["phd_path"] --> OC
  JCg -->|jc_work| J0["job_pick"]
  OC --> J0

  %% 职场：work_y3 + P04
  J0 --> Wy["work_y3"]
  Wy -->|w_layoff| LO["P04 work_layoff"] --> Cs["career_split"]
  Wy -->|w_climb/w_balance/w_burn| Cs
  Wy -->|w_quit_city| Rm["romance_start"]
  Cs --> Rm

  %% 婚恋/家庭：P05
  Rm --> Bd["bond_pair"] --> Mr["marry_scene"] --> HB["P05 housing_buy"] --> Kd["kids_scene"]

  %% 中年：P06–P09 的“多分叉但不加深度”的扩展
  Kd --> Mf["midlife_fork"]
  Mf --> PI["P06 parent_illness"]
  PI --> CS2["caregiving_strain"]
  PI --> SV2["caregiving_service"]
  PI --> CB2["caregiving_boundary"]
  CS2 --> EN["P07 empty_nest"]
  SV2 --> EN
  CB2 --> EN
  EN --> RT["P08 retire_hang"] --> CR["P09 community_role"] --> Ec["elder_care"]

  %% 老年结局入口：按 tag/flag/stat 横向展开
  Ec --> Endings["ending: end_elder_* (18)"]
```

---

## 2. “增加广度”的高考后世界线（不增加深度）

这张图只画 **高考后** 的枢纽层（大学/毕业/职场/家庭/中年/老年），每层横向展开世界线，但层级数不变。

```mermaid
flowchart LR
  GK["高考后入口"] --> U["大学枢纽"]
  U --> G["毕业枢纽"]
  G --> W["职场枢纽"]
  W --> F["家庭枢纽"]
  F --> M["中年枢纽"]
  M --> E["老年枢纽/结局入口"]

  GK --- A["艺考线: art_admit/艺术院校"]
  GK --- JC["专科线: 专科路径/专升本"]
  GK --- S["常规线: gk_tier/学业积淀"]

  U --- MA["专业线: 理工/商科/人文/作品集驱动"]
  G --- OF["offer线: 平台/匹配/现金流"]
  W --- WK["职场线: 晋升/降速/裁员转向/换城"]
  F --- HM["家庭线: 住房(房贷/租房/回家) + 生育/丁克/不婚"]
  M --- MID["中年线: 照护/康复/隔代照护/传帮带/社群"]
  E --- END["老年结局入口: caregiver/mortgage/rehab/legacy/..."]
```

---

## 3. 独特世界线（开始条件 / 合并点 / 结束状态）

- **艺术院校世界线**
  - **开始条件**：`flag art_admit = true`（`gk_gate` → `art_exam` 成功）
  - **合并点**：可在 `uni_grad`/`offer_compare` 合并回主线
  - **结束状态**：若保持差分，可更容易走向作品/legacy 类老年入口（如 `elder_cap_legacy`）

- **专科 → 专升本世界线**
  - **开始条件**：`tag 专科路径`（`gk_rl/from_rl_jc`）
  - **合并点**：`jc_upgrade` → `university/uni_y1`；或 `jc_work` → `offer_compare/job_pick`
  - **结束状态**：可与常规线高度合并，但在 `tags` 上保留“技能线/专升本”等差分点

- **照护 / 康复世界线**
  - **开始条件**：`tag 照护者`（照护优先）或 `tag 康复计划`（资源照护/健康优先）
  - **合并点**：仍会汇入 `elder_care`
  - **结束状态**：可直达更专属的老年结局入口：`end_elder_caregiver` / `end_elder_rehab`

- **房贷压力世界线**
  - **开始条件**：`tag 房贷`（`housing_buy/hb_buy`）
  - **合并点**：仍会汇入 `elder_care`
  - **结束状态**：若晚年 `wealth` 偏低，可走 `end_elder_mortgage`

---

*该文档用于视觉化讨论；若与运行时不一致，以 `content/story.json` 与 `npm run validate:story` 通过为准。*

