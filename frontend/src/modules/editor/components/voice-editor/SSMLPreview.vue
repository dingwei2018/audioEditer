<template>
  <div class="ssml-preview">
    <div class="section-header">
      <label>SSML标记预览</label>
      <el-button
        @click="copySSML"
        type="info"
        size="small"
        icon="CopyDocument"
      >
        复制
      </el-button>
    </div>
    <div class="ssml-content">
      <pre>{{ ssmlContent }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

interface Voice {
  id: string
  name: string
  category: string
  avatar: string
  description?: string
  ssmlName: string
}

interface PauseMark {
  charIndex: number
  duration: number
}

interface PronunciationMark {
  charIndex: number
  pinyin: string
}

interface Props {
  currentVoice: Voice
  volume: number
  speed: number
  pitch: number
  displayText: string[]
  pauseMarks: PauseMark[]
  pronunciationMarks: PronunciationMark[]
}

const props = defineProps<Props>()

// 计算属性
const ssmlContent = computed(() => {
  let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">`

  // 添加语音设置
  ssml += `<voice name="${props.currentVoice.ssmlName}">`
  ssml += `<prosody rate="${props.speed}" pitch="${props.pitch}" volume="${Math.round(props.volume * 100)}%">`

  // 构建文本内容
  let textContent = ''
  for (let i = 0; i < props.displayText.length; i++) {
    const char = props.displayText[i]

    // 检查是否有发音标记
    const pronunciation = props.pronunciationMarks.find(p => p.charIndex === i)
    if (pronunciation) {
      textContent += `<phoneme alphabet="pinyin" ph="${pronunciation.pinyin}">${char}</phoneme>`
    } else {
      textContent += char
    }

    // 检查是否有停顿标记
    const pause = props.pauseMarks.find(p => p.charIndex === i)
    if (pause) {
      textContent += `<break time="${pause.duration}s"/>`
    }
  }

  ssml += textContent
  ssml += `</prosody>`
  ssml += `</voice>`
  ssml += `</speak>`

  return ssml
})

// 方法
function copySSML() {
  navigator.clipboard.writeText(ssmlContent.value).then(() => {
    ElMessage.success('SSML已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
/* SSML预览 */
.ssml-preview {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header label {
  color: #cccccc;
  font-weight: 500;
  font-size: 14px;
}

.ssml-content {
  background: #333;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #444;
  max-height: 200px;
  overflow-y: auto;
}

.ssml-content pre {
  margin: 0;
  color: #cccccc;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

<script lang="ts">
export default {
  name: 'SSMLPreview'
}
</script>