<template>
  <div class="task-canvas">
    <div class="canvas-header">
      <h2>工作流画布</h2>
      <div class="task-count">{{ taskCount }} 个任务</div>
    </div>

    <div 
      class="canvas-content"
      @dragover.prevent="handleDragOver"
      @drop="handleDrop"
    >
      <div v-if="tasks.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <div class="empty-text">从左侧拖拽任务到这里开始构建工作流</div>
      </div>

      <div v-else class="task-flow">
        <TaskBlock
          v-for="(task, index) in tasks"
          :key="task.id"
          :task="task"
          :index="index"
          :level="0"
          :executing="executing"
          :isCurrentTask="currentTaskId === task.id"
          @delete="deleteTask"
          @move-up="moveTaskUp"
          @move-down="moveTaskDown"
          @update="updateTask"
          @drag-start="handleTaskDragStart"
          @drag-end="handleTaskDragEnd"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import TaskBlock from './TaskBlock.vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  },
  executing: {
    type: Boolean,
    default: false
  },
  currentTaskId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update-tasks'])

const draggingTaskId = inject('draggingTaskId', null)
const moveTask = inject('moveTask', null)

const taskCount = computed(() => {
  function countTasks(tasks) {
    let count = 0
    tasks.forEach(task => {
      count++
      if (task.children) {
        count += countTasks(task.children)
      }
      if (task.elseChildren) {
        count += countTasks(task.elseChildren)
      }
      if (task.catchChildren) {
        count += countTasks(task.catchChildren)
      }
    })
    return count
  }
  return countTasks(props.tasks)
})

function handleDragOver(event) {
  event.preventDefault()
  
  // 根据全局状态判断是否为画布任务
  event.dataTransfer.dropEffect = draggingTaskId?.value ? 'move' : 'copy'
}

function handleDrop(event) {
  event.preventDefault()
  
  try {
    const dragData = JSON.parse(event.dataTransfer.getData('application/json'))
    
    if (dragData.isCanvasTask) {
      // 从画布拖拽的任务 - 移动到顶层末尾
      if (moveTask) {
        moveTask(dragData.taskId, null, null)
      }
    } else {
      // 从面板拖拽的新任务 - 创建任务
      const newTask = createTask(dragData)
      const newTasks = [...props.tasks, newTask]
      emit('update-tasks', newTasks)
    }
  } catch (error) {
    console.error('Failed to drop task:', error)
  }
}

function createTask(taskData) {
  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: taskData.type,
    name: taskData.name,
    icon: taskData.icon,
    color: taskData.color,
    config: getDefaultConfig(taskData.type),
    isContainer: taskData.isContainer || false
  }

  if (taskData.isContainer) {
    task.children = []
    if (taskData.hasElse) {
      task.elseChildren = []
    }
    if (taskData.hasCatch) {
      task.catchChildren = []
    }
  }

  return task
}

function getDefaultConfig(type) {
  const configs = {
    open_browser: { url: 'https://www.baidu.com' },
    click_element: { selector: '', description: '' },
    input_text: { selector: '', text: '', description: '' },
    wait: { duration: 1000 },
    get_text: { selector: '', variable: 'text_result' },
    screenshot: { filename: 'screenshot.png' },
    if: { condition: 'true', description: '' },
    while: { condition: 'count < 10', maxIterations: 100 },
    foreach: { items: '["item1", "item2", "item3"]', itemVar: 'item' },
    try: { description: '尝试执行' }
  }
  return configs[type] || {}
}

function deleteTask(taskId) {
  function removeTask(tasks) {
    return tasks.filter(task => {
      if (task.id === taskId) {
        return false
      }
      if (task.children) {
        task.children = removeTask(task.children)
      }
      if (task.elseChildren) {
        task.elseChildren = removeTask(task.elseChildren)
      }
      if (task.catchChildren) {
        task.catchChildren = removeTask(task.catchChildren)
      }
      return true
    })
  }

  const newTasks = removeTask([...props.tasks])
  emit('update-tasks', newTasks)
}

function moveTaskUp(taskId) {
  function moveUp(tasks) {
    for (let i = 1; i < tasks.length; i++) {
      if (tasks[i].id === taskId) {
        [tasks[i - 1], tasks[i]] = [tasks[i], tasks[i - 1]]
        return true
      }
      if (tasks[i].children && moveUp(tasks[i].children)) return true
      if (tasks[i].elseChildren && moveUp(tasks[i].elseChildren)) return true
      if (tasks[i].catchChildren && moveUp(tasks[i].catchChildren)) return true
    }
    return false
  }

  const newTasks = [...props.tasks]
  moveUp(newTasks)
  emit('update-tasks', newTasks)
}

function moveTaskDown(taskId) {
  function moveDown(tasks) {
    for (let i = 0; i < tasks.length - 1; i++) {
      if (tasks[i].id === taskId) {
        [tasks[i], tasks[i + 1]] = [tasks[i + 1], tasks[i]]
        return true
      }
      if (tasks[i].children && moveDown(tasks[i].children)) return true
      if (tasks[i].elseChildren && moveDown(tasks[i].elseChildren)) return true
      if (tasks[i].catchChildren && moveDown(tasks[i].catchChildren)) return true
    }
    return false
  }

  const newTasks = [...props.tasks]
  moveDown(newTasks)
  emit('update-tasks', newTasks)
}

function updateTask(taskId, updates) {
  function update(tasks) {
    return tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates }
      }
      const updated = { ...task }
      if (updated.children) {
        updated.children = update(updated.children)
      }
      if (updated.elseChildren) {
        updated.elseChildren = update(updated.elseChildren)
      }
      if (updated.catchChildren) {
        updated.catchChildren = update(updated.catchChildren)
      }
      return updated
    })
  }

  const newTasks = update([...props.tasks])
  emit('update-tasks', newTasks)
}

function handleTaskDragStart(taskId) {
  if (draggingTaskId) {
    draggingTaskId.value = taskId
  }
}

function handleTaskDragEnd() {
  if (draggingTaskId) {
    draggingTaskId.value = null
  }
}
</script>

<style scoped>
.task-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.canvas-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.task-count {
  font-size: 13px;
  color: #909399;
  background: #f4f4f5;
  padding: 4px 12px;
  border-radius: 12px;
}

.canvas-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  position: relative;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #909399;
  max-width: 300px;
}

.task-flow {
  max-width: 800px;
  margin: 0 auto;
}

/* 滚动条样式 */
.canvas-content::-webkit-scrollbar {
  width: 8px;
}

.canvas-content::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.canvas-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;
}

.canvas-content::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
