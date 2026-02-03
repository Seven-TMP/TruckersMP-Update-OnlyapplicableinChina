/**
 * IPC 处理器设置模块
 * 设置所有 IPC 通信处理程序
 */

const { ipcMain, dialog, BrowserWindow } = require('electron');
const { getFileList, downloadFile, checkPermission } = require('./apiHandler');
const { selectDirectory, updateFiles, validateDirectory } = require('./fileHandler');

/**
 * 设置所有 IPC 处理器
 */
function setupIpcHandlers() {
    console.log('设置 IPC 处理器...');

    // 窗口控制
    ipcMain.handle('window-minimize', async () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) win.minimize();
    });

    ipcMain.handle('window-maximize', async () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            if (win.isMaximized()) {
                win.unmaximize();
            } else {
                win.maximize();
            }
        }
    });

    ipcMain.handle('window-close', async () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) win.close();
    });

    // 文件列表
    ipcMain.handle('get-file-list', async () => {
        const result = await getFileList();
        return result;
    });

    // 文件下载
    ipcMain.handle('download-file', async (event, params) => {
        return await downloadFile(params, event);
    });

    // 权限检查
    ipcMain.handle('check-permission', async (event, dirPath) => {
        return await checkPermission(dirPath);
    });

    // 选择目录
    ipcMain.handle('select-directory', async () => {
        const win = BrowserWindow.getAllWindows()[0];
        return await selectDirectory(win);
    });

    // 验证目录
    ipcMain.handle('validate-directory', async (event, dirPath) => {
        return await validateDirectory(dirPath);
    });

    // 更新文件
    ipcMain.handle('update-files', async (event, params) => {
        return await updateFiles(params, event);
    });

    // 显示消息框
    ipcMain.handle('show-message', async (event, options) => {
        const win = BrowserWindow.getAllWindows()[0];
        return await dialog.showMessageBox(win, options);
    });

    // 显示错误框
    ipcMain.handle('show-error', async (event, options) => {
        const win = BrowserWindow.getAllWindows()[0];
        return await dialog.showErrorBox(options.title, options.message);
    });

    // 获取应用版本
    ipcMain.handle('get-app-version', async () => {
        const { app } = require('electron');
        return app.getVersion();
    });

    // 获取 TMP 目录路径（返回 installation 子目录）
    ipcMain.handle('get-tmp-path', async () => {
        const fs = require('fs');
        const path = require('path');
        const { app } = require('electron');

        const base = app.getPath('appData');
        const installation = path.join(base, 'TruckersMP', 'installation');

        try {
            if (fs.existsSync(installation)) {
                console.log('找到 installation 目录:', installation);
                return installation;
            }
        } catch (error) {
            console.warn('检查 installation 路径失败:', error);
        }

        return null;
    });

    // 【调试版】检测 TMP 路径（返回详细信息）
    ipcMain.handle('debug-tmp-path', async () => {
        const fs = require('fs');
        const path = require('path');
        const { app } = require('electron');

        const base = app.getPath('appData');
        const tmpDir = path.join(base, 'TruckersMP');
        const installation = path.join(tmpDir, 'installation');

        return {
            appData: base,
            tmpDir: tmpDir,
            target: installation,
            appDataExists: fs.existsSync(base),
            tmpDirExists: fs.existsSync(tmpDir),
            installationExists: fs.existsSync(installation)
        };
    });

    // 打开开发者工具
    ipcMain.handle('open-devtools', async () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            win.webContents.openDevTools();
        }
    });

    console.log('IPC 处理器设置完成');
}

module.exports = {
    setupIpcHandlers
};
