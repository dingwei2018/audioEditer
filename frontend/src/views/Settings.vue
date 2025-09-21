<template>
  <div class="settings">
    <el-container class="settings-container">
      <!-- 头部 -->
      <el-header class="settings-header">
        <div class="header-content">
          <div class="title">
            <el-icon><Setting /></el-icon>
            <h1>设置</h1>
          </div>
          <div class="header-actions">
            <el-button @click="goHome">
              <el-icon><HomeFilled /></el-icon>
              返回首页
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="settings-main">
        <div class="settings-content">
          <el-row :gutter="24">
            <!-- 左侧菜单 -->
            <el-col :span="6">
              <el-menu
                :default-active="activeTab"
                @select="handleTabChange"
                class="settings-menu"
              >
                <el-menu-item index="tts">
                  <el-icon><Microphone /></el-icon>
                  <span>TTS 设置</span>
                </el-menu-item>
                <el-menu-item index="audio">
                  <el-icon><Headphones /></el-icon>
                  <span>音频设置</span>
                </el-menu-item>
                <el-menu-item index="ui">
                  <el-icon><Monitor /></el-icon>
                  <span>界面设置</span>
                </el-menu-item>
                <el-menu-item index="about">
                  <el-icon><InfoFilled /></el-icon>
                  <span>关于</span>
                </el-menu-item>
              </el-menu>
            </el-col>

            <!-- 右侧内容 -->
            <el-col :span="18">
              <div class="settings-panel">
                <!-- TTS 设置 -->
                <div v-if="activeTab === 'tts'" class="settings-section">
                  <h2>TTS 设置</h2>
                  <el-form :model="ttsSettings" label-width="120px" @submit.prevent>
                    <el-form-item label="服务提供商">
                      <el-select v-model="ttsSettings.provider">
                        <el-option label="阿里云 DashScope" value="aliyun" />
                        <el-option label="GPT-SoVITS" value="gpt-sovits" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="默认语音">
                      <el-select v-model="ttsSettings.voice">
                        <el-option label="知初" value="zhichu" />
                        <el-option label="知美" value="zhimei" />
                        <el-option label="知文" value="zhiwen" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="默认语速">
                      <el-slider
                        v-model="ttsSettings.speed"
                        :min="0.5"
                        :max="2.0"
                        :step="0.1"
                        show-input
                      />
                    </el-form-item>
                    
                    <el-form-item label="默认音调">
                      <el-slider
                        v-model="ttsSettings.pitch"
                        :min="0.5"
                        :max="2.0"
                        :step="0.1"
                        show-input
                      />
                    </el-form-item>
                    
                    <el-form-item label="API Key">
                      <el-input
                        v-model="ttsSettings.apiKey"
                        type="password"
                        show-password
                        placeholder="请输入 API Key"
                      />
                    </el-form-item>
                    
                    <el-form-item label="API URL">
                      <el-input
                        v-model="ttsSettings.apiUrl"
                        placeholder="请输入 API URL（可选）"
                      />
                    </el-form-item>
                  </el-form>
                </div>

                <!-- 音频设置 -->
                <div v-if="activeTab === 'audio'" class="settings-section">
                  <h2>音频设置</h2>
                  <el-form :model="audioSettings" label-width="120px" @submit.prevent>
                    <el-form-item label="输出格式">
                      <el-select v-model="audioSettings.outputFormat">
                        <el-option label="MP3" value="mp3" />
                        <el-option label="WAV" value="wav" />
                        <el-option label="AAC" value="aac" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="采样率">
                      <el-select v-model="audioSettings.sampleRate">
                        <el-option label="44.1 kHz" :value="44100" />
                        <el-option label="48 kHz" :value="48000" />
                        <el-option label="96 kHz" :value="96000" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="比特率">
                      <el-select v-model="audioSettings.bitRate">
                        <el-option label="128 kbps" :value="128" />
                        <el-option label="192 kbps" :value="192" />
                        <el-option label="256 kbps" :value="256" />
                        <el-option label="320 kbps" :value="320" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="声道数">
                      <el-radio-group v-model="audioSettings.channels">
                        <el-radio :label="1">单声道</el-radio>
                        <el-radio :label="2">立体声</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    
                    <el-form-item label="音频标准化">
                      <el-switch v-model="audioSettings.normalize" />
                    </el-form-item>
                  </el-form>
                </div>

                <!-- 界面设置 -->
                <div v-if="activeTab === 'ui'" class="settings-section">
                  <h2>界面设置</h2>
                  <el-form :model="uiSettings" label-width="120px" @submit.prevent>
                    <el-form-item label="主题">
                      <el-radio-group v-model="uiSettings.theme">
                        <el-radio label="light">浅色</el-radio>
                        <el-radio label="dark">深色</el-radio>
                        <el-radio label="auto">跟随系统</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    
                    <el-form-item label="语言">
                      <el-select v-model="uiSettings.language">
                        <el-option label="简体中文" value="zh-CN" />
                        <el-option label="English" value="en-US" />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="字体大小">
                      <el-radio-group v-model="uiSettings.fontSize">
                        <el-radio label="small">小</el-radio>
                        <el-radio label="medium">中</el-radio>
                        <el-radio label="large">大</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    
                    <el-form-item label="显示网格">
                      <el-switch v-model="uiSettings.showGrid" />
                    </el-form-item>
                    
                    <el-form-item label="自动保存">
                      <el-switch v-model="uiSettings.autoSave" />
                    </el-form-item>
                    
                    <el-form-item v-if="uiSettings.autoSave" label="保存间隔">
                      <el-input-number
                        v-model="uiSettings.autoSaveInterval"
                        :min="1"
                        :max="300"
                        controls-position="right"
                      />
                      <span style="margin-left: 8px;">秒</span>
                    </el-form-item>
                  </el-form>
                </div>

                <!-- 关于 -->
                <div v-if="activeTab === 'about'" class="settings-section">
                  <h2>关于</h2>
                  <div class="about-content">
                    <div class="app-info">
                      <h3>云听文转声精修界面</h3>
                      <p>版本: 1.0.0</p>
                      <p>基于阿里云 CosyVoice 技术构建的智能音频编辑器</p>
                    </div>
                    
                    <div class="tech-stack">
                      <h4>技术栈</h4>
                      <ul>
                        <li>前端: Vue 3 + TypeScript + Element Plus</li>
                        <li>后端: Node.js + Fastify</li>
                        <li>TTS: 阿里云 DashScope CosyVoice</li>
                        <li>数据库: MySQL + Redis</li>
                      </ul>
                    </div>
                    
                    <div class="features">
                      <h4>主要功能</h4>
                      <ul>
                        <li>智能语音合成</li>
                        <li>多轨道音频编辑</li>
                        <li>实时参数调节</li>
                        <li>项目管理与导出</li>
                        <li>云端 API 集成</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="settings-actions">
                  <el-button @click="resetSettings">重置设置</el-button>
                  <el-button type="primary" @click="saveSettings">保存设置</el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '../stores'

const router = useRouter()
const settingsStore = useSettingsStore()

// 响应式数据
const activeTab = ref('tts')

// 表单数据
const ttsSettings = reactive({ ...settingsStore.ttsSettings })
const audioSettings = reactive({ ...settingsStore.audioSettings })
const uiSettings = reactive({ ...settingsStore.uiSettings })

// 方法
const handleTabChange = (tab: string) => {
  activeTab.value = tab
}

const saveSettings = () => {
  try {
    settingsStore.updateTTSSettings(ttsSettings)
    settingsStore.updateAudioSettings(audioSettings)
    settingsStore.updateUISettings(uiSettings)
    ElMessage.success('设置保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

const resetSettings = () => {
  settingsStore.resetSettings()
  Object.assign(ttsSettings, settingsStore.ttsSettings)
  Object.assign(audioSettings, settingsStore.audioSettings)
  Object.assign(uiSettings, settingsStore.uiSettings)
  ElMessage.success('设置已重置')
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.settings {
  height: 100vh;
  background-color: #f5f5f5;
}

.settings-container {
  height: 100%;
}

.settings-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.settings-main {
  padding: 24px;
}

.settings-content {
  max-width: 1200px;
  margin: 0 auto;
}

.settings-menu {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.settings-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.settings-section h2 {
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.about-content {
  line-height: 1.6;
}

.app-info {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
}

.app-info h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 24px;
  color: #303133;
}

.app-info p {
  margin: 8px 0;
  color: #606266;
}

.tech-stack,
.features {
  margin-bottom: 24px;
}

.tech-stack h4,
.features h4 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.tech-stack ul,
.features ul {
  margin: 0;
  padding-left: 20px;
}

.tech-stack li,
.features li {
  margin-bottom: 8px;
  color: #606266;
}

.settings-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-main {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
  }
  
  .settings-panel {
    padding: 16px;
  }
  
  .settings-actions {
    flex-direction: column;
  }
}
</style>
