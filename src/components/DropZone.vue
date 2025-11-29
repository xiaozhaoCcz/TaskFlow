<template>
  <div 
    class="drop-zone"
    :class="{ 'drag-over': isDragOver, 'has-tasks': children.length > 0 }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div v-if="children.length === 0" class="drop-placeholder">
      拖拽任务到这里
    </div>

    <TaskBlock
      v-for="(child, index) in children"
      :key="child.id"
      :task="child"
      :index="index"
      :level="level"
      :executing="executing"
      :isCurrentTask="currentTaskId === child.id"
      @delete="deleteTask"
      @move-up="moveTaskUp"
      @move-down="moveTaskDown"
      @update="updateTask"
    />
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import TaskBlock from './TaskBlock.vue'

const props = defineProps({
  children: {
    type: Array,
    required: true
  },
  parentTask: {
    type: Object,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  executing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-children'])

const isDragOver = ref(false)
const currentTaskId = inject('currentTaskId', null)

function handleDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  isDragOver.value = true
}

function handleDragLeave(event) {
  if (event.target.classList.contains('drop-zone')) {
    isDragOver.value = false
  }
}

function handleDrop(event) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  try {
    const taskData = JSON.parse(event.dataTransfer.getData('application/json'))
    const newTask = createTask(taskData)
    
    const newChildren = [...props.children, newTask]
    emit('update-children', props.branch, newChildren)
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
  const newChildren = props.children.filter(child => child.id !== taskId)
  emit('update-children', props.branch, newChildren)
}

function moveTaskUp(taskId) {
  const index = props.children.findIndex(child => child.id === taskId)
  if (index > 0) {
    const newChildren = [...props.children]
    ;[newChildren[index - 1], newChildren[index]] = [newChildren[index], newChildren[index - 1]]
    emit('update-children', props.branch, newChildren)
  }
}

function moveTaskDown(taskId) {
  const index = props.children.findIndex(child => child.id === taskId)
  if (index < props.children.length - 1) {
    const newChildren = [...props.children]
    ;[newChildren[index], newChildren[index + 1]] = [newChildren[index + 1], newChildren[index]]
    emit('update-children', props.branch, newChildren)
  }
}

function updateTask(taskId, updates) {
  const newChildren = props.children.map(child => {
    if (child.id === taskId) {
      return { ...child, ...updates }
    }
    return child
  })
  emit('update-children', props.branch, newChildren)
}
</script>

<style scoped>
.drop-zone {
  min-height: 60px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  transition: all 0.3s;
}

.drop-zone.drag-over {
  background: rgba(64, 158, 255, 0.1);
  border: 2px dashed #409eff;
}

.drop-zone.has-tasks {
  background: transparent;
  min-height: auto;
  padding: 8px;
}

.drop-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: #c0c4cc;
  font-size: 13px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

.drop-zone.drag-over .drop-placeholder {
  color: #409eff;
  border-color: #409eff;
}
</style>
