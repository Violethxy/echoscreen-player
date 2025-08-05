class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.lyrics = [];
        this.currentLyricIndex = -1;
        this.isLooping = false;
        this.loopStartTime = 0;
        this.loopEndTime = 0;
        this.playlist = [];
        this.currentPlaylistIndex = -1;
        this.showTranslation = false;
        this.isSeeking = false;
        this.timerActive = false;
        this.timerId = null;
        this.timerEndTime = 0;
        this.favorites = [];
        
        this.initializeElements();
        this.bindEvents();
        this.setupAudioEvents();
        this.loadFavoritesFromStorage();
        this.updateFavoritesCount();
    }

    initializeElements() {
        try {
            // 文件夹上传
            this.folderInput = document.getElementById('folderInput');
            console.log('文件夹输入元素:', this.folderInput);
            
            // 播放控制
            this.playPauseBtn = document.getElementById('playPauseBtn');
            this.prevBtn = document.getElementById('prevBtn');
            this.nextBtn = document.getElementById('nextBtn');
            this.loopBtn = document.getElementById('loopBtn');
            
            // 进度和音量
            this.progressSlider = document.getElementById('progressSlider');
            this.progressFill = document.getElementById('progressFill');
            this.volumeSlider = document.getElementById('volumeSlider');
            this.speedSelect = document.getElementById('speedSelect');
            
            // 显示信息
            this.songTitle = document.getElementById('songTitle');
            this.currentTimeSpan = document.getElementById('currentTime');
            this.totalTimeSpan = document.getElementById('totalTime');
            this.lyricsContainer = document.getElementById('lyrics');
            this.playlistContainer = document.getElementById('playlist');
            this.volumePercentage = document.getElementById('volumePercentage');
            
            // 收藏相关元素
            this.favoritesContainer = document.getElementById('favorites');
            this.favoritesBtn = document.getElementById('favoritesBtn');
            this.favoritesCount = document.getElementById('favoritesCount');
            this.favoritesModal = document.getElementById('favoritesModal');
            this.closeFavoritesBtn = document.getElementById('closeFavoritesBtn');
            this.clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
    
            this.saveFavoritesBtn = document.getElementById('saveFavoritesBtn');
            
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
            
            // 播放控制事件
            if (this.playPauseBtn) {
                this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
            }
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.previous());
            }
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.next());
            }
            if (this.loopBtn) {
                this.loopBtn.addEventListener('click', () => this.toggleLoop());
            }
            
            // 进度控制
            if (this.progressSlider) {
                this.progressSlider.addEventListener('input', (e) => {
                    this.isSeeking = true;
                    this.seekToTime(parseFloat(e.target.value));
                });
                this.progressSlider.addEventListener('change', (e) => {
                    this.isSeeking = false;
                });
            }
            if (this.volumeSlider) {
                this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
            }
            if (this.speedSelect) {
                this.speedSelect.addEventListener('change', (e) => this.setPlaybackRate(e.target.value));
            }
            
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
            
            console.log('事件绑定成功');
        } catch (error) {
            console.error('事件绑定失败:', error);
        }
    }

    setupAudioEvents() {
        this.audio.addEventListener('loadedmetadata', () => {
            this.totalTimeSpan.textContent = this.formatTime(this.audio.duration);
            this.progressSlider.max = this.audio.duration;
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
            this.playPauseBtn.innerHTML = '<span class="pause-icon">⏸</span>';
            this.playPauseBtn.classList.add('active');
        });

        this.audio.addEventListener('pause', () => {
            this.playPauseBtn.innerHTML = '<span class="play-icon">▶</span>';
            this.playPauseBtn.classList.remove('active');
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
            
            this.updateStatus(`成功加载 ${this.playlist.length} 首歌曲`, 'success');
            this.displayPlaylist();
            
            // 如果有歌曲，自动播放第一首
            if (this.playlist.length > 0) {
                this.currentPlaylistIndex = 0;
                this.loadSong(this.playlist[0]);
            }
            
        } catch (error) {
            console.error('文件夹处理失败:', error);
            this.updateStatus('文件夹处理失败: ' + error.message, 'error');
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
        
        this.playlist.push(song);
        console.log(`歌曲 ${folderName} 已添加到播放列表，时长: ${song.duration}秒`);
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
        if (!this.playlistContainer) return;
        
        this.playlistContainer.innerHTML = '';
        
        if (this.playlist.length === 0) {
            this.playlistContainer.innerHTML = '<div class="playlist-placeholder">请上传歌曲文件夹</div>';
            return;
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
            
            this.playlistContainer.appendChild(item);
        });
    }

    updatePlaylistDisplay() {
        const items = this.playlistContainer.querySelectorAll('.playlist-item');
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
            
            // 创建音频URL
            const audioUrl = URL.createObjectURL(song.audioFile);
            this.audio.src = audioUrl;
            
            // 更新歌曲信息
            this.songTitle.textContent = song.title;
            this.lyrics = song.lyrics || [];
            this.currentLyricIndex = -1;
            
                    // 显示歌词
        this.displayLyrics();
        
        // 更新收藏数量
        this.updateFavoritesCount();
            
            // 等待音频加载完成
            await new Promise((resolve, reject) => {
                this.audio.addEventListener('loadedmetadata', resolve, { once: true });
                this.audio.addEventListener('error', reject, { once: true });
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
        this.loopBtn.classList.toggle('active', this.isLooping);
        
        // 保持状态指示器元素
        const statusIndicator = this.loopBtn.querySelector('.status-indicator');
        
        if (this.isLooping) {
            this.loopBtn.innerHTML = '🔁<span style="font-size: 10px; display: block;">循环</span>';
        } else {
            this.loopBtn.innerHTML = '🔁<span style="font-size: 10px; display: block;">单句</span>';
        }
        
        // 重新添加状态指示器
        if (statusIndicator) {
            this.loopBtn.appendChild(statusIndicator);
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
        if (this.volumePercentage) {
            this.volumePercentage.textContent = `${volume}%`;
        }
    }

    setPlaybackRate(rate) {
        this.audio.playbackRate = parseFloat(rate);
    }

    updateProgress() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        
        if (duration > 0) {
            const percentage = (currentTime / duration) * 100;
            this.progressFill.style.width = percentage + '%';
            this.progressSlider.value = currentTime;
        }
        
        this.currentTimeSpan.textContent = this.formatTime(currentTime);
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
