<template>
  <div class="sentence-voice-editor">
    <!-- 使用新的模块化语音编辑器 -->
    <ModularSentenceVoiceEditor
      :sentence-text="sentenceText"
      :sentence-index="sentenceIndex"
      :sentence-duration="sentenceDuration"
      :initial-voice="initialVoice"
      :initial-volume="initialVolume"
      :initial-speed="initialSpeed"
      :initial-pitch="initialPitch"
      :current-segment="currentSegment"
      @update-ssml="handleSSMLUpdate"
      @update-voice="handleVoiceUpdate"
      @update-volume="handleVolumeUpdate"
      @update-speed="handleSpeedUpdate"
      @update-pitch="handlePitchUpdate"
      @update-pause-marks="handlePauseMarksUpdate"
      @update-pronunciation-marks="handlePronunciationMarksUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import ModularSentenceVoiceEditor from '@/modules/editor/components/voice-editor/SentenceVoiceEditor.vue'

interface Voice {
  id: string
  name: string
  category: string
  avatar: string
  description?: string
  ssmlName: string
}

interface Props {
  sentenceText: string
  sentenceIndex: number
  sentenceDuration: number
  initialVoice?: Voice
  initialVolume?: number
  initialSpeed?: number
  initialPitch?: number
  currentSegment?: any
}

interface Emits {
  (e: 'update-ssml', ssml: string): void
  (e: 'update-voice', voice: Voice): void
  (e: 'update-volume', volume: number): void
  (e: 'update-speed', speed: number): void
  (e: 'update-pitch', pitch: number): void
  (e: 'update-pause-marks', pauseMarks: any[]): void
  (e: 'update-pronunciation-marks', pronunciationMarks: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  initialVolume: 1,
  initialSpeed: 1,
  initialPitch: 1
})

const emit = defineEmits<Emits>()

// 事件处理方法
function handleSSMLUpdate(ssml: string) {
  emit('update-ssml', ssml)
}

function handleVoiceUpdate(voice: Voice) {
  emit('update-voice', voice)
}

function handleVolumeUpdate(volume: number) {
  emit('update-volume', volume)
}

function handleSpeedUpdate(speed: number) {
  emit('update-speed', speed)
}

function handlePitchUpdate(pitch: number) {
  emit('update-pitch', pitch)
}

function handlePauseMarksUpdate(pauseMarks: any[]) {
  emit('update-pause-marks', pauseMarks)
}

function handlePronunciationMarksUpdate(pronunciationMarks: any[]) {
  emit('update-pronunciation-marks', pronunciationMarks)
}
</script>

<script lang="ts">
export default {
  name: 'SentenceVoiceEditorWrapper'
}
</script>

<style scoped>
.sentence-voice-editor {
  width: 100%;
  height: 100%;
}
</style>
