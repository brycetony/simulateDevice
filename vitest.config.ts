import { defineConfig } from 'vitest/config'

// 契约测试约定（AGENTS.md §2）：
// - tests/contracts/test_<条目ID小写>.test.ts，文件头注释声明断言来源
// - tests/faults/ 放历史故障回归
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
