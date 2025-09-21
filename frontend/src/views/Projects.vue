<template>
  <div class="projects">
    <el-container class="projects-container">
      <!-- 头部 -->
      <el-header class="projects-header">
        <div class="header-content">
          <div class="title">
            <el-icon><FolderOpened /></el-icon>
            <h1>项目管理</h1>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog">
              <el-icon><Plus /></el-icon>
              新建项目
            </el-button>
            <el-button @click="goHome">
              <el-icon><HomeFilled /></el-icon>
              返回首页
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="projects-main">
        <div class="projects-content">
          <!-- 项目列表 -->
          <div v-if="hasProjects" class="projects-grid">
            <div 
              v-for="project in projects" 
              :key="project.id"
              class="project-card"
              @click="openProject(project)"
            >
              <div class="project-header">
                <h3>{{ project.name }}</h3>
                <el-dropdown @command="handleProjectAction">
                  <el-button type="text" @click.stop>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ action: 'edit', project }">
                        <el-icon><Edit /></el-icon>
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'export', project }">
                        <el-icon><Download /></el-icon>
                        导出
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'delete', project }" divided>
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              
              <div class="project-info">
                <p v-if="project.description">{{ project.description }}</p>
                <p v-else class="no-description">暂无描述</p>
              </div>
              
              <div class="project-meta">
                <div class="meta-item">
                  <el-icon><VideoPlay /></el-icon>
                  <span>{{ project.tracks.length }} 个轨道</span>
                </div>
                <div class="meta-item">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
              
              <div class="project-actions">
                <el-button type="primary" size="small" @click.stop="openProject(project)">
                  <el-icon><VideoPlay /></el-icon>
                  打开
                </el-button>
                <el-button size="small" @click.stop="editProject(project)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-projects">
            <el-empty description="暂无项目">
              <el-button type="primary" @click="showCreateDialog">
                创建第一个项目
              </el-button>
            </el-empty>
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- 创建/编辑项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑项目' : '新建项目'"
      width="500px"
    >
      <el-form :model="projectForm" :rules="projectRules" ref="projectFormRef" label-width="80px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProject" :loading="isSaving">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useProjectStore } from '../stores'
import type { Project } from '../stores/project'

const router = useRouter()
const projectStore = useProjectStore()

// 响应式数据
const dialogVisible = ref(false)
const isEditing = ref(false)
const currentProject = ref<Project | null>(null)
const projectFormRef = ref<FormInstance>()

const projectForm = reactive({
  name: '',
  description: ''
})

const projectRules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 1, max: 50, message: '项目名称长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const { projects, hasProjects, isSaving } = projectStore

// 方法
const showCreateDialog = () => {
  isEditing.value = false
  currentProject.value = null
  projectForm.name = ''
  projectForm.description = ''
  dialogVisible.value = true
}

const editProject = (project: Project) => {
  isEditing.value = true
  currentProject.value = project
  projectForm.name = project.name
  projectForm.description = project.description
  dialogVisible.value = true
}

const submitProject = async () => {
  if (!projectFormRef.value) return

  await projectFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEditing.value && currentProject.value) {
          // 更新项目
          const updatedProject = {
            ...currentProject.value,
            name: projectForm.name,
            description: projectForm.description
          }
          await projectStore.saveProject(updatedProject)
          ElMessage.success('项目更新成功')
        } else {
          // 创建项目
          await projectStore.createProject(projectForm.name, projectForm.description)
          ElMessage.success('项目创建成功')
        }
        dialogVisible.value = false
      } catch (error) {
        console.error('保存项目失败:', error)
        ElMessage.error('保存项目失败')
      }
    }
  })
}

const openProject = (project: Project) => {
  projectStore.loadProject(project.id)
  router.push('/editor')
}

const handleProjectAction = async (command: { action: string; project: Project }) => {
  const { action, project } = command

  switch (action) {
    case 'edit':
      editProject(project)
      break
    case 'export':
      try {
        const data = await projectStore.exportProject(project.id)
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.name}.json`
        a.click()
        URL.revokeObjectURL(url)
        ElMessage.success('项目导出成功')
      } catch (error) {
        console.error('导出项目失败:', error)
        ElMessage.error('导出项目失败')
      }
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        projectStore.deleteProject(project.id)
        ElMessage.success('项目删除成功')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除项目失败:', error)
          ElMessage.error('删除项目失败')
        }
      }
      break
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.projects {
  height: 100vh;
  background-color: #f5f5f5;
}

.projects-container {
  height: 100%;
}

.projects-header {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.projects-main {
  padding: 24px;
}

.projects-content {
  max-width: 1200px;
  margin: 0 auto;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.project-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.project-info {
  margin-bottom: 16px;
}

.project-info p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.no-description {
  color: #c0c4cc;
  font-style: italic;
}

.project-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #909399;
}

.meta-item .el-icon {
  font-size: 16px;
}

.project-actions {
  display: flex;
  gap: 8px;
}

.empty-projects {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
  }
  
  .projects-main {
    padding: 16px;
  }
}
</style>
