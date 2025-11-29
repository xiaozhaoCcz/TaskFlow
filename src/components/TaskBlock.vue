<template>
  <div 
    :class="['task-block', { 
      'is-container': task.isContainer,
      'is-executing': isCurrentTask,
      'level-indent': level > 0
    }]"
    :style="{ '--level': level }"
  >
    <!-- 主任务块 -->
    <div 
      :class="['task-header', { 'expanded': expanded }]"
      @click="toggleExpand"
      :style="{ borderLeftColor: task.color }"
    >
      <div class="task-main">
        <div class="task-icon" :style="{ background: task.color }">
          {{ task.icon }}
        </div>
        <div class="task-content">
          <div class="task-title">{{ task.name }}</div>
          <div class="task-config-preview" v-if="!expanded">
            {{ getConfigPreview() }}
          </div>
        </div>
        <div v-if="isCurrentTask" class="task-status executing">
          <span class="status-dot"></span>
          执行中
        </div>
      </div>
      
      <div class="task-actions" @click.stop>
        <button 
          v-if="task.isContainer"
          class="btn-icon" 
          :title="expanded ? '收起' : '展开'"
          @click.stop="toggleExpand"
        >
          {{ expanded ? '▼' : '▶' }}
        </button>
        <button class="btn-icon" title="上移" @click="$emit('move-up', task.id)">↑</button>
        <button class="btn-icon" title="下移" @click="$emit('move-down', task.id)">↓</button>
        <button class="btn-icon btn-delete" title="删除" @click="$emit('delete', task.id)">×</button>
      </div>
    </div>

    <!-- 配置区域 -->
    <div v-if="expanded" class="task-config">
      <div class="config-form">
        <!-- 打开网页配置 -->
        <template v-if="task.type === 'open_browser'">
          <div class="form-group">
            <label>网址：</label>
            <input 
              v-model="task.config.url" 
              type="text" 
              placeholder="请输入网址"
              @input="emitUpdate"
            />
          </div>
        </template>

        <!-- 点击元素配置 -->
        <template v-if="task.type === 'click_element'">
          <div class="form-group">
            <label>选择器：</label>
            <input 
              v-model="task.config.selector" 
              type="text" 
              placeholder="CSS选择器，如：#button"
              @input="emitUpdate"
            />
          </div>
          <div class="form-group">
            <label>说明：</label>
            <input 
              v-model="task.config.description" 
              type="text" 
              placeholder="元素说明"
              @input="emitUpdate"
            />
          </div>
        </template>

        <!-- 输入文本配置 -->
        <template v-if="task.type === 'input_text'">
          <div class="form-group">
            <label>选择器：</label>
            <input 
              v-model="task.config.selector" 
              type="text" 
              placeholder="CSS选择器"
              @input="emitUpdate"
            />
          </div>
          <div class="form-group">
            <label>文本：</label>
            <input 
              v-model="task.config.text" 
              type="text" 
              placeholder="要输入的文本"
              @input="emitUpdate"
            />
          </div>
        </template>

        <!-- 等待配置 -->
        <template v-if="task.type === 'wait'">
          <div class="form-group">
            <label>等待时间（毫秒）：</label>
            <input 
              v-model.number="task.config.duration" 
              type="number" 
              min="0"
              @input="emitUpdate"
            />
          </div>
        </template>

        <!-- 获取文本配置 -->
        <template v-if="task.type === 'get_text'">
          <div class="form-group">
            <label>选择器：</label>
            <input 
              v-model="task.config.selector" 
              type="text" 
              placeholder="CSS选择器"
              @input="emitUpdate"
            />
          </div>
          <div class="form-group">
            <label>保存到变量：</label>
            <input 
              v-model="task.config.variable" 
              type="text" 
              placeholder="变量名"
              @input="emitUpdate"
            />
          </div>
        </template>

        <!-- 截图配置 -->
        <template v-if="task.type === 'screenshot'">
          <div class="form-group">
            <label>文件名：</label>
            <input 
              v-model="task.config.filename" 
              type="text" 
              placeholder="screenshot.png"
              @input="emitUpdate"
            />
          </div>
        </template>

        <!-- IF条件配置 -->
        <template v-if="task.type === 'if'">
          <div class="form-group">
            <label>条件表达式：</label>
            <input 
              v-model="task.config.condition" 
              type="text" 
              placeholder="例如：count > 5"
              @input="emitUpdate"
            />
          </div>
        </template>

        <!-- While循环配置 -->
        <template v-if="task.type === 'while'">
          <div class="form-group">
            <label>循环条件：</label>
            <input 
              v-model="task.config.condition" 
              type="text" 
              placeholder="例如：count < 10"
              @input="emitUpdate"
            />
          </div>
          <div class="form-group">
            <label>最大迭代次数：</label>
            <input 
              v-model.number="task.config.maxIterations" 
              type="number" 
              min="1"
              @input="emitUpdate"
            />
          </div>
        </template>

        <!-- Foreach遍历配置 -->
        <template v-if="task.type === 'foreach'">
          <div class="form-group">
            <label>遍历数组：</label>
            <input 
              v-model="task.config.items" 
              type="text" 
              placeholder='["item1", "item2"]'
              @input="emitUpdate"
            />
          </div>
          <div class="form-group">
            <label>项变量名：</label>
            <input 
              v-model="task.config.itemVar" 
              type="text" 
              placeholder="item"
              @input="emitUpdate"
            />
          </div>
        </template>
      </div>

      <!-- 容器任务的子任务区域 -->
      <div v-if="task.isContainer" class="task-children-container">
        <!-- IF的THEN分支 -->
        <div v-if="task.type === 'if'" class="branch-container then-branch">
          <div class="branch-header">
            <span class="branch-label">✓ THEN (条件为真)</span>
          </div>
          <DropZone 
            :children="task.children || []"
            :parentTask="task"
            branch="children"
            :level="level + 1"
            @update-children="updateChildren"
          />
        </div>

        <!-- IF的ELSE分支 -->
        <div v-if="task.type === 'if'" class="branch-container else-branch">
          <div class="branch-header">
            <span class="branch-label">✗ ELSE (条件为假)</span>
          </div>
          <DropZone 
            :children="task.elseChildren || []"
            :parentTask="task"
            branch="elseChildren"
            :level="level + 1"
            @update-children="updateChildren"
          />
        </div>

        <!-- While/Foreach的循环体 -->
        <div v-if="task.type === 'while' || task.type === 'foreach'" class="branch-container loop-branch">
          <div class="branch-header">
            <span class="branch-label">🔄 循环体</span>
          </div>
          <DropZone 
            :children="task.children || []"
            :parentTask="task"
            branch="children"
            :level="level + 1"
            @update-children="updateChildren"
          />
        </div>

        <!-- Try的主体 -->
        <div v-if="task.type === 'try'" class="branch-container try-branch">
          <div class="branch-header">
            <span class="branch-label">🛡️ TRY</span>
          </div>
          <DropZone 
            :children="task.children || []"
            :parentTask="task"
            branch="children"
            :level="level + 1"
            @update-children="updateChildren"
          />
        </div>

        <!-- Try的CATCH分支 -->
        <div v-if="task.type === 'try'" class="branch-container catch-branch">
          <div class="branch-header">
            <span class="branch-label">⚠️ CATCH (异常处理)</span>
          </div>
          <DropZone 
            :children="task.catchChildren || []"
            :parentTask="task"
            branch="catchChildren"
            :level="level + 1"
            @update-children="updateChildren"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DropZone from './DropZone.vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  executing: {
    type: Boolean,
    default: false
  },
  isCurrentTask: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['delete', 'move-up', 'move-down', 'update'])

const expanded = ref(props.task.isContainer || false)

function toggleExpand() {
  if (props.task.isContainer) {
    expanded.value = !expanded.value
  }
}

function getConfigPreview() {
  const config = props.task.config
  if (!config) return ''
  
  const previews = {
    open_browser: config.url,
    click_element: config.selector || config.description,
    input_text: `${config.selector}: "${config.text}"`,
    wait: `${config.duration}ms`,
    get_text: `${config.selector} → ${config.variable}`,
    screenshot: config.filename,
    if: config.condition,
    while: config.condition,
    foreach: `${config.itemVar} in ${config.items}`,
    try: '异常捕获'
  }
  
  return previews[props.task.type] || ''
}

function emitUpdate() {
  emit('update', props.task.id, { config: props.task.config })
}

function updateChildren(branch, children) {
  emit('update', props.task.id, { [branch]: children })
}
</script>

<style scoped>
.task-block {
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.task-block.level-indent {
  margin-left: calc(var(--level) * 20px);
}

.task-block:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.task-block.is-executing {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  border: 2px solid #409eff;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: all 0.3s;
}

.task-header:hover {
  background: #f5f7fa;
}

.task-header.expanded {
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.task-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.task-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.task-config-preview {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  background: #ecf5ff;
  color: #409eff;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409eff;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.task-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border: none;
  background: #f4f4f5;
  color: #606266;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #e4e7ed;
  color: #303133;
}

.btn-delete:hover {
  background: #fef0f0;
  color: #f56c6c;
}

.task-config {
  padding: 16px;
  background: #fafafa;
}

.config-form {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.task-children-container {
  margin-top: 12px;
}

.branch-container {
  margin-bottom: 12px;
  border-radius: 6px;
  overflow: hidden;
}

.then-branch {
  border: 2px solid #67c23a;
}

.else-branch {
  border: 2px solid #f56c6c;
}

.loop-branch {
  border: 2px solid #409eff;
}

.try-branch {
  border: 2px solid #e6a23c;
}

.catch-branch {
  border: 2px solid #f56c6c;
}

.branch-header {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.branch-label {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}
</style>
