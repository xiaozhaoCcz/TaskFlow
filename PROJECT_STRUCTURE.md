# 📁 项目结构说明

## 目录结构

```
/workspace
├── src/                          # 源代码目录
│   ├── components/               # Vue组件
│   │   ├── WorkflowBuilder.vue   # 主工作流构建器组件
│   │   ├── TaskPanel.vue         # 左侧任务面板（拖拽源）
│   │   ├── TaskCanvas.vue        # 右侧任务画布（拖放目标）
│   │   ├── TaskBlock.vue         # 单个任务块组件
│   │   └── DropZone.vue          # 拖放区域组件（支持嵌套）
│   ├── utils/                    # 工具函数
│   │   └── taskExecutor.js       # 任务执行引擎
│   ├── App.vue                   # 根组件
│   └── main.js                   # 应用入口
├── index.html                    # HTML模板
├── vite.config.js                # Vite构建配置
├── package.json                  # 项目依赖配置
├── .gitignore                    # Git忽略文件
├── README.md                     # 项目说明文档
├── QUICKSTART.md                 # 快速开始指南
└── PROJECT_STRUCTURE.md          # 本文件
```

## 组件关系图

```
App.vue
  └─ WorkflowBuilder.vue (主组件)
      ├─ TaskPanel.vue (左侧面板)
      │   └─ 任务列表 (可拖拽)
      │
      ├─ TaskCanvas.vue (右侧画布)
      │   └─ TaskBlock.vue (任务块) ↺ 递归
      │       └─ DropZone.vue (拖放区)
      │           └─ TaskBlock.vue (子任务) ↺ 递归
      │
      └─ 日志面板 (执行日志)
```

## 核心组件详解

### 1. WorkflowBuilder.vue
**主工作流构建器组件**

- **职责**：
  - 管理整个工作流状态
  - 协调各子组件
  - 处理工作流执行
  - 显示执行日志

- **核心功能**：
  - 任务列表状态管理
  - 执行工作流
  - 清空画布
  - 日志收集和展示

- **提供给子组件**：
  - `tasks` - 任务列表
  - `addLog` - 添加日志函数

### 2. TaskPanel.vue
**左侧任务面板**

- **职责**：
  - 展示可用的任务类型
  - 提供拖拽源

- **任务分类**：
  - 基础任务（6个）
  - 控制流任务（4个）

- **拖拽实现**：
  - `draggable="true"` 使任务可拖拽
  - `@dragstart` 保存任务数据到DataTransfer
  - 视觉反馈（拖拽时样式变化）

### 3. TaskCanvas.vue
**右侧任务画布**

- **职责**：
  - 接收拖放的任务
  - 管理根级任务列表
  - 提供任务操作接口

- **核心功能**：
  - 接收拖放事件创建新任务
  - 任务增删改查
  - 任务排序（上移下移）
  - 递归渲染任务树

- **拖放处理**：
  - `@dragover.prevent` 允许拖放
  - `@drop` 创建新任务并添加到列表

### 4. TaskBlock.vue
**单个任务块组件（核心组件）**

- **职责**：
  - 显示任务信息
  - 提供任务配置界面
  - 处理任务嵌套
  - 管理展开/收起状态

- **功能模块**：
  - **任务头部**：图标、名称、预览、操作按钮
  - **配置表单**：根据任务类型显示不同的配置项
  - **嵌套容器**：控制流任务的子任务区域

- **支持的配置类型**：
  - 基础任务：URL、选择器、文本、时间等
  - 控制流：条件表达式、循环参数等

- **分支类型**：
  - IF: `children` (THEN) + `elseChildren` (ELSE)
  - WHILE/FOREACH: `children` (循环体)
  - TRY: `children` (TRY块) + `catchChildren` (CATCH块)

### 5. DropZone.vue
**拖放区域组件**

- **职责**：
  - 为嵌套任务提供拖放目标
  - 递归渲染子任务
  - 管理特定分支的任务列表

- **特点**：
  - 支持多层嵌套
  - 空状态提示
  - 拖放高亮效果

- **递归机制**：
  - DropZone 包含 TaskBlock
  - TaskBlock 包含 DropZone
  - 形成递归渲染树

## 工具模块详解

### taskExecutor.js
**任务执行引擎**

- **核心功能**：
  - 顺序执行任务列表
  - 递归执行嵌套任务
  - 管理变量存储
  - 评估条件表达式
  - 提供执行反馈

- **执行流程**：
  1. 初始化变量存储
  2. 遍历任务列表
  3. 根据任务类型执行对应逻辑
  4. 触发进度回调
  5. 处理异常

- **支持的控制流**：
  - **IF**: 评估条件，选择分支执行
  - **WHILE**: 循环执行直到条件不满足
  - **FOREACH**: 遍历数组，为每个元素执行子任务
  - **TRY/CATCH**: 捕获异常并执行catch块

- **变量系统**：
  - 全局变量存储
  - 支持跨任务传递数据
  - 条件表达式可访问变量
  - 循环中的局部变量

## 数据流

### 1. 任务创建流程

```
用户拖拽任务 
  → TaskPanel @dragstart (保存数据)
  → TaskCanvas/DropZone @drop (接收数据)
  → 创建任务对象
  → 更新任务列表
  → 触发重新渲染
```

### 2. 任务配置流程

```
用户修改配置
  → TaskBlock @input事件
  → emitUpdate()
  → 向上传递update事件
  → WorkflowBuilder更新tasks
  → 状态更新完成
```

### 3. 任务执行流程

```
点击运行按钮
  → executeWorkflow()
  → taskExecutor.executeTaskFlow()
  → 递归执行每个任务
  → 触发onProgress回调
  → 更新UI状态和日志
  → 执行完成
```

## 关键技术点

### 1. 拖拽实现
- HTML5 Drag and Drop API
- DataTransfer 传递任务数据
- 视觉反馈（拖拽状态、拖放提示）

### 2. 递归渲染
- Vue组件递归引用
- TaskBlock ↔ DropZone 相互递归
- 支持无限层级嵌套

### 3. 状态管理
- Props down（父传子）
- Events up（子传父）
- Provide/Inject（跨层级通信）

### 4. 任务执行
- Async/Await 异步顺序执行
- 递归处理嵌套任务
- Promise链保证执行顺序

### 5. 条件评估
- Function构造器动态评估
- 安全的上下文传递
- 支持JavaScript表达式

## 扩展点

### 可扩展的功能

1. **新增任务类型**
   - 在 TaskPanel 添加任务定义
   - 在 TaskBlock 添加配置表单
   - 在 taskExecutor 添加执行逻辑

2. **持久化存储**
   - 添加导出为JSON功能
   - 添加从JSON导入功能
   - 集成后端API保存工作流

3. **可视化增强**
   - 添加任务连接线
   - 添加缩略图预览
   - 添加撤销/重做功能

4. **执行增强**
   - 支持断点调试
   - 支持单步执行
   - 支持变量监视

5. **真实自动化**
   - 集成Puppeteer/Playwright
   - 真实的浏览器操作
   - 元素定位和操作

## 性能考虑

- 使用虚拟滚动处理大量任务
- 懒加载配置面板内容
- 防抖优化配置输入
- 减少不必要的重新渲染

## 安全考虑

- 条件表达式评估沙箱
- XSS防护
- 输入验证
- 循环次数限制

---

**提示**: 这是一个教学和演示项目，展示了如何使用Vue 3构建复杂的交互式应用。
