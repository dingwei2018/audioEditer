<template>
  <div class="editor-toolbar">
    <div class="toolbar-left">
      <h2 class="app-title">音频编辑器</h2>
    </div>

    <div class="toolbar-center">
      <el-button-group>
        <el-button
          :type="workflowStage === 'input' ? 'primary' : 'default'"
          @click="$emit('stage-change', 'input')"
          icon="Edit"
        >
          文本输入
        </el-button>
        <el-button
          :type="workflowStage === 'timeline' ? 'primary' : 'default'"
          @click="$emit('stage-change', 'timeline')"
          icon="Grid"
          :disabled="!hasTracks"
        >
          分句视图
        </el-button>
      </el-button-group>
    </div>

    <div class="toolbar-right">
      <el-button @click="$emit('save-project')">
        <el-icon><Document /></el-icon>
        保存
      </el-button>
      <el-button type="primary" @click="$emit('export-project')">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  workflowStage: 'input' | 'timeline'
  hasTracks: boolean
}

interface Emits {
  (e: 'stage-change', stage: 'input' | 'timeline'): void
  (e: 'save-project'): void
  (e: 'export-project'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.editor-toolbar {
  height: 120px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>