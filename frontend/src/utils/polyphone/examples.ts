// 多音字处理示例
import PolyphoneProcessor from '@/utils/polyphone'

// 示例函数：分析文本中的多音字
export function analyzeTextPolyphones(text: string) {
  console.log('=== 多音字分析示例 ===')
  console.log('原始文本:', text)

  const analysis = PolyphoneProcessor.analyzePolyphones(text)

  console.log('分析结果:')
  console.log('- 总字符数:', analysis.totalCharacters)
  console.log('- 多音字个数:', analysis.polyphoneCount)
  console.log('- 多音字比例:', (analysis.polyphoneCount / analysis.totalCharacters * 100).toFixed(2) + '%')
  console.log('- 包含多音字:', analysis.hasPolyphones ? '是' : '否')

  if (analysis.hasPolyphones) {
    console.log('\n发现的多音字:')
    analysis.polyphones.forEach((polyphone, index) => {
      console.log(`${index + 1}. 字符: "${polyphone.char}" (位置: ${polyphone.index})`)
      console.log(`   上下文: "${polyphone.context}"`)
      console.log('   可选读音:')
      polyphone.options.forEach((option, optionIndex) => {
        console.log(`     ${optionIndex + 1}. ${option.pinyin} - ${option.meaning} (例: ${option.example})`)
      })

      // 智能推荐
      const recommended = PolyphoneProcessor.recommendPronunciation(polyphone.char, polyphone.context)
      if (recommended.length > 0) {
        console.log(`   推荐读音: ${recommended[0].pinyin} (${recommended[0].meaning})`)
      }
      console.log('')
    })

    // 生成统计信息
    const stats = PolyphoneProcessor.getStatistics(analysis)
    console.log('统计信息:')
    console.log('- 多音字比例:', (stats.polyphoneRatio * 100).toFixed(2) + '%')
    console.log('- 总发音选项数:', stats.totalOptions)
    console.log('- 最常见多音字:', stats.mostCommonPolyphones.map(p => `${p.char}(${p.count}次)`).join(', '))
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
    console.log(`\n示例 ${index + 1}:`)
    analyzeTextPolyphones(text)
    console.log('='.repeat(50))
  })
}

// 导出便捷函数
export { analyzeTextPolyphones as default }