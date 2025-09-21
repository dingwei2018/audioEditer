<template>
  <div class="sentence-voice-editor">
    <!-- 内容显示区域 -->
    <div class="content-display-area">
      <div class="content-header">
        <h3>句子内容</h3>
        <div class="content-info">
          <span class="sentence-index">句子 #{{ sentenceIndex + 1 }}</span>
          <span class="sentence-duration">{{ sentenceDuration }}s</span>
        </div>
      </div>
      
      <div class="content-text" ref="contentTextRef">
        <span 
          v-for="(char, index) in displayText" 
          :key="index"
          :class="getCharClass(index)"
          @click="selectChar(index)"
          @mouseenter="hoverChar(index)"
          @mouseleave="unhoverChar(index)"
        >
          {{ char }}
        </span>
      </div>
    </div>

    <!-- 语音编辑控制区域 -->
    <div class="voice-controls">
      <!-- 合并控制区域：音色、音量、语速 -->
      <div class="control-section combined-controls">
        <div class="combined-row">
          <!-- 音色选择 -->
          <div class="control-item voice-control">
            <div class="control-header">
              <span class="control-label">音色</span>
            </div>
            <div class="control-content">
              <div class="current-voice-compact">
                <div class="voice-avatar-small">
                  <img :src="currentVoice.avatar" :alt="currentVoice.name" />
                </div>
                <div class="voice-info-compact">
                  <div class="voice-name-small">{{ currentVoice.name }}</div>
                </div>
                <el-button 
                  @click="showVoiceDialog = true"
                  type="primary"
                  size="small"
                  icon="User"
                  class="change-voice-btn"
                >
                  更换
                </el-button>
              </div>
            </div>
          </div>

          <!-- 音量控制 -->
          <div class="control-item volume-control">
            <div class="control-header">
              <span class="control-label">音量</span>
            </div>
            <div class="control-content">
              <div class="slider-section">
                <el-slider
                  v-model="volume"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  :format-tooltip="(val) => `${Math.round(val * 100)}%`"
                  @change="updateSSML"
                  class="compact-slider"
                />
                <span class="value-display-small">{{ Math.round(volume * 100) }}%</span>
              </div>
            </div>
          </div>

          <!-- 语速控制 -->
          <div class="control-item speed-control">
            <div class="control-header">
              <span class="control-label">语速</span>
            </div>
            <div class="control-content">
              <div class="slider-section">
                <el-slider
                  v-model="speed"
                  :min="0.5"
                  :max="5"
                  :step="0.1"
                  :format-tooltip="(val) => `${val}x`"
                  @change="updateSSML"
                  class="compact-slider"
                />
                <span class="value-display-small">{{ speed }}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 合并控制区域：音调、停顿、多音字 -->
      <div class="control-section combined-controls">
        <div class="combined-row">
          <!-- 音调控制 -->
          <div class="control-item pitch-control">
            <div class="control-header">
              <span class="control-label">音调</span>
            </div>
            <div class="control-content">
              <div class="slider-section">
                <el-slider
                  v-model="pitch"
                  :min="0.5"
                  :max="2"
                  :step="0.1"
                  :format-tooltip="(val) => `${val}x`"
                  @change="updateSSML"
                  class="compact-slider"
                />
                <span class="value-display-small">{{ pitch }}x</span>
              </div>
            </div>
          </div>

          <!-- 停顿控制 -->
          <div class="control-item pause-control">
            <div class="control-header">
              <span class="control-label">字后停顿</span>
              <div class="pause-buttons-inline">
                <el-button 
                  @click="addPause"
                  type="success"
                  size="small"
                  icon="Plus"
                  :disabled="!selectedCharIndex"
                  class="pause-action-btn add-pause-btn"
                >
                  添加
                </el-button>
                <el-button 
                  @click="removePause"
                  type="danger"
                  size="small"
                  icon="Minus"
                  :disabled="!selectedCharIndex"
                  class="pause-action-btn remove-pause-btn"
                >
                  去除
                </el-button>
              </div>
            </div>
            <div class="control-content">
              <div class="slider-section">
                <el-slider
                  v-model="pauseDuration"
                  :min="0.1"
                  :max="3"
                  :step="0.1"
                  :format-tooltip="(val) => `${val}s`"
                  class="compact-slider"
                />
                <span class="value-display-small">{{ pauseDuration }}s</span>
              </div>
            </div>
          </div>

          <!-- 多音字选择 -->
          <div v-if="showPolyphoneSelection" class="control-item polyphone-control">
            <div class="control-header">
              <span class="control-label">多音字设置</span>
            </div>
            <div class="control-content">
              <div class="pronunciation-select-container">
                <el-select 
                  v-model="selectedPronunciation" 
                  @change="updatePronunciation"
                  placeholder="选择发音"
                  class="pronunciation-select"
                  size="small"
                >
                  <el-option
                    v-for="pronunciation in polyphoneOptions"
                    :key="pronunciation.pinyin"
                    :label="`${pronunciation.pinyin} (${pronunciation.tone})`"
                    :value="pronunciation.pinyin"
                  >
                    <div class="pronunciation-option-item">
                      <span class="pinyin-select">{{ pronunciation.pinyin }}</span>
                      <span class="tone-select">{{ pronunciation.tone }}</span>
                      <span class="meaning-select">{{ pronunciation.meaning }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SSML预览 -->
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

    <!-- 语音音色选择对话框 -->
    <el-dialog
      v-model="showVoiceDialog"
      title="选择语音音色"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="voice-selection-dialog">
        <!-- 分类切换 -->
        <el-tabs v-model="activeVoiceCategory" @tab-change="handleCategoryChange">
          <el-tab-pane 
            v-for="category in voiceCategories" 
            :key="category.id"
            :label="category.name"
            :name="category.id"
          >
            <div class="voice-grid">
              <div 
                v-for="voice in category.voices" 
                :key="voice.id"
                class="voice-item"
                :class="{ selected: voice.id === currentVoice.id }"
                @click="selectVoice(voice)"
              >
                <div class="voice-avatar">
                  <img :src="voice.avatar" :alt="voice.name" />
                </div>
                <div class="voice-name">{{ voice.name }}</div>
                <div class="voice-description">{{ voice.description }}</div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showVoiceDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmVoiceSelection">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

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

// 响应式数据
const contentTextRef = ref<HTMLElement>()
const selectedCharIndex = ref<number | null>(null)
const hoveredCharIndex = ref<number | null>(null)
const showVoiceDialog = ref(false)
const activeVoiceCategory = ref('classical')
const showPolyphoneSelection = ref(false)
const selectedPronunciation = ref('')
const pauseDuration = ref(1)

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
  return splitTextByWords(props.sentenceText)
})

// 按单词分割文本的函数
function splitTextByWords(text: string): string[] {
  const result: string[] = []
  let currentWord = ''
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    
    // 判断是否为英文字母或数字
    if (/[a-zA-Z0-9]/.test(char)) {
      currentWord += char
    } else {
      // 如果当前有英文单词，先添加单词
      if (currentWord) {
        result.push(currentWord)
        currentWord = ''
      }
      // 添加非英文字符
      result.push(char)
    }
  }
  
  // 处理最后一个单词
  if (currentWord) {
    result.push(currentWord)
  }
  
  return result
}

const ssmlContent = computed(() => {
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
  
  return ssml
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

function getCharClass(index: number): string {
  const classes = ['char']
  const item = displayText.value[index]
  
  // 判断是否为英文单词
  if (/^[a-zA-Z0-9]+$/.test(item)) {
    classes.push('word')
  }
  
  if (index === selectedCharIndex.value) {
    classes.push('selected')
  }
  
  if (index === hoveredCharIndex.value) {
    classes.push('hovered')
  }
  
  // 检查是否有停顿标记
  const hasPause = pauseMarks.value.some(p => p.charIndex === index)
  if (hasPause) {
    classes.push('has-pause')
  }
  
  // 检查是否有发音标记
  const hasPronunciation = pronunciationMarks.value.some(p => p.charIndex === index)
  if (hasPronunciation) {
    classes.push('has-pronunciation')
  }
  
  return classes.join(' ')
}

function selectChar(index: number) {
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

function hoverChar(index: number) {
  hoveredCharIndex.value = index
}

function unhoverChar(index: number) {
  hoveredCharIndex.value = null
}

function getPolyphoneData(char: string): PolyphoneOption[] | null {
  // 扩展多音字数据
  const polyphoneMap: Record<string, PolyphoneOption[]> = {
    '的': [
      { pinyin: 'de', tone: '轻声', meaning: '助词' },
      { pinyin: 'di', tone: '二声', meaning: '目的' },
      { pinyin: 'di', tone: '四声', meaning: '的确' }
    ],
    '了': [
      { pinyin: 'le', tone: '轻声', meaning: '完成' },
      { pinyin: 'liao', tone: '三声', meaning: '了解' }
    ],
    '着': [
      { pinyin: 'zhe', tone: '轻声', meaning: '进行' },
      { pinyin: 'zhao', tone: '二声', meaning: '着急' },
      { pinyin: 'zhuo', tone: '二声', meaning: '穿着' }
    ],
    '和': [
      { pinyin: 'he', tone: '二声', meaning: '和谐' },
      { pinyin: 'he', tone: '四声', meaning: '附和' },
      { pinyin: 'huo', tone: '二声', meaning: '和面' }
    ],
    '中': [
      { pinyin: 'zhong', tone: '一声', meaning: '中间' },
      { pinyin: 'zhong', tone: '四声', meaning: '中奖' }
    ],
    '行': [
      { pinyin: 'xing', tone: '二声', meaning: '行走' },
      { pinyin: 'hang', tone: '二声', meaning: '银行' }
    ],
    '长': [
      { pinyin: 'chang', tone: '二声', meaning: '长度' },
      { pinyin: 'zhang', tone: '三声', meaning: '成长' }
    ],
    '重': [
      { pinyin: 'zhong', tone: '四声', meaning: '重量' },
      { pinyin: 'chong', tone: '二声', meaning: '重复' }
    ],
    '发': [
      { pinyin: 'fa', tone: '一声', meaning: '发现' },
      { pinyin: 'fa', tone: '四声', meaning: '头发' }
    ],
    '好': [
      { pinyin: 'hao', tone: '三声', meaning: '好坏' },
      { pinyin: 'hao', tone: '四声', meaning: '爱好' }
    ],
    '还': [
      { pinyin: 'hai', tone: '二声', meaning: '还是' },
      { pinyin: 'huan', tone: '二声', meaning: '归还' }
    ],
    '会': [
      { pinyin: 'hui', tone: '四声', meaning: '会议' },
      { pinyin: 'kuai', tone: '四声', meaning: '会计' }
    ],
    '看': [
      { pinyin: 'kan', tone: '四声', meaning: '看见' },
      { pinyin: 'kan', tone: '一声', meaning: '看守' }
    ],
    '没': [
      { pinyin: 'mei', tone: '二声', meaning: '没有' },
      { pinyin: 'mo', tone: '四声', meaning: '淹没' }
    ],
    '为': [
      { pinyin: 'wei', tone: '二声', meaning: '作为' },
      { pinyin: 'wei', tone: '四声', meaning: '为了' }
    ],
    '要': [
      { pinyin: 'yao', tone: '四声', meaning: '需要' },
      { pinyin: 'yao', tone: '一声', meaning: '要求' }
    ],
    '得': [
      { pinyin: 'de', tone: '轻声', meaning: '助词' },
      { pinyin: 'de', tone: '二声', meaning: '得到' },
      { pinyin: 'dei', tone: '三声', meaning: '得去' }
    ],
    '地': [
      { pinyin: 'de', tone: '轻声', meaning: '助词' },
      { pinyin: 'di', tone: '四声', meaning: '地方' }
    ],
    '界': [
      { pinyin: 'jie', tone: '四声', meaning: '世界' },
      { pinyin: 'jie', tone: '四声', meaning: '界限' }
    ],
    '说': [
      { pinyin: 'shuo', tone: '一声', meaning: '说话' },
      { pinyin: 'shui', tone: '四声', meaning: '游说' }
    ],
    '数': [
      { pinyin: 'shu', tone: '四声', meaning: '数字' },
      { pinyin: 'shu', tone: '三声', meaning: '数数' }
    ]
  }
  
  return polyphoneMap[char] || null
}

function updatePronunciation() {
  if (selectedCharIndex.value !== null && selectedPronunciation.value) {
    // 移除现有的发音标记
    pronunciationMarks.value = pronunciationMarks.value.filter(p => p.charIndex !== selectedCharIndex.value)
    
    // 添加新的发音标记
    pronunciationMarks.value.push({
      charIndex: selectedCharIndex.value,
      pinyin: selectedPronunciation.value
    })
    
    updateSSML()
  }
}

function addPause() {
  if (selectedCharIndex.value !== null) {
    // 移除现有的停顿标记
    pauseMarks.value = pauseMarks.value.filter(p => p.charIndex !== selectedCharIndex.value)
    
    // 添加新的停顿标记
    pauseMarks.value.push({
      charIndex: selectedCharIndex.value,
      duration: pauseDuration.value
    })
    
    updateSSML()
    ElMessage.success(`在"${displayText.value[selectedCharIndex.value]}"后添加了${pauseDuration.value}秒停顿`)
  }
}

function removePause() {
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

function selectVoice(voice: Voice) {
  currentVoice.value = voice
}

function confirmVoiceSelection() {
  emit('update-voice', currentVoice.value)
  showVoiceDialog.value = false
  updateSSML()
  ElMessage.success(`已切换到${currentVoice.value.name}音色`)
}

function handleCategoryChange(categoryId: string) {
  activeVoiceCategory.value = categoryId
}

function updateSSML() {
  emit('update-ssml', ssmlContent.value)
}

function copySSML() {
  navigator.clipboard.writeText(ssmlContent.value).then(() => {
    ElMessage.success('SSML已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
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

watch(volume, (newVolume) => {
  emit('update-volume', newVolume)
  updateSSML()
})

watch(speed, (newSpeed) => {
  emit('update-speed', newSpeed)
  updateSSML()
})

watch(pitch, (newPitch) => {
  emit('update-pitch', newPitch)
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

/* 内容显示区域 */
.content-display-area {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #333;
}

.content-header h3 {
  margin: 0;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.content-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.sentence-index {
  color: #409eff;
  font-weight: 500;
}

.sentence-duration {
  color: #67c23a;
  font-weight: 500;
}

.content-text {
  font-size: 18px;
  line-height: 2;
  min-height: 60px;
  padding: 16px;
  background: #333;
  border-radius: 8px;
  border: 1px solid #444;
  word-break: break-all;
}

.char {
  display: inline-block;
  padding: 2px 4px;
  margin: 1px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.char.word {
  padding: 4px 8px;
  margin: 2px;
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 6px;
  font-weight: 500;
}

.char:hover {
  background: rgba(64, 158, 255, 0.2);
  transform: scale(1.1);
}

.char.word:hover {
  background: rgba(64, 158, 255, 0.3);
  border-color: rgba(64, 158, 255, 0.6);
  transform: scale(1.05);
}

.char.hovered {
  background: rgba(64, 158, 255, 0.3);
  transform: scale(1.05);
}

.char.word.hovered {
  background: rgba(64, 158, 255, 0.4);
  border-color: rgba(64, 158, 255, 0.8);
  transform: scale(1.02);
}

.char.selected {
  background: #409eff;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.char.word.selected {
  background: #409eff;
  color: white;
  border-color: #409eff;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.char.has-pause::after {
  content: '⏸';
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 10px;
  color: #f56c6c;
  background: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.char.has-pronunciation::before {
  content: '🎵';
  position: absolute;
  top: -8px;
  left: -8px;
  font-size: 10px;
  background: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 语音控制区域 */
.voice-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-section {
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

.value-display {
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
}

/* 合并控制区域样式 */
.combined-controls {
  padding: 20px;
}

/* 统一控制项样式 */
.control-item {
  background: #333;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100px;
  width: 292px;
  min-width: 292px;
  max-width: 300px;
  flex-shrink: 0;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.control-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-section .compact-slider {
  flex: 1;
  margin: 0;
}

.slider-section .value-display-small {
  font-size: 11px;
  min-width: 30px;
  text-align: center;
}

.combined-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  width: 100%;
  justify-content: flex-start;
}


.control-label {
  color: #cccccc;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

/* 音色控制样式 - 使用统一的固定宽度 */

.current-voice-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #333;
  border-radius: 8px;
  border: 1px solid #444;
}

.voice-avatar-small img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.voice-info-compact {
  flex: 1;
}

.voice-name-small {
  color: white;
  font-weight: 500;
  font-size: 14px;
}

.change-voice-btn {
  font-size: 12px;
  padding: 4px 8px;
}

/* 音量、语速、音调、停顿控制样式 - 使用统一的固定宽度 */

.control-label-with-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

/* 停顿控制按钮样式 */
.pause-buttons-inline {
  display: flex;
  gap: 4px;
  align-items: center;
}


.pause-action-btn {
  font-size: 11px;
  padding: 2px 6px;
  min-width: auto;
}


.slider-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compact-slider {
  margin: 0;
}

.value-display-small {
  color: #409eff;
  font-weight: 600;
  font-size: 12px;
  text-align: center;
  background: #333;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #444;
  min-width: 50px;
}

/* 当前音色显示 */
.current-voice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #333;
  border-radius: 8px;
  border: 1px solid #444;
}

.voice-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.voice-info {
  flex: 1;
}

.voice-name {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.voice-category {
  color: #909399;
  font-size: 12px;
}

/* 停顿控制 */
.pause-control {
  background: #333;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #444;
}

.pause-info {
  margin-bottom: 12px;
  color: #cccccc;
  font-size: 14px;
}

.pause-duration {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pause-duration label {
  color: #cccccc;
  font-size: 14px;
  white-space: nowrap;
}

.duration-display {
  color: #67c23a;
  font-weight: 600;
  font-size: 14px;
  min-width: 40px;
}

/* 多音字选择 - 使用统一的固定宽度 */

.polyphone-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-char-display {
  font-size: 12px;
  color: #cccccc;
  text-align: center;
  padding: 4px 6px;
  background: #333;
  border-radius: 4px;
  border: 1px solid #444;
}

.pronunciation-select-container {
  width: 100%;
}

.pronunciation-select {
  width: 100%;
}

.pronunciation-select .el-input__inner {
  background: #2a2a2a;
  border: 1px solid #444;
  color: white;
  font-size: 12px;
}

.pronunciation-select .el-input__inner:focus {
  border-color: #409eff;
}

.pronunciation-option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 0;
}

.pinyin-select {
  font-weight: 600;
  color: #409eff;
  min-width: 30px;
}

.tone-select {
  color: #ffa500;
  min-width: 25px;
  font-size: 11px;
}

.meaning-select {
  color: #666;
  font-size: 11px;
  flex: 1;
}

.close-polyphone-btn {
  font-size: 11px;
  padding: 2px 6px;
}

/* SSML预览 */
.ssml-preview {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
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

/* 音色选择对话框 */
.voice-selection-dialog {
  min-height: 400px;
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.voice-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.voice-item:hover {
  background: #e6f7ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.voice-item.selected {
  background: #e6f7ff;
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.voice-item .voice-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
}

.voice-item .voice-name {
  color: #333;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.voice-item .voice-description {
  color: #666;
  font-size: 12px;
  text-align: center;
  line-height: 1.4;
}

/* 滑块样式覆盖 */
:deep(.el-slider__runway) {
  background-color: #444;
}

:deep(.el-slider__bar) {
  background-color: #409eff;
}

:deep(.el-slider__button) {
  border-color: #409eff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sentence-voice-editor {
    width: 700px;
    max-width: 700px;
    padding: 20px;
  }
  
  .combined-row {
    gap: 12px;
  }
  
  .control-item {
    width: 200px;
    min-width: 200px;
    max-width: 200px;
  }
}

@media (max-width: 768px) {
  .sentence-voice-editor {
    width: 100%;
    max-width: 100%;
    padding: 12px;
    gap: 16px;
  }
  
  .content-text {
    font-size: 16px;
  }
  
  .voice-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .pause-duration {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  /* 合并控制区域响应式 */
  .combined-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .control-item {
    width: 100%;
    min-width: auto;
    max-width: none;
  }
  
  .polyphone-content {
    gap: 6px;
  }
  
  .pronunciation-select-container {
    width: 100%;
  }
  
  .current-voice-compact {
    justify-content: space-between;
  }
  
  .change-voice-btn {
    flex-shrink: 0;
  }
  
  .control-label-with-buttons {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .control-header {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .pause-buttons-inline {
    align-self: center;
  }
  
  .control-content {
    gap: 4px;
  }
  
  .slider-section {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .combined-row {
    gap: 16px;
  }
  
  .voice-control {
    min-width: 180px;
  }
  
  .volume-control,
  .speed-control,
  .pitch-control {
    min-width: 160px;
  }
  
  .pause-control {
    min-width: 200px;
  }
  
  .polyphone-control {
    min-width: 200px;
    max-width: 280px;
  }
}
</style>
