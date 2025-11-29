<template>
  <div class="workflow-builder">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h1 class="title">可视化工作流构建器</h1>
      <div class="toolbar-actions">
        <button @click="clearWorkflow" class="btn btn-secondary">清空</button>
        <button @click="executeWorkflow" class="btn btn-primary" :disabled="executing">
          {{ executing ? '执行中...' : '运行工作流' }}
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="content">
      <!-- 左侧任务面板 -->
      <TaskPanel />

      <!-- 右侧任务流画布 -->
      <TaskCanvas 
        :tasks="tasks" 
        :executing="executing"
        :currentTaskId="currentTaskId"
        @update-tasks="handleUpdateTasks"
      />

      <!-- 执行日志面板 -->
      <div class="log-panel" v-if="logs.length > 0">
        <div class="log-header">
          <h3>执行日志</h3>
          <button @click="clearLogs" class="btn-clear">清除</button>
        </div>
        <div class="log-content">
          <div 
            v-for="(log, index) in logs" 
            :key="index" 
            :class="['log-item', `log-${log.type}`]"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import TaskPanel from './TaskPanel.vue'
import TaskCanvas from './TaskCanvas.vue'
import { executeTaskFlow } from '../utils/taskExecutor.js'

const tasks = ref([])
const executing = ref(false)
const currentTaskId = ref(null)
const logs = ref([])

// 提供全局状态给子组件
provide('tasks', tasks)
provide('addLog', addLog)

function handleUpdateTasks(newTasks) {
  tasks.value = newTasks
}

function clearWorkflow() {
  if (confirm('确定要清空所有任务吗？')) {
    tasks.value = []
    clearLogs()
  }
}

function addLog(type, message) {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  logs.value.push({ type, message, time })
}

function clearLogs() {
  logs.value = []
}

async function executeWorkflow() {
  if (tasks.value.length === 0) {
    alert('请先添加任务！')
    return
  }

  executing.value = true
  clearLogs()
  addLog('info', '开始执行工作流...')

  try {
    await executeTaskFlow(tasks.value, (taskId, status, message) => {
      currentTaskId.value = taskId
      if (status === 'start') {
        addLog('info', message)
      } else if (status === 'success') {
        addLog('success', message)
      } else if (status === 'error') {
        addLog('error', message)
      }
    })
    addLog('success', '工作流执行完成！')
  } catch (error) {
    addLog('error', `执行失败: ${error.message}`)
  } finally {
    executing.value = false
    currentTaskId.value = null
  }
}
</script>

<style scoped>
.workflow-builder {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-primary:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f4f4f5;
  color: #606266;
}

.btn-secondary:hover {
  background: #e9e9eb;
}

.content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.log-panel {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 400px;
  height: 300px;
  background: white;
  border-left: 1px solid #e4e7ed;
  border-top: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  box-shadow: -2px -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.log-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.btn-clear {
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
}

.btn-clear:hover {
  background: #f4f4f5;
  color: #606266;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 4px;
  margin-bottom: 4px;
}

.log-time {
  color: #909399;
  font-family: monospace;
  flex-shrink: 0;
}

.log-message {
  flex: 1;
}

.log-info {
  background: #f0f9ff;
  color: #409eff;
}

.log-success {
  background: #f0f9ff;
  color: #67c23a;
}

.log-error {
  background: #fef0f0;
  color: #f56c6c;
}
</style>
