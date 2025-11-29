<template>
  <div class="task-panel">
    <div class="panel-header">
      <h2>任务组件</h2>
      <p class="hint">拖拽到右侧画布</p>
    </div>

    <div class="panel-content">
      <!-- 基础任务 -->
      <div class="task-category">
        <h3 class="category-title">基础任务</h3>
        <div class="task-list">
          <div
            v-for="task in basicTasks"
            :key="task.type"
            class="task-item"
            draggable="true"
            @dragstart="handleDragStart($event, task)"
            @dragend="handleDragEnd"
          >
            <div class="task-icon" :style="{ background: task.color }">
              {{ task.icon }}
            </div>
            <div class="task-info">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-desc">{{ task.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 控制流 -->
      <div class="task-category">
        <h3 class="category-title">控制流</h3>
        <div class="task-list">
          <div
            v-for="task in controlTasks"
            :key="task.type"
            class="task-item control-task"
            draggable="true"
            @dragstart="handleDragStart($event, task)"
            @dragend="handleDragEnd"
          >
            <div class="task-icon" :style="{ background: task.color }">
              {{ task.icon }}
            </div>
            <div class="task-info">
              <div class="task-name">{{ task.name }}</div>
              <div class="task-desc">{{ task.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const basicTasks = ref([
  {
    type: 'open_browser',
    name: '打开网页',
    description: '打开指定的网页',
    icon: '🌐',
    color: '#409eff',
    isContainer: false
  },
  {
    type: 'click_element',
    name: '点击元素',
    description: '点击页面元素',
    icon: '👆',
    color: '#67c23a',
    isContainer: false
  },
  {
    type: 'input_text',
    name: '输入文本',
    description: '在输入框输入文本',
    icon: '⌨️',
    color: '#e6a23c',
    isContainer: false
  },
  {
    type: 'wait',
    name: '等待',
    description: '等待指定时间',
    icon: '⏱️',
    color: '#909399',
    isContainer: false
  },
  {
    type: 'get_text',
    name: '获取文本',
    description: '获取元素文本内容',
    icon: '📝',
    color: '#f56c6c',
    isContainer: false
  },
  {
    type: 'screenshot',
    name: '截图',
    description: '截取页面截图',
    icon: '📸',
    color: '#9c27b0',
    isContainer: false
  }
])

const controlTasks = ref([
  {
    type: 'if',
    name: 'IF 条件',
    description: '条件判断分支',
    icon: '❓',
    color: '#ff9800',
    isContainer: true,
    hasElse: true
  },
  {
    type: 'while',
    name: 'WHILE 循环',
    description: '条件循环执行',
    icon: '🔄',
    color: '#00bcd4',
    isContainer: true
  },
  {
    type: 'foreach',
    name: 'FOREACH 遍历',
    description: '遍历列表执行',
    icon: '📋',
    color: '#4caf50',
    isContainer: true
  },
  {
    type: 'try',
    name: 'TRY 异常处理',
    description: '捕获异常',
    icon: '🛡️',
    color: '#e91e63',
    isContainer: true,
    hasCatch: true
  }
])

let draggedTask = null

function handleDragStart(event, task) {
  draggedTask = task
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/json', JSON.stringify(task))
  event.target.classList.add('dragging')
}

function handleDragEnd(event) {
  event.target.classList.remove('dragging')
}
</script>

<style scoped>
.task-panel {
  width: 280px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.panel-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.hint {
  font-size: 12px;
  opacity: 0.9;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.task-category {
  margin-bottom: 24px;
}

.category-title {
  font-size: 13px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-left: 4px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.3s;
}

.task-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.task-item.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.task-item.control-task {
  border-left-width: 3px;
}

.task-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.task-desc {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
