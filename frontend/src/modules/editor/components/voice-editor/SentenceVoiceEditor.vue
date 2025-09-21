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
      :current-segment="currentSegment || null"
      @char-select="handleCharSelect"
      @char-hover="handleCharHover"
      @char-unhover="handleCharUnhover"
      @synthesize-audio="handleSynthesizeAudio"
      @play-audio="handlePlayAudio"
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
        @cancel-pronunciation="handleCancelPronunciation"
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
import { ref, computed, watch, nextTick } from 'vue'
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

interface SegmentWithTiming {
  id: string
  text: string
  startTime: number
  endTime: number
  duration: number
  isPlaying: boolean
  audioUrl?: string
  voice?: string
  speed?: number
  pitch?: number
  volume?: number
  ssml?: string
}

interface Props {
  sentenceText: string
  sentenceIndex: number
  sentenceDuration: number
  initialVoice?: Voice
  initialVolume?: number
  initialSpeed?: number
  initialPitch?: number
  currentSegment?: SegmentWithTiming | null
}

interface Emits {
  (e: 'update-ssml', ssml: string): void
  (e: 'update-voice', voice: Voice): void
  (e: 'update-volume', volume: number): void
  (e: 'update-speed', speed: number): void
  (e: 'update-pitch', pitch: number): void
  (e: 'update-pause-marks', pauseMarks: PauseMark[]): void
  (e: 'update-pronunciation-marks', pronunciationMarks: PronunciationMark[]): void
  (e: 'synthesize-audio', segment: SegmentWithTiming): void
  (e: 'play-audio', segment: SegmentWithTiming): void
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

// 语音设置 - 先定义默认值，稍后在voiceCategories定义后重新初始化
const currentVoice = ref<Voice>(props.initialVoice || {
  id: 'zhichu',
  name: '知初',
  category: '现代人物',
  avatar: '/header/zc.jpeg',
  description: '清新自然，适合日常对话',
  ssmlName: 'zh-CN-XiaoxiaoNeural'
})

const volume = ref((props.currentSegment as any)?.volume ?? props.initialVolume)
const speed = ref((props.currentSegment as any)?.speed ?? props.initialSpeed)
const pitch = ref((props.currentSegment as any)?.pitch ?? props.initialPitch)

// 编辑标记 - 从currentSegment中读取已保存的设置
const pauseMarks = ref<PauseMark[]>((props.currentSegment as any)?.pauseMarks || [])
const pronunciationMarks = ref<PronunciationMark[]>((props.currentSegment as any)?.pronunciationMarks || [])


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
        avatar: '/header/cc.jpeg',
        description: '雄浑有力，适合历史题材',
        ssmlName: 'zh-CN-XiaoxiaoNeural'
      },
      {
        id: 'liubang',
        name: '刘邦',
        category: '古典人物',
        avatar: '/header/lb.jpeg',
        description: '威严庄重，帝王风范',
        ssmlName: 'zh-CN-YunxiNeural'
      },
      {
        id: 'zhugeliang',
        name: '诸葛亮',
        category: '古典人物',
        avatar: '/header/zgl.jpeg',
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
        avatar: '/header/zc.jpeg',
        description: '清新自然，适合日常对话',
        ssmlName: 'zh-CN-XiaoxiaoNeural'
      },
      {
        id: 'zhimei',
        name: '知美',
        category: '现代人物',
        avatar: '/header/zc.jpeg',
        description: '温柔甜美，适合情感表达',
        ssmlName: 'zh-CN-XiaohanNeural'
      },
      {
        id: 'zhiwen',
        name: '知文',
        category: '现代人物',
        avatar: '/header/zc.jpeg',
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

// 获取初始语音设置
const getInitialVoice = (): Voice => {
  if (props.currentSegment && (props.currentSegment as any).voice) {
    const savedVoice = voiceCategories.value
      .reduce((acc, cat) => [...acc, ...cat.voices], [] as Voice[])
      .find(voice => voice.id === (props.currentSegment as any).voice)
    return savedVoice || getDefaultVoice()
  }
  return props.initialVoice || getDefaultVoice()
}

// 初始化语音设置
if (props.currentSegment && (props.currentSegment as any).voice) {
  currentVoice.value = getInitialVoice()
}

// 按单词分割文本的函数
function splitTextByWords(text: string): string[] {
  const result: string[] = []
  let currentWord = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    
    // 如果是英文字母或数字，累积成单词
    if (/^[a-zA-Z0-9]$/.test(char)) {
      currentWord += char
    } else {
      // 如果当前有累积的单词，先添加单词
      if (currentWord) {
        result.push(currentWord)
        currentWord = ''
      }
      // 添加当前字符
      result.push(char)
    }
  }
  
  // 处理最后的单词
  if (currentWord) {
    result.push(currentWord)
  }
  
  return result
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
    selectedPronunciation.value = existingPronunciation ? existingPronunciation.pinyin : ''
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

function handleSynthesizeAudio(segment: SegmentWithTiming) {
  emit('synthesize-audio', segment)
}

function handlePlayAudio(segment: SegmentWithTiming) {
  emit('play-audio', segment)
}

function handleAddPause(duration: number) {
  
  if (selectedCharIndex.value !== null) {
    // 移除现有的停顿标记
    pauseMarks.value = pauseMarks.value.filter(p => p.charIndex !== selectedCharIndex.value)

    // 添加新的停顿标记
    const newPauseMark = {
      charIndex: selectedCharIndex.value,
      duration: duration
    }
    pauseMarks.value.push(newPauseMark)
    
    // 发出停顿标记更新事件
    emit('update-pause-marks', pauseMarks.value)
    
    // 延迟更新SSML，确保pauseMarks先保存到store
    nextTick(() => {
      updateSSML()
    })
    ElMessage.success(`在"${displayText.value[selectedCharIndex.value]}"后添加了${duration}秒停顿`)
  } else {
    console.error('SentenceVoiceEditor - selectedCharIndex is null')
  }
}

function handleRemovePause() {
  if (selectedCharIndex.value !== null) {
    const existingPause = pauseMarks.value.find(p => p.charIndex === selectedCharIndex.value)
    if (existingPause) {
      pauseMarks.value = pauseMarks.value.filter(p => p.charIndex !== selectedCharIndex.value)
      
      // 发出停顿标记更新事件
      emit('update-pause-marks', pauseMarks.value)
      
      // 延迟更新SSML，确保pauseMarks先保存到store
      nextTick(() => {
        updateSSML()
      })
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

    // 更新选中的发音
    selectedPronunciation.value = pinyin

    // 发出发音标记更新事件
    emit('update-pronunciation-marks', pronunciationMarks.value)
    updateSSML()
    ElMessage.success(`已设置"${displayText.value[selectedCharIndex.value]}"的发音为：${pinyin}`)
  }
}

function handleCancelPronunciation() {
  if (selectedCharIndex.value !== null) {
    // 移除该字符的发音标记
    pronunciationMarks.value = pronunciationMarks.value.filter(p => p.charIndex !== selectedCharIndex.value)
    
    // 重置选中的发音
    selectedPronunciation.value = ''
    
    // 发出发音标记更新事件
    emit('update-pronunciation-marks', pronunciationMarks.value)
    updateSSML()
    ElMessage.success(`已取消"${displayText.value[selectedCharIndex.value]}"的多音字设置`)
  }
}

function updateSSML() {
  
  let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">`

  // 添加语音设置
  ssml += `<voice name="${currentVoice.value.ssmlName}">`
  ssml += `<prosody rate="${speed.value}" pitch="${pitch.value}" volume="${Math.round(volume.value * 100)}%">`

  // 构建文本内容 - 使用当前句子的文本
  let textContent = ''
  const textArray = splitTextByWords(props.sentenceText)
  
  for (let i = 0; i < textArray.length; i++) {
    const char = textArray[i]

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

// 监听currentSegment变化，重新加载已保存的设置
watch(() => props.currentSegment, (newSegment, oldSegment) => {
  console.log('=== SentenceVoiceEditor - currentSegment watch triggered ===')
  console.log('oldSegment:', oldSegment?.id, oldSegment?.text)
  console.log('newSegment:', newSegment?.id, newSegment?.text)
  
  if (newSegment) {
    console.log('SentenceVoiceEditor - currentSegment changed, loading saved settings:', newSegment)
    
    // 加载已保存的停顿标记和发音标记
    pauseMarks.value = (newSegment as any).pauseMarks || []
    pronunciationMarks.value = (newSegment as any).pronunciationMarks || []
    
    console.log('SentenceVoiceEditor - loaded pauseMarks:', pauseMarks.value)
    console.log('SentenceVoiceEditor - loaded pronunciationMarks:', pronunciationMarks.value)
    
    // 加载已保存的语音设置
    if ((newSegment as any).voice) {
      const savedVoice = voiceCategories.value
        .reduce((acc, cat) => [...acc, ...cat.voices], [] as Voice[])
        .find(voice => voice.id === (newSegment as any).voice)
      if (savedVoice) {
        currentVoice.value = savedVoice
        console.log('SentenceVoiceEditor - loaded saved voice:', savedVoice.name)
      }
    }
    
    if ((newSegment as any).volume !== undefined) {
      volume.value = (newSegment as any).volume
      console.log('SentenceVoiceEditor - loaded saved volume:', volume.value)
    }
    if ((newSegment as any).speed !== undefined) {
      speed.value = (newSegment as any).speed
      console.log('SentenceVoiceEditor - loaded saved speed:', speed.value)
    }
    if ((newSegment as any).pitch !== undefined) {
      pitch.value = (newSegment as any).pitch
      console.log('SentenceVoiceEditor - loaded saved pitch:', pitch.value)
    }
    
    console.log('SentenceVoiceEditor - final loaded settings:', {
      voice: currentVoice.value,
      volume: volume.value,
      speed: speed.value,
      pitch: pitch.value,
      pauseMarks: pauseMarks.value,
      pronunciationMarks: pronunciationMarks.value
    })
    
    updateSSML()
  }
}, { immediate: true })

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