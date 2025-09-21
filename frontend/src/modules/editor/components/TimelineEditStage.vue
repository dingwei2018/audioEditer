<template>
  <div class="timeline-edit-stage">
    <div class="timeline-container">
      <div class="segments-timeline-view">
        <TimelineSegments
          :segments="timelineSegments"
          :gaps="timelineGaps"
          :total-duration="totalTimelineDuration"
          :selected-segment-id="selectedSegmentId"
          :playing-segment-id="playingSegmentId"
          :selected-gap-id="selectedGapId"
          @segment-select="$emit('select-segment', $event)"
          @audio-play="$emit('play-audio', $event)"
          @segment-edit="handleSegmentEdit"
          @segment-delete="$emit('delete-segment', $event)"
          @segment-add-after="$emit('add-sentence-after', $event.segmentId || $event[0], $event.index || $event[1])"
          @gap-select="$emit('select-gap', $event)"
          @gap-update="$emit('update-gap-duration', $event.gapId || $event[0], $event.duration || $event[1])"
          @audio-synthesize="$emit('synthesize-audio', $event)"
        />
      </div>
    </div>

    <div v-if="showVoiceEditor" class="voice-editor-container">
      <SentenceVoiceEditor
        :sentence-text="selectedSegmentForVoice?.text || ''"
        :sentence-index="selectedSegmentIndex"
        :sentence-duration="selectedSegmentForVoice?.duration || 0"
        :initial-voice="getCurrentVoice(selectedSegmentForVoice?.voice)"
        :initial-volume="getTrackVolume(selectedSegmentForVoice)"
        :initial-speed="selectedSegmentForVoice?.speed || 1"
        :initial-pitch="selectedSegmentForVoice?.pitch || 1"
        @update-ssml="$emit('ssml-update', $event)"
        @update-voice="$emit('voice-update', $event)"
        @update-volume="$emit('volume-update', $event)"
        @update-speed="$emit('speed-update', $event)"
        @update-pitch="$emit('pitch-update', $event)"
        @close="$emit('close-voice-editor')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TimelineSegments from '@/components/TimelineSegments.vue'
import SentenceVoiceEditor from '@/components/SentenceVoiceEditor.vue'

interface Props {
  timelineSegments: any[]
  timelineGaps: any[]
  totalTimelineDuration: number
  selectedSegmentId: string
  playingSegmentId: string
  selectedGapId: string
  showVoiceEditor: boolean
  selectedSegmentForVoice: any
  selectedSegmentIndex: number
}

interface Emits {
  (e: 'select-segment', segment: any): void
  (e: 'play-segment', segmentId: string): void
  (e: 'edit-segment', segmentId: string): void
  (e: 'add-text', position: number): void
  (e: 'update-segment-text', segmentId: string, newText: string): void
  (e: 'delete-segment', segmentId: string): void
  (e: 'add-sentence-after', segmentId: string, index: number): void
  (e: 'select-gap', gap: any): void
  (e: 'update-gap-duration', gapId: string, duration: number): void
  (e: 'remove-gap', gapId: string): void
  (e: 'open-voice-editor', segment: any): void
  (e: 'synthesize-audio', segment: any): void
  (e: 'play-audio', segment: any): void
  (e: 'ssml-update', ssml: string): void
  (e: 'voice-update', voice: any): void
  (e: 'volume-update', volume: number): void
  (e: 'speed-update', speed: number): void
  (e: 'pitch-update', pitch: number): void
  (e: 'close-voice-editor'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// 处理文本编辑事件
function handleSegmentEdit(segmentId: string, newText: string) {
  console.log('TimelineEditStage - handleSegmentEdit:', segmentId, newText)
  emit('update-segment-text', segmentId, newText)
}

const getCurrentVoice = (voiceId?: string) => {
  const voiceMap: Record<string, any> = {
    'zhichu': {
      id: 'zhichu',
      name: '知初',
      category: '现代人物',
      avatar: 'https://via.placeholder.com/60x60/50E3C2/FFFFFF?text=知',
      description: '清新自然，适合日常对话',
      ssmlName: 'zh-CN-XiaoxiaoNeural'
    },
    'zhimei': {
      id: 'zhimei',
      name: '知美',
      category: '现代人物',
      avatar: 'https://via.placeholder.com/60x60/BD10E0/FFFFFF?text=美',
      description: '温柔甜美，适合情感表达',
      ssmlName: 'zh-CN-XiaohanNeural'
    },
    'zhiwen': {
      id: 'zhiwen',
      name: '知文',
      category: '现代人物',
      avatar: 'https://via.placeholder.com/60x60/B8E986/FFFFFF?text=文',
      description: '文雅知性，适合知识讲解',
      ssmlName: 'zh-CN-YunxiNeural'
    }
  }
  return voiceMap[voiceId || 'zhichu'] || voiceMap['zhichu']
}

const getTrackVolume = (segment: any) => {
  // TODO: 从实际轨道数据获取音量
  return 1
}
</script>

<style scoped>
.timeline-edit-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
}

.timeline-container {
  display: flex;
  flex-direction: column;
}

.segments-timeline-view {
  display: flex;
  flex-direction: column;
}

.voice-editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  margin-top: 24px;
}
</style>