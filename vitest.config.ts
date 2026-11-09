import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// 契约测试约定（AGENTS.md §2）：
// - tests/contracts/test_<条目ID小写>.test.ts，文件头注释声明断言来源
// - tests/faults/ 放历史故障回归
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'), // 与 vite.config.ts 一致，供被测模块内的 @ 导入解析
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
