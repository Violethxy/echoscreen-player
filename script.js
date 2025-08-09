class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.lyrics = [];
        this.currentLyricIndex = -1;
        this.isLooping = false;
        this.loopStartTime = 0;
        this.loopEndTime = 0;
        this.playlist = []; // 当前播放列表（指向localPlaylist或serverPlaylist）
        this.currentPlaylistIndex = -1;
        this.showTranslation = false;
        this.isSeeking = false;
        this.timerActive = false;
        this.timerId = null;
        this.timerEndTime = 0;
        this.favorites = [];
        this.currentServerUrl = null; // 保存当前服务器URL
        this.currentSelectionState = null; // 保存当前选择状态
        
        // 播放列表管理
        this.currentPlaylistType = 'local'; // 当前播放列表类型：'local' 或 'server'
        this.localPlaylist = []; // 本地播放列表
        this.serverPlaylist = []; // 服务器播放列表
        this.playlist = this.localPlaylist; // 初始化当前播放列表指向本地播放列表
        
        // 从配置文件读取设置
        this.config = typeof CONFIG !== 'undefined' ? CONFIG : {
            server: { url: 'http://154.64.252.167:4000/playercloudapi', autoLoad: true },
            player: { defaultVolume: 100, defaultSpeed: 1, autoPlay: false, showTranslation: false },
            ui: { showServerInput: false, showLoadServerBtn: false }
        };
        
        this.initializeElements();
        this.bindEvents();
        this.setupAudioEvents();
        this.loadFavoritesFromStorage();
        this.updateFavoritesCount();
        
        // 移除自动加载，改为点击服务器标签页时加载
        // if (this.config.server.autoLoad && this.config.server.url) {
        //     this.autoLoadServerFiles();
        // }
    }

    initializeElements() {
        try {
            // 文件夹上传
            this.folderInput = document.getElementById('folderInput');
            console.log('文件夹输入元素:', this.folderInput);
            
            // 服务器文件加载
            this.serverInput = document.getElementById('serverInput');
            this.loadServerBtn = document.getElementById('loadServerBtn');
            console.log('服务器输入元素:', this.serverInput);
            console.log('服务器加载按钮:', this.loadServerBtn);
            
            // 播放控制（已移到底部栏）
            this.playPauseBtn = null;
            this.prevBtn = null;
            this.nextBtn = null;
            this.loopBtn = null;
            
            // 进度和音量
            this.progressSlider = document.getElementById('progressSlider');
            this.progressFill = document.getElementById('progressFill');
            this.volumeSlider = null; // 已删除
            this.speedSelect = null; // 已移到底部栏
            
            // 显示信息（这些元素已移除，设为null）
            this.songTitle = null;
            this.currentTimeSpan = null;
            this.totalTimeSpan = null;
            
            // 底部播放栏元素
            this.bottomSongTitle = document.getElementById('bottomSongTitle');
            this.bottomCurrentTimeSpan = document.getElementById('bottomCurrentTime');
            this.bottomTotalTimeSpan = document.getElementById('bottomTotalTime');
            this.bottomProgressSlider = document.getElementById('bottomProgressSlider');
            this.bottomProgressFill = document.getElementById('bottomProgressFill');
            
            // 底部播放控制按钮
            this.bottomPlayPauseBtn = document.getElementById('bottomPlayPauseBtn');
            this.bottomPrevBtn = document.getElementById('bottomPrevBtn');
            this.bottomNextBtn = document.getElementById('bottomNextBtn');
            this.bottomLoopBtn = document.getElementById('bottomLoopBtn');
            this.bottomSpeedSelect = document.getElementById('bottomSpeedSelect');
            this.lyricsContainer = document.getElementById('lyrics');
            this.localPlaylistContainer = document.getElementById('localPlaylist');
            this.serverPlaylistContainer = document.getElementById('serverPlaylist');
            this.volumePercentage = null; // 已删除
            
            // 收藏相关元素
            this.favoritesContainer = document.getElementById('favorites');
            this.favoritesBtn = document.getElementById('favoritesBtn');
            this.favoritesCount = document.getElementById('favoritesCount');
            this.favoritesModal = document.getElementById('favoritesModal');
            this.closeFavoritesBtn = document.getElementById('closeFavoritesBtn');
            this.clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
    
            this.saveFavoritesBtn = document.getElementById('saveFavoritesBtn');
            
            // 播放列表切换按钮
            this.localPlaylistTab = document.getElementById('localPlaylistTab');
            this.serverPlaylistTab = document.getElementById('serverPlaylistTab');
            
            // 翻译控制
            this.translationToggle = document.getElementById('translationToggle');
            this.translationText = document.querySelector('.switch-label');
            
            // 定时器控制
            this.timerBtn = document.getElementById('timerBtn');
            this.timerInput = document.getElementById('timerInput');
            this.timerIcon = document.getElementById('timerIcon');
            this.timerText = document.getElementById('timerText');
            

            
            console.log('DOM元素初始化成功');
        } catch (error) {
            console.error('DOM元素初始化失败:', error);
        }
    }

    bindEvents() {
        try {
            // 文件夹上传事件
            if (this.folderInput) {
                console.log('绑定文件夹上传事件');
                this.folderInput.addEventListener('change', (e) => {
                    console.log('文件夹选择事件触发');
                    this.handleFolderUpload(e);
                });
            } else {
                console.error('文件夹输入元素未找到');
            }
            
            // 服务器文件加载事件
            if (this.loadServerBtn) {
                this.loadServerBtn.addEventListener('click', () => this.loadSongFromServer());
            }
            
            // 播放控制事件（已移到底部栏）
            
            // 底部播放控制事件
            if (this.bottomPlayPauseBtn) {
                this.bottomPlayPauseBtn.addEventListener('click', () => this.togglePlayPause());
            }
            if (this.bottomPrevBtn) {
                this.bottomPrevBtn.addEventListener('click', () => this.previous());
            }
            if (this.bottomNextBtn) {
                this.bottomNextBtn.addEventListener('click', () => this.next());
            }
            if (this.bottomLoopBtn) {
                this.bottomLoopBtn.addEventListener('click', () => this.toggleLoop());
            }
            if (this.bottomSpeedSelect) {
                this.bottomSpeedSelect.addEventListener('change', (e) => this.setPlaybackRate(e.target.value));
            }
            
            // 进度控制（这些元素已移除，跳过事件绑定）
            // if (this.progressSlider) {
            //     this.progressSlider.addEventListener('input', (e) => {
            //         this.isSeeking = true;
            //         this.seekToTime(parseFloat(e.target.value));
            //     });
            //     this.progressSlider.addEventListener('change', (e) => {
            //         this.isSeeking = false;
            //     });
            // }
            
            // 底部进度条控制
            if (this.bottomProgressSlider) {
                this.bottomProgressSlider.addEventListener('input', (e) => {
                    this.isSeeking = true;
                    this.seekToTime(parseFloat(e.target.value));
                });
                this.bottomProgressSlider.addEventListener('change', (e) => {
                    this.isSeeking = false;
                });
            }
            // 音量控制已删除
            // 倍速控制已移到底部栏
            
            // 翻译切换事件
            if (this.translationToggle) {
                this.translationToggle.addEventListener('change', () => this.toggleTranslation());
            }
            
            // 定时器事件
            if (this.timerBtn) {
                this.timerBtn.addEventListener('click', () => this.toggleTimer());
            }
            
            // 收藏按钮事件
            if (this.favoritesBtn) {
                this.favoritesBtn.addEventListener('click', () => this.openFavoritesModal());
            }
            
            // 关闭收藏弹窗事件
            if (this.closeFavoritesBtn) {
                this.closeFavoritesBtn.addEventListener('click', () => this.closeFavoritesModal());
            }
            
            // 点击弹窗背景关闭
            if (this.favoritesModal) {
                this.favoritesModal.addEventListener('click', (e) => {
                    if (e.target === this.favoritesModal) {
                        this.closeFavoritesModal();
                    }
                });
            }
            
            // 清空收藏事件
            if (this.clearFavoritesBtn) {
                this.clearFavoritesBtn.addEventListener('click', () => this.clearAllFavorites());
            }
            

            
            // 保存收藏事件
            if (this.saveFavoritesBtn) {
                this.saveFavoritesBtn.addEventListener('click', () => this.saveFavoritesToTxtFile());
            }
            
            // 播放列表切换事件
            if (this.localPlaylistTab) {
                this.localPlaylistTab.addEventListener('click', () => this.switchPlaylist('local'));
            }
            if (this.serverPlaylistTab) {
                this.serverPlaylistTab.addEventListener('click', () => {
                    this.switchPlaylist('server');
                    // 如果服务器播放列表为空，则加载服务器文件
                    if (this.serverPlaylist.length === 0) {
                        this.autoLoadServerFiles();
                    }
                });
            }
            
            console.log('事件绑定成功');
        } catch (error) {
            console.error('事件绑定失败:', error);
        }
    }

    setupAudioEvents() {
        this.audio.addEventListener('loadedmetadata', () => {
            if (this.totalTimeSpan) {
                this.totalTimeSpan.textContent = this.formatTime(this.audio.duration);
            }
            if (this.progressSlider) {
                this.progressSlider.max = this.audio.duration;
            }
            
            // 同步底部播放栏
            if (this.bottomTotalTimeSpan) {
                this.bottomTotalTimeSpan.textContent = this.formatTime(this.audio.duration);
            }
            if (this.bottomProgressSlider) {
                this.bottomProgressSlider.max = this.audio.duration;
            }
        });

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
            this.updateLyrics();
            this.checkLoop();
        });

        this.audio.addEventListener('ended', () => {
            if (!this.isSeeking) {
                this.handleAudioEnd();
            }
        });

        this.audio.addEventListener('play', () => {
            if (this.bottomPlayPauseBtn) {
                this.bottomPlayPauseBtn.innerHTML = '<span class="pause-icon">⏸</span>';
                this.bottomPlayPauseBtn.classList.add('active');
            }
        });

        this.audio.addEventListener('pause', () => {
            if (this.bottomPlayPauseBtn) {
                this.bottomPlayPauseBtn.innerHTML = '<span class="play-icon">▶</span>';
                this.bottomPlayPauseBtn.classList.remove('active');
            }
        });
    }

    async handleFolderUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) {
            console.log('没有选择任何文件');
            return;
        }

        console.log('开始处理文件夹上传，文件数量:', files.length);
        console.log('文件列表:', files.map(f => f.webkitRelativePath));
        console.log('文件详细信息:', files.map(f => ({
            name: f.name,
            webkitRelativePath: f.webkitRelativePath,
            size: f.size,
            type: f.type
        })));
        this.updateStatus('正在处理文件夹...', 'success');
        
        try {
            // 检测macOS系统并给出提示
            const isMacOS = navigator.platform.includes('Mac');
            if (isMacOS) {
                console.log('检测到macOS系统，正在处理多层文件夹结构...');
                this.updateStatus('macOS系统：正在处理多层文件夹结构...', 'success');
            }
            
            // 按文件夹分组文件
            const folderGroups = this.groupFilesByFolder(files);
            console.log('文件夹分组结果:', Object.keys(folderGroups));
            
            // 处理每个文件夹
            for (const [folderName, folderFiles] of Object.entries(folderGroups)) {
                console.log(`处理文件夹: ${folderName}, 文件数量: ${folderFiles.length}`);
                await this.processFolder(folderName, folderFiles);
            }
            
            this.updateStatus(`成功加载 ${this.localPlaylist.length} 首歌曲到本地播放列表`, 'success');
            
            // 切换到本地播放列表
            this.switchPlaylist('local');
            
            // 如果有歌曲，自动播放第一首
            if (this.localPlaylist.length > 0) {
                this.currentPlaylistIndex = 0;
                this.loadSong(this.localPlaylist[0]);
            }
            
        } catch (error) {
            console.error('文件夹处理失败:', error);
            this.updateStatus('文件夹处理失败: ' + error.message, 'error');
        }
    }

    async loadSongFromServer() {
        // 优先使用配置文件中的服务器地址，如果没有则使用输入框的值
        let serverUrl = this.config.server.url;
        if (!serverUrl && this.serverInput) {
            serverUrl = this.serverInput.value.trim();
        }
        
        if (!serverUrl) {
            this.updateStatus('未配置服务器地址', 'error');
            return;
        }

        try {
            this.updateStatus('正在扫描服务器目录结构...', 'success');
            this.loadServerBtn.disabled = true;
            this.loadServerBtn.textContent = '扫描中...';

            // 保存当前服务器URL
            this.currentServerUrl = serverUrl;

            // 清空服务器播放列表
            this.serverPlaylist = [];
            this.currentPlaylistIndex = -1;

            // 获取服务器目录结构
            const directoryStructure = await this.getServerDirectoryStructure(serverUrl);
            
            if (!directoryStructure || Object.keys(directoryStructure).length === 0) {
                this.updateStatus('服务器上没有找到文件夹', 'error');
                return;
            }

            // 显示一级文件夹选择界面
            this.showFolderSelection(directoryStructure, serverUrl);

        } catch (error) {
            console.error('服务器文件加载失败:', error);
            this.updateStatus('服务器文件加载失败: ' + error.message, 'error');
        } finally {
            this.loadServerBtn.disabled = false;
            this.loadServerBtn.textContent = '加载服务器文件';
        }
    }

    async getServerDirectoryStructure(serverUrl) {
        try {
            console.log('开始获取服务器目录结构:', serverUrl);
            
            const response = await fetch(serverUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                // JSON格式响应
                const data = await response.json();
                console.log('收到JSON响应:', data);
                
                if (data.success && data.shows) {
                    // 处理shows/episodes结构
                    const structure = {};
                    for (const [showName, showData] of Object.entries(data.shows)) {
                        if (showData.episodes) {
                            structure[showName] = {
                                type: 'show',
                                episodes: Object.keys(showData.episodes),
                                data: showData
                            };
                        }
                    }
                    return structure;
                } else if (data.success && data.folders) {
                    // 处理folders结构
                    const structure = {};
                    for (const [folderName, folderData] of Object.entries(data.folders)) {
                        structure[folderName] = {
                            type: 'folder',
                            data: folderData
                        };
                    }
                    return structure;
                }
            } else {
                // HTML格式响应
                const html = await response.text();
                return this.parseHtmlDirectory(html, serverUrl);
            }
            
            return {};
        } catch (error) {
            console.error('获取服务器目录结构失败:', error);
            throw error;
        }
    }

    parseHtmlDirectory(html, serverUrl) {
        const structure = {};
        const links = html.match(/href="([^"]+)"/gi);
        
        if (links) {
            const folders = [];
            
            for (const link of links) {
                const match = link.match(/href="([^"]+)"/);
                if (match) {
                    const href = match[1];
                    if (href.endsWith('/') && href !== '../' && href !== './') {
                        const folderName = href.replace('/', '');
                        folders.push(folderName);
                    }
                }
            }
            
            // 将一级文件夹添加到结构中
            folders.forEach(folder => {
                structure[folder] = {
                    type: 'html_folder',
                    url: new URL(folder + '/', serverUrl).href
                };
            });
        }
        
        return structure;
    }

    showFolderSelection(structure, serverUrl) {
        const container = this.currentPlaylistType === 'local' ? this.localPlaylistContainer : this.serverPlaylistContainer;
        if (!container) return;
        
        // 保存当前选择状态
        this.currentSelectionState = {
            type: 'folder_selection',
            structure: structure,
            serverUrl: serverUrl
        };
        
        container.innerHTML = '';
        
        const title = document.createElement('div');
        title.className = 'folder-selection-title';
        title.innerHTML = '<h3>请选择剧集：</h3>';
        container.appendChild(title);
        
        Object.keys(structure).forEach(folderName => {
            const item = document.createElement('div');
            item.className = 'folder-item';
            item.innerHTML = `
                <div class="folder-info">
                    <div class="folder-name">${folderName}</div>
                    <div class="folder-type">${this.getFolderTypeText(structure[folderName].type)}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.handleFolderSelection(folderName, structure[folderName], serverUrl);
            });
            
            container.appendChild(item);
        });
    }

    getFolderTypeText(type) {
        switch (type) {
            case 'show': return '剧集';
            case 'folder': return '文件夹';
            case 'html_folder': return '文件夹';
            default: return '未知';
        }
    }

    async handleFolderSelection(folderName, folderData, serverUrl) {
        console.log(`用户选择了文件夹: ${folderName}`);
        
        if (folderData.type === 'show') {
            // 显示二级文件夹（集数）选择
            this.showEpisodeSelection(folderName, folderData, serverUrl);
        } else if (folderData.type === 'folder') {
            // 直接加载文件夹中的歌曲
            await this.loadFolderSongs(folderName, folderData, serverUrl);
        } else if (folderData.type === 'html_folder') {
            // 扫描HTML文件夹的子目录
            await this.scanHtmlFolder(folderName, folderData.url);
        }
    }

    showEpisodeSelection(showName, showData, serverUrl) {
        const container = this.currentPlaylistType === 'local' ? this.localPlaylistContainer : this.serverPlaylistContainer;
        if (!container) return;
        
        // 保存当前选择状态
        this.currentSelectionState = {
            type: 'episode_selection',
            showName: showName,
            showData: showData,
            serverUrl: serverUrl
        };
        
        container.innerHTML = '';
        
        const title = document.createElement('div');
        title.className = 'episode-selection-title';
        title.innerHTML = `<h3>${showName} - 请选择集数：</h3>`;
        container.appendChild(title);
        
        // 添加返回按钮
        const backBtn = document.createElement('div');
        backBtn.className = 'back-button';
        backBtn.innerHTML = '← 返回剧集列表';
        backBtn.addEventListener('click', () => {
            this.loadSongFromServer();
        });
        container.appendChild(backBtn);
        

        
        showData.episodes.forEach(episodeName => {
            const item = document.createElement('div');
            item.className = 'episode-item';
            item.innerHTML = `
                <div class="episode-info">
                    <div class="episode-name">${episodeName}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.loadEpisodeSongs(showName, episodeName, showData.data.episodes[episodeName], serverUrl);
            });
            
            container.appendChild(item);
        });
    }

    async loadEpisodeSongs(showName, episodeName, episodeData, serverUrl) {
        console.log(`加载剧集: ${showName} - ${episodeName}`);
        
        try {
            this.updateStatus(`正在加载 ${showName} - ${episodeName}...`, 'success');
            
            // 创建歌曲对象
            const song = {
                id: Date.now() + Math.random(),
                title: `${showName} - ${episodeName}`,
                audioUrl: new URL(`${showName}/${episodeName}/${episodeData.audioFiles[0]}`, serverUrl).href,
                lrcUrl: episodeData.scriptFiles && episodeData.scriptFiles.length > 0 ? 
                    new URL(`${showName}/${episodeName}/${episodeData.scriptFiles[0]}`, serverUrl).href : null,
                duration: 0,
                lyrics: []
            };
            
            // 预加载音频时长
            try {
                const tempAudio = new Audio();
                tempAudio.src = song.audioUrl;
                
                await new Promise((resolve, reject) => {
                    tempAudio.addEventListener('loadedmetadata', () => {
                        song.duration = tempAudio.duration;
                        resolve();
                    }, { once: true });
                    tempAudio.addEventListener('error', reject, { once: true });
                });
            } catch (error) {
                console.warn(`预加载音频时长失败: ${error.message}`);
            }
            
            // 处理歌词文件
            if (song.lrcUrl) {
                try {
                    const lrcText = await this.readServerLrcFile(song.lrcUrl);
                    song.lyrics = this.parseLrc(lrcText);
                } catch (error) {
                    console.warn(`处理歌词文件失败: ${error.message}`);
                }
            }
            
            this.serverPlaylist = [song];
            this.currentPlaylistIndex = 0;
            
            this.updateStatus(`已加载: ${song.title} 到服务器播放列表`, 'success');
            
            // 切换到服务器播放列表
            this.switchPlaylist('server');
            this.loadSong(song);
            
        } catch (error) {
            console.error(`加载剧集失败:`, error);
            this.updateStatus('加载剧集失败: ' + error.message, 'error');
        }
    }

    async loadAllEpisodes(showName, showData, serverUrl) {
        console.log(`加载所有剧集: ${showName}`);
        
        try {
            this.updateStatus(`正在加载 ${showName} 的所有集数...`, 'success');
            
            this.serverPlaylist = [];
            this.currentPlaylistIndex = -1;
            
            // 加载所有集数
            for (const episodeName of showData.episodes) {
                const episodeData = showData.data.episodes[episodeName];
                
                if (episodeData.audioFiles && episodeData.audioFiles.length > 0) {
                    console.log(`处理剧集: ${episodeName}`);
                    
                    // 创建歌曲对象
                    const song = {
                        id: Date.now() + Math.random(),
                        title: `${showName} - ${episodeName}`,
                        audioUrl: new URL(`${showName}/${episodeName}/${episodeData.audioFiles[0]}`, serverUrl).href,
                        lrcUrl: episodeData.scriptFiles && episodeData.scriptFiles.length > 0 ? 
                            new URL(`${showName}/${episodeName}/${episodeData.scriptFiles[0]}`, serverUrl).href : null,
                        duration: 0,
                        lyrics: []
                    };
                    
                    // 预加载音频时长
                    try {
                        const tempAudio = new Audio();
                        tempAudio.src = song.audioUrl;
                        
                        await new Promise((resolve, reject) => {
                            tempAudio.addEventListener('loadedmetadata', () => {
                                song.duration = tempAudio.duration;
                                resolve();
                            }, { once: true });
                            tempAudio.addEventListener('error', reject, { once: true });
                        });
                    } catch (error) {
                        console.warn(`预加载音频时长失败: ${error.message}`);
                    }
                    
                    // 处理歌词文件
                    if (song.lrcUrl) {
                        try {
                            const lrcText = await this.readServerLrcFile(song.lrcUrl);
                            song.lyrics = this.parseLrc(lrcText);
                        } catch (error) {
                            console.warn(`处理歌词文件失败: ${error.message}`);
                        }
                    }
                    
                    this.serverPlaylist.push(song);
                    console.log(`已添加剧集到服务器播放列表: ${episodeName}`);
                }
            }
            
            if (this.serverPlaylist.length > 0) {
                this.currentPlaylistIndex = 0;
                this.updateStatus(`已加载 ${this.serverPlaylist.length} 集 ${showName} 到服务器播放列表`, 'success');
                
                // 切换到服务器播放列表
                this.switchPlaylist('server');
                this.loadSong(this.serverPlaylist[0]);
            } else {
                this.updateStatus('没有找到可播放的剧集', 'error');
            }
            
        } catch (error) {
            console.error(`加载所有剧集失败:`, error);
            this.updateStatus('加载所有剧集失败: ' + error.message, 'error');
        }
    }

    async loadFolderSongs(folderName, folderData, serverUrl) {
        console.log(`加载文件夹: ${folderName}`);
        
        try {
            this.updateStatus(`正在加载 ${folderName}...`, 'success');
            
            this.serverPlaylist = [];
            this.currentPlaylistIndex = -1;
            
            // 加载文件夹中的所有音频文件
            if (folderData.data.audioFiles && folderData.data.audioFiles.length > 0) {
                for (let i = 0; i < folderData.data.audioFiles.length; i++) {
                    const audioFile = folderData.data.audioFiles[i];
                    const scriptFile = folderData.data.scriptFiles && folderData.data.scriptFiles.length > i ? 
                        folderData.data.scriptFiles[i] : null;
                    
                    const song = {
                        id: Date.now() + Math.random() + i,
                        title: `${folderName} - ${audioFile}`,
                        audioUrl: new URL(`${folderName}/${audioFile}`, serverUrl).href,
                        lrcUrl: scriptFile ? new URL(`${folderName}/${scriptFile}`, serverUrl).href : null,
                        duration: 0,
                        lyrics: []
                    };
                    
                    // 预加载音频时长
                    try {
                        const tempAudio = new Audio();
                        tempAudio.src = song.audioUrl;
                        
                        await new Promise((resolve, reject) => {
                            tempAudio.addEventListener('loadedmetadata', () => {
                                song.duration = tempAudio.duration;
                                resolve();
                            }, { once: true });
                            tempAudio.addEventListener('error', reject, { once: true });
                        });
                    } catch (error) {
                        console.warn(`预加载音频时长失败: ${error.message}`);
                    }
                    
                    // 处理歌词文件
                    if (song.lrcUrl) {
                        try {
                            const lrcText = await this.readServerLrcFile(song.lrcUrl);
                            song.lyrics = this.parseLrc(lrcText);
                        } catch (error) {
                            console.warn(`处理歌词文件失败: ${error.message}`);
                        }
                    }
                    
                    this.serverPlaylist.push(song);
                    console.log(`已添加歌曲到服务器播放列表: ${song.title}`);
                }
            }
            
            if (this.serverPlaylist.length > 0) {
                this.currentPlaylistIndex = 0;
                this.updateStatus(`已加载 ${this.serverPlaylist.length} 首歌曲到服务器播放列表`, 'success');
                
                // 切换到服务器播放列表
                this.switchPlaylist('server');
                this.loadSong(this.serverPlaylist[0]);
            } else {
                this.updateStatus('文件夹中没有找到音频文件', 'error');
            }
            
        } catch (error) {
            console.error(`加载文件夹失败:`, error);
            this.updateStatus('加载文件夹失败: ' + error.message, 'error');
        }
    }

    async scanHtmlFolder(folderName, folderUrl) {
        console.log(`扫描HTML文件夹: ${folderName}`);
        
        try {
            this.updateStatus(`正在扫描 ${folderName}...`, 'success');
            
            const response = await fetch(folderUrl);
            if (!response.ok) {
                throw new Error(`无法访问文件夹: ${response.status}`);
            }
            
            const html = await response.text();
            const links = html.match(/href="([^"]+)"/gi);
            
            if (links) {
                const subFolders = [];
                const files = [];
                
                for (const link of links) {
                    const match = link.match(/href="([^"]+)"/);
                    if (match) {
                        const href = match[1];
                        if (href.endsWith('/') && href !== '../' && href !== './') {
                            subFolders.push(href.replace('/', ''));
                        } else {
                            const fileType = this.getFileType(href);
                            if (fileType === 'audio' || fileType === 'lrc') {
                                files.push(href);
                            }
                        }
                    }
                }
                
                if (subFolders.length > 0) {
                    // 显示子文件夹选择
                    this.showSubFolderSelection(folderName, subFolders, folderUrl);
                } else if (files.some(f => this.getFileType(f) === 'audio')) {
                    // 直接加载歌曲
                    await this.loadHtmlFolderSongs(folderName, files, folderUrl);
                }
            }
            
        } catch (error) {
            console.error(`扫描HTML文件夹失败:`, error);
            this.updateStatus('扫描文件夹失败: ' + error.message, 'error');
        }
    }

    showSubFolderSelection(parentFolder, subFolders, parentUrl) {
        if (!this.playlistContainer) return;
        
        this.playlistContainer.innerHTML = '';
        
        const title = document.createElement('div');
        title.className = 'subfolder-selection-title';
        title.innerHTML = `<h3>${parentFolder} - 请选择集数：</h3>`;
        this.playlistContainer.appendChild(title);
        
        // 添加返回按钮
        const backBtn = document.createElement('div');
        backBtn.className = 'back-button';
        backBtn.innerHTML = '← 返回上级';
        backBtn.addEventListener('click', () => {
            this.loadSongFromServer();
        });
        this.playlistContainer.appendChild(backBtn);
        

        
        subFolders.forEach(subFolder => {
            const item = document.createElement('div');
            item.className = 'subfolder-item';
            item.innerHTML = `
                <div class="subfolder-info">
                    <div class="subfolder-name">${subFolder}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                const subFolderUrl = new URL(subFolder + '/', parentUrl).href;
                this.scanHtmlFolder(subFolder, subFolderUrl);
            });
            
            this.playlistContainer.appendChild(item);
        });
    }

    async loadHtmlFolderSongs(folderName, files, folderUrl) {
        console.log(`加载HTML文件夹歌曲: ${folderName}`);
        
        try {
            this.updateStatus(`正在加载 ${folderName}...`, 'success');
            
            const audioFiles = files.filter(f => this.getFileType(f) === 'audio');
            const lrcFiles = files.filter(f => this.getFileType(f) === 'lrc');
            
            if (audioFiles.length === 0) {
                this.updateStatus('没有找到音频文件', 'error');
                return;
            }
            
            const song = {
                id: Date.now() + Math.random(),
                title: folderName,
                audioUrl: new URL(audioFiles[0], folderUrl).href,
                lrcUrl: lrcFiles.length > 0 ? new URL(lrcFiles[0], folderUrl).href : null,
                duration: 0,
                lyrics: []
            };
            
            // 预加载音频时长
            try {
                const tempAudio = new Audio();
                tempAudio.src = song.audioUrl;
                
                await new Promise((resolve, reject) => {
                    tempAudio.addEventListener('loadedmetadata', () => {
                        song.duration = tempAudio.duration;
                        resolve();
                    }, { once: true });
                    tempAudio.addEventListener('error', reject, { once: true });
                });
            } catch (error) {
                console.warn(`预加载音频时长失败: ${error.message}`);
            }
            
            // 处理歌词文件
            if (song.lrcUrl) {
                try {
                    const lrcText = await this.readServerLrcFile(song.lrcUrl);
                    song.lyrics = this.parseLrc(lrcText);
                } catch (error) {
                    console.warn(`处理歌词文件失败: ${error.message}`);
                }
            }
            
            this.serverPlaylist = [song];
            this.currentPlaylistIndex = 0;
            
            this.updateStatus(`已加载: ${song.title} 到服务器播放列表`, 'success');
            
            // 切换到服务器播放列表
            this.switchPlaylist('server');
            this.loadSong(song);
            
        } catch (error) {
            console.error(`加载HTML文件夹歌曲失败:`, error);
            this.updateStatus('加载歌曲失败: ' + error.message, 'error');
        }
    }

    async loadAllHtmlEpisodes(parentFolder, subFolders, parentUrl) {
        console.log(`加载所有HTML剧集: ${parentFolder}`);
        
        try {
            this.updateStatus(`正在加载 ${parentFolder} 的所有集数...`, 'success');
            
            this.serverPlaylist = [];
            this.currentPlaylistIndex = -1;
            
            // 加载所有子文件夹
            for (const subFolder of subFolders) {
                console.log(`处理子文件夹: ${subFolder}`);
                
                const subFolderUrl = new URL(subFolder + '/', parentUrl).href;
                
                try {
                    const response = await fetch(subFolderUrl);
                    if (!response.ok) {
                        console.warn(`无法访问子文件夹: ${subFolder}`);
                        continue;
                    }
                    
                    const html = await response.text();
                    const links = html.match(/href="([^"]+)"/gi);
                    
                    if (links) {
                        const files = [];
                        
                        for (const link of links) {
                            const match = link.match(/href="([^"]+)"/);
                            if (match) {
                                const href = match[1];
                                if (!href.endsWith('/') && href !== '../' && href !== './') {
                                    const fileType = this.getFileType(href);
                                    if (fileType === 'audio' || fileType === 'lrc') {
                                        files.push(href);
                                    }
                                }
                            }
                        }
                        
                        const audioFiles = files.filter(f => this.getFileType(f) === 'audio');
                        const lrcFiles = files.filter(f => this.getFileType(f) === 'lrc');
                        
                        if (audioFiles.length > 0) {
                            const song = {
                                id: Date.now() + Math.random(),
                                title: `${parentFolder} - ${subFolder}`,
                                audioUrl: new URL(audioFiles[0], subFolderUrl).href,
                                lrcUrl: lrcFiles.length > 0 ? new URL(lrcFiles[0], subFolderUrl).href : null,
                                duration: 0,
                                lyrics: []
                            };
                            
                            // 预加载音频时长
                            try {
                                const tempAudio = new Audio();
                                tempAudio.src = song.audioUrl;
                                
                                await new Promise((resolve, reject) => {
                                    tempAudio.addEventListener('loadedmetadata', () => {
                                        song.duration = tempAudio.duration;
                                        resolve();
                                    }, { once: true });
                                    tempAudio.addEventListener('error', reject, { once: true });
                                });
                            } catch (error) {
                                console.warn(`预加载音频时长失败: ${error.message}`);
                            }
                            
                            // 处理歌词文件
                            if (song.lrcUrl) {
                                try {
                                    const lrcText = await this.readServerLrcFile(song.lrcUrl);
                                    song.lyrics = this.parseLrc(lrcText);
                                } catch (error) {
                                    console.warn(`处理歌词文件失败: ${error.message}`);
                                }
                            }
                            
                            this.serverPlaylist.push(song);
                            console.log(`已添加剧集到服务器播放列表: ${subFolder}`);
                        }
                    }
                } catch (error) {
                    console.warn(`处理子文件夹失败: ${subFolder}`, error);
                }
            }
            
            if (this.serverPlaylist.length > 0) {
                this.currentPlaylistIndex = 0;
                this.updateStatus(`已加载 ${this.serverPlaylist.length} 集 ${parentFolder} 到服务器播放列表`, 'success');
                
                // 切换到服务器播放列表
                this.switchPlaylist('server');
                this.loadSong(this.serverPlaylist[0]);
            } else {
                this.updateStatus('没有找到可播放的剧集', 'error');
            }
            
        } catch (error) {
            console.error(`加载所有HTML剧集失败:`, error);
            this.updateStatus('加载所有剧集失败: ' + error.message, 'error');
        }
    }

    restoreSelectionState() {
        if (!this.currentSelectionState) {
            this.loadSongFromServer();
            return;
        }
        
        console.log('恢复选择状态:', this.currentSelectionState.type);
        
        if (this.currentSelectionState.type === 'folder_selection') {
            // 恢复到文件夹选择界面
            this.showFolderSelection(
                this.currentSelectionState.structure, 
                this.currentSelectionState.serverUrl
            );
        } else if (this.currentSelectionState.type === 'episode_selection') {
            // 恢复到集数选择界面
            this.showEpisodeSelection(
                this.currentSelectionState.showName,
                this.currentSelectionState.showData,
                this.currentSelectionState.serverUrl
            );
        } else {
            // 如果没有有效的选择状态，重新加载服务器
            this.loadSongFromServer();
        }
    }

    async getServerFileList(serverUrl) {
        try {
            // 直接使用用户提供的完整路径
            console.log('正在访问服务器API:', serverUrl);
            return await this.scanServerDirectory(serverUrl);
            
        } catch (error) {
            console.error('获取服务器文件列表失败:', error);
            throw new Error('无法访问服务器API，请检查服务器地址和权限');
        }
    }

    async scanServerDirectory(serverUrl) {
        // 递归扫描服务器目录结构
        const folderTree = [];
        
        try {
            console.log('开始递归扫描服务器目录:', serverUrl);
            
            // 从根目录开始扫描
            await this.scanDirectoryRecursively(serverUrl, '', folderTree);
            
            console.log(`扫描完成，共找到 ${folderTree.length} 个文件夹层级`);
            return folderTree;
            
        } catch (error) {
            console.error('扫描服务器目录失败:', error);
            throw new Error('无法访问服务器目录，请检查服务器地址和权限');
        }
    }

    async scanDirectoryRecursively(baseUrl, currentPath, folderTree, depth = 0) {
        const maxDepth = 10; // 防止无限递归
        if (depth > maxDepth) {
            console.warn('达到最大扫描深度，停止递归');
            return;
        }

        const fullUrl = new URL(currentPath, baseUrl).href;
        console.log(`扫描目录: ${fullUrl}, 深度: ${depth}`);

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                console.warn(`无法访问目录: ${fullUrl}, 状态: ${response.status}`);
                return;
            }

            // 检查响应类型
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                // JSON格式响应，处理API数据
                const data = await response.json();
                console.log('收到JSON响应:', data);
                
                if (data.success && data.shows) {
                    // 处理shows/episodes结构
                    for (const [showName, showData] of Object.entries(data.shows)) {
                        if (showData.episodes) {
                            for (const [episodeName, episodeData] of Object.entries(showData.episodes)) {
                                if (episodeData.audioFiles && episodeData.audioFiles.length > 0) {
                                    const songFolder = {
                                        name: `${showName} - ${episodeName}`,
                                        path: `${showName}/${episodeName}`,
                                        url: new URL(`${showName}/${episodeName}/`, baseUrl).href,
                                        audioFiles: episodeData.audioFiles,
                                        lrcFiles: episodeData.scriptFiles || [],
                                        isSongFolder: true,
                                        showName: showName,
                                        episodeName: episodeName
                                    };
                                    
                                    folderTree.push(songFolder);
                                    console.log(`找到歌曲目录: ${songFolder.name}, 音频文件: ${songFolder.audioFiles.length}, 歌词文件: ${songFolder.lrcFiles.length}`);
                                }
                            }
                        }
                    }
                } else if (data.success && data.folders) {
                    // 处理原有的folders结构
                    for (const [folderName, folderData] of Object.entries(data.folders)) {
                        if (folderData.audioFiles && folderData.audioFiles.length > 0) {
                            const songFolder = {
                                name: folderName,
                                path: folderName,
                                url: new URL(`${folderName}/`, baseUrl).href,
                                audioFiles: folderData.audioFiles,
                                lrcFiles: folderData.scriptFiles || [],
                                isSongFolder: true
                            };
                            
                            folderTree.push(songFolder);
                            console.log(`找到歌曲目录: ${songFolder.name}, 音频文件: ${songFolder.audioFiles.length}, 歌词文件: ${songFolder.lrcFiles.length}`);
                        }
                    }
                }
            } else {
                // HTML格式响应，处理目录浏览
                const html = await response.text();
                
                // 解析HTML中的链接
                const links = html.match(/href="([^"]+)"/gi);
                if (!links) {
                    console.log(`目录 ${fullUrl} 中没有找到链接`);
                    return;
                }

                const folders = [];
                const files = [];

                for (const link of links) {
                    const match = link.match(/href="([^"]+)"/);
                    if (match) {
                        const href = match[1];
                        
                        // 跳过父目录链接
                        if (href === '../' || href === './') {
                            continue;
                        }

                        // 检查是否是文件夹（以斜杠结尾）
                        if (href.endsWith('/')) {
                            const folderName = href.replace('/', '');
                            folders.push(folderName);
                        } else {
                            // 检查是否是音频或歌词文件
                            const fileType = this.getFileType(href);
                            if (fileType === 'audio' || fileType === 'lrc') {
                                files.push(href);
                            }
                        }
                    }
                }

                // 如果当前目录有音频文件，说明这是歌曲目录
                const hasAudioFiles = files.some(file => this.getFileType(file) === 'audio');
                
                if (hasAudioFiles) {
                    // 这是歌曲目录，添加到结果中
                    const songFolder = {
                        name: currentPath.split('/').filter(p => p).pop() || '根目录',
                        path: currentPath,
                        url: fullUrl,
                        audioFiles: files.filter(file => this.getFileType(file) === 'audio'),
                        lrcFiles: files.filter(file => this.getFileType(file) === 'lrc'),
                        isSongFolder: true
                    };
                    
                    folderTree.push(songFolder);
                    console.log(`找到歌曲目录: ${songFolder.name}, 音频文件: ${songFolder.audioFiles.length}, 歌词文件: ${songFolder.lrcFiles.length}`);
                } else if (folders.length > 0) {
                    // 这是中间目录，继续递归扫描
                    for (const folder of folders) {
                        const newPath = currentPath + folder + '/';
                        await this.scanDirectoryRecursively(baseUrl, newPath, folderTree, depth + 1);
                    }
                }
            }

        } catch (error) {
            console.error(`扫描目录失败 ${fullUrl}:`, error);
        }
    }

    getFileType(fileName) {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
        const lrcExtensions = ['.lrc', '.txt'];
        
        const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        
        if (audioExtensions.includes(ext)) return 'audio';
        if (lrcExtensions.includes(ext)) return 'lrc';
        return 'other';
    }

    async processServerFolder(songFolder) {
        console.log(`处理服务器歌曲文件夹: ${songFolder.name}`);
        
        try {
            // 检查是否有音频文件
            if (!songFolder.audioFiles || songFolder.audioFiles.length === 0) {
                console.warn(`歌曲文件夹 ${songFolder.name} 中没有找到音频文件`);
                return;
            }
            
            // 选择第一个音频文件
            const audioFileName = songFolder.audioFiles[0];
            
            // 根据数据来源构建正确的文件URL
            let audioFileUrl;
            if (songFolder.showName && songFolder.episodeName) {
                // JSON API格式：shows/episodes结构
                // 从songFolder.url中提取基础URL
                const baseUrl = songFolder.url.replace(songFolder.path + '/', '');
                audioFileUrl = new URL(`${songFolder.showName}/${songFolder.episodeName}/${audioFileName}`, baseUrl).href;
            } else {
                // 普通文件夹结构
                audioFileUrl = new URL(audioFileName, songFolder.url).href;
            }
            
            // 查找对应的歌词文件
            let lrcFileUrl = null;
            if (songFolder.lrcFiles && songFolder.lrcFiles.length > 0) {
                // 尝试找到与音频文件同名的歌词文件
                const audioBaseName = audioFileName.substring(0, audioFileName.lastIndexOf('.'));
                const matchingLrcFile = songFolder.lrcFiles.find(lrcFile => {
                    const lrcBaseName = lrcFile.substring(0, lrcFile.lastIndexOf('.'));
                    return lrcBaseName === audioBaseName;
                });
                
                if (matchingLrcFile) {
                    if (songFolder.showName && songFolder.episodeName) {
                        // JSON API格式
                        const baseUrl = songFolder.url.replace(songFolder.path + '/', '');
                        lrcFileUrl = new URL(`${songFolder.showName}/${songFolder.episodeName}/${matchingLrcFile}`, baseUrl).href;
                    } else {
                        // 普通文件夹结构
                        lrcFileUrl = new URL(matchingLrcFile, songFolder.url).href;
                    }
                } else {
                    // 如果没有找到同名文件，使用第一个歌词文件
                    if (songFolder.showName && songFolder.episodeName) {
                        const baseUrl = songFolder.url.replace(songFolder.path + '/', '');
                        lrcFileUrl = new URL(`${songFolder.showName}/${songFolder.episodeName}/${songFolder.lrcFiles[0]}`, baseUrl).href;
                    } else {
                        lrcFileUrl = new URL(songFolder.lrcFiles[0], songFolder.url).href;
                    }
                }
            }
            
            console.log(`找到音频文件: ${audioFileName}, URL: ${audioFileUrl}`);
            if (lrcFileUrl) {
                console.log(`找到歌词文件: ${songFolder.lrcFiles.find(f => new URL(f, songFolder.url).href === lrcFileUrl)}, URL: ${lrcFileUrl}`);
            }
            
            // 创建歌曲对象
            const song = {
                id: Date.now() + Math.random(),
                title: songFolder.name,
                audioUrl: audioFileUrl,
                lrcUrl: lrcFileUrl,
                duration: 0,
                lyrics: []
            };
            
            // 验证文件URL是否可访问
            try {
                console.log(`验证音频文件URL: ${audioFileUrl}`);
                const audioResponse = await fetch(audioFileUrl, { method: 'HEAD' });
                if (!audioResponse.ok) {
                    console.warn(`音频文件不可访问: ${audioResponse.status} ${audioResponse.statusText}`);
                } else {
                    console.log('音频文件URL验证成功');
                }
                
                if (lrcFileUrl) {
                    console.log(`验证歌词文件URL: ${lrcFileUrl}`);
                    const lrcResponse = await fetch(lrcFileUrl, { method: 'HEAD' });
                    if (!lrcResponse.ok) {
                        console.warn(`歌词文件不可访问: ${lrcResponse.status} ${lrcResponse.statusText}`);
                    } else {
                        console.log('歌词文件URL验证成功');
                    }
                }
            } catch (error) {
                console.warn('文件URL验证失败:', error.message);
            }
            
            // 预加载音频时长
            try {
                console.log(`预加载服务器音频时长: ${audioFileName}`);
                const tempAudio = new Audio();
                tempAudio.src = audioFileUrl;
                
                await new Promise((resolve, reject) => {
                    tempAudio.addEventListener('loadedmetadata', () => {
                        song.duration = tempAudio.duration;
                        console.log(`服务器音频时长加载完成: ${song.duration}秒`);
                        resolve();
                    }, { once: true });
                    tempAudio.addEventListener('error', reject, { once: true });
                });
            } catch (error) {
                console.warn(`预加载服务器音频时长失败: ${error.message}`);
            }
            
            // 处理歌词文件
            if (lrcFileUrl) {
                try {
                    console.log(`开始处理服务器歌词文件: ${lrcFileUrl}`);
                    const lrcText = await this.readServerLrcFile(lrcFileUrl);
                    song.lyrics = this.parseLrc(lrcText);
                    console.log(`服务器歌词解析完成，共 ${song.lyrics.length} 行`);
                } catch (error) {
                    console.warn(`处理服务器歌词文件失败: ${error.message}`);
                }
            }
            
            this.playlist.push(song);
            console.log(`服务器歌曲 ${songFolder.name} 已添加到播放列表，时长: ${song.duration}秒`);
            
        } catch (error) {
            console.error(`处理服务器歌曲文件夹 ${songFolder.name} 失败:`, error);
        }
    }

    async readServerLrcFile(lrcUrl) {
        try {
            const response = await fetch(lrcUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            return text;
        } catch (error) {
            throw new Error(`读取服务器歌词文件失败: ${error.message}`);
        }
    }

    groupFilesByFolder(files) {
        const folderGroups = {};
        
        // 分析文件路径结构，确定是哪种情况
        const samplePath = files[0]?.webkitRelativePath;
        console.log('样本文件路径:', samplePath);
        
        if (!samplePath) {
            console.log('没有文件路径信息');
            return folderGroups;
        }
        
        const pathParts = samplePath.split('/');
        console.log('样本路径分割:', pathParts);
        console.log('样本路径长度:', pathParts.length);
        
        // 检测macOS系统
        const isMacOS = navigator.platform.includes('Mac');
        console.log('检测到macOS:', isMacOS);
        
        // 判断上传类型
        let isDirectSubfolder = false;
        if (pathParts.length === 2) {
            // 情况2：直接上传子文件夹 (子文件夹名/文件名)
            isDirectSubfolder = true;
            console.log('检测到：直接上传子文件夹');
        } else if (pathParts.length >= 3) {
            // 情况1：上传包含多个子文件夹的文件夹 (根文件夹/子文件夹/文件名)
            isDirectSubfolder = false;
            console.log('检测到：上传包含多个子文件夹的文件夹');
        } else {
            console.log('未知的文件路径结构');
            return folderGroups;
        }
        
        for (const file of files) {
            console.log('处理文件路径:', file.webkitRelativePath);
            const pathParts = file.webkitRelativePath.split('/');
            
            let folderName;
            
            // macOS特殊处理：更好地处理多层文件夹结构
            if (isMacOS) {
                if (pathParts.length === 2) {
                    // 情况：子文件夹/文件名
                    folderName = pathParts[0];
                    console.log('macOS单层文件夹模式 - 文件夹名:', folderName);
                } else if (pathParts.length >= 3) {
                    // 情况：根文件夹/子文件夹/文件名
                    folderName = pathParts[1];
                    console.log('macOS多层文件夹模式 - 文件夹名:', folderName);
                } else {
                    // 情况：只有文件名，没有文件夹结构
                    folderName = '默认文件夹';
                    console.log('macOS无文件夹结构 - 使用默认文件夹名');
                }
            } else {
                // Windows和其他系统的处理
                if (isDirectSubfolder) {
                    // 情况2：直接上传子文件夹，使用第一个部分作为文件夹名
                    folderName = pathParts[0];
                    console.log('直接子文件夹模式 - 文件夹名:', folderName);
                } else {
                    // 情况1：多层级文件夹，使用第二个部分作为文件夹名
                    if (pathParts.length < 2) {
                        console.log('跳过根目录文件:', file.webkitRelativePath);
                        continue;
                    }
                    folderName = pathParts[1];
                    console.log('多层级文件夹模式 - 文件夹名:', folderName);
                }
            }
            
            if (!folderGroups[folderName]) {
                folderGroups[folderName] = [];
            }
            
            folderGroups[folderName].push(file);
            console.log(`文件 ${file.name} 已添加到文件夹 ${folderName}`);
        }
        
        console.log('最终文件夹分组:', Object.keys(folderGroups));
        return folderGroups;
    }

    async processFolder(folderName, files) {
        let audioFile = null;
        let lrcFile = null;
        
        console.log(`在文件夹 ${folderName} 中查找音频和歌词文件...`);
        
        // 查找音频文件和歌词文件
        for (const file of files) {
            const fileName = file.name.toLowerCase();
            console.log(`检查文件: ${fileName}`);
            console.log(`文件完整路径: ${file.webkitRelativePath}`);
            
            if (this.isAudioFile(fileName)) {
                audioFile = file;
                console.log(`找到音频文件: ${fileName}`);
            } else if (this.isLrcFile(fileName)) {
                lrcFile = file;
                console.log(`找到歌词文件: ${fileName}`);
            } else {
                console.log(`跳过非音频/歌词文件: ${fileName}`);
            }
        }
        
        if (!audioFile) {
            console.warn(`文件夹 ${folderName} 中没有找到音频文件`);
            return;
        }
        
        // 创建歌曲对象
        const song = {
            id: Date.now() + Math.random(),
            title: folderName,
            audioFile: audioFile,
            lrcFile: lrcFile,
            duration: 0,
            lyrics: []
        };
        
        // 预加载音频时长
        try {
            console.log(`预加载音频时长: ${audioFile.name}`);
            const audioUrl = URL.createObjectURL(audioFile);
            const tempAudio = new Audio();
            tempAudio.src = audioUrl;
            
            await new Promise((resolve, reject) => {
                tempAudio.addEventListener('loadedmetadata', () => {
                    song.duration = tempAudio.duration;
                    console.log(`音频时长加载完成: ${song.duration}秒`);
                    resolve();
                }, { once: true });
                tempAudio.addEventListener('error', reject, { once: true });
            });
            
            // 清理临时音频对象
            URL.revokeObjectURL(audioUrl);
        } catch (error) {
            console.warn(`预加载音频时长失败: ${error.message}`);
        }
        
        // 处理歌词文件
        if (lrcFile) {
            try {
                console.log(`开始处理歌词文件: ${lrcFile.name}`);
                const lrcText = await this.readLrcFile(lrcFile);
                song.lyrics = this.parseLrc(lrcText);
                console.log(`歌词解析完成，共 ${song.lyrics.length} 行`);
            } catch (error) {
                console.warn(`处理歌词文件失败: ${error.message}`);
            }
        }
        
        this.localPlaylist.push(song);
        console.log(`歌曲 ${folderName} 已添加到本地播放列表，时长: ${song.duration}秒`);
    }

    isAudioFile(fileName) {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
        return audioExtensions.some(ext => fileName.endsWith(ext));
    }

    isLrcFile(fileName) {
        return fileName.endsWith('.lrc') || fileName.endsWith('.txt');
    }

    async readLrcFile(file) {
        try {
            const text = await this.autoDetectAndConvert(file);
            return text;
        } catch (error) {
            throw new Error(`读取歌词文件失败: ${error.message}`);
        }
    }

    async autoDetectAndConvert(file) {
        const encodings = [
            { name: 'UTF-8', value: 'utf-8' },
            { name: 'GBK', value: 'gbk' },
            { name: 'GB2312', value: 'gb2312' },
            { name: 'Big5', value: 'big5' },
            { name: 'UTF-16', value: 'utf-16' }
        ];
        
        let bestText = null;
        let bestEncoding = null;
        let bestScore = 0;
        
        for (const encoding of encodings) {
            try {
                const text = await this.readFileWithEncoding(file, encoding.value);
                
                if (text && text.length > 0) {
                    const score = this.evaluateTextQuality(text);
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestText = text;
                        bestEncoding = encoding.name;
                    }
                }
            } catch (error) {
                console.log(`${encoding.name} 编码读取失败:`, error.message);
            }
        }
        
        if (bestText) {
            this.updateStatus(`检测到编码: ${bestEncoding}`, 'success');
            
            if (bestEncoding !== 'UTF-8') {
                try {
                    const utf8Text = await this.convertToUtf8(file, bestEncoding);
                    if (utf8Text && this.evaluateTextQuality(utf8Text) >= bestScore) {
                        this.updateStatus(`已转换为UTF-8格式`, 'success');
                        return utf8Text;
                    }
                } catch (convertError) {
                    console.log('UTF-8转换失败，使用原始编码:', convertError.message);
                }
            }
            
            return bestText;
        } else {
            throw new Error('无法检测到有效的文件编码');
        }
    }

    async readFileWithEncoding(file, encoding) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const buffer = e.target.result;
                    let text;
                    
                    if (encoding === 'gbk') {
                        text = this.decodeGBKReliable(buffer);
                    } else {
                        const decoder = new TextDecoder(encoding);
                        text = decoder.decode(buffer);
                    }
                    
                    resolve(text);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }

    decodeGBKReliable(buffer) {
        const bytes = new Uint8Array(buffer);
        let result = '';
        
        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i];
            
            if (byte < 0x80) {
                // ASCII字符
                result += String.fromCharCode(byte);
            } else if (byte >= 0x81 && byte <= 0xFE) {
                // 双字节字符
                if (i + 1 < bytes.length) {
                    const nextByte = bytes[i + 1];
                    const gbkCode = (byte << 8) | nextByte;
                    const unicode = this.gbkToUnicodeComplete(gbkCode);
                    result += unicode;
                    i++; // 跳过下一个字节
                }
            }
        }
        
        return result;
    }

    gbkToUnicodeComplete(gbkCode) {
        // 简化的GBK到Unicode映射
        if (gbkCode >= 0x8140 && gbkCode <= 0xFEFE) {
            try {
                const bytes = new Uint8Array([(gbkCode >> 8) & 0xFF, gbkCode & 0xFF]);
                const decoder = new TextDecoder('gbk');
                return decoder.decode(bytes);
            } catch (error) {
                return '?';
            }
        }
        return '?';
    }

    async convertToUtf8(file, sourceEncoding) {
        try {
            const text = await this.readFileWithEncoding(file, sourceEncoding.toLowerCase());
            return text;
        } catch (error) {
            throw new Error(`转换失败: ${error.message}`);
        }
    }

    evaluateTextQuality(text) {
        let score = 0;
        
        // 检查是否包含中文
        if (/[\u4e00-\u9fff]/.test(text)) score += 10;
        
        // 检查是否包含时间标签
        if (/\[\d{2}:\d{2}[.:]\d{2}\]/.test(text)) score += 20;
        
        // 检查是否包含方括号
        if (/\[.*\]/.test(text)) score += 5;
        
        // 检查文本长度
        if (text.length > 50) score += 5;
        
        // 检查是否有合理的行数
        const lines = text.split('\n');
        if (lines.length > 5) score += 10;
        
        return score;
    }

    parseLrc(lrcText) {
        const lines = lrcText.split('\n');
        const lyrics = [];
        let maxLines = 2000;
        let maxProcessTime = 5000;
        let startTime = Date.now();
        let processedLines = 0;
        
        for (const line of lines) {
            if (Date.now() - startTime > maxProcessTime) {
                console.warn('解析超时，停止处理');
                break;
            }
            
            if (processedLines >= maxLines) {
                console.warn('达到最大行数限制');
                break;
            }
            
            const parsed = this.parseSingleLine(line);
            if (parsed) {
                lyrics.push(parsed);
            }
            
            processedLines++;
        }
        
        lyrics.sort((a, b) => a.time - b.time);
        console.log(`解析完成: ${lyrics.length} 行歌词`);
        
        return lyrics;
    }

    parseSingleLine(line) {
        const timeFormats = [
            /\[(\d{2}):(\d{2})[.:](\d{2})\]/g,
            /\[(\d{2}):(\d{2})\]/g,
            /\[(\d{1}):(\d{2})[.:](\d{2})\]/g,
            /\[(\d{1}):(\d{2})\]/g
        ];
        
        let allMatches = [];
        
        for (const regex of timeFormats) {
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(line)) !== null) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const centiseconds = match[3] ? parseInt(match[3]) : 0;
                
                if (!isNaN(minutes) && !isNaN(seconds)) {
                    const time = minutes * 60 + seconds + centiseconds / 100;
                    allMatches.push({
                        time: time,
                        index: match.index,
                        length: match[0].length
                    });
                }
            }
        }
        
        if (allMatches.length === 0) {
            return null;
        }
        
        allMatches.sort((a, b) => a.time - b.time);
        
        const lastMatch = allMatches[allMatches.length - 1];
        const text = line.substring(lastMatch.index + lastMatch.length).trim();
        
        if (text && text.length > 0 && text.length < 500) {
            return { time: allMatches[0].time, text };
        }
        
        return null;
    }

    displayPlaylist() {
        const container = this.currentPlaylistType === 'local' ? this.localPlaylistContainer : this.serverPlaylistContainer;
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.playlist.length === 0) {
            const placeholderText = this.currentPlaylistType === 'local' ? '请上传本地文件夹' : '请加载服务器文件';
            container.innerHTML = `<div class="playlist-placeholder">${placeholderText}</div>`;
            return;
        }
        
        // 添加返回选择按钮（当播放列表只有一首歌时）
        if (this.playlist.length === 1 && this.currentSelectionState) {
            const backToSelectionBtn = document.createElement('div');
            backToSelectionBtn.className = 'back-to-selection-btn';
            backToSelectionBtn.innerHTML = '← 返回选择其他集数';
            backToSelectionBtn.addEventListener('click', () => {
                this.restoreSelectionState();
            });
            container.appendChild(backToSelectionBtn);
        }
        
        this.playlist.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === this.currentPlaylistIndex) {
                item.classList.add('active');
            }
            
            const durationText = this.formatTime(song.duration);
            console.log(`显示歌曲: ${song.title}, 时长: ${song.duration}秒, 格式化: ${durationText}`);
            item.innerHTML = `
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-duration">${durationText}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.currentPlaylistIndex = index;
                this.loadSong(song);
                this.updatePlaylistDisplay();
            });
            
            container.appendChild(item);
        });
    }

    updatePlaylistDisplay() {
        const container = this.currentPlaylistType === 'local' ? this.localPlaylistContainer : this.serverPlaylistContainer;
        if (!container) return;
        
        const items = container.querySelectorAll('.playlist-item');
        items.forEach((item, index) => {
            if (index === this.currentPlaylistIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    async loadSong(song) {
        try {
            console.log(`开始加载歌曲: ${song.title}`);
            
            // 根据歌曲类型选择加载方式
            if (song.audioFile) {
                // 本地文件
                const audioUrl = URL.createObjectURL(song.audioFile);
                this.audio.src = audioUrl;
                console.log('加载本地文件:', audioUrl);
            } else if (song.audioUrl) {
                // 服务器文件
                console.log('加载服务器文件:', song.audioUrl);
                this.audio.src = song.audioUrl;
            } else {
                throw new Error('歌曲没有有效的音频文件');
            }
            
            // 更新歌曲信息
            if (this.songTitle) {
                this.songTitle.textContent = song.title;
            }
            this.lyrics = song.lyrics || [];
            this.currentLyricIndex = -1;
            
            // 同步底部播放栏歌曲标题
            if (this.bottomSongTitle) {
                this.bottomSongTitle.textContent = song.title;
            }
            
            // 显示歌词
            this.displayLyrics();
            
            // 更新收藏数量
            this.updateFavoritesCount();
            
            // 等待音频加载完成
            await new Promise((resolve, reject) => {
                this.audio.addEventListener('loadedmetadata', () => {
                    console.log('音频加载成功');
                    resolve();
                }, { once: true });
                this.audio.addEventListener('error', (error) => {
                    console.error('音频加载失败:', error);
                    console.error('音频URL:', this.audio.src);
                    reject(new Error(`音频加载失败: ${error.message}`));
                }, { once: true });
            });
            
            // 如果歌曲时长未设置，则设置它
            if (!song.duration || song.duration === 0) {
                song.duration = this.audio.duration;
            }
            this.updateStatus(`已加载: ${song.title}`, 'success');
            
            // 更新循环按钮状态
            this.updateLoopButtonState();
            
            // 更新翻译按钮状态
            this.updateTranslationButtonState();
            
            // 重置定时器状态
            if (this.timerActive) {
                this.stopTimer();
            }
            
        } catch (error) {
            console.error('加载歌曲失败:', error);
            this.updateStatus('加载歌曲失败: ' + error.message, 'error');
        }
    }

    displayLyrics() {
        if (!this.lyricsContainer) return;
        
        this.lyricsContainer.innerHTML = '';
        
        if (this.lyrics.length === 0) {
            this.lyricsContainer.innerHTML = '<div class="lyric-placeholder">暂无歌词</div>';
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        this.lyrics.forEach((lyric, index) => {
            const line = document.createElement('div');
            line.className = 'lyric-line';
            line.dataset.time = lyric.time;
            
            // 检查是否包含翻译
            const hasTranslation = this.hasTranslation(lyric.text);
            
            if (hasTranslation && this.showTranslation) {
                // 如果有翻译且开启显示，分别显示原文和翻译
                const originalText = this.getOriginalText(lyric.text);
                const translationText = this.getTranslationText(lyric.text);
                
                line.innerHTML = `
                    <div class="lyric-original">${originalText}</div>
                    <div class="lyric-translation">${translationText}</div>
                `;
            } else if (hasTranslation && !this.showTranslation) {
                // 如果有翻译但关闭显示，只显示英文部分
                const originalText = this.getOriginalText(lyric.text);
                line.textContent = originalText;
            } else {
                // 没有翻译或不是双语歌词，显示完整文本
                line.textContent = lyric.text;
            }
            
            line.addEventListener('click', () => {
                this.seekToTime(lyric.time);
            });
            
            // 添加收藏功能
            line.addEventListener('dblclick', () => {
                this.toggleFavorite(lyric);
            });
            
            fragment.appendChild(line);
        });
        
        this.lyricsContainer.appendChild(fragment);
    }

    hasTranslation(text) {
        // 检查是否包含翻译的简单规则
        // 1. 包含中文字符
        // 2. 包含英文字符
        return /[\u4e00-\u9fff]/.test(text) && /[a-zA-Z]/.test(text);
    }

    getOriginalText(text) {
        // 提取英文部分（空格分隔前的部分）
        const parts = text.split(/\s+/);
        const englishParts = [];
        
        for (const part of parts) {
            // 如果这部分包含英文字符，认为是英文
            if (/[a-zA-Z]/.test(part) && !/[\u4e00-\u9fff]/.test(part)) {
                englishParts.push(part);
            } else if (/[\u4e00-\u9fff]/.test(part)) {
                // 遇到中文部分就停止
                break;
            }
        }
        
        return englishParts.join(' ').trim();
    }

    getTranslationText(text) {
        // 提取中文翻译部分（空格分隔后的部分）
        const parts = text.split(/\s+/);
        const chineseParts = [];
        let foundChinese = false;
        
        for (const part of parts) {
            if (/[\u4e00-\u9fff]/.test(part)) {
                foundChinese = true;
                chineseParts.push(part);
            } else if (foundChinese && /[a-zA-Z]/.test(part)) {
                // 如果已经找到中文后又遇到英文，停止
                break;
            }
        }
        
        return chineseParts.join(' ').trim();
    }

    updateLyrics() {
        if (this.lyrics.length === 0) return;
        
        const currentTime = this.audio.currentTime;
        let newIndex = -1;
        
        for (let i = this.lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= this.lyrics[i].time) {
                newIndex = i;
                break;
            }
        }
        
        if (newIndex !== this.currentLyricIndex) {
            this.currentLyricIndex = newIndex;
            this.updateLyricDisplay();
        }
    }

    updateLyricDisplay() {
        const lines = this.lyricsContainer.querySelectorAll('.lyric-line');
        
        lines.forEach((line, index) => {
            if (index === this.currentLyricIndex) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
        
        if (this.currentLyricIndex >= 0) {
            this.scrollToCurrentLyric();
        }
    }

    scrollToCurrentLyric() {
        const activeLine = this.lyricsContainer.querySelector('.lyric-line.active');
        if (activeLine) {
            activeLine.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    togglePlayPause() {
        if (this.audio.paused) {
            this.audio.play();
        } else {
            this.audio.pause();
        }
    }

    previous() {
        if (this.playlist.length === 0) return;
        
        if (this.currentPlaylistIndex > 0) {
            this.currentPlaylistIndex--;
        } else {
            this.currentPlaylistIndex = this.playlist.length - 1;
        }
        
        this.loadSong(this.playlist[this.currentPlaylistIndex]);
        this.updatePlaylistDisplay();
    }

    next() {
        if (this.playlist.length === 0) return;
        
        if (this.currentPlaylistIndex < this.playlist.length - 1) {
            this.currentPlaylistIndex++;
        } else {
            this.currentPlaylistIndex = 0;
        }
        
        this.loadSong(this.playlist[this.currentPlaylistIndex]);
        this.updatePlaylistDisplay();
    }

    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.updateLoopButtonState();
        
        if (this.isLooping) {
            console.log('单句循环已开启');
            this.updateStatus('单句循环已开启', 'success');
        } else {
            console.log('单句循环已关闭');
            // 清除状态提示
            this.clearStatus();
        }
    }

    updateLoopButtonState() {
        // 同步底部循环按钮状态
        if (this.bottomLoopBtn) {
            this.bottomLoopBtn.classList.toggle('active', this.isLooping);
            
            // 保持状态指示器元素
            const bottomStatusIndicator = this.bottomLoopBtn.querySelector('.status-indicator');
            
            if (this.isLooping) {
                this.bottomLoopBtn.innerHTML = '🔁<span class="status-indicator"></span>';
            } else {
                this.bottomLoopBtn.innerHTML = '🔁<span class="status-indicator"></span>';
            }
            
            // 重新添加状态指示器
            if (bottomStatusIndicator) {
                this.bottomLoopBtn.appendChild(bottomStatusIndicator);
            }
        }
    }
    
    switchPlaylist(type) {
        this.currentPlaylistType = type;
        
        // 更新标签页状态
        if (this.localPlaylistTab) {
            this.localPlaylistTab.classList.toggle('active', type === 'local');
        }
        if (this.serverPlaylistTab) {
            this.serverPlaylistTab.classList.toggle('active', type === 'server');
        }
        
        // 更新播放列表显示
        if (this.localPlaylistContainer) {
            this.localPlaylistContainer.classList.toggle('active', type === 'local');
        }
        if (this.serverPlaylistContainer) {
            this.serverPlaylistContainer.classList.toggle('active', type === 'server');
        }
        
        // 更新当前播放列表
        this.playlist = type === 'local' ? this.localPlaylist : this.serverPlaylist;
        this.currentPlaylistIndex = -1;
        
        // 重新显示播放列表
        this.displayPlaylist();
        
        // 如果切换到服务器播放列表且为空，显示加载提示
        if (type === 'server' && this.serverPlaylist.length === 0) {
            console.log('服务器播放列表为空');
            this.updateStatus('点击"加载服务器文件"按钮来加载服务器内容', 'info');
        }
    }

    toggleTranslation() {
        this.showTranslation = this.translationToggle.checked;
        this.updateTranslationButtonState();
        this.displayLyrics(); // 重新显示歌词以应用翻译设置
        this.displayFavorites(); // 重新显示收藏以应用翻译设置
    }

    updateTranslationButtonState() {
        if (this.translationToggle && this.translationText) {
            if (this.showTranslation) {
                this.translationText.textContent = '隐藏';
            } else {
                this.translationText.textContent = '翻译';
            }
        }
    }
    
    toggleTimer() {
        if (this.timerActive) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        const minutes = parseInt(this.timerInput.value);
        if (!minutes || minutes < 1) {
            this.updateStatus('请输入有效的分钟数', 'error');
            return;
        }
        
        this.timerActive = true;
        this.timerEndTime = Date.now() + (minutes * 60 * 1000);
        this.updateTimerButtonState();
        
        // 清除之前的定时器
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        
        // 启动新的定时器
        this.timerId = setInterval(() => {
            this.checkTimer();
        }, 1000);
        
        this.updateStatus(`定时暂停已启动，${minutes}分钟后将暂停播放`, 'timer');
    }
    
    stopTimer() {
        this.timerActive = false;
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.updateTimerButtonState();
        this.updateStatus('定时暂停已取消', 'timer');
        
        // 2秒后自动清除取消消息
        setTimeout(() => {
            this.clearStatus();
        }, 2000);
    }
    
    checkTimer() {
        if (!this.timerActive) return;
        
        const now = Date.now();
        if (now >= this.timerEndTime) {
            // 时间到，暂停播放
            this.audio.pause();
            this.stopTimer();
            this.updateStatus('定时暂停：播放已暂停', 'timer');
        }
    }
    
    updateTimerButtonState() {
        if (this.timerBtn && this.timerIcon && this.timerText) {
            this.timerBtn.classList.toggle('active', this.timerActive);
            
            if (this.timerActive) {
                this.timerIcon.textContent = '⏰';
                this.timerText.textContent = '取消';
            } else {
                this.timerIcon.textContent = '⏰';
                this.timerText.textContent = '定时';
            }
        }
    }

    checkLoop() {
        if (!this.isLooping || this.lyrics.length === 0) {
            console.log('循环检查: 循环未开启或没有歌词');
            return;
        }
        
        const currentTime = this.audio.currentTime;
        console.log(`循环检查: 当前时间 ${this.formatTime(currentTime)}`);
        
        // 找到当前正在播放的歌词
        let currentLyricIndex = -1;
        
        for (let i = 0; i < this.lyrics.length; i++) {
            if (currentTime >= this.lyrics[i].time) {
                currentLyricIndex = i;
            }
        }
        
        console.log(`循环检查: 当前歌词索引 ${currentLyricIndex}`);
        
        // 如果找到了当前歌词
        if (currentLyricIndex >= 0) {
            const currentLyric = this.lyrics[currentLyricIndex];
            const nextLyricIndex = currentLyricIndex + 1;
            
            console.log(`循环检查: 当前歌词 "${currentLyric.text}" 时间 ${this.formatTime(currentLyric.time)}`);
            
            // 如果还有下一句歌词
            if (nextLyricIndex < this.lyrics.length) {
                const nextLyric = this.lyrics[nextLyricIndex];
                console.log(`循环检查: 下一句歌词 "${nextLyric.text}" 时间 ${this.formatTime(nextLyric.time)}`);
                
                // 计算当前歌词的结束时间（下一句歌词的开始时间）
                const currentLyricEndTime = nextLyric.time;
                
                // 如果播放时间接近下一句歌词的时间（提前0.5秒），就跳回到当前句
                const loopThreshold = 0.5; // 提前0.5秒循环
                if (currentTime >= currentLyricEndTime - loopThreshold) {
                    console.log(`单句循环触发: 从 ${this.formatTime(currentTime)} 跳回到 ${this.formatTime(currentLyric.time)}`);
                    console.log(`当前歌词: "${currentLyric.text}"`);
                    console.log(`下一句歌词: "${nextLyric.text}"`);
                    console.log(`循环阈值: ${this.formatTime(currentLyricEndTime - loopThreshold)}`);
                    this.seekToTime(currentLyric.time);
                    return; // 防止重复检查
                } else {
                    console.log(`循环检查: 还未到循环阈值，继续播放`);
                    console.log(`当前时间: ${this.formatTime(currentTime)}, 循环阈值: ${this.formatTime(currentLyricEndTime - loopThreshold)}`);
                }
            } else {
                // 如果是最后一句歌词，当播放时间超过当前句的时间加上一定延迟时，跳回到当前句
                const loopDelay = 2; // 2秒延迟
                console.log(`循环检查: 最后一句歌词，延迟 ${loopDelay} 秒`);
                
                if (currentTime >= currentLyric.time + loopDelay) {
                    console.log(`单句循环触发(最后一句): 从 ${this.formatTime(currentTime)} 跳回到 ${this.formatTime(currentLyric.time)}`);
                    console.log(`最后一句歌词: "${currentLyric.text}"`);
                    this.seekToTime(currentLyric.time);
                    return;
                } else {
                    console.log(`循环检查: 最后一句，还未到延迟时间`);
                }
            }
        } else {
            console.log(`循环检查: 未找到当前歌词`);
        }
    }

    seekToTime(time) {
        this.audio.currentTime = time;
    }

    seekTo(percentage) {
        const time = (percentage / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }

    setVolume(volume) {
        this.audio.volume = volume / 100;
    }

    setPlaybackRate(rate) {
        this.audio.playbackRate = parseFloat(rate);
    }

    updateProgress() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        
        if (duration > 0) {
            const percentage = (currentTime / duration) * 100;
            if (this.progressFill) {
                this.progressFill.style.width = percentage + '%';
            }
            if (this.progressSlider) {
                this.progressSlider.value = currentTime;
            }
            
            // 同步底部播放栏进度
            if (this.bottomProgressFill) {
                this.bottomProgressFill.style.width = percentage + '%';
            }
            if (this.bottomProgressSlider) {
                this.bottomProgressSlider.value = currentTime;
            }
        }
        
        if (this.currentTimeSpan) {
            this.currentTimeSpan.textContent = this.formatTime(currentTime);
        }
        
        // 同步底部播放栏时间显示
        if (this.bottomCurrentTimeSpan) {
            this.bottomCurrentTimeSpan.textContent = this.formatTime(currentTime);
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    handleAudioEnd() {
        this.next();
    }

    updateStatus(message, type = 'success') {
        let statusElement = document.querySelector('.status');
        
        if (!statusElement) {
            statusElement = this.createStatusElement();
        }
        
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        
        setTimeout(() => {
            this.clearStatus();
        }, 2000);
    }

    createStatusElement() {
        const statusElement = document.createElement('div');
        statusElement.className = 'status';
        document.body.appendChild(statusElement);
        return statusElement;
    }

    clearStatus() {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = '';
            statusElement.className = 'status';
        }
    }
    
    toggleFavorite(lyric) {
        const existingIndex = this.favorites.findIndex(fav => 
            fav.text === lyric.text && fav.time === lyric.time
        );
        
        if (existingIndex >= 0) {
            // 如果已收藏，则取消收藏
            this.favorites.splice(existingIndex, 1);
            this.updateStatus('已取消收藏', 'success');
        } else {
            // 如果未收藏，则添加到收藏
            this.favorites.push({
                text: lyric.text,
                time: lyric.time,
                songTitle: this.songTitle.textContent,
                timestamp: Date.now()
            });
            this.updateStatus('已添加到收藏', 'success');
        }
        
        this.updateFavoritesCount();
        this.saveFavoritesToStorage();
        this.displayFavorites();
    }
    
    openFavoritesModal() {
        if (this.favoritesModal) {
            this.favoritesModal.classList.add('show');
            this.displayFavorites();
        }
    }
    
    closeFavoritesModal() {
        if (this.favoritesModal) {
            this.favoritesModal.classList.remove('show');
        }
    }
    
    updateFavoritesCount() {
        if (this.favoritesCount) {
            this.favoritesCount.textContent = this.favorites.length;
        }
    }
    
    saveFavoritesToStorage() {
        try {
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.warn('保存收藏到本地存储失败:', error);
        }
    }
    
    loadFavoritesFromStorage() {
        try {
            const savedFavorites = localStorage.getItem('favorites');
            if (savedFavorites) {
                this.favorites = JSON.parse(savedFavorites);
                this.updateFavoritesCount();
            }
        } catch (error) {
            console.warn('从本地存储加载收藏失败:', error);
        }
    }
    
    updateSyncStatus() {
        // 此方法已不再需要，保留空方法以避免错误
    }
    

    

    

    

    

    

    

    

    
    clearAllFavorites() {
        if (this.favorites.length === 0) {
            this.updateStatus('收藏夹已经是空的', 'success');
            return;
        }
        
        if (confirm('确定要清空所有收藏吗？此操作不可恢复。')) {
            this.favorites = [];
            
            this.updateFavoritesCount();
            this.saveFavoritesToStorage();
            this.displayFavorites();
            this.updateStatus('已清空所有收藏', 'success');
        }
    }
    
    displayFavorites() {
        if (!this.favoritesContainer) return;
        
        this.favoritesContainer.innerHTML = '';
        
        if (this.favorites.length === 0) {
            this.favoritesContainer.innerHTML = '<div class="favorites-placeholder">暂无收藏</div>';
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        this.favorites.forEach((favorite, index) => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            
            // 检查是否包含翻译
            const hasTranslation = this.hasTranslation(favorite.text);
            
            let displayText = favorite.text;
            if (hasTranslation && this.showTranslation) {
                const originalText = this.getOriginalText(favorite.text);
                const translationText = this.getTranslationText(favorite.text);
                displayText = `${originalText} ${translationText}`;
            } else if (hasTranslation && !this.showTranslation) {
                displayText = this.getOriginalText(favorite.text);
            }
            
            item.innerHTML = `
                <div class="favorite-content">
                    <div class="favorite-text">${displayText}</div>
                    <div class="favorite-song">${favorite.songTitle}</div>
                </div>
                <button class="remove-favorite" title="删除收藏">×</button>
            `;
            
            // 点击收藏项跳转到对应时间
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-favorite')) {
                    this.seekToTime(favorite.time);
                }
            });
            
            // 删除收藏
            const removeBtn = item.querySelector('.remove-favorite');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.favorites.splice(index, 1);
                
                this.updateFavoritesCount();
                this.saveFavoritesToStorage();
                this.displayFavorites();
                this.updateStatus('已删除收藏', 'success');
            });
            
            fragment.appendChild(item);
        });
        
        this.favoritesContainer.appendChild(fragment);
    }
    
    // 保存收藏到txt文件
    saveFavoritesToTxtFile() {
        if (this.favorites.length === 0) {
            this.updateStatus('收藏夹为空，无法保存', 'error');
            return;
        }
        
        try {
            const fileName = `favorites.txt`;
            let content = `收藏夹\n`;
            content += `导出时间: ${new Date().toLocaleString()}\n`;
            content += `收藏数量: ${this.favorites.length}\n`;
            content += '='.repeat(50) + '\n\n';
            
            this.favorites.forEach((favorite, index) => {
                const timeStr = this.formatTime(favorite.time);
                content += `${index + 1}. [${timeStr}] ${favorite.songTitle}\n`;
                content += `   文本: ${favorite.text}\n`;
                content += `   收藏时间: ${new Date(favorite.timestamp).toLocaleString()}\n`;
                content += '\n';
            });
            
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`收藏已保存到文件: ${fileName}`);
            this.updateStatus(`收藏已保存到文件: ${fileName}`, 'success');
            
            // 2秒后自动清除保存成功消息
            setTimeout(() => {
                this.clearStatus();
            }, 2000);
        } catch (error) {
            console.error('保存收藏到文件失败:', error);
            this.updateStatus('保存收藏到文件失败', 'error');
        }
    }
    
    // 自动加载服务器文件
    async autoLoadServerFiles() {
        try {
            console.log('自动加载服务器文件...');
            this.updateStatus('正在自动加载服务器文件...', 'info');
            
            // 获取服务器地址
            const serverUrl = this.config.server.url;
            if (!serverUrl) {
                console.log('未配置服务器地址，跳过自动加载');
                return;
            }
            
            // 获取服务器目录结构
            const directoryStructure = await this.getServerDirectoryStructure(serverUrl);
            
            if (!directoryStructure || Object.keys(directoryStructure).length === 0) {
                console.log('服务器上没有找到文件夹，跳过自动加载');
                return;
            }
            
            // 自动选择第一个可用的文件夹或剧集
            const firstKey = Object.keys(directoryStructure)[0];
            const firstItem = directoryStructure[firstKey];
            
            // 显示剧名选择界面
            console.log(`显示剧名选择界面`);
            
            // 确保切换到服务器播放列表
            this.switchPlaylist('server');
            
            this.showFolderSelection(directoryStructure, serverUrl);
            
            console.log('服务器文件自动加载完成');
            this.updateStatus('服务器文件自动加载完成', 'success');
            
        } catch (error) {
            console.error('自动加载服务器文件失败:', error);
            this.updateStatus('自动加载服务器文件失败: ' + error.message, 'error');
        }
    }
    

}

function initializePlayer() {
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                new MusicPlayer();
            });
        } else {
            new MusicPlayer();
        }
    } catch (error) {
        console.error('播放器初始化失败:', error);
    }
}

initializePlayer(); 
