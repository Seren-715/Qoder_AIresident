# 自主阅读系统分阶段 Spec（R0–R3）

> 日期：2026-11-13
> 配套架构：`docs/spec/reading-system-architecture.md`。
> 总原则：小步实现、先测不变量、每个 Quest 保持构建和测试通过；不复制旧项目，不修改 `docs/00-计划与需求草案.md`。

## 0. 实施顺序与依赖

```text
R0 架构审查
  → 第一阶段 Quest 1b / 1c（自主生活、生活存档、离线补算、快进）
  → R1 真实书籍与断点
  → R2 模型阅读与笔记
  → R3 阅读记忆与聊天
```

- R1 的书籍数据、library 和阅读存档可以在生活模拟完成前先行，但“主动选择阅读”的完整验收必须使用真实 `advance` 事件。
- 不在 `src/reading/` 中重新实现饥饿、体力、心情、性格、离线补算或快进。
- 如果第一阶段排期需要调整，应单独安排前置 Quest，不用临时定时器冒充自主生活。

## Quest R0：架构设计

### 范围

- 核对当前 `src/`、`functions/`、`tests/` 与第一阶段 Spec 的差距。
- 交付模块图、接口、数据结构、存档格式、事件流、状态机、风险和最小范围。
- 明确翻阅进度与模型分析进度的区别。

### 交付物

- `docs/spec/reading-system-architecture.md`
- `docs/spec/reading-system-quests.md`

### 验收

- [x] 不把尚未实现的 `sim`、生活存档、快进和离线补算写成现状。
- [x] 每个新增模块都有明确职责和依赖方向。
- [x] 只有 committed 能推进模型分析进度。
- [x] R1 未接模型的记录不会被 R3 当成已分析内容。
- [x] 不引入新框架、数据库、向量库或 EPUB 解析器。
- [x] 本次没有业务代码改动。

---

## Quest R1：真实书籍与断点（不接 LLM）

### 目标

建立一本真实短篇的顺序阅读、确定性翻阅提交、进度持久化、关闭后恢复和书架面板。此阶段的“读过”只表示生活模拟完成了一段翻阅，不表示模型生成过理解或笔记。

### 前置

- 完整自主阅读验收前完成第一阶段 Quest 1b / 1c。
- 选定一篇来源和许可明确的短篇；记录作者、来源、许可和版本。

### 新增或调整的文件

```text
src/data/reading.ts                 阅读限制与初始配置
src/data/books/<short-book>.ts      人工分段的内置正文与来源信息
src/reading/library.ts             书籍查询、稳定定位、顺序与哈希检查
src/reading/scheduler.ts           翻阅意图、单任务状态机和确定性提交
src/reading/storage.ts             ReadingSaveV1 读写与提交事务
src/ui/bookshelf.ts                书架面板
src/ui/scene.ts                    书架点击时保留姿态并打开面板
src/sim/                           只接入已有 read 活动事件，不在这里实现阅读
tests/reading-*.test.ts
```

### 实施步骤

1. **书籍入库**
   - 一本短篇即可；按章节人工分段，每段不超过 1,200 字符。
   - 固定 `bookId / contentVersion / contentHash / segmentId / order`。
   - 测试哈希与正文一致，片段 ID 唯一，顺序固定。

2. **存档与纯提交逻辑**
   - 建立 `ReadingSaveV1`、`BookProgress` 和 `ReadingTask`。
   - R1 提交只推进翻阅字段 `nextSegmentId` 与 `completedSegmentIds`；`nextAnalysisSegmentId` 初始化为首个片段，`analyzedSegmentIds` 保持为空。
   - 提交前验证书籍版本、哈希、翻阅游标、完整活动的 activityId 和起止分钟；用 `processedActivityIds` 跨活动、跨重启去重，并把活动证明写入 `activityBySegmentId`。
   - 翻阅活动与分析任务使用不同幂等键；R1 不写 `activeTask` 或 `lastCommittedAnalysisTaskId`。
   - 所有读取—校验—写入都在 Web Locks 内完成；取得锁后重读最新 revision，禁止过期内存覆盖。
   - localStorage 写成功后才替换内存并递增 revision；失败保留旧进度。

3. **生活意图接入**
   - `advance` 的阅读活动开始只显示姿态，不产生阅读任务。
   - 活动完整结束事件才生成带 activityId 和起止分钟的意图，并由调度器提交当前翻阅段；中途取消或关闭不提交。
   - 同一 activityId 的重复结束事件直接被 `processedActivityIds` 忽略；即使旧活动晚于新活动到达，也不能绑定到当前下一段。
   - 离线完整活动可以逐条更新翻阅事实，但只合并一个分析意图，不能生成笔记、分析 ID 或偏好。

4. **书架面板**
   - 显示书名、作者、当前章节、翻阅进度和当前状态。
   - 笔记区显示“还没有整理笔记”，不生成假笔记。
   - 版本不匹配时暂停并说明“这本书的内容更新了，先停在上次的位置”。
   - 损坏或未知存档不白屏、不静默覆盖；显式重置需要二次确认。
   - 模型文本在 R1 不存在；书籍标题和笔记展示统一使用 `textContent`。

### 测试与验收

- [ ] 相同存档、相同活动时间和相同 RNG 得到完全相同的翻阅结果。
- [ ] 活动未结束、用户取消、页面中途关闭都不增加翻阅游标。
- [ ] 重复 activityId 不重复推进；活动 A、B 完成后晚到的 A 仍被忽略，重启后同样有效。
- [ ] 刷新或重开页面后从下一段继续，而不是从头开始。
- [ ] 书籍版本或哈希改变后进入暂停，不沿用旧定位。
- [ ] localStorage 不保存整本书；配额失败不推进内存游标。
- [ ] 两个真实标签页同时结束时，锁内重读和 revision 能防止重复提交与覆盖；无 Web Locks 时禁止自主写入。
- [ ] R1 不发起任何模型请求，`analyzedSegmentIds` 和笔记始终为空。
- [ ] 375px 下面板可打开、滚动、关闭，书架和聊天操作不互相遮挡。
- [ ] `npm run build` 和 `npm test` 通过。

### 建议小提交

1. `R1a`：书籍数据、library、存储和纯逻辑测试。
2. `R1b`：调度器、生活事件和恢复测试。
3. `R1c`：书架 UI、场景接入和 375px 浏览器验收。

### 本 Quest 不做

LLM、聊天检索、长期偏好、EPUB、上传、多书籍智能选择。

---

## Quest R2：模型阅读与笔记

### 目标

把阅读意图变成受预算约束的结构化分析任务。只有模型结果通过结构、引用、版本和游标校验后，才同时提交阅读进度、分析 ID 和笔记。

### 前置

- R1 验收通过。
- 站点保持私有，并在发布前验证匿名公网无法访问 Function；R2 不具备公开防刷能力。
- Function 的 Secret 只配置 `LLM_API_KEY`；不把 Key 写进前端、测试、日志或工具参数。
- 书架提供正文外发同意；默认关闭，切换服务商主机后重新确认。

### 新增或调整的文件

```text
src/reading/processor.ts            阅读请求、响应结构和引用校验
src/reading/scheduler.ts            queued/reading/validating/commit、取消、退避和预算
src/reading/storage.ts              analyzedSegmentIds、笔记和 committed 事务
src/ai/client.ts                    analyze_segment 同源请求与安静失败
src/ui/bookshelf.ts                 外发同意、笔记、暂停与重试状态
functions/handler.ts                operation 分流、长度限制和结构化模型请求
tests/reading-*.test.ts
tests/handler.test.ts
tests/client.test.ts
```

### 实施步骤

1. **先写校验与提交测试**
   - 定义 `SegmentAnalysis`；限制数组数量、字符串长度、主题枚举和 quoteId 引用。
   - facts 和 observations 必须能回到当前片段引用；问题不能伪造原文事实。
   - 引用由程序在当前片段中逐字查找并生成 `start / end`。
   - 未通过校验不调用 committed 事务。

2. **扩展 Function**
   - 请求显式使用 `operation: 'analyze_segment'`；同一小步把现有客户端和 Function 的普通聊天切换为 `operation: 'chat'` 并更新测试。
   - 检查 operation、正文、上下文和配置；请求体在 JSON 解析前按流式读取限制 16 KiB，上游响应按实际读取限制 32 KiB，不能只依赖 Content-Length 或 max_tokens。
   - 固定字段上限：facts 5 条、observations 3 条、questions 3 条、quotes 8 条；summary 300 字符，事实/观察 160，问题 100，引用 120。
   - 系统提示把正文声明为不可信资料，不提供工具，不执行正文指令。
   - 要求结构化 JSON；响应为空、非 JSON、超长或结构不符时返回稳定错误码。
   - 不把上游原始错误、Secret 或环境信息返回浏览器。

3. **调度、锁与取消**
   - 每次 `drain` 最多一段，页面内单 Promise；执行锁覆盖 fetch、校验和最终写入，recover 也必须先取得锁。
   - 创建 queued 不代表已分析；reading / validating 也不增加分析游标。
   - 恢复只把被中断的 reading / validating 转 queued；queued 保持 queued，paused / failed 等待明确重试或暂停条件解除，不能因刷新自动复活。
   - 每次取消、恢复或重试都递增 generation；提交同时匹配 taskId 和 generation，旧响应不能提交。
   - 先对相同 `lastCommittedAnalysisTaskId` 做幂等返回，再拒绝其他游标不匹配。
   - committed 只写 `nextAnalysisSegmentId / analyzedSegmentIds / notes / lastCommittedAnalysisTaskId`，不改翻阅游标。
   - R1 升级后按 `completedSegmentIds` 顺序，从最早未分析片段开始 backfill；任务来源从 `activityBySegmentId` 取得，pendingIntent 为空也能创建。
   - pendingIntent 只负责唤醒，入队即清除；未翻阅片段不能分析。

4. **预算与失败**
   - 并发 1；单活动 1 段；恢复首次 drain 1 段；现实每小时最多 6 次上游尝试。
   - fetch 前在锁内预留一次预算，失败、超时和丢失响应都不返还；时钟回拨不能清空额度。
   - 最多 3 次尝试，第 2 次前 2 秒、第 3 次前 8 秒，之后 failed 并保留原分析进度。
   - 快进和离线只合并分析意图，不提高现实预算，不生成离线笔记。
   - 模型不可用时生活模拟和模板聊天继续，书架只显示温柔的暂停状态。

5. **书架笔记**
   - 展示当前片段概括、事实、观察和问题；观察使用“我当时觉得”等不确定表述。
   - 每条观察可展开对应原文引用。
   - 概括标明为鸭子整理的内容，不伪装成原文。

### 测试与验收

- [ ] 网络失败、超时、坏 JSON、结构错误、配额错误均不改写翻阅事实、不推进分析游标。
- [ ] 引用不存在于当前原文、quoteId 不存在或引用指向其他片段时拒绝提交。
- [ ] 相同片段重复响应、重复任务和重复 committed 不重复写笔记或推进游标。
- [ ] R1 已翻阅两段后升级 R2，backfill 从第一段开始依次分析，不跳过、不要求重新翻阅。
- [ ] 取消→重试→旧 generation 响应晚到不能提交；页面恢复后不会从头重读。
- [ ] 标签 A 的上游请求进行中，标签 B recover 必须等待执行锁，不能发起第二个请求；paused / failed 刷新后不自动恢复。
- [ ] 版本或哈希在处理期间改变时拒绝提交。
- [ ] 离线补算不伪造已分析 ID、笔记、偏好或模型时间。
- [ ] ×600 和大量离线阅读意图不会形成几十次并发；现实预算不能被绕过。
- [ ] 同一窗口内六次失败尝试也计额度，不能发起第七次；时钟回拨不能清空额度。
- [ ] 未同意或更换服务商主机后不发送正文。
- [ ] 不可信主机不会收到 Secret；请求和响应都有长度限制。
- [ ] 模型不可用时鸭子仍生活、场景和聊天仍可操作。
- [ ] 375px 下同意、暂停、查看笔记和引用均可操作。
- [ ] `npm run build` 和 `npm test` 通过。

### 建议小提交

1. `R2a`：结构校验、引用定位、提交不变量和失败测试。
2. `R2b`：Function 操作分流、客户端、模型超时和长度限制。
3. `R2c`：调度锁、预算、恢复、取消和退避。
4. `R2d`：书架笔记、外发同意和移动端验收。

### 本 Quest 不做

聊天自动引用书籍、长期偏好、向量检索、跨设备同步、公开防刷的完整方案。

---

## Quest R3：阅读记忆与聊天

### 目标

让鸭子围绕实际已分析内容聊天，明确区分原文、个人观察和未知；从多条观察形成可撤销的暂时兴趣倾向。

### 前置

- R2 已有至少两段通过校验的真实笔记；测试可使用无凭据的固定样例。
- 不引入向量数据库，不增加模型调用次数来形成偏好。

### 新增或调整的文件

```text
src/reading/memory.ts               确定性检索、上下文预算和偏好派生
src/reading/storage.ts              兴趣证据读取与撤销
src/ai/client.ts                    聊天携带有限 readingContext
src/ui/chat.ts                      无命中时的温柔未知表达
src/ui/bookshelf.ts                 观察来源与兴趣证据展示/撤销
functions/handler.ts                区分原文、观察、未知的聊天约束
tests/reading-memory.test.ts
tests/handler.test.ts
```

### 实施步骤

1. **确定性检索**
   - 只检索 `analyzedSegmentIds` 中的笔记和对应原文。
   - 书名/作者优先，其后按事实、引用、概括和观察评分；同分按阅读顺序。
   - 最多两个片段、三条观察、共 1,600 字符。
   - 无命中返回空上下文和 `no_match / not_analyzed / version_mismatch` 状态，不从 library 的未读区域补资料。

2. **聊天接入**
   - 用户提到书籍或故事时先检索，再调用现有聊天。
   - 请求分别标记逐字原文、模型事实笔记、鸭子观察和未知边界，不把笔记当用户信息或绝对原文。
   - 书籍问题不携带旧的 assistant 阅读回答历史，只发送当前问题和本次核验上下文，避免旧误答继续污染回答。
   - 系统约束：虚构故事不是鸭子的现实经历；观察必须带不确定性；不知道就说不知道。
   - 模型不可用时按检索状态使用“还没读到/还没整理好”的阅读专用兜底，不退回可能暗示已读的通用话术。

3. **兴趣证据**
   - 从已提交观察的受控主题和态度生成 `PreferenceEvidence`，记录 noteId、segmentId 和 quoteIds。
   - 至少三条未撤销证据、覆盖两个章节，才形成暂时偏好。
   - 偏好由证据重新计算，不修改开局性格，不设永久人格字段。
   - 撤销后派生偏好立即减弱或消失；原文事实不参与态度打分。

### 测试与验收

- [ ] 未读、仅翻阅未分析、分析失败和版本不匹配的片段不会进入聊天上下文。
- [ ] 检索只取必要片段，完整阅读历史不会随每次聊天发送。
- [ ] 无命中时返回空上下文和明确未知，不编造章节内容。
- [ ] 书籍问题不携带旧的 assistant 阅读回答历史；失败时使用阅读专用未知兜底。
- [ ] 逐字原文、模型事实笔记、个人观察、用户信息和虚构经历在请求中保持不同类型。
- [ ] 一条观察不会形成长期偏好；撤销来源后偏好重新计算。
- [ ] 相同笔记和查询得到相同检索结果与上下文顺序。
- [ ] 聊天 Function 失败时游戏和阅读存档不受影响。
- [ ] 375px 下书架与聊天均能滚动、关闭和继续输入，无横向溢出。
- [ ] 用真实已读样例验收：能谈情节和观察；询问未读章节时明确不知道。
- [ ] `npm run build` 和 `npm test` 通过。

### 建议小提交

1. `R3a`：检索、上下文限制和未读测试。
2. `R3b`：聊天请求、Function 约束和真实样例验收。
3. `R3c`：兴趣证据、撤销和移动端验收。

### 本 Quest 不做

向量数据库、自动知识图谱、永久人格演化、多设备记忆、把用户聊天保存成阅读经历。

---

## 跨 Quest 测试清单

| 必须验证的行为 | 主要测试位置 | 所属 Quest |
|---|---|---|
| 相同存档和时间输入结果确定 | sim / scheduler 纯函数测试 | R1 |
| 重复任务不重复推进游标 | scheduler / storage | R1、R2 |
| 分析失败不增加分析进度、不改写翻阅事实 | processor / scheduler | R2 |
| 引用不在原文时拒绝提交 | processor | R2 |
| 关闭并恢复后不从开始重读 | storage / recovery | R1、R2 |
| 离线补算不伪造 AI 阅读 | sim 编排 / scheduler | R2 |
| 快进不产生失控模型调用 | scheduler 预算与并发 | R2 |
| 模型不可用时生活照常 | 浏览器降级 + 客户端测试 | R2、R3 |
| 聊天不把未读内容说成已读 | memory 检索 + Function 样例 | R3 |
| 偏好有来源且可撤销 | memory | R3 |
| 375px 书架和聊天可用 | 真实浏览器验收 | R1、R2、R3 |

## 每个 Quest 的收尾要求

1. 只提交当前小步所需文件，不顺手重构场景或旧聊天。
2. 运行 `npm run build` 和 `npm test`，记录真实结果。
3. 在 `docs/qoder-log.md` 追加草稿行，「我改了什么」和「截图」留空。
4. UI Quest 留下桌面和 375px 验收截图；模型 Quest 记录无凭据测试与真实链路验收的区别。
5. 保持站点私有，发布和公开访问分别需要明确授权。
