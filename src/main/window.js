/**
 * 窗口管理模块
 * 处理窗口创建和配置
 */

const { BrowserWindow, dialog, app } = require('electron');
const path = require('path');

let mainWindow = null;

/**
 * 创建主窗口
 */
function createWindow() {
    // 检查启动权限
    if (!checkStartupPermission()) {
        dialog.showErrorBox(
            '权限不足',
            '请右键点击程序，选择"以管理员身份运行"以获得必要权限。'
        );
        app.quit();
        return;
    }

    mainWindow = new BrowserWindow({
        width: 1024,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/index.js')
        },
        title: 'TMP更新工具',
        icon: path.join(__dirname, '../../assets/icon.ico'),
        // 无边框设置
        frame: false,
        transparent: false,
        // 窗口样式
        backgroundColor: '#1a1a2e',
        hasShadow: true,
        // Windows 特定设置
        win32: {
            requestedExecutionLevel: 'requireAdministrator'
        },
        // 禁用系统菜单
        autoHideMenuBar: true
    });

    // 加载主页面
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // 窗口控制
    setupWindowControls(mainWindow);

    // 禁用默认打开开发者工具
    // mainWindow.webContents.openDevTools();

    // 窗口就绪后显示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // 窗口关闭时清理
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 渲染进程崩溃处理
    mainWindow.webContents.on('render-process-gone', (event, details) => {
        console.error('渲染进程崩溃:', details);
        dialog.showErrorBox('应用错误', '渲染进程崩溃，请重启应用。');
    });

    return mainWindow;
}

/**
 * 检查启动权限
 */
function checkStartupPermission() {
    const fs = require('fs');
    const testPath = 'C:\\ProgramData\\TruckersMP\\.permission_test';

    try {
        // 尝试创建测试文件
        fs.writeFileSync(testPath, 'test');
        fs.unlinkSync(testPath);
        return true;
    } catch (error) {
        if (error.code === 'EPERM' || error.code === 'EACCES') {
            return false;
        }
        return true; // 其他错误不阻止启动
    }
}

/**
 * 设置窗口控制
 */
function setupWindowControls(win) {
    if (!win) return;

    // 最小化
    win.on('minimize', (event) => {
        event.preventDefault();
        win.minimize();
    });

    // 最大化/还原
    win.on('maximize', (event) => {
        event.preventDefault();
        win.maximize();
    });

    win.on('unmaximize', (event) => {
        event.preventDefault();
        win.unmaximize();
    });

    // 窗口移动时保存位置
    win.on('move', () => {
        if (win && !win.isMaximized()) {
            saveWindowState(win);
        }
    });

    // 窗口调整大小时保存状态
    win.on('resize', () => {
        if (win && !win.isMaximized()) {
            saveWindowState(win);
        }
    });
}

/**
 * 保存窗口状态
 */
function saveWindowState(win) {
    const state = {
        x: win.getPosition()[0],
        y: win.getPosition()[1],
        width: win.getSize()[0],
        height: win.getSize()[1],
        maximized: win.isMaximized()
    };
    // 可以保存到本地存储或配置文件
    try {
        const fs = require('fs');
        const statePath = path.join(app.getPath('userData'), 'windowState.json');
        fs.writeFileSync(statePath, JSON.stringify(state));
    } catch (error) {
        console.error('保存窗口状态失败:', error);
    }
}

/**
 * 获取主窗口实例
 */
function getMainWindow() {
    return mainWindow;
}

/**
 * 窗口控制函数
 */
const windowControls = {
    minimize: () => mainWindow?.minimize(),
    maximize: () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow?.maximize();
        }
    },
    close: () => mainWindow?.close(),
    restore: () => mainWindow?.restore()
};

module.exports = {
    createWindow,
    getMainWindow,
    windowControls
};
