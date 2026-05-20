/**
 * TMP更新工具 - 主应用逻辑
 * 现代化重构版本
 */

const AppState = {
    // 状态枚举
    State: {
        IDLE: 'idle',
        LOADING: 'loading',
        PROCESSING: 'processing',
        SUCCESS: 'success',
        ERROR: 'error'
    },

    // 当前状态
    current: 'idle',

    // 数据
    fileList: [],
    newDir: '',
    oldDir: '',
    isUpdating: false,

    // 更新状态
    setState(newState) {
        const oldState = this.current;
        this.current = newState;
        console.log(`状态变更: ${oldState} -> ${newState}`);
        this.updateUI();
    },

    getState() {
        return this.current;
    },

    // 更新 UI
    updateUI() {
        this.renderButtons();
        this.renderStatus();
    },

    // 渲染按钮状态
    renderButtons() {
        const buttons = document.querySelectorAll('.btn-action');
        const isBusy = this.current === this.State.LOADING ||
            this.current === this.State.PROCESSING ||
            this.isUpdating;

        buttons.forEach(btn => {
            btn.disabled = isBusy;
            if (isBusy) {
                btn.classList.add('loading');
            } else {
                btn.classList.remove('loading');
            }
        });
    },

    // 渲染状态
    renderStatus() {
        const statusEl = document.getElementById('appStatus');
        if (statusEl) {
            const stateInfo = {
                [this.State.IDLE]: { icon: '⚡', text: '就绪', color: '#48bb78' },
                [this.State.LOADING]: { icon: '⏳', text: '加载中...', color: '#ed8936' },
                [this.State.PROCESSING]: { icon: '🔄', text: '处理中...', color: '#4299e1' },
                [this.State.SUCCESS]: { icon: '✅', text: '成功', color: '#48bb78' },
                [this.State.ERROR]: { icon: '❌', text: '错误', color: '#f56565' }
            };
            const info = stateInfo[this.current] || stateInfo[this.State.IDLE];
            statusEl.innerHTML = `<span style="color: ${info.color}">${info.icon} ${info.text}</span>`;
        }
    }
};

// UI 管理器
const UIManager = {
    // 显示状态消息
    showStatus(message, type = 'info', duration = 0) {
        const statusDiv = document.getElementById('statusMessage');
        if (!statusDiv) return;

        const typeClasses = {
            info: 'alert-info',
            success: 'alert-success',
            warning: 'alert-warning',
            error: 'alert-error'
        };

        statusDiv.className = `alert-box ${typeClasses[type] || typeClasses.info}`;
        statusDiv.innerHTML = message.replace(/\n/g, '<br>');
        statusDiv.style.display = 'block';

        // 添加淡入动画
        statusDiv.style.opacity = '0';
        statusDiv.style.transition = 'opacity 0.3s ease';
        requestAnimationFrame(() => {
            statusDiv.style.opacity = '1';
        });

        // 自动隐藏（可选）
        if (duration > 0 && type === 'success') {
            setTimeout(() => {
                this.hideStatus();
            }, duration);
        }
    },

    // 隐藏状态消息
    hideStatus() {
        const statusDiv = document.getElementById('statusMessage');
        if (statusDiv) {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 300);
        }
    },

    // 显示进度区域
    showProgress(show) {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.style.display = show ? 'block' : 'none';
        }
    },

    // 更新进度
    updateProgress(percent, currentFile = '', current = 0, total = 0) {
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        const currentFileEl = document.getElementById('currentFile');

        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.style.transition = 'width 0.3s ease';
        }

        if (progressPercent) {
            progressPercent.textContent = `${percent}%`;
        }

        if (currentFileEl) {
            if (current > 0 && total > 0) {
                currentFileEl.textContent = `正在处理: ${currentFile} (${current}/${total})`;
            } else {
                currentFileEl.textContent = currentFile ? `当前文件: ${currentFile}` : '';
            }
        }
    },

    // 重置进度
    resetProgress() {
        this.updateProgress(0);
        this.showProgress(false);
    },

    // 显示/隐藏文件列表
    showFileList(show) {
        const fileListSection = document.getElementById('fileListSection');
        if (fileListSection) {
            fileListSection.style.display = show ? 'block' : 'none';
        }
    },

    // 渲染文件列表
    renderFileList(files) {
        const container = document.getElementById('fileListContainer');
        const countElement = document.getElementById('fileCount');
        const section = document.getElementById('fileListSection');

        if (!container || !countElement || !section) return;

        container.innerHTML = '';
        countElement.textContent = `${files.length} 个文件`;
        section.style.display = 'block';

        // 显示前30个文件
        const displayFiles = files.slice(0, 30);
        displayFiles.forEach(file => {
            const item = this.createFileListItem(file);
            container.appendChild(item);
        });

        // 显示更多提示
        if (files.length > 30) {
            const moreText = document.createElement('div');
            moreText.className = 'more-files';
            moreText.textContent = `还有 ${files.length - 30} 个文件...`;
            container.appendChild(moreText);
        }
    },

    // 创建文件列表项
    createFileListItem(file) {
        const item = document.createElement('div');
        item.className = 'file-item';
        const isOldVersion = file.filePath.includes('core');

        item.innerHTML = `
            <div class="file-info">
                <span class="file-name" title="${file.filePath}">${window.window.Utils.truncate(file.filePath, 60)}</span>
                <span class="file-badge ${isOldVersion ? 'badge-old' : 'badge-new'}">
                    ${isOldVersion ? '旧版' : '新版'}
                </span>
            </div>
            <div class="file-status">
                <span class="status-icon">${file.downloadUrl ? '✅' : '⏳'}</span>
            </div>
        `;

        return item;
    },

    // 设置按钮加载状态
    setButtonLoading(buttonId, loading) {
        const btn = document.getElementById(buttonId);
        if (!btn) return;

        if (loading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<span class="spinner"></span> 处理中...`;
            btn.disabled = true;
        } else {
            btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
            btn.disabled = false;
        }
    },

    // 启用/禁用所有操作按钮
    setButtonsEnabled(enabled) {
        const buttons = [
            'btnGetFiles',
            'btnCheckPerm',
            'btnUpdateNew',
            'btnUpdateOld',
            'btnQuickUpdate'
        ];

        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = !enabled;
                if (!enabled) {
                    btn.classList.add('disabled');
                } else {
                    btn.classList.remove('disabled');
                }
            }
        });
    }
};

// 事件处理器
const EventHandlers = {
    // 初始化所有事件
    init() {
        this.setupWindowControls();
        this.setupDirectoryInputs();
        this.setupActionButtons();
        this.setupProgressListener();
        this.loadSavedPaths();
    },

    // 窗口控制
    setupWindowControls() {
        const minimizeBtn = document.getElementById('btnMinimize');
        const maximizeBtn = document.getElementById('btnMaximize');
        const closeBtn = document.getElementById('btnClose');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', async () => {
                await window.window.API.minimizeWindow();
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', async () => {
                await window.API.maximizeWindow();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', async () => {
                if (AppState.isUpdating) {
                    const confirm = await window.API.showConfirm('确认', '更新进行中，确定要关闭吗？');
                    if (!confirm) return;
                }
                await window.API.closeWindow();
            });
        }
    },

    // 目录输入
    setupDirectoryInputs() {
        const newDirInput = document.getElementById('newDirInput');
        const oldDirInput = document.getElementById('oldDirInput');

        if (newDirInput) {
            newDirInput.addEventListener('change', () => {
                AppState.newDir = newDirInput.value.trim();
                this.savePath('newDir', AppState.newDir);
            });
        }

        if (oldDirInput) {
            oldDirInput.addEventListener('change', () => {
                AppState.oldDir = oldDirInput.value.trim();
                this.savePath('oldDir', AppState.oldDir);
            });
        }
    },

    // 操作按钮
    setupActionButtons() {
        // 获取文件列表
        const btnGetFiles = document.getElementById('btnGetFiles');
        if (btnGetFiles) {
            btnGetFiles.addEventListener('click', () => this.handleGetFiles());
        }

        // 检查权限
        const btnCheckPerm = document.getElementById('btnCheckPerm');
        if (btnCheckPerm) {
            btnCheckPerm.addEventListener('click', () => this.handleCheckPermissions());
        }

        // 更新新版
        const btnUpdateNew = document.getElementById('btnUpdateNew');
        if (btnUpdateNew) {
            btnUpdateNew.addEventListener('click', () => this.handleUpdateFiles('new'));
        }

        // 更新旧版
        const btnUpdateOld = document.getElementById('btnUpdateOld');
        if (btnUpdateOld) {
            btnUpdateOld.addEventListener('click', () => this.handleUpdateFiles('old'));
        }

        // 快速更新
        const btnQuickUpdate = document.getElementById('btnQuickUpdate');
        if (btnQuickUpdate) {
            btnQuickUpdate.addEventListener('click', () => this.handleQuickUpdate());
        }
    },

    // 进度监听
    setupProgressListener() {
        window.API.onDownloadProgress((data) => {
            if (data.status === 'completed') {
                // 更新完成
                UIManager.updateProgress(100, '完成', data.success, data.failed);
                UIManager.showStatus(
                    `更新完成！成功: ${data.success}, 失败: ${data.failed}`,
                    data.failed === 0 ? 'success' : 'warning',
                    5000
                );
                AppState.isUpdating = false;
                UIManager.setButtonsEnabled(true);
                AppState.setState(AppState.State.SUCCESS);
            } else {
                // 更新中
                UIManager.updateProgress(
                    data.progress || 0,
                    data.filePath || '',
                    data.current || 0,
                    data.total || 0
                );
            }
        });
    },

    // 加载保存的路径
    loadSavedPaths() {
        try {
            const savedPaths = localStorage.getItem('tmp_update_paths');
            if (savedPaths) {
                const paths = JSON.parse(savedPaths);
                if (paths.newDir) {
                    const input = document.getElementById('newDirInput');
                    if (input) input.value = paths.newDir;
                    AppState.newDir = paths.newDir;
                }
                if (paths.oldDir) {
                    const input = document.getElementById('oldDirInput');
                    if (input) input.value = paths.oldDir;
                    AppState.oldDir = paths.oldDir;
                }
            }
        } catch (error) {
            console.error('加载保存的路径失败:', error);
        }
    },

    // 保存路径
    savePath(key, value) {
        try {
            const savedPaths = localStorage.getItem('tmp_update_paths');
            const paths = savedPaths ? JSON.parse(savedPaths) : {};
            paths[key] = value;
            localStorage.setItem('tmp_update_paths', JSON.stringify(paths));
        } catch (error) {
            console.error('保存路径失败:', error);
        }
    },

    // 选择目录
    async handleSelectDirectory(type) {
        const path = await window.API.selectDirectory();
        if (path) {
            const inputId = type === 'new' ? 'newDirInput' : 'oldDirInput';
            const input = document.getElementById(inputId);
            if (input) {
                input.value = path;
                AppState[type === 'new' ? 'newDir' : 'oldDir'] = path;
                this.savePath(type === 'new' ? 'newDir' : 'oldDir', path);
                UIManager.showStatus(`已选择目录: ${path}`, 'success');
            }
        }
    },

    // 获取文件列表
    async handleGetFiles() {
        AppState.setState(AppState.State.LOADING);
        UIManager.setButtonsEnabled(false);
        UIManager.hideStatus();

        try {
            UIManager.showStatus('正在获取文件列表...', 'info');
            const result = await window.API.fetchFileList();

            if (result.success) {
                AppState.fileList = result.data || [];
                UIManager.renderFileList(AppState.fileList);
                UIManager.showStatus(result.message, 'success');
                AppState.setState(AppState.State.SUCCESS);
            } else {
                UIManager.showStatus(result.message, 'error');
                AppState.setState(AppState.State.ERROR);
            }
        } catch (error) {
            UIManager.showStatus(`获取文件列表失败: ${error.message}`, 'error');
            AppState.setState(AppState.State.ERROR);
        } finally {
            UIManager.setButtonsEnabled(true);
        }
    },

    // 检查权限
    async handleCheckPermissions() {
        AppState.setState(AppState.State.PROCESSING);
        UIManager.setButtonsEnabled(false);
        UIManager.hideStatus();

        const newDir = AppState.newDir || document.getElementById('newDirInput').value;
        const oldDir = AppState.oldDir || document.getElementById('oldDirInput').value;

        try {
            UIManager.showStatus('正在检查新版目录权限...', 'info');
            const newPerm = await window.API.checkDirectoryPermission(newDir);

            UIManager.showStatus('正在检查旧版目录权限...', 'info');
            const oldPerm = await window.API.checkDirectoryPermission(oldDir);

            let message = `<strong>权限检查完成</strong><br><br>`;
            message += `新版目录: ${newPerm.hasPermission ? '✅ 有权限' : '❌ 无权限'}<br>`;
            message += `旧版目录: ${oldPerm.hasPermission ? '✅ 有权限' : '❌ 无权限'}`;

            if (!oldPerm.hasPermission) {
                message += `<br><br><span style="color: #e83e8c;">⚠️ 旧版目录需要管理员权限！</span>`;
                message += `<br><span style="font-size: 0.85rem;">提示: 请右键点击程序图标，选择"以管理员身份运行"</span>`;
                AppState.setState(AppState.State.ERROR);
            } else {
                AppState.setState(AppState.State.SUCCESS);
            }

            UIManager.showStatus(message, oldPerm.hasPermission ? 'success' : 'warning');
        } catch (error) {
            UIManager.showStatus(`权限检查失败: ${error.message}`, 'error');
            AppState.setState(AppState.State.ERROR);
        } finally {
            UIManager.setButtonsEnabled(true);
        }
    },

    // 更新文件
    async handleUpdateFiles(versionType) {
        if (AppState.fileList.length === 0) {
            UIManager.showStatus('请先获取文件列表', 'warning');
            return;
        }

        const targetDir = versionType === 'new'
            ? (AppState.newDir || document.getElementById('newDirInput').value)
            : (AppState.oldDir || document.getElementById('oldDirInput').value);

        if (!targetDir) {
            UIManager.showStatus('请先选择目录', 'warning');
            return;
        }

        AppState.isUpdating = true;
        AppState.setState(AppState.State.PROCESSING);
        UIManager.setButtonsEnabled(false);
        UIManager.showProgress(true);
        UIManager.updateProgress(0);

        const versionName = versionType === 'new' ? '新版' : '旧版';

        try {
            UIManager.showStatus(`开始更新${versionName}目录...`, 'info');
            const result = await window.API.updateFiles(
                AppState.fileList,
                targetDir,
                versionType,
                versionName
            );

            if (result.success) {
                UIManager.showStatus(result.message, 'success');
                AppState.setState(AppState.State.SUCCESS);
            } else {
                UIManager.showStatus(result.message, 'warning');
                AppState.setState(AppState.State.WARNING || AppState.State.SUCCESS);
            }
        } catch (error) {
            UIManager.showStatus(`更新失败: ${error.message}`, 'error');
            AppState.setState(AppState.State.ERROR);
        } finally {
            AppState.isUpdating = false;
            UIManager.setButtonsEnabled(true);
            setTimeout(() => {
                UIManager.showProgress(false);
            }, 2000);
        }
    },

    // 快速更新（检查权限后一键更新）
    async handleQuickUpdate() {
        if (AppState.fileList.length === 0) {
            UIManager.showStatus('请先获取文件列表', 'warning');
            return;
        }

        const newDir = AppState.newDir || document.getElementById('newDirInput').value;
        const oldDir = AppState.oldDir || document.getElementById('oldDirInput').value;

        if (!newDir || !oldDir) {
            UIManager.showStatus('请先选择两个目录', 'warning');
            return;
        }

        // 先检查权限
        const oldPerm = await window.API.checkDirectoryPermission(oldDir);
        if (!oldPerm.hasPermission) {
            UIManager.showStatus('旧版目录需要管理员权限，请右键以管理员身份运行程序', 'warning');
            return;
        }

        // 更新新版
        await this.handleUpdateFiles('new');
        // 更新旧版
        await this.handleUpdateFiles('old');
    }
};

// 附加全局函数到 window
window.selectDirectory = (type) => EventHandlers.handleSelectDirectory(type);
window.minimizeWindow = () => window.API.minimizeWindow();
window.maximizeWindow = () => window.API.maximizeWindow();
window.closeWindow = () => window.API.closeWindow();

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('TMP更新工具 - 初始化中...');

    // 初始化事件
    EventHandlers.init();

    // 初始化状态
    AppState.setState(AppState.State.IDLE);

    // 初始化版本信息
    window.API.getAppVersion().then(version => {
        const versionEl = document.getElementById('appVersion');
        if (versionEl) {
            versionEl.textContent = `v${version}`;
        }
    });

    // 延迟获取 TMP 路径，确保主进程已准备好
    setTimeout(async () => {
        try {
            const tmpPath = await window.API.getTmpPath();
            console.log('TMP 路径:', tmpPath);

            // 【调试版】打印详细路径信息
            try {
                const debug = await window.appInfo.debugTmpPath();
                console.log('=== TMP 路径调试信息 ===');
                console.log('appData:', debug.appData);
                console.log('tmpDir (TruckersMP):', debug.tmpDir);
                console.log('installation:', debug.target);
                console.log('appDataExists:', debug.appDataExists);
                console.log('tmpDirExists:', debug.tmpDirExists);
                console.log('installationExists:', debug.installationExists);
                console.log('========================');
            } catch (e) {
                console.error('调试信息获取失败:', e);
            }

            if (tmpPath) {
                const input = document.getElementById('newDirInput');
                if (input) {
                    input.value = tmpPath;
                    AppState.newDir = tmpPath;
                }
            } else {
                console.warn('未检测到 TruckersMP 安装目录');
                window.API.showMessage('未检测到 TruckersMP 安装目录，请手动选择目录。', 'warning');
            }
        } catch (error) {
            console.error('获取 TMP 路径失败:', error);
        }
    }, 100);

    // 键盘快捷键：Ctrl+Shift+I 打开开发者工具
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            window.API.openDevTools();
        }
    });

    console.log('TMP更新工具 - 初始化完成');
});

// 导出模块（挂载到 window）
window.AppState = AppState;
window.UIManager = UIManager;
window.EventHandlers = EventHandlers;
