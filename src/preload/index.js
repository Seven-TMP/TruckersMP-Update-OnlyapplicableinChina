/**
 * 预加载脚本
 * 安全地暴露 API 给渲染进程
 */

const { contextBridge, ipcRenderer } = require('electron');

// ========== 窗口控制 API ==========

contextBridge.exposeInMainWorld('windowControls', {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close')
});

// ========== 文件操作 API ==========

contextBridge.exposeInMainWorld('fileAPI', {
    // 获取文件列表
    getFileList: () => ipcRenderer.invoke('get-file-list'),

    // 下载文件
    downloadFile: (url, filePath, targetDir) =>
        ipcRenderer.invoke('download-file', { url, filePath, targetDir }),

    // 权限检查
    checkPermission: (dirPath) => ipcRenderer.invoke('check-permission', dirPath),

    // 选择目录
    selectDirectory: () => ipcRenderer.invoke('select-directory'),

    // 验证目录
    validateDirectory: (dirPath) => ipcRenderer.invoke('validate-directory', dirPath),

    // 更新文件
    updateFiles: (files, targetDir, filterType, versionType) =>
        ipcRenderer.invoke('update-files', {
            files,
            targetDir,
            filterType,
            versionType
        })
});

// ========== 进度监听 API ==========

contextBridge.exposeInMainWorld('progressAPI', {
    // 监听下载进度
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, data) => callback(data));
    },

    // 移除进度监听
    removeProgressListener: () => {
        ipcRenderer.removeAllListeners('download-progress');
    }
});

// ========== 消息框 API ==========

contextBridge.exposeInMainWorld('dialogAPI', {
    // 显示消息框
    showMessage: (options) => ipcRenderer.invoke('show-message', options),

    // 显示错误框
    showError: (title, message) => ipcRenderer.invoke('show-error', { title, message })
});

// ========== 应用信息 API ==========

contextBridge.exposeInMainWorld('appInfo', {
    // 获取应用版本
    getVersion: () => ipcRenderer.invoke('get-app-version'),

    // 获取 TMP 目录路径
    getTmpPath: () => ipcRenderer.invoke('get-tmp-path'),

    // 【调试版】检测 TMP 路径
    debugTmpPath: () => ipcRenderer.invoke('debug-tmp-path'),

    // 打开开发者工具
    openDevTools: () => ipcRenderer.invoke('open-devtools')
});

// ========== 清理 ==========

// 页面卸载时清理监听器
window.addEventListener('beforeunload', () => {
    ipcRenderer.removeAllListeners('download-progress');
});
