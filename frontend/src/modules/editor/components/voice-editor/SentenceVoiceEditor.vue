<template>
  <div class="sentence-voice-editor">
    <!-- 内容显示区域 -->
    <SentenceContentDisplay
      :sentence-text="sentenceText"
      :sentence-index="sentenceIndex"
      :sentence-duration="sentenceDuration"
      :selected-char-index="selectedCharIndex"
      :hovered-char-index="hoveredCharIndex"
      :pause-marks="pauseMarks"
      :pronunciation-marks="pronunciationMarks"
      @char-select="handleCharSelect"
      @char-hover="handleCharHover"
      @char-unhover="handleCharUnhover"
      ref="contentDisplayRef"
    />

    <!-- 语音编辑控制区域 -->
    <div class="voice-controls">
      <!-- 基础语音控制（音色、音量、语速） -->
      <BasicVoiceControls
        :current-voice="currentVoice"
        :initial-volume="volume"
        :initial-speed="speed"
        :voice-categories="voiceCategories"
        @update-voice="handleVoiceUpdate"
        @update-volume="handleVolumeUpdate"
        @update-speed="handleSpeedUpdate"
      />

      <!-- 高级语音控制（音调、停顿、多音字） -->
      <AdvancedVoiceControls
        :initial-pitch="pitch"
        :has-selected-char="selectedCharIndex !== null"
        :show-polyphone-selection="showPolyphoneSelection"
        :polyphone-options="polyphoneOptions"
        :selected-pronunciation="selectedPronunciation"
        @update-pitch="handlePitchUpdate"
        @add-pause="handleAddPause"
        @remove-pause="handleRemovePause"
        @update-pronunciation="handlePronunciationUpdate"
      />
    </div>

    <!-- SSML预览 -->
    <SSMLPreview
      :current-voice="currentVoice"
      :volume="volume"
      :speed="speed"
      :pitch="pitch"
      :display-text="displayText"
      :pause-marks="pauseMarks"
      :pronunciation-marks="pronunciationMarks"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import SentenceContentDisplay from './SentenceContentDisplay.vue'
import BasicVoiceControls from './BasicVoiceControls.vue'
import AdvancedVoiceControls from './AdvancedVoiceControls.vue'
import SSMLPreview from './SSMLPreview.vue'
import PinyinPolyphoneProcessor from '@/utils/polyphone/PinyinProcessor'

interface Voice {
  id: string
  name: string
  category: string
  avatar: string
  description?: string
  ssmlName: string
}

interface VoiceCategory {
  id: string
  name: string
  voices: Voice[]
}

interface PolyphoneOption {
  pinyin: string
  tone: string
  meaning: string
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
  sentenceText: string
  sentenceIndex: number
  sentenceDuration: number
  initialVoice?: Voice
  initialVolume?: number
  initialSpeed?: number
  initialPitch?: number
}

interface Emits {
  (e: 'update-ssml', ssml: string): void
  (e: 'update-voice', voice: Voice): void
  (e: 'update-volume', volume: number): void
  (e: 'update-speed', speed: number): void
  (e: 'update-pitch', pitch: number): void
}

const props = withDefaults(defineProps<Props>(), {
  initialVolume: 1,
  initialSpeed: 1,
  initialPitch: 1
})

const emit = defineEmits<Emits>()

// 组件引用
const contentDisplayRef = ref()

// 响应式数据
const selectedCharIndex = ref<number | null>(null)
const hoveredCharIndex = ref<number | null>(null)
const showPolyphoneSelection = ref(false)
const selectedPronunciation = ref('')

// 语音设置
const currentVoice = ref<Voice>(props.initialVoice || getDefaultVoice())
const volume = ref(props.initialVolume)
const speed = ref(props.initialSpeed)
const pitch = ref(props.initialPitch)

// 编辑标记
const pauseMarks = ref<PauseMark[]>([])
const pronunciationMarks = ref<PronunciationMark[]>([])

// 多音字数据
const polyphoneOptions = ref<PolyphoneOption[]>([])

// 计算属性
const displayText = computed(() => {
  if (contentDisplayRef.value?.displayText) {
    return contentDisplayRef.value.displayText
  }
  return []
})

// 虚拟音色数据
const voiceCategories = ref<VoiceCategory[]>([
  {
    id: 'classical',
    name: '古典人物',
    voices: [
      {
        id: 'caocao',
        name: '曹操',
        category: '古典人物',
        avatar: 'https://via.placeholder.com/60x60/4A90E2/FFFFFF?text=曹',
        description: '雄浑有力，适合历史题材',
        ssmlName: 'zh-CN-XiaoxiaoNeural'
      },
      {
        id: 'liubang',
        name: '刘邦',
        category: '古典人物',
        avatar: 'https://via.placeholder.com/60x60/7ED321/FFFFFF?text=刘',
        description: '威严庄重，帝王风范',
        ssmlName: 'zh-CN-YunxiNeural'
      },
      {
        id: 'zhugeliang',
        name: '诸葛亮',
        category: '古典人物',
        avatar: 'https://via.placeholder.com/60x60/F5A623/FFFFFF?text=诸',
        description: '智慧深沉，谋士风范',
        ssmlName: 'zh-CN-YunyangNeural'
      }
    ]
  },
  {
    id: 'modern',
    name: '现代人物',
    voices: [
      {
        id: 'zhichu',
        name: '知初',
        category: '现代人物',
        avatar: 'https://via.placeholder.com/60x60/50E3C2/FFFFFF?text=知',
        description: '清新自然，适合日常对话',
        ssmlName: 'zh-CN-XiaoxiaoNeural'
      },
      {
        id: 'zhimei',
        name: '知美',
        category: '现代人物',
        avatar: 'https://via.placeholder.com/60x60/BD10E0/FFFFFF?text=美',
        description: '温柔甜美，适合情感表达',
        ssmlName: 'zh-CN-XiaohanNeural'
      },
      {
        id: 'zhiwen',
        name: '知文',
        category: '现代人物',
        avatar: 'https://via.placeholder.com/60x60/B8E986/FFFFFF?text=文',
        description: '文雅知性，适合知识讲解',
        ssmlName: 'zh-CN-YunxiNeural'
      }
    ]
  },
  {
    id: 'special',
    name: '特色音色',
    voices: [
      {
        id: 'robot',
        name: '机器人',
        category: '特色音色',
        avatar: 'https://via.placeholder.com/60x60/9013FE/FFFFFF?text=机',
        description: '科技感十足，未来风格',
        ssmlName: 'zh-CN-YunyangNeural'
      },
      {
        id: 'child',
        name: '儿童',
        category: '特色音色',
        avatar: 'https://via.placeholder.com/60x60/417505/FFFFFF?text=童',
        description: '天真可爱，适合儿童内容',
        ssmlName: 'zh-CN-XiaoxiaoNeural'
      },
      {
        id: 'elder',
        name: '长者',
        category: '特色音色',
        avatar: 'https://via.placeholder.com/60x60/F8E71C/FFFFFF?text=长',
        description: '慈祥温和，适合故事讲述',
        ssmlName: 'zh-CN-YunxiNeural'
      }
    ]
  }
])

// 方法
function getDefaultVoice(): Voice {
  return voiceCategories.value[0].voices[0]
}

function handleCharSelect(index: number) {
  selectedCharIndex.value = index
  const selectedItem = displayText.value[index]

  // 检查是否为多音字
  const polyphoneData = getPolyphoneData(selectedItem)
  if (polyphoneData && polyphoneData.length > 1) {
    polyphoneOptions.value = polyphoneData
    showPolyphoneSelection.value = true

    // 设置当前选中的发音
    const existingPronunciation = pronunciationMarks.value.find(p => p.charIndex === index)
    selectedPronunciation.value = existingPronunciation ? existingPronunciation.pinyin : polyphoneData[0].pinyin
  } else {
    showPolyphoneSelection.value = false
  }
}

function handleCharHover(index: number) {
  hoveredCharIndex.value = index
}

function handleCharUnhover() {
  hoveredCharIndex.value = null
}

function getPolyphoneData(char: string): PolyphoneOption[] | null {
  // 使用新的拼音处理器
  const options = PinyinPolyphoneProcessor.getPolyphoneOptions(char)
  if (options && options.length > 1) {
    return options.map(option => ({
      pinyin: option.pinyin,
      tone: option.tone,
      meaning: option.meaning
    }))
  }
  return null
}

function handleVoiceUpdate(voice: Voice) {
  currentVoice.value = voice
  emit('update-voice', voice)
  updateSSML()
}

function handleVolumeUpdate(newVolume: number) {
  volume.value = newVolume
  emit('update-volume', newVolume)
  updateSSML()
}

function handleSpeedUpdate(newSpeed: number) {
  speed.value = newSpeed
  emit('update-speed', newSpeed)
  updateSSML()
}

function handlePitchUpdate(newPitch: number) {
  pitch.value = newPitch
  emit('update-pitch', newPitch)
  updateSSML()
}

function handleAddPause(duration: number) {
  if (selectedCharIndex.value !== null) {
    // 移除现有的停顿标记
    pauseMarks.value = pauseMarks.value.filter(p => p.charIndex !== selectedCharIndex.value)

    // 添加新的停顿标记
    pauseMarks.value.push({
      charIndex: selectedCharIndex.value,
      duration: duration
    })

    updateSSML()
    ElMessage.success(`在"${displayText.value[selectedCharIndex.value]}"后添加了${duration}秒停顿`)
  }
}

function handleRemovePause() {
  if (selectedCharIndex.value !== null) {
    const existingPause = pauseMarks.value.find(p => p.charIndex === selectedCharIndex.value)
    if (existingPause) {
      pauseMarks.value = pauseMarks.value.filter(p => p.charIndex !== selectedCharIndex.value)
      updateSSML()
      ElMessage.success(`已移除"${displayText.value[selectedCharIndex.value]}"后的停顿`)
    } else {
      ElMessage.warning(`"${displayText.value[selectedCharIndex.value]}"后没有停顿标记`)
    }
  }
}

function handlePronunciationUpdate(pinyin: string) {
  if (selectedCharIndex.value !== null && pinyin) {
    // 移除现有的发音标记
    pronunciationMarks.value = pronunciationMarks.value.filter(p => p.charIndex !== selectedCharIndex.value)

    // 添加新的发音标记
    pronunciationMarks.value.push({
      charIndex: selectedCharIndex.value,
      pinyin: pinyin
    })

    updateSSML()
  }
}

function updateSSML() {
  let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">`

  // 添加语音设置
  ssml += `<voice name="${currentVoice.value.ssmlName}">`
  ssml += `<prosody rate="${speed.value}" pitch="${pitch.value}" volume="${Math.round(volume.value * 100)}%">`

  // 构建文本内容
  let textContent = ''
  for (let i = 0; i < displayText.value.length; i++) {
    const char = displayText.value[i]

    // 检查是否有发音标记
    const pronunciation = pronunciationMarks.value.find(p => p.charIndex === i)
    if (pronunciation) {
      textContent += `<phoneme alphabet="pinyin" ph="${pronunciation.pinyin}">${char}</phoneme>`
    } else {
      textContent += char
    }

    // 检查是否有停顿标记
    const pause = pauseMarks.value.find(p => p.charIndex === i)
    if (pause) {
      textContent += `<break time="${pause.duration}s"/>`
    }
  }

  ssml += textContent
  ssml += `</prosody>`
  ssml += `</voice>`
  ssml += `</speak>`

  emit('update-ssml', ssml)
}

// 监听属性变化
watch(() => props.sentenceText, () => {
  // 清空所有标记
  pauseMarks.value = []
  pronunciationMarks.value = []
  selectedCharIndex.value = null
  showPolyphoneSelection.value = false
  updateSSML()
})

// 初始化
updateSSML()
</script>

<script lang="ts">
export default {
  name: 'SentenceVoiceEditor'
}
</script>

<style scoped>
.sentence-voice-editor {
  width: 1000px;
  max-width: 1000px;
  height: 100%;
  max-height: 300vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background: #2a2a2a;
  color: white;
  border-radius: 16px;
  margin: 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 语音控制区域 */
.voice-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sentence-voice-editor {
    width: 700px;
    max-width: 700px;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .sentence-voice-editor {
    width: 100%;
    max-width: 100%;
    padding: 12px;
    gap: 16px;
  }
}
</style>