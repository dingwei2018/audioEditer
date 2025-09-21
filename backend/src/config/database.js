const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('../utils/logger');

let mysqlPool = null;

// MySQL 连接池
const setupDatabase = async () => {
  try {
    mysqlPool = mysql.createPool({
      host: config.database.mysql.host,
      port: config.database.mysql.port,
      user: config.database.mysql.user,
      password: config.database.mysql.password,
      database: config.database.mysql.database,
      charset: config.database.mysql.charset,
      timezone: config.database.mysql.timezone,
      connectionLimit: config.database.mysql.connectionLimit,
      waitForConnections: config.database.mysql.waitForConnections,
      queueLimit: config.database.mysql.queueLimit
    });

    // 测试连接
    const connection = await mysqlPool.getConnection();
    await connection.ping();
    connection.release();

    logger.info('MySQL 数据库连接成功');
    return mysqlPool;
  } catch (error) {
    logger.error('MySQL 数据库连接失败:', error);
    throw error;
  }
};

// 获取数据库连接
const getDatabase = () => {
  if (!mysqlPool) {
    throw new Error('数据库连接池未初始化');
  }
  return mysqlPool;
};

// 执行查询
const query = async (sql, params = []) => {
  try {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('数据库查询失败:', { sql, params, error: error.message });
    throw error;
  }
};

// 执行事务
const transaction = async (callback) => {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 初始化数据库表
const initializeTables = async () => {
  try {
    const tables = [
      // 项目表
      `CREATE TABLE IF NOT EXISTS projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        content LONGTEXT,
        settings JSON,
        status ENUM('draft', 'processing', 'completed', 'failed') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 音频文件表
      `CREATE TABLE IF NOT EXISTS audio_files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        duration DECIMAL(10,3),
        format VARCHAR(50) NOT NULL,
        status ENUM('uploading', 'processing', 'completed', 'failed') DEFAULT 'uploading',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        INDEX idx_project_id (project_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // TTS 合成记录表
      `CREATE TABLE IF NOT EXISTS tts_synthesizes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        text_content TEXT NOT NULL,
        voice_config JSON,
        audio_file_id INT,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        error_message TEXT,
        processing_time INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (audio_file_id) REFERENCES audio_files(id) ON DELETE SET NULL,
        INDEX idx_project_id (project_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 系统配置表
      `CREATE TABLE IF NOT EXISTS system_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const table of tables) {
      await query(table);
    }

    // 插入默认配置
    const defaultConfigs = [
      ['tts_default_voice', 'zhichu', '默认语音ID'],
      ['tts_default_speed', '1.0', '默认语速'],
      ['tts_default_pitch', '1.0', '默认音调'],
      ['audio_output_format', 'wav', '默认音频输出格式'],
      ['max_file_size', '104857600', '最大文件大小(字节)']
    ];

    for (const [key, value, description] of defaultConfigs) {
      await query(
        'INSERT IGNORE INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
        [key, value, description]
      );
    }

    logger.info('数据库表初始化完成');
  } catch (error) {
    logger.error('数据库表初始化失败:', error);
    throw error;
  }
};

// 关闭数据库连接
const closeDatabase = async () => {
  if (mysqlPool) {
    await mysqlPool.end();
    logger.info('MySQL 数据库连接已关闭');
  }
};

module.exports = {
  setupDatabase,
  getDatabase,
  query,
  transaction,
  initializeTables,
  closeDatabase
};
