// 多音字处理示例
import PolyphoneProcessor from '@/utils/polyphone'

// 示例函数：分析文本中的多音字
export function analyzeTextPolyphones(text: string) {

  const analysis = PolyphoneProcessor.analyzePolyphones(text)


  if (analysis.hasPolyphones) {
    analysis.polyphones.forEach((polyphone, index) => {
      polyphone.options.forEach((option, optionIndex) => {
      })

      // 智能推荐
      const recommended = PolyphoneProcessor.recommendPronunciation(polyphone.char, polyphone.context)
      if (recommended.length > 0) {
      }
    })

    // 生成统计信息
    const stats = PolyphoneProcessor.getStatistics(analysis)
  }

  return analysis
}

// 使用示例
export function demonstratePolyphoneUsage() {
  const examples = [
    "欢迎使用云听文转声精修界面！这是一个基于阿里云CosyVoice技术的智能音频编辑器。",
    "今天的会议内容很重要，大家都应该认真听讲。",
    "他很好学，总是乐于助人，处理问题也很得当。",
    "这个便民服务很好，为民众提供了方便。"
  ]

  examples.forEach((text, index) => {
    analyzeTextPolyphones(text)
  })
}

// 导出便捷函数
export { analyzeTextPolyphones as default }