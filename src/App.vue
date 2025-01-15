<template>
  <router-view></router-view>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

/* Element Plus 样式覆盖 */
.el-card {
  border: none !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.08),
              0 3px 6px 0 rgba(0, 0, 0, 0.06),
              0 5px 12px 4px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.3s ease !important;
}

.el-card:hover {
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.12),
              0 4px 8px 0 rgba(0, 0, 0, 0.08),
              0 6px 16px 4px rgba(0, 0, 0, 0.05) !important;
}

.el-card__header {
  border-bottom: 1px solid #f0f0f0 !important;
  padding: 16px 20px !important;
}

.el-button {
  border-radius: 4px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
}

.el-button:not(.is-text):not(.is-link) {
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02) !important;
}

.el-button--primary:not(.is-text):not(.is-link) {
  background: linear-gradient(135deg, #409EFF 0%, #2e89ff 100%) !important;
  border: none !important;
}

.el-button--primary:not(.is-text):not(.is-link):hover {
  background: linear-gradient(135deg, #66b1ff 0%, #409EFF 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4) !important;
}

.el-input__wrapper {
  box-shadow: 0 0 0 1px #dcdfe6 !important;
  border-radius: 4px !important;
  transition: all 0.3s ease !important;
}

.el-input__wrapper:hover {
  box-shadow: 0 0 0 1px #409EFF !important;
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #409EFF !important;
}

.el-table {
  border-radius: 8px !important;
  overflow: hidden !important;
}

.el-table th.el-table__cell {
  background-color: #fafafa !important;
  font-weight: 600 !important;
}

.el-dialog {
  border-radius: 8px !important;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08),
              0 9px 28px 0 rgba(0, 0, 0, 0.05),
              0 12px 48px 16px rgba(0, 0, 0, 0.03) !important;
}

.el-dialog__header {
  margin: 0 !important;
  padding: 16px 24px !important;
  border-bottom: 1px solid #f0f0f0 !important;
}

.el-dialog__footer {
  border-top: 1px solid #f0f0f0 !important;
  padding: 16px 24px !important;
}

.el-message {
  border-width: 0px !important;
  border-radius: 8px !important;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08),
              0 9px 28px 0 rgba(0, 0, 0, 0.05) !important;
  padding: 12px 24px !important;
}

.el-message--success {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%) !important;
}

.el-message--error {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%) !important;
}

.el-message--warning {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%) !important;
}

.el-message--info {
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%) !important;
}
</style>
