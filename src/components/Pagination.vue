<template>
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      prev-text="上一页"
      next-text="下一页"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

interface Props {
  total: number
  page?: number
  limit?: number
}

interface Emits {
  (e: 'update:page', page: number): void
  (e: 'update:limit', limit: number): void
  (e: 'pagination', params: { page: number; limit: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  page: 1,
  limit: 10
})

const emit = defineEmits<Emits>()

const currentPage = ref(props.page)
const pageSize = ref(props.limit)

// 监听props变化
watch(() => props.page, (val) => {
  currentPage.value = val
})

watch(() => props.limit, (val) => {
  pageSize.value = val
})

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  emit('update:limit', val)
  emit('pagination', {
    page: currentPage.value,
    limit: val
  })
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  emit('update:page', val)
  emit('pagination', {
    page: val,
    limit: pageSize.value
  })
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style> 