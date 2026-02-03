/**
 * 主进程入口文件
 * 应用启动入口
 */

// 设置控制台编码为 UTF-8
try {
    process.env.NODE_ENV = 'development';
    if (process.platform === 'win32') {
        process.env.VSLANG = 'zh-CN.UTF-8';
    }
} catch (e) {}

const { app } = require('electron');
const { createWindow } = require('./window');
const { setupIpcHandlers } = require('./handlers');

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
    createWindow();
    setupIpcHandlers();
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 应用激活时重新创建窗口（macOS）
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    dialog.showErrorBox('应用错误', `发生错误: ${error.message}`);
});
