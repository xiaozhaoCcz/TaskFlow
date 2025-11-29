/**
 * 任务执行引擎
 * 负责按顺序执行工作流中的任务
 */

// 全局变量存储，用于在任务间传递数据
const variables = {}

/**
 * 执行任务流
 * @param {Array} tasks - 任务列表
 * @param {Function} onProgress - 进度回调函数
 */
export async function executeTaskFlow(tasks, onProgress) {
  // 清空变量存储
  Object.keys(variables).forEach(key => delete variables[key])
  
  // 初始化一些默认变量
  variables.count = 0
  
  try {
    await executeTasks(tasks, onProgress)
  } catch (error) {
    throw error
  }
}

/**
 * 递归执行任务列表
 */
async function executeTasks(tasks, onProgress, parentContext = {}) {
  for (const task of tasks) {
    await executeTask(task, onProgress, parentContext)
  }
}

/**
 * 执行单个任务
 */
async function executeTask(task, onProgress, parentContext = {}) {
  onProgress(task.id, 'start', `开始执行: ${task.name}`)
  
  try {
    switch (task.type) {
      case 'open_browser':
        await executeOpenBrowser(task)
        break
      case 'click_element':
        await executeClickElement(task)
        break
      case 'input_text':
        await executeInputText(task)
        break
      case 'wait':
        await executeWait(task)
        break
      case 'get_text':
        await executeGetText(task)
        break
      case 'screenshot':
        await executeScreenshot(task)
        break
      case 'if':
        await executeIf(task, onProgress, parentContext)
        break
      case 'while':
        await executeWhile(task, onProgress, parentContext)
        break
      case 'foreach':
        await executeForeach(task, onProgress, parentContext)
        break
      case 'try':
        await executeTry(task, onProgress, parentContext)
        break
      default:
        throw new Error(`未知的任务类型: ${task.type}`)
    }
    
    onProgress(task.id, 'success', `完成: ${task.name}`)
  } catch (error) {
    onProgress(task.id, 'error', `错误: ${error.message}`)
    throw error
  }
}

/**
 * 打开网页
 */
async function executeOpenBrowser(task) {
  const { url } = task.config
  console.log(`打开网页: ${url}`)
  await sleep(500) // 模拟网页加载
}

/**
 * 点击元素
 */
async function executeClickElement(task) {
  const { selector, description } = task.config
  console.log(`点击元素: ${selector} (${description})`)
  await sleep(300)
}

/**
 * 输入文本
 */
async function executeInputText(task) {
  const { selector, text } = task.config
  console.log(`输入文本到 ${selector}: ${text}`)
  await sleep(300)
}

/**
 * 等待
 */
async function executeWait(task) {
  const { duration } = task.config
  console.log(`等待 ${duration}ms`)
  await sleep(duration)
}

/**
 * 获取文本
 */
async function executeGetText(task) {
  const { selector, variable } = task.config
  const text = `模拟文本内容 from ${selector}`
  variables[variable] = text
  console.log(`获取文本并保存到 ${variable}: ${text}`)
  await sleep(300)
}

/**
 * 截图
 */
async function executeScreenshot(task) {
  const { filename } = task.config
  console.log(`截图保存为: ${filename}`)
  await sleep(400)
}

/**
 * IF条件判断
 */
async function executeIf(task, onProgress, parentContext) {
  const { condition } = task.config
  const result = evaluateCondition(condition, parentContext)
  
  console.log(`IF条件: ${condition} = ${result}`)
  
  if (result && task.children && task.children.length > 0) {
    console.log('执行 THEN 分支')
    await executeTasks(task.children, onProgress, parentContext)
  } else if (!result && task.elseChildren && task.elseChildren.length > 0) {
    console.log('执行 ELSE 分支')
    await executeTasks(task.elseChildren, onProgress, parentContext)
  }
}

/**
 * WHILE循环
 */
async function executeWhile(task, onProgress, parentContext) {
  const { condition, maxIterations } = task.config
  let iterations = 0
  
  console.log(`WHILE循环开始: ${condition}`)
  
  while (evaluateCondition(condition, parentContext) && iterations < maxIterations) {
    console.log(`第 ${iterations + 1} 次循环`)
    
    if (task.children && task.children.length > 0) {
      await executeTasks(task.children, onProgress, { ...parentContext, iteration: iterations })
    }
    
    iterations++
    variables.count = iterations // 更新循环计数器
    
    // 防止无限循环
    if (iterations >= maxIterations) {
      console.log(`达到最大迭代次数: ${maxIterations}`)
      break
    }
  }
  
  console.log(`WHILE循环结束，共执行 ${iterations} 次`)
}

/**
 * FOREACH遍历
 */
async function executeForeach(task, onProgress, parentContext) {
  const { items, itemVar } = task.config
  
  let itemsArray
  try {
    // 尝试解析JSON数组
    itemsArray = JSON.parse(items)
  } catch {
    // 如果不是JSON，尝试从变量获取
    itemsArray = variables[items] || []
  }
  
  if (!Array.isArray(itemsArray)) {
    throw new Error('FOREACH的items必须是数组')
  }
  
  console.log(`FOREACH遍历 ${itemsArray.length} 个元素`)
  
  for (let i = 0; i < itemsArray.length; i++) {
    const item = itemsArray[i]
    console.log(`处理第 ${i + 1} 个元素: ${item}`)
    
    // 创建新的上下文，包含当前项
    const context = {
      ...parentContext,
      [itemVar]: item,
      index: i
    }
    
    // 临时将当前项存储到全局变量
    variables[itemVar] = item
    variables.index = i
    
    if (task.children && task.children.length > 0) {
      await executeTasks(task.children, onProgress, context)
    }
  }
  
  console.log('FOREACH遍历完成')
}

/**
 * TRY异常处理
 */
async function executeTry(task, onProgress, parentContext) {
  console.log('TRY块开始')
  
  try {
    if (task.children && task.children.length > 0) {
      await executeTasks(task.children, onProgress, parentContext)
    }
    console.log('TRY块成功完成')
  } catch (error) {
    console.log(`捕获到异常: ${error.message}`)
    
    // 将异常信息存储到变量
    variables.error = error.message
    
    if (task.catchChildren && task.catchChildren.length > 0) {
      console.log('执行 CATCH 块')
      await executeTasks(task.catchChildren, onProgress, { ...parentContext, error: error.message })
    }
  }
}

/**
 * 评估条件表达式
 */
function evaluateCondition(condition, context = {}) {
  try {
    // 创建一个安全的上下文，合并全局变量和局部上下文
    const evalContext = { ...variables, ...context }
    
    // 构建参数列表
    const params = Object.keys(evalContext)
    const values = Object.values(evalContext)
    
    // 使用Function构造器创建一个安全的评估函数
    const func = new Function(...params, `return ${condition}`)
    const result = func(...values)
    
    return Boolean(result)
  } catch (error) {
    console.warn(`条件评估失败: ${condition}`, error)
    return false
  }
}

/**
 * 睡眠函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 导出变量访问函数（用于调试）
 */
export function getVariables() {
  return { ...variables }
}

export function setVariable(key, value) {
  variables[key] = value
}
