<template>
  <div class="dashboard-container">
    <!-- 统计卡片区域 -->
    <div class="stat-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card total-users" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>总用户数</span>
                <el-icon><User /></el-icon>
              </div>
            </template>
            <div class="card-value">{{ statistics.totalUsers }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card total-devices" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>设备总数</span>
                <el-icon><Connection /></el-icon>
              </div>
            </template>
            <div class="card-value">{{ statistics.totalDevices }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card online-devices" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>在线设备</span>
                <el-icon><Monitor /></el-icon>
              </div>
            </template>
            <div class="card-value">{{ statistics.onlineDevices }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card total-commands" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>今日命令数</span>
                <el-icon><Operation /></el-icon>
              </div>
            </template>
            <div class="card-value">{{ statistics.todayCommands }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>设备活跃度趋势</span>
                <el-radio-group v-model="timeRange" size="small">
                  <el-radio-button label="week">近一周</el-radio-button>
                  <el-radio-button label="month">近一月</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart" ref="activityChart"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>设备类型分布</span>
              </div>
            </template>
            <div class="chart" ref="deviceTypeChart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近活动列表 -->
    <el-card class="recent-activity" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>最近活动</span>
          <el-button text>查看更多</el-button>
        </div>
      </template>
      <el-table :data="recentActivities" style="width: 100%" :max-height="300">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="deviceName" label="设备名称" width="180" />
        <el-table-column prop="type" label="活动类型">
          <template #default="scope">
            <el-tag :type="getActivityTypeTag(scope.row.type)">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'" size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

// 模拟数据
const statistics = ref({
  totalUsers: 1234,
  userGrowth: 15,
  totalDevices: 567,
  deviceGrowth: 23,
  onlineDevices: 489,
  onlineRate: 86,
  todayCommands: 8234,
  commandGrowth: 12
})

const timeRange = ref('week')
const activityChart = ref()
const deviceTypeChart = ref()

const recentActivities = ref([
  {
    time: '2024-03-20 14:23:45',
    deviceName: '设备A',
    type: '连接',
    description: '设备成功连接到服务器',
    status: '成功'
  },
  {
    time: '2024-03-20 14:22:30',
    deviceName: '设备B',
    type: '命令',
    description: '执行温度检测命令',
    status: '成功'
  },
  {
    time: '2024-03-20 14:20:15',
    deviceName: '设备C',
    type: '断开',
    description: '设备意外断开连接',
    status: '失败'
  }
])

const getActivityTypeTag = (type: string) => {
  const map: Record<string, string> = {
    '连接': 'success',
    '断开': 'danger',
    '命令': 'warning'
  }
  return map[type] || 'info'
}

onMounted(() => {
  // 初始化活跃度趋势图表
  const activity = echarts.init(activityChart.value)
  activity.setOption({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '活跃设备数',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        areaStyle: {
          opacity: 0.3
        },
        lineStyle: {
          width: 3
        },
        itemStyle: {
          borderWidth: 2
        }
      }
    ]
  })

  // 初始化设备类型分布图表
  const deviceType = echarts.init(deviceTypeChart.value)
  deviceType.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: 'TCP设备' },
          { value: 735, name: 'UDP设备' },
          { value: 580, name: 'WebSocket设备' },
          { value: 484, name: 'MQTT设备' }
        ]
      }
    ]
  })

  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    activity.resize()
    deviceType.resize()
  })
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 180px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-value {
  font-size: 36px;
  font-weight: bold;
  margin: 20px 0;
  background: linear-gradient(45deg, #1890ff, #36cfc9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.trend {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
}

.charts-container {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart {
  height: 350px;
}

.recent-activity {
  margin-bottom: 20px;
}

/* 统计卡片渐变背景 */
.total-users .el-card__header {
  background: linear-gradient(45deg, rgba(24,144,255,0.1), rgba(24,144,255,0.2));
}

.total-devices .el-card__header {
  background: linear-gradient(45deg, rgba(54,207,201,0.1), rgba(54,207,201,0.2));
}

.online-devices .el-card__header {
  background: linear-gradient(45deg, rgba(103,194,58,0.1), rgba(103,194,58,0.2));
}

.total-commands .el-card__header {
  background: linear-gradient(45deg, rgba(144,147,153,0.1), rgba(144,147,153,0.2));
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #fafcff;
}
</style> 