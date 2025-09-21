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
      @update-ssml="handleSSMLUpdate"
      @update-voice="handleVoiceUpdate"
      @update-volume="handleVolumeUpdate"
      @update-speed="handleSpeedUpdate"
      @update-pitch="handlePitchUpdate"
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
</script>

<script lang="ts">
export default {
  name: 'SentenceVoiceEditor'
}
</script>

<style scoped>
.sentence-voice-editor {
  width: 100%;
  height: 100%;
}
</style>
