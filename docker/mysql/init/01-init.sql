-- 音频编辑器数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS audioediter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE audioediter;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 音频项目表
CREATE TABLE IF NOT EXISTS audio_projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    original_audio_path VARCHAR(500),
    processed_audio_path VARCHAR(500),
    status ENUM('draft', 'processing', 'completed', 'failed') DEFAULT 'draft',
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 文本片段表
CREATE TABLE IF NOT EXISTS text_segments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    segment_order INT NOT NULL,
    text_content TEXT NOT NULL,
    audio_path VARCHAR(500),
    start_time DECIMAL(10,3),
    end_time DECIMAL(10,3),
    duration DECIMAL(10,3),
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES audio_projects(id) ON DELETE CASCADE
);

-- TTS 任务表
CREATE TABLE IF NOT EXISTS tts_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    segment_id INT,
    text_content TEXT NOT NULL,
    voice_model VARCHAR(100),
    tts_service ENUM('cosyvoice', 'gpt-sovits', 'aliyun', 'tencent', 'baidu'),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    result_audio_path VARCHAR(500),
    error_message TEXT,
    processing_time DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES audio_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES text_segments(id) ON DELETE CASCADE
);

-- 声音模型表
CREATE TABLE IF NOT EXISTS voice_models (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    provider ENUM('cosyvoice', 'gpt-sovits', 'aliyun', 'tencent', 'baidu') NOT NULL,
    provider_voice_id VARCHAR(100),
    language VARCHAR(10) DEFAULT 'zh-CN',
    gender ENUM('male', 'female', 'neutral'),
    category VARCHAR(50),
    description TEXT,
    preview_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSON,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认声音模型
INSERT INTO voice_models (name, display_name, provider, provider_voice_id, language, gender, category, description) VALUES
('cosyvoice_female_zh', 'CosyVoice 中文女声', 'cosyvoice', 'default_female', 'zh-CN', 'female', 'news', 'CosyVoice 2 默认中文女声，适合新闻播报'),
('cosyvoice_male_zh', 'CosyVoice 中文男声', 'cosyvoice', 'default_male', 'zh-CN', 'male', 'news', 'CosyVoice 2 默认中文男声，适合新闻播报'),
('gpt_sovits_female_1', 'GPT-SoVITS 女声1', 'gpt-sovits', 'female_zh_1', 'zh-CN', 'female', 'narrative', 'GPT-SoVITS 自定义女声模型'),
('aliyun_xiaoqian', '阿里云 晓倩', 'aliyun', 'xiaoqian', 'zh-CN', 'female', 'commercial', '阿里云语音合成女声，适合商业配音'),
('tencent_101001', '腾讯云 女声', 'tencent', '101001', 'zh-CN', 'female', 'news', '腾讯云语音合成女声，适合新闻播报');

-- 插入默认系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('default_voice_model', '{"provider": "cosyvoice", "voice_id": "default_female"}', '默认声音模型配置'),
('tts_service_priority', '["cosyvoice", "gpt-sovits", "aliyun", "tencent", "baidu"]', 'TTS服务优先级配置'),
('audio_quality', '{"sample_rate": 22050, "bit_rate": 16, "format": "wav"}', '默认音频质量配置'),
('max_text_length', '512', '单次TTS最大文本长度'),
('concurrent_limit', '5', '并发TTS任务限制');

-- 创建索引
CREATE INDEX idx_audio_projects_user_id ON audio_projects(user_id);
CREATE INDEX idx_audio_projects_status ON audio_projects(status);
CREATE INDEX idx_text_segments_project_id ON text_segments(project_id);
CREATE INDEX idx_text_segments_order ON text_segments(project_id, segment_order);
CREATE INDEX idx_tts_tasks_status ON tts_tasks(status);
CREATE INDEX idx_tts_tasks_project_id ON tts_tasks(project_id);
CREATE INDEX idx_voice_models_provider ON voice_models(provider);
CREATE INDEX idx_voice_models_active ON voice_models(is_active);
