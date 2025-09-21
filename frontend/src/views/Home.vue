<template>
  <div class="home">
    <el-container class="home-container">
      <!-- 头部 -->
      <el-header class="home-header">
        <div class="header-content">
          <div class="logo">
            <el-icon><Microphone /></el-icon>
            <h1>云听文转声精修界面</h1>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="goToEditor">
              <el-icon><Edit /></el-icon>
              开始编辑
            </el-button>
            <el-button @click="toggleDarkMode">
              <el-icon><Moon v-if="!isDarkMode" /><Sunny v-else /></el-icon>
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="home-main">
        <div class="welcome-section">
          <div class="welcome-content">
            <h2>欢迎使用云听文转声精修界面</h2>
            <p>基于阿里云 CosyVoice 的智能音频编辑器，让文本转语音更加自然流畅</p>
            
            <div class="feature-grid">
              <div class="feature-card">
                <el-icon class="feature-icon"><Microphone /></el-icon>
                <h3>智能语音合成</h3>
                <p>基于阿里云 CosyVoice 技术，提供高质量的语音合成服务</p>
              </div>
              
              <div class="feature-card">
                <el-icon class="feature-icon"><Edit /></el-icon>
                <h3>专业音频编辑</h3>
                <p>支持多轨道编辑、音频拼接、音量调节等专业功能</p>
              </div>
              
              <div class="feature-card">
                <el-icon class="feature-icon"><Setting /></el-icon>
                <h3>灵活参数调节</h3>
                <p>可调节语速、音调、音量等参数，满足不同场景需求</p>
              </div>
              
              <div class="feature-card">
                <el-icon class="feature-icon"><FolderOpened /></el-icon>
                <h3>项目管理</h3>
                <p>支持项目保存、导入导出，方便管理和分享</p>
              </div>
            </div>

            <div class="action-buttons">
              <el-button type="primary" size="large" @click="goToEditor">
                <el-icon><Edit /></el-icon>
                开始创作
              </el-button>
              <el-button size="large" @click="goToProjects">
                <el-icon><FolderOpened /></el-icon>
                查看项目
              </el-button>
            </div>
          </div>
        </div>
      </el-main>

      <!-- 底部 -->
      <el-footer class="home-footer">
        <p>&copy; 2024 云听文转声精修界面. 基于阿里云 CosyVoice 技术构建.</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores'

const router = useRouter()
const appStore = useAppStore()

const { isDarkMode, toggleDarkMode } = appStore

const goToEditor = () => {
  router.push('/editor')
}

const goToProjects = () => {
  router.push('/projects')
}
</script>

<style scoped>
.home {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.home-container {
  height: 100%;
}

.home-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.home-main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.welcome-section {
  text-align: center;
  color: white;
  max-width: 1200px;
  padding: 40px 20px;
}

.welcome-content h2 {
  font-size: 48px;
  margin-bottom: 20px;
  font-weight: 700;
}

.welcome-content p {
  font-size: 20px;
  margin-bottom: 60px;
  opacity: 0.9;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 30px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #fff;
}

.feature-card h3 {
  font-size: 24px;
  margin-bottom: 15px;
  font-weight: 600;
}

.feature-card p {
  font-size: 16px;
  opacity: 0.8;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.home-footer {
  background: rgba(0, 0, 0, 0.2);
  color: white;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-footer p {
  margin: 0;
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-content h2 {
    font-size: 32px;
  }
  
  .welcome-content p {
    font-size: 18px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .header-content {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
