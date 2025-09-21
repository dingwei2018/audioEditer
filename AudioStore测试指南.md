# AudioStore 测试指南

## 问题分析

你之前使用的 `test-audio-store.html` 是一个**独立的HTML文件**，它无法访问Vue应用中的Pinia store。这就是为什么测试结果显示"audioStore不存在"的原因。

## 正确的测试方法

现在我已经在Vue应用的Editor组件中添加了AudioStore测试功能。

### 测试步骤

1. **启动应用**
   ```
   cd frontend
   npm run dev
   ```
   服务器已启动：http://localhost:5175/

2. **访问编辑器页面**
   - 在浏览器中打开：http://localhost:5175/
   - 进入编辑器页面

3. **打开浏览器控制台**
   - 按 F12 打开开发者工具
   - 切换到 Console 选项卡
   - 你应该能看到AudioStore测试初始化日志：
     ```
     🔧 AudioStore 测试开始...
     🎉 AudioStore已暴露到window对象
     📚 可以在控制台运行 window.testAudioStore() 进行测试
     ```

4. **运行AudioStore测试**

   **基础测试（无需数据）：**
   在控制台中输入：
   ```javascript
   window.audioStore
   ```
   应该返回AudioStore对象，不是undefined

   **功能测试（需要有分句数据）：**
   - 先在应用中输入一些文本并进行分句
   - 然后在控制台运行：
   ```javascript
   window.testAudioStore()
   ```

   这个测试将会：
   - ✅ 检查store方法是否存在
   - 📦 显示当前tracks状态
   - 🎯 测试语音设置的保存和读取
   - 📊 验证数据是否正确保存

## 测试结果说明

如果AudioStore正常工作，你应该看到：
- `✅ getSegmentVoiceSettings: 存在`
- `✅ updateSegmentVoiceSettings: 存在`
- `📊 设置保存✅ 成功`

如果出现问题，测试会显示具体的错误信息。

## 下一步

请按照上述步骤测试，然后告诉我测试结果。这样我们就能确定AudioStore是否正常工作，以及语音设置是否能正确保存。