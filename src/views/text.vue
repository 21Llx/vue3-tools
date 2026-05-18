<template>
  <div class="dynamic-wrap-demo">
    <!-- 控制栏 -->
    <div class="toolbar">
      <div class="info">
        <span>🖱️ 拖拽图片移动</span>
        <span>✨ 文字四周环绕包裹</span>
        <span>⚡ 使用 Pretext 引擎</span>
      </div>
      <div class="controls">
        <button @click="resetImage" class="btn">重置位置</button>
        <button @click="toggleDebug" class="btn" :class="{ active: showDebug }">
          {{ showDebug ? '隐藏' : '显示' }}调试信息
        </button>
        <button @click="switchText" class="btn">切换文本</button>
      </div>
    </div>

    <!-- Canvas 画布 -->
    <div class="canvas-container" ref="containerRef">
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
        @touchstart="startDrag"
        @touchmove="onDrag"
        @touchend="stopDrag"
      ></canvas>

      <!-- 性能面板 -->
      <div class="performance-panel" v-if="showDebug">
        <div>🎯 FPS: {{ fps }}</div>
        <div>📝 行数: {{ lineCount }}</div>
        <div>⏱️ 布局耗时: {{ layoutTime }}ms</div>
        <div>🖼️ 图片位置: ({{ imgX.toFixed(0) }}, {{ imgY.toFixed(0) }})</div>
        <div>📐 环绕模式: 四周包裹</div>
      </div>
    </div>

    <!-- 图例说明 -->
    <div class="legend">
      <div class="legend-item"><span class="color-box" style="background: #667eea;"></span>文本流</div>
      <div class="legend-item"><span class="color-box" style="background: #f093fb;"></span>可拖拽图片</div>
      <div class="legend-item"><span class="color-box" style="background: rgba(102,126,234,0.2);"></span>文本包裹区域</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'

// ==================== 配置参数 ====================
const canvasWidth = ref(900)
const canvasHeight = ref(600)
const imgWidth = 120
const imgHeight = 120
const imgX = ref(400)
const imgY = ref(240)
const lineHeight = 26
const marginX = 40
const marginY = 40
const fontSize = 16
const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
const fontString = `${fontSize}px ${fontFamily}`

// ==================== 状态变量 ====================
const canvasRef = ref(null)
const containerRef = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const showDebug = ref(false)
const lineCount = ref(0)
const layoutTime = ref(0)
const fps = ref(60)

// 文本库
const texts = [
  `人工智能（Artificial Intelligence，简称AI）是计算机科学的一个重要分支，旨在创建能够模拟、延伸和扩展人类智能的理论、方法、技术及应用系统。自1956年达特茅斯会议正式提出"人工智能"这一概念以来，AI已经走过了近七十年的发展历程。

近年来，随着深度学习技术的突破性进展，人工智能在图像识别、自然语言处理、语音识别等领域取得了前所未有的成就。特别是GPT系列大语言模型的问世，标志着AI进入了新的发展阶段。这些模型能够理解上下文、回答问题、撰写文章、编写代码，甚至展现出一定的推理能力，让人们对AI的潜力有了全新的认识。

然而，AI技术的发展也带来了诸多挑战和思考。数据隐私保护、算法偏见消除、AI伦理规范、就业市场影响等问题日益凸显。如何在推动技术进步的同时，确保AI系统的安全性、透明度和公平性，成为研究人员、企业和社会各界共同面对的重要议题。

未来，人机协作的新模式正在各个行业逐渐形成。AI不再是取代人类的威胁，而是增强人类能力的得力助手。在医疗领域，AI辅助诊断系统帮助医生更准确地发现病灶；在教育领域，个性化学习系统为每个学生提供定制化的学习路径；在科研领域，AI加速了新材料的发现和药物的研发进程。

让我们拥抱这个充满可能性的AI时代，同时保持理性和审慎，共同探索人与人工智能和谐共处的美好未来。`,

  `Vue.js 是一个用于构建用户界面的渐进式 JavaScript 框架。它采用组件化的开发方式，使得代码更加模块化和可维护。Vue 3 引入了 Composition API，提供了更好的逻辑复用和代码组织能力，配合 TypeScript 使用可以获得更好的类型推导和开发体验。

Pretext 是一个革命性的文本布局库，专注于解决复杂的排版需求。它采用"先测量，后布局"的设计理念，将昂贵的文本测量和快速的布局计算分离，使得在响应式布局和动画场景下都能获得极致的性能表现。

动态图文环绕是 Pretext 最令人惊叹的能力之一。当图片在文本中移动时，文本会像水流一样自动避让，形成流畅的环绕效果。这种效果在过去需要复杂的碰撞检测和昂贵的 DOM 操作，而现在借助 Pretext 的纯数学布局计算，可以轻松实现 120fps 的丝滑体验。`
]

let currentTextIndex = ref(0)
let preparedCache = null
let animationFrameId = null
let lastFrameTime = 0
let frameCount = 0

// ==================== 图片边界计算 ====================
const imageBounds = computed(() => ({
  left: imgX.value,
  right: imgX.value + imgWidth,
  top: imgY.value,
  bottom: imgY.value + imgHeight
}))

// ==================== 核心算法：智能文本环绕 ====================

/**
 * 计算文本行与图片的碰撞类型
 * @returns {string} 'none' | 'left' | 'right' | 'top' | 'bottom' | 'full'
 */
function getCollisionType(lineY, lineH, lineWidth) {
  const bounds = imageBounds.value
  const lineTop = lineY
  const lineBottom = lineY + lineH
  const lineCenterY = (lineTop + lineBottom) / 2
  
  // 检查是否与图片垂直重叠
  const verticalOverlap = !(lineBottom < bounds.top || lineTop > bounds.bottom)
  
  if (!verticalOverlap) {
    return 'none'
  }
  
  // 计算水平重叠情况
  const lineLeft = marginX
  const lineRight = marginX + lineWidth
  
  // 完全覆盖图片
  if (lineLeft <= bounds.left && lineRight >= bounds.right) {
    // 根据行的垂直位置决定是上环绕还是下环绕
    if (lineBottom <= bounds.top + 10) {
      return 'top'
    } else if (lineTop >= bounds.bottom - 10) {
      return 'bottom'
    } else {
      return 'full'
    }
  }
  
  // 只与左侧重叠
  if (lineRight > bounds.left && lineRight <= bounds.right) {
    return 'left'
  }
  
  // 只与右侧重叠
  if (lineLeft < bounds.right && lineLeft >= bounds.left) {
    return 'right'
  }
  
  return 'none'
}

/**
 * 获取文本行的可用宽度和起始位置（四周环绕算法）
 */
function getLineLayout(lineY, lineH, lineIndex) {
  const bounds = imageBounds.value
  const fullWidth = canvasWidth.value - marginX * 2
  const collisionType = getCollisionType(lineY, lineH, fullWidth)
  
  // 无碰撞：使用完整宽度
  if (collisionType === 'none') {
    return {
      startX: marginX,
      availableWidth: fullWidth,
      type: 'full'
    }
  }
  
  // 顶部环绕：图片上方，使用完整宽度
  if (collisionType === 'top') {
    return {
      startX: marginX,
      availableWidth: fullWidth,
      type: 'top'
    }
  }
  
  // 底部环绕：图片下方，使用完整宽度
  if (collisionType === 'bottom') {
    return {
      startX: marginX,
      availableWidth: fullWidth,
      type: 'bottom'
    }
  }
  
  // 完全覆盖：需要分左右两栏布局
  if (collisionType === 'full') {
    const leftWidth = bounds.left - marginX - 10
    const rightWidth = canvasWidth.value - marginX - bounds.right - 10
    
    // 根据行索引交替使用左右两侧（形成真正的环绕效果）
    // 这样可以实现文字在图片左右两侧都出现，而不是只有一侧
    const useLeftFirst = Math.floor(lineIndex / 2) % 2 === 0
    
    if (useLeftFirst && leftWidth > 30) {
      return {
        startX: marginX,
        availableWidth: leftWidth,
        type: 'left',
        nextLineOffset: 0
      }
    } else if (rightWidth > 30) {
      return {
        startX: bounds.right + 10,
        availableWidth: rightWidth,
        type: 'right',
        nextLineOffset: 0
      }
    }
  }
  
  // 左侧碰撞：文字放在图片右侧
  if (collisionType === 'left') {
    const rightWidth = canvasWidth.value - marginX - bounds.right - 10
    if (rightWidth > 30) {
      return {
        startX: bounds.right + 10,
        availableWidth: rightWidth,
        type: 'right'
      }
    }
  }
  
  // 右侧碰撞：文字放在图片左侧
  if (collisionType === 'right') {
    const leftWidth = bounds.left - marginX - 10
    if (leftWidth > 30) {
      return {
        startX: marginX,
        availableWidth: leftWidth,
        type: 'left'
      }
    }
  }
  
  // 默认：使用完整宽度
  return {
    startX: marginX,
    availableWidth: fullWidth,
    type: 'full'
  }
}

// ==================== 渲染引擎 ====================
function render() {
  if (!canvasRef.value || !preparedCache) return
  
  const startTime = performance.now()
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  // 绘制背景网格
  drawBackground(ctx)
  
  // 设置文本样式
  ctx.font = fontString
  ctx.fillStyle = '#2c3e50'
  ctx.textBaseline = 'top'
  
  // Pretext 布局计算
  let cursor = { segmentIndex: 0, graphemeIndex: 0 }
  let currentY = marginY
  let lines = 0
  let lineIndex = 0
  
  // 存储渲染的行信息
  const renderedLines = []
  
  while (true) {
    if (currentY > canvasHeight.value - marginY) break
    
    // 获取当前行的布局信息
    const layout = getLineLayout(currentY, lineHeight, lineIndex)
    
    if (layout.availableWidth <= 0) {
      currentY += lineHeight
      lineIndex++
      continue
    }
    console.log(cursor)
    console.log(preparedCache)
    // 使用 Pretext 获取下一行文本
    const line = layoutNextLine(preparedCache, cursor, layout.availableWidth)
    if (line === null) break
    
    // 绘制文本行
    ctx.fillText(line.text, layout.startX, currentY)
    
    // 调试模式：显示文本行边界
    if (showDebug.value) {
      ctx.save()
      ctx.globalAlpha = 0.15
      // 根据布局类型使用不同颜色
      if (layout.type === 'left') {
        ctx.fillStyle = '#4ecdc4'
      } else if (layout.type === 'right') {
        ctx.fillStyle = '#ff6b6b'
      } else {
        ctx.fillStyle = '#667eea'
      }
      ctx.fillRect(layout.startX, currentY, line.width, lineHeight)
      
      // 显示布局类型标签
      ctx.globalAlpha = 0.5
      ctx.font = '10px monospace'
      ctx.fillStyle = '#666'
      ctx.fillText(layout.type, layout.startX, currentY - 2)
      ctx.restore()
    }
    
    renderedLines.push({
      text: line.text.substring(0, 30),
      y: currentY,
      type: layout.type
    })
    
    cursor = line.end
    currentY += lineHeight
    lines++
    lineIndex++
  }
  
  lineCount.value = lines
  layoutTime.value = (performance.now() - startTime).toFixed(2)
  
  // 绘制图片
  drawImage(ctx)
  
  // 调试输出
  if (showDebug.value) {
    console.log(`渲染完成: ${lines}行, 左侧布局: ${renderedLines.filter(l => l.type === 'left').length}行, 右侧布局: ${renderedLines.filter(l => l.type === 'right').length}行`)
  }
}

// 绘制背景网格
function drawBackground(ctx) {
  ctx.save()
  ctx.globalAlpha = 0.03
  ctx.strokeStyle = '#667eea'
  ctx.lineWidth = 1
  
  for (let x = 0; x < canvasWidth.value; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasHeight.value)
    ctx.stroke()
  }
  
  for (let y = 0; y < canvasHeight.value; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvasWidth.value, y)
    ctx.stroke()
  }
  
  ctx.restore()
}

// 绘制可拖拽图片
function drawImage(ctx) {
  const bounds = imageBounds.value
  
  // 绘制阴影
  ctx.shadowBlur = 15
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4
  
  // 渐变背景
  const gradient = ctx.createLinearGradient(
    bounds.left, bounds.top,
    bounds.right, bounds.bottom
  )
  gradient.addColorStop(0, '#f093fb')
  gradient.addColorStop(1, '#f5576c')
  
  ctx.fillStyle = gradient
  ctx.fillRect(bounds.left, bounds.top, imgWidth, imgHeight)
  
  // 白色边框
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.strokeRect(bounds.left, bounds.top, imgWidth, imgHeight)
  
  // 图标
  ctx.font = `${imgWidth * 0.4}px "Segoe UI Emoji"`
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('📷', bounds.left + imgWidth / 2, bounds.top + imgHeight / 2)
  
  // 拖拽提示
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText('拖拽移动', bounds.left + imgWidth / 2, bounds.top + imgHeight - 15)
  
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  // 调试模式：显示图片边界
  if (showDebug.value) {
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(bounds.left, bounds.top, imgWidth, imgHeight)
    ctx.setLineDash([])
    ctx.restore()
  }
}

// ==================== 拖拽交互 ====================
function startDrag(event) {
  event.preventDefault()
  
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasWidth.value / rect.width
  const scaleY = canvasHeight.value / rect.height
  
  let clientX, clientY
  if (event.touches) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }
  
  const canvasX = (clientX - rect.left) * scaleX
  const canvasY = (clientY - rect.top) * scaleY
  
  if (canvasX >= imgX.value && canvasX <= imgX.value + imgWidth &&
      canvasY >= imgY.value && canvasY <= imgY.value + imgHeight) {
    isDragging.value = true
    dragOffset.value = {
      x: canvasX - imgX.value,
      y: canvasY - imgY.value
    }
    canvasRef.value.style.cursor = 'grabbing'
  }
}

function onDrag(event) {
  if (!isDragging.value) return
  
  event.preventDefault()
  
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasWidth.value / rect.width
  const scaleY = canvasHeight.value / rect.height
  
  let clientX, clientY
  if (event.touches) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }
  
  let newX = (clientX - rect.left) * scaleX - dragOffset.value.x
  let newY = (clientY - rect.top) * scaleY - dragOffset.value.y
  
  // 边界限制
  newX = Math.max(marginX, Math.min(canvasWidth.value - imgWidth - marginX, newX))
  newY = Math.max(marginY, Math.min(canvasHeight.value - imgHeight - marginY, newY))
  
  imgX.value = newX
  imgY.value = newY
}

function stopDrag() {
  if (isDragging.value) {
    isDragging.value = false
    if (canvasRef.value) {
      canvasRef.value.style.cursor = 'grab'
    }
  }
}

// ==================== 辅助功能 ====================
function resetImage() {
  imgX.value = canvasWidth.value / 2 - imgWidth / 2
  imgY.value = canvasHeight.value / 2 - imgHeight / 2
}

function toggleDebug() {
  showDebug.value = !showDebug.value
  render()
}

function switchText() {
  currentTextIndex.value = (currentTextIndex.value + 1) % texts.length
  preparedCache = prepareWithSegments(texts[currentTextIndex.value], fontString)
  render()
}

// FPS 计算
function calculateFPS() {
  const now = performance.now()
  frameCount++
  
  if (now - lastFrameTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastFrameTime = now
  }
  
  animationFrameId = requestAnimationFrame(calculateFPS)
}

// ==================== 生命周期 ====================
watch([imgX, imgY], () => {
  render()
})

watch([canvasWidth, canvasHeight], () => {
  if (preparedCache) render()
})

onMounted(async () => {
  await nextTick()
  
  // 初始化 Pretext
  preparedCache = prepareWithSegments(texts[currentTextIndex.value], fontString)
  
  // 设置鼠标样式
  if (canvasRef.value) {
    canvasRef.value.style.cursor = 'grab'
  }
  
  // 初始渲染
  render()
  
  // 启动 FPS 监控
  lastFrameTime = performance.now()
  animationFrameId = requestAnimationFrame(calculateFPS)
  
  // 响应窗口大小变化
  const handleResize = () => {
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      canvasWidth.value = rect.width
      canvasHeight.value = rect.height
      render()
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
  })
})
</script>

<style scoped>
.dynamic-wrap-demo {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
}

.toolbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.info {
  display: flex;
  gap: 24px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.info span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 20px;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn.active {
  background: #667eea;
  color: white;
}

.canvas-container {
  flex: 1;
  position: relative;
  margin: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
  background: white;
}

canvas:active {
  cursor: grabbing;
}

.performance-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 12px 16px;
  border-radius: 12px;
  color: #00ff00;
  font-family: monospace;
  font-size: 12px;
  z-index: 20;
  pointer-events: none;
  min-width: 200px;
}

.performance-panel div {
  margin: 4px 0;
}

.legend {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 10px 16px;
  border-radius: 12px;
  display: flex;
  gap: 16px;
  font-size: 12px;
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
  
  .info {
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }
  
  .canvas-container {
    margin: 10px;
  }
  
  .legend {
    bottom: 10px;
    right: 10px;
    left: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .performance-panel {
    top: 10px;
    right: 10px;
    font-size: 10px;
    min-width: 160px;
  }
}
</style>