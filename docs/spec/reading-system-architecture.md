# 自主阅读系统架构（Quest R0）

> 日期：2026-11-13
> 状态：已完成三轮设计审查，最终复核无阻塞问题；本 Quest 只形成设计，不改业务代码。
> 代码基线：`bdfc278`。
> 原则：只借鉴「长期阅读形成经历」的设计思想，在当前仓库独立设计和实现，不复制旧 QQ Agent 项目。

## 1. 现状核对与结论

### 1.1 已经存在的能力

| 能力 | 当前实现 | 阅读系统如何复用 |
|---|---|---|
| 小屋与书架热点 | `src/data/scene.ts:52-56` 有书架锚点、阅读姿态和气泡；`src/ui/scene.ts:67-80` 负责点击家具 | 保留热点、锚点和 `read` 姿态；书架点击额外打开面板 |
| 场景与物件动效 | `src/ui/scene.ts`、`src/ui/props.ts` | 不重写场景、不改美术比例 |
| 聊天面板 | `src/ui/chat.ts:55-70` 发送最近 12 条内存历史 | R3 注入少量检索到的阅读上下文；不塞入完整历史 |
| 聊天客户端 | `src/ai/client.ts:11-40` 有 20 秒超时、JSON 检查和模板兜底 | 扩展阅读请求，复用同源 Function、配置和失败降级 |
| Function | `functions/handler.ts` 目前只处理普通聊天；有输入限制、15 秒上游超时、可信主机和 Secret 读取 | R2 增加明确的操作类型，复用安全边界 |
| API 配置存储 | `src/storage/settings.ts` 仅保存 `ai-resident-settings` | 阅读存档使用独立 key，不和 API 配置混在一起 |
| 测试 | 当前 41 个 Vitest 测试覆盖场景、动效、水效、聊天、Function 和设置 | 新增纯逻辑单元测试及浏览器验收 |

### 1.2 尚未实现，不能当作现有能力

- 没有 `src/sim/`；没有 `advance`、状态数值、性格选择、自主活动事件。
- 没有游戏生活存档、离线补算、「你不在的时候」卡片或 ×1 / ×60 / ×600 控件。
- 没有书籍、阅读游标、阅读任务、笔记、长期记忆或书架面板。
- 聊天历史只存在于当前页面内存，不是持久记忆。
- Function 没有阅读分析路由、结构化输出校验或引用校验。

这些能力出现在 `docs/spec/phase1-小屋与自主生活.md` 中，但那是计划，不是代码现状。

### 1.3 关键设计决策

1. **先补生活模拟，再验收“主动阅读”。** R1 的书籍和存档可以先做，但完整自主阅读验收依赖第一阶段 Quest 1b / 1c。阅读模块不另造一套生活模拟。
2. **翻阅进度与模型分析进度使用独立游标。** `nextSegmentId / completedSegmentIds` 永久只表示生活翻阅事实；`nextAnalysisSegmentId / analyzedSegmentIds` 只表示通过校验的分析。R2 从“最早已翻阅但未分析”的片段开始补做，绝不跳过 R1 历史。
3. **本地存档不是服务器权威存档。** 当前不使用数据库；Function 不信任客户端提交的进度，只处理有长度限制的文本。进度事务在浏览器内完成，跨设备同步不在本设计中。
4. **所有阅读写入都在同一排他锁内。** 取得锁后重新读取最新存档和 revision，再校验、写入、释放锁，不能用其他标签页的过期内存覆盖新进度。
5. **生活时间和处理时间分开。** 生活模拟只用整数游戏分钟；阅读网络重试和预算使用注入的现实毫秒时间戳。两者不得互相回填或伪造。
6. **模型不可用只暂停笔记，不暂停生活。** 阅读动画、翻阅活动和 AI 分析是不同事实，界面分别表达。分析失败不回滚已经发生的翻阅，但也绝不增加分析进度。

## 2. 目标与最小边界

### 2.1 本设计要实现

- 生活模拟产生 `read` 活动意图，阅读调度器选择当前书的下一段。
- 书籍和片段顺序固定；刷新、关闭页面后从原位置继续。
- AI 分析通过结构和引用校验后，才原子提交分析进度与笔记。
- 聊天只检索已经提交分析的片段，区分原文、鸭子的观察和未知内容。
- 兴趣偏好来自多条可撤销证据，不直接改写人格。

### 2.2 最小实现范围

- 一本来源和许可明确的短篇，先按人工确定的章节和片段入库。
- 一个当前阅读任务，现实并发上限为 1。
- localStorage 单 key 阅读存档；不重复保存整本书。
- 一个 Function 入口中的显式 `operation`，不新增服务或框架。
- 简单关键词检索，不引入向量数据库。

### 2.3 明确不做

EPUB 解析、任意文件上传、用户自行导入付费书籍、多设备同步、服务器权威阅读进度、向量数据库、知识图谱、多角色共享记忆、自动重写人格、模型生成或补写书籍正文。

## 3. 模块图

```mermaid
flowchart LR
  Sim[src/sim\n生活模拟] -->|read 活动意图| Scheduler[src/reading/scheduler.ts\n阅读调度]
  Scene[src/ui/scene.ts\n场景] -->|书架点击| Shelf[src/ui/bookshelf.ts\n书架面板]
  Shelf -->|选择当前书 / 同意发送| Scheduler
  Library[src/reading/library.ts\n书籍清单与定位] --> Scheduler
  Scheduler <-->|读写的只是进度、任务和笔记| Store[src/reading/storage.ts\n版本化存档]
  Scheduler -->|当前片段 + 少量已提交上下文| Processor[src/reading/processor.ts\n请求与校验]
  Library -->|原文用于核对引用| Processor
  Processor -->|analyze_segment| Function[functions/handler.ts\nQoder Sites Function]
  Function -->|固定可信主机，Key 来自 Secret| LLM[DeepSeek / Qwen]
  Scheduler -->|committed 后产生笔记| Memory[src/reading/memory.ts\n检索与兴趣证据]
  Library -->|仅已分析片段原文| Memory
  Memory -->|有限阅读上下文| Chat[src/ai/client.ts + src/ui/chat.ts]
  Chat -->|chat + readingContext| Function
  Scheduler -->|进度与状态| Shelf
  Sim -->|当前活动| Scene
```

依赖方向必须保持：`sim` 不访问阅读模块、DOM、存储或网络；`reading` 不反向修改生活数值；UI 只编排调用，不自行推进游标。

## 4. 模块职责与接口

### 4.1 Life Simulation：沿用第一阶段 Spec

计划位置：`src/sim/`。

```ts
interface ReadingIntent {
  intentId: string;       // 由 saveId + activityId 确定生成
  saveId: string;
  activityId: string;
  startedAtMinute: number;
  endedAtMinute: number;
  kind: 'read';
}
```

- `advance` 仍只接收状态、目标分钟和可设种子 RNG。
- 活动开始事件只更新场景姿态；**活动完整结束事件**才生成 `ReadingIntent`，并提交一次确定性翻阅事实。
- `activityId` 和起止分钟来自生活事件；取消的活动没有结束事件，也不能产生阅读任务。
- 模拟可以表达“这段时间在看书”，不能表达“模型已经生成笔记”。
- 离线补算可以提交所有完整活动的翻阅事实，但多次阅读活动只合并为一个待分析意图，不逐个补发模型请求。

### 4.2 Book Library：`src/reading/library.ts`

静态正文放在 `src/data/books/`，符合项目现有 `data` 目录职责；`library.ts` 只提供查询和定位。

```ts
interface BookSegment {
  segmentId: string;
  chapterId: string;
  chapterTitle: string;
  order: number;
  text: string;
}

interface Book {
  bookId: string;
  contentVersion: string;
  contentHash: string; // sha256:...
  title: string;
  author: string;
  source: string;
  license: string;
  chapters: { chapterId: string; title: string; segments: BookSegment[] }[];
}

function listBooks(): readonly Book[];
function getBook(bookId: string): Book | null;
function getSegment(book: Book, segmentId: string): BookSegment | null;
function nextSegment(book: Book, segmentId: string | null): BookSegment | null;
function flattenBook(book: Book): readonly BookSegment[];
```

约束：

- 片段由作者人工确定顺序并写进数据，不在启动时随机切分。
- `segmentId` 在书内稳定且唯一，例如 `ch01-s02`；定位还必须同时匹配 `bookId + contentVersion + contentHash`。
- 哈希输入统一为 NFC、LF 换行的章节正文拼接；测试重新计算哈希，防止改正文却忘记升版本。
- 更新正文必须提升 `contentVersion` 并更新哈希。旧存档进入 `version_mismatch`，不沿用旧片段号。
- R1 所选短篇必须记录来源和许可；不使用未经许可的现代译文。

### 4.3 Reading Scheduler：`src/reading/scheduler.ts`

```ts
interface ReadingScheduler {
  request(intent: ReadingIntent): Promise<ScheduleResult>;
  drain(nowMs: number): Promise<CommitResult>;
  cancel(taskId: string): Promise<void>;
  recover(nowMs: number): Promise<void>;
}
```

- `request` 只创建或复用待处理意图，不等于完成分析。
- `drain` 每次最多处理一个片段；现实并发固定为 1。
- 同一页面用单个 Promise 串行；R1/R2 的所有读取—校验—写入都使用 Web Locks 的 `ai-resident-reading:${saveId}` 锁。
- R1 只在翻阅写入时持锁；R2 的执行锁覆盖整个 `drain`，包括 fetch、校验和最终写入。`recover` 也必须先取得同一把锁，因此新标签不会把仍在执行的旧标签误判为中断。页面关闭会释放锁，之后的标签才能恢复任务。
- 不支持 Web Locks 时只允许查看书籍，禁止自主翻阅写入和 AI 阅读，并给出温柔提示；不能假设“用户大概只有一个标签页”。
- 翻阅选择顺序：当前书 → `nextSegmentId`。R2 分析选择顺序：`completedSegmentIds` 中最早不在 `analyzedSegmentIds` 的片段，即优先 backfill，再分析新翻阅片段。
- 每个翻阅段的活动证明来自 `activityBySegmentId`；即使没有 pendingIntent，drain 也能构造完整 backfill 任务。pendingIntent 只是唤醒提示，任务入队时清除，后续新活动可重新写入。
- 分析对象必须已经翻阅，未翻阅章节不能进入模型。
- 每次 `drain` 最多提交一个分析片段；恢复页面后的首次 `drain` 也最多一个。
- 调度器是唯一允许调用提交事务的模块，UI、聊天和场景不能修改任何游标。

### 4.4 Reading Processor：`src/reading/processor.ts`

```ts
interface AnalyzeSegmentInput {
  book: Book;
  segment: BookSegment;
  previous?: { summary: string; excerpt: string };
  config: AiConfig;
}

interface AnalysisQuote {
  quoteId: string;
  text: string;
}

interface SegmentAnalysis {
  summary: string;
  facts: { text: string; quoteIds: string[] }[];
  observations: {
    text: string;
    quoteIds: string[];
    topics: InterestTopic[];
    attitude: 'positive' | 'mixed' | 'negative';
  }[];
  questions: string[];
  quotes: AnalysisQuote[];
}

function validateAnalysis(
  raw: unknown,
  segment: BookSegment,
): { ok: true; value: SegmentAnalysis } | { ok: false; reason: string };
```

- 请求只含当前片段，以及前一个**已提交**片段的短概括和少量原文尾部。
- 前文上下文最多一段；不能把整章或完整历史发送给模型。
- 模型只返回声明的结构，不生成正文、不决定游标、不修改生活数值。
- `facts` 和 `observations` 的 `quoteIds` 必须存在；每条事实笔记和观察至少对应一条当前片段引用。
- 引用必须在当前 `segment.text` 中逐字出现。程序用 `indexOf` 生成定位，不接受模型提供的偏移量。
- 只有逐字 quote 可以称为原文；`facts[].text` 是“模型整理的事实笔记”，引用只能支持核对，不能证明释义绝对正确。
- 概括仍属于模型生成内容，不能因为它通过结构校验就宣称语义绝对正确。
- 校验失败、请求失败、超时或取消时返回失败结果，不调用提交事务。

### 4.5 Reading Storage：`src/reading/storage.ts`

```ts
function loadReadingSave(): LoadReadingSaveResult;
function saveReadingSave(candidate: ReadingSaveV1): void;
function commitValidatedSegment(
  current: ReadingSaveV1,
  task: ReadingTask,
  analysis: SegmentAnalysis,
  book: Book,
  processedAtMs: number,
): ReadingSaveV1;
```

- 所有写入都先取得排他锁并重新加载最新存档；提交函数检查 `revision`、任务 ID、generation、版本、哈希、游标和重复片段，再返回完整候选存档。
- 先处理相同 `lastCommittedAnalysisTaskId` 的幂等返回，再拒绝其他游标不匹配任务，避免重复响应被误判或重复写入。
- 构造 `revision = 最新 revision + 1` 的候选存档；`localStorage.setItem` 成功后才替换内存，配额失败时旧进度不变。
- 进度、笔记、完成任务 ID、预算和 revision 在同一个 key 的一次 `JSON.stringify` 中提交，避免多 key 半提交。
- 未知存档版本或损坏数据不直接覆盖原值；界面暂停并提供显式重置。
- 不保存整本书，不保存 API Key，不把用户聊天内容混入阅读笔记。

### 4.6 Reading Memory：`src/reading/memory.ts`

```ts
interface ReadingContext {
  status: 'ok' | 'no_match' | 'not_analyzed' | 'version_mismatch';
  segments: { bookId: string; segmentId: string; excerpt: string; quotes: VerifiedQuote[] }[];
  observations: SegmentNote['observations'];
}

interface ReadingPreference {
  topic: InterestTopic;
  score: number;
  status: 'tentative';
  evidenceIds: string[];
}

function retrieveReadingContext(
  save: ReadingSaveV1,
  query: string,
  library: Library,
): ReadingContext;

function derivePreferences(
  evidence: readonly PreferenceEvidence[],
): ReadingPreference[];
```

- 原文事实、个人观察和兴趣证据使用不同类型，不能合并成一段无来源文本。
- 检索入口只读取 `analyzedSegmentIds` 对应的笔记和原文。
- 按标题、作者、事实、引用、概括和观察做确定性关键词评分；同分时按书籍阅读顺序取先读内容。
- 每次聊天最多两个片段、三条观察，阅读上下文总长度设置硬上限。
- 未命中时返回空上下文和“未读/未整理”原因，不能让模型自行补全未读情节。
- 偏好只从观察中的受控主题和态度生成，不从原文事实或用户话语生成。

### 4.7 Chat / Visual Integration

- `src/ai/client.ts` 增加阅读分析请求，聊天请求增加可选 `readingContext`。
- `functions/handler.ts` 用 `operation: 'chat' | 'analyze_segment'` 分流；普通聊天保持原有行为。
- `src/ui/chat.ts` 只负责展示；检索在发送前完成。
- `src/ui/bookshelf.ts` 展示当前书、章节、翻阅进度、分析进度、最近笔记、失败/暂停状态和正文外发同意。
- 书架点击保留现有 `read` 姿态与气泡，并额外打开面板；自主阅读活动由生活模拟驱动同一姿态。
- 不使用 `innerHTML` 渲染模型文本或书籍笔记，沿用 `textContent`。

## 5. 阅读存档格式

建议 key：`ai-resident-reading`。版本独立于生活存档和 API 设置。

```ts
interface ReadingSaveV1 {
  version: 1;
  revision: number;
  saveId: string;
  currentBookId: string | null;
  books: Record<string, BookProgress>;
  activeTask: ReadingTask | null; // 仅分析任务；翻阅不使用此字段
  lastCommittedAnalysisTaskId: string | null;
  pendingIntent: ReadingIntent | null; // 仅唤醒提示，不是 backfill 的数据来源
  consent: { providerHost: string; acceptedAtMs: number } | null;
  budget: { windowStartedAtMs: number; used: number };
  preferenceEvidence: PreferenceEvidence[];
}

interface BookProgress {
  bookId: string;
  contentVersion: string;
  contentHash: string;
  nextSegmentId: string | null;         // 永久只表示下一段待翻阅
  completedSegmentIds: string[];        // 永久只表示完整活动的翻阅顺序
  processedActivityIds: string[];       // 翻阅幂等键，跨活动、跨重启去重
  activityBySegmentId: Record<string, {
    activityId: string;
    startedAtMinute: number;
    endedAtMinute: number;
  }>;
  nextAnalysisSegmentId: string | null; // 下一段待分析，R1 初始为首个片段
  analyzedSegmentIds: string[];         // R2 起，只有通过校验的子集
  notes: SegmentNote[];
  status: 'idle' | 'reading' | 'paused' | 'completed' | 'version_mismatch';
}

interface ReadingTask {
  taskId: string;                      // analysis:书籍版本 + 片段；绝不与翻阅事件共用幂等键
  bookId: string;
  contentVersion: string;
  contentHash: string;
  segmentId: string;
  state: 'idle' | 'queued' | 'reading' | 'validating' | 'committed' | 'paused' | 'failed';
  pausedReason?: 'cancelled' | 'consent_required' | 'budget_exhausted' | 'version_mismatch' | 'unsupported_lock';
  generation: number;                // 取消、恢复、重试时递增，提交必须同时匹配
  attempt: number;                   // 已预留预算的上游请求次数
  nextAttemptAtMs: number;
  intentId: string;
  activityId: string;
  startedAtMinute: number;
  endedAtMinute: number;
}

interface VerifiedQuote extends AnalysisQuote {
  start: number;
  end: number;
}

interface SegmentNote extends SegmentAnalysis {
  noteId: string;
  bookId: string;
  contentVersion: string;
  segmentId: string;
  chapterId: string;
  quotes: (AnalysisQuote & { start: number; end: number })[];
  activityId: string;
  startedAtMinute: number;
  endedAtMinute: number;
  processedAtMs: number;
}

interface PreferenceEvidence {
  evidenceId: string;
  noteId: string;
  bookId: string;
  segmentId: string;
  quoteIds: string[];
  topic: InterestTopic;
  attitude: 'positive' | 'mixed' | 'negative';
  revoked: boolean;
}

type InterestTopic = 'nature' | 'friendship' | 'adventure' | 'reflection' | 'humor';
```

最小示例：

```json
{
  "version": 1,
  "revision": 4,
  "saveId": "local-life",
  "currentBookId": "example-short",
  "books": {
    "example-short": {
      "bookId": "example-short",
      "contentVersion": "1",
      "contentHash": "sha256:...",
      "nextSegmentId": "ch01-s03",
      "completedSegmentIds": ["ch01-s01", "ch01-s02"],
      "processedActivityIds": ["activity-001", "activity-002"],
      "activityBySegmentId": {
        "ch01-s01": { "activityId": "activity-001", "startedAtMinute": 100, "endedAtMinute": 140 },
        "ch01-s02": { "activityId": "activity-002", "startedAtMinute": 200, "endedAtMinute": 250 }
      },
      "nextAnalysisSegmentId": "ch01-s02",
      "analyzedSegmentIds": ["ch01-s01"],
      "notes": [],
      "status": "reading"
    }
  },
  "activeTask": null,
  "lastCommittedAnalysisTaskId": "analysis:example-short:1:ch01-s01",
  "pendingIntent": null,
  "consent": null,
  "budget": { "windowStartedAtMs": 0, "used": 0 },
  "preferenceEvidence": []
}
```

示例表达：两段已经翻阅，只有第一段完成过 AI 分析；聊天不能把第二段当作已经理解和整理过的内容。

## 6. 状态机与提交不变量

翻阅事实由完整生活活动独立提交，不经过模型。下面描述的是**分析任务**状态机；`activeTask: null` 就是 idle，`committed` 是提交结果而不是需要长期保存的活动状态。

```text
idle
  └─ request / drain → queued
 queued
  └─ 取得执行锁、预算和正文外发同意 → reading
 reading
  └─ 收到响应 → validating
 validating
  └─ 结构、引用、版本、游标全部通过 → committed
 committed
  └─ 原子写入笔记和进度，清除 activeTask → idle

queued / reading / validating：用户取消 → paused
reading / validating：可重试失败 → queued（按退避等待）；达到上限 → failed
paused / failed：用户明确重试或暂停条件解除 → queued（递增 generation）
页面恢复：仅 reading / validating → queued（同一片段重新等待处理）
```

必须始终保持：

1. 翻阅以 `processedActivityIds` 做跨活动、跨重启幂等，不使用分析 taskId；重复旧 activityId 不会绑定到新的下一段。
2. `queued`、`reading`、`validating` 都不会改变 `nextAnalysisSegmentId`。
3. 只有 `committed` 更新分析游标、分析 ID、笔记和 `lastCommittedAnalysisTaskId`；它不修改翻阅游标和翻阅事实。
4. `task.segmentId === progress.nextAnalysisSegmentId`，且该片段已经翻阅、尚未分析，否则提交被拒绝。
5. 提交先检查 `lastCommittedAnalysisTaskId`：相同分析任务直接返回既有结果，不重复写笔记、不推进游标；随后才检查其他游标不匹配。
6. 每次取消、恢复或重试都递增 `generation`；提交必须同时匹配 taskId 和 generation，旧响应不能冒充新任务。
7. 取消后旧 generation 失效；晚到响应不能提交。达到失败上限进入 failed，用户取消等非网络原因进入 paused 并记录 `pausedReason`。
8. 书籍版本或哈希不匹配时只能暂停，不能自动映射到新版本片段。
9. R1 升级后，从 `completedSegmentIds` 中最早未分析片段开始 backfill；活动证明来自 `activityBySegmentId`，未翻阅片段不能分析或进入聊天上下文。
10. 所有写入都在锁内重新加载最新 revision；过期内存不能覆盖其他标签的新进度。

## 7. 事件流

### 7.1 正常在线阅读

1. `advance` 返回阅读活动开始事件，场景显示阅读姿态，但不创建分析任务。
2. 活动完整结束事件携带 activityId 和起止分钟；编排层在锁内先查 `processedActivityIds`，未消费过才提交翻阅段、活动证明和 activityId，再生成 `ReadingIntent`。晚到的旧活动不会绑定到当前下一段；取消的活动没有这一步。
3. 调度器合并重复意图，选择最早已翻阅但未分析的片段；检查同意、书籍版本和现实预算后写入 `queued`。
4. fetch 前在锁内重新读取存档，递增 generation、预留一次上游尝试预算并写入 `reading`；失败和超时不返还额度。
5. 模型只收到当前片段和少量已提交前文；收到结构化结果后进入 `validating`，程序检查结构、长度、引用和定位。
6. 调度器在锁内再次读取最新 revision，检查 taskId、generation 和分析游标，调用提交事务。
7. localStorage 写入成功后返回 `committed`，清除活动任务并回到 `idle`；翻阅游标不被模型提交修改。
8. 书架展示新笔记；之后的聊天才能检索这一段。

### 7.2 页面关闭或响应丢失

- `pagehide` 不等待新的模型请求，也不把活动任务标成完成。
- 上游可能已经产生一次调用，但浏览器没有提交结果；恢复后同一片段仍为待处理。
- 恢复方取得执行锁后，只把被中断的 `reading / validating` 转为 `queued` 并递增 generation；原本 queued 的任务保持 queued。`paused / failed` 不会因刷新自动恢复，必须等用户明确重试或对应暂停条件解除。
- 重试可能增加一次上游费用，但不会伪造分析进度或重复写笔记；已预留的失败尝试额度不返还。

### 7.3 离线与快进

- 离线 `advance` 只补算生活事件和翻阅活动，不更新 `analyzedSegmentIds`、笔记或偏好。
- 多个离线阅读意图折叠为一个 `pendingIntent`，不建立无限队列。
- ×1 / ×60 / ×600 只改变生活时间；模型预算按现实时间计算。
- 恢复后先执行一个片段，后续是否继续由下一次显式 `drain` 和现实预算决定。

## 8. 模型安全、同意与预算

### 8.1 正文外发同意

- R1 不发送正文，不需要模型同意。
- 首次 AI 阅读前，书架面板明确说明：会把当前片段和少量已读上下文发送给当前服务商，用于生成笔记。
- 默认不同意；用户主动确认后才调度。
- 同意记录绑定 `providerHost`。更换服务商主机后必须重新确认。
- 未同意时生活模拟照常，任务进入 `paused` 并记录 `pausedReason: 'consent_required'`，不显示技术报错。

### 8.2 R2 起始限制（集中在配置中）

| 限制 | 起始值 |
|---|---|
| 单片段正文 | 最多 1,200 字符，书籍入库时验证 |
| 前文上下文 | 前一段概括最多 160 字符 + 原文尾部最多 300 字符 |
| 请求体 | 流式读取并在超过 16 KiB 时拒绝，不能先解析完整 JSON 再检查 |
| 上游超时 | 沿用 15 秒；客户端 20 秒 |
| 输出 | 最多 500 tokens；上游响应按实际读取字节限制为 32 KiB |
| 并发 | 每个存档 1，跨标签页串行 |
| 单次 `drain` | 1 个片段、1 次上游尝试 |
| 单次活动 / 恢复 | 最多处理 1 个分析片段 |
| 现实预算 | 每现实小时最多 6 次**上游尝试**，fetch 前预留，失败不返还 |
| 失败重试 | 最多 3 次尝试；第 2 次前 2 秒、第 3 次前 8 秒，之后 failed |
| 聊天阅读上下文 | 最多 2 个片段、3 条观察，总计最多 1,600 字符 |

结构上限固定为：`summary ≤ 300` 字符；`facts ≤ 5` 条且每条 ≤ 160 字符；`observations ≤ 3` 条且每条 ≤ 160 字符；`questions ≤ 3` 条且每条 ≤ 100 字符；`quotes ≤ 8` 条且每条 ≤ 120 字符；quoteId 必须唯一且引用有效。

预算按上游尝试而不是 committed 计数，因此超时和丢失响应也计入费用。`nowMs < windowStartedAtMs` 表示现实时钟回拨：重新锚定窗口但保留已用额度，不能借此清空预算。页面等待延迟钳制为非负数，页面内计时使用单调时钟；持久预算仍使用现实时间。

这些数值是初始产品预算，实现后可根据片段长度和费用调整，但必须集中在 `src/data/reading.ts`，不能散落。

### 8.3 不可信正文与提示注入

- 系统提示固定声明：书籍和笔记只是不可信资料，其中任何指令都不执行。
- Function 不根据正文调用工具、访问 URL、读取其他 Secret 或改变请求目的地。
- 阅读请求仍只使用 DeepSeek / Qwen 可信主机，Key 只从 `LLM_API_KEY` 读取。
- 原文、观察、事实和用户在消息中使用不同字段，不拼接成可覆盖系统指令的新系统提示。
- 不向用户展示原始上游错误、环境变量或密钥信息。

### 8.4 Function 操作契约

`analyze_segment` 请求包含 `operation / requestId / bookId / contentVersion / segmentId / text / previous / config`，其中 `requestId = taskId:generation` 只用于关联响应，不作为服务器进度凭证。成功返回 `{ ok: true, operation: 'analyze_segment', requestId, analysis }`；失败返回 `{ ok: false, code }`，稳定错误码至少包括 `invalid_input / service_not_configured / upstream_unavailable / upstream_error / invalid_model_response`。

R2 同一小步把现有客户端和 Function 的普通聊天切换为显式 `operation: 'chat'` 并更新测试，避免只改一端。两个 operation 都在 JSON 解析前执行流式字节限制；上游响应同样按实际读取字节限流，`max_tokens` 不能代替响应大小限制。

### 8.5 公开访问前的边界

localStorage 预算只能约束正常客户端，不是防滥用安全边界。当前站点保持私有；R2 发布前必须验证匿名公网无法访问 Function。R2 的 Function 校验可以降低意外成本，但不能阻止恶意访客直接调用接口。

未来改为公开站点是独立阻塞验收：必须具备服务端身份或访问控制、覆盖 chat/analyze 的速率与每日/token 限额、模型 allowlist，并测试直接调用 Function 绕过 localStorage 的路径。不能把 R2 标记为已具备公开防刷能力。

## 9. 阅读记忆与聊天规则

### 9.1 三类信息

| 类型 | 来源 | 可以怎样说 | 不可以怎样说 |
|---|---|---|---|
| 原文事实 | 已分析片段的逐字 quote；`facts.text` 只是附引用的模型事实笔记 | quote 可说“原文写了……”；facts 可说“我的笔记里整理的是……” | 把模型释义或概括当成原文逐字内容 |
| 个人观察 | 当时提交的观察笔记 | “我当时觉得……，这只是我的理解” | 把虚构情节说成鸭子现实经历 |
| 长期偏好 | 多条未撤销观察证据 | “最近几段读下来，我好像更喜欢……” | 一次阅读后永久改变人格 |

### 9.2 检索顺序

1. 精确匹配已读书名和作者。
2. 在已提交事实、引用、概括和观察中做关键词评分。
3. 用户只说“那本书/那个故事”时，取最近提交且有笔记的片段。
4. 取最多两个片段的原文节选及对应观察，连同未知边界一起发送。
5. 没有命中时返回空上下文，并显式携带 `status: 'no_match' | 'not_analyzed' | 'version_mismatch'`；兜底话术只能说“还没读到/还没整理好”，不得编造。
6. 书籍相关问题不携带旧的 assistant 阅读回答历史，只发送当前问题和本次核验后的阅读上下文，避免一次误答在历史里变成“已知事实”。
7. 书籍相关请求失败时使用由上述 status 决定的阅读专用兜底，不能退回可能暗示已读的通用话术。

### 9.3 偏好形成

- R2 的观察只使用固定主题 `nature / friendship / adventure / reflection / humor` 和三类态度。
- R3 将每条观察转为带来源的兴趣证据；不需要额外模型调用。
- 至少三条未撤销证据、覆盖至少两个不同章节，且同方向分数达到阈值时，才形成“暂时偏好”。
- 偏好是证据的派生结果，不写死到性格字段；撤销证据后重新计算。
- 证据可追溯到 `noteId + segmentId + quoteIds`，可在后续界面中查看或撤销。

## 10. 风险清单

| 风险 | 设计对策 | 剩余边界 |
|---|---|---|
| 把第一阶段 Spec 当成现有模拟 | 实施顺序先补 1b / 1c；完整验收必须产生真实模拟事件 | R1 的书籍/存档可先做，但不能提前宣称自主阅读完成 |
| R1 翻阅被当成 R2 已分析或被跳过 | 翻阅/分析双游标；最早已翻阅未分析片段优先 backfill；聊天只认 analyzed | 旧翻阅内容可显示“翻过但未整理” |
| 失败或重复响应推进游标 | 稳定 taskId + generation、幂等检查顺序、分析游标条件、单 key 原子提交 | 丢失响应仍可能重复产生上游费用 |
| 多标签页重复执行或覆盖 | 写入锁内重读 revision；执行锁覆盖整个上游尝试；recover 同锁 + 单 Promise | 不支持锁的浏览器只允许查看，禁止自主写入 |
| 页面关闭造成半提交 | 仅 reading / validating 恢复为 queued；paused / failed 不自动复活；先存候选再换内存 | 不假装恢复丢失的模型结果 |
| 引用伪造或错定位 | 当前片段逐字匹配，程序计算偏移 | 概括和观察仍可能有语义误判 |
| 正文提示注入 | 固定系统边界、无工具、无动态 URL、结构校验 | 模型仍可能生成不合格文本，失败即暂停 |
| 快进/离线造成费用风暴 | 合并意图、单段 drain、按上游尝试预留现实预算、失败不返还、并发 1 | 公开防刷需要服务端另行控制 |
| 书籍更新后错位 | version + hash 双重匹配，暂停而非猜测 | 暂不做跨版本笔记迁移 |
| localStorage 损坏或配额不足 | 校验、保留旧值、显式重置、提交失败不换内存 | 本地存档清浏览器数据后无法恢复 |
| 聊天编造未读内容 | 只检索 analyzed、限制上下文、无命中明确未知 | 生成式回答仍需真实样例验收 |
| 范围超过 30 小时项目预算 | 一本书、简单检索、无向量库、无 EPUB、无同步 | 新需求另开 Quest，不塞进 R1-R3 |

## 11. 推荐实施顺序

1. **R0：本架构与分阶段 Spec审查。** 不改业务代码。
2. **前置：完成第一阶段 Quest 1b / 1c。** 书籍、library 和存储可与此前置并行准备，但不得伪造自主活动。
3. **R1：真实书籍与断点。** 不接 LLM，先打通顺序、存档、恢复和书架。
4. **R2：模型阅读与笔记。** 先写校验和提交测试，再接 Function；每次只上一个可运行小目标。
5. **R3：阅读记忆与聊天。** 先做检索和未知边界，再加可撤销兴趣证据。

详细任务、测试和完成标准见 `docs/spec/reading-system-quests.md`。
