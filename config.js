// 播放器配置文件
const CONFIG = {
    // 服务器配置
    server: {
        url: '',
        autoLoad: false, // 是否自动加载服务器文件
        timeout: 30000  // 请求超时时间（毫秒）
    },
    
    // 播放器配置
    player: {
        defaultVolume: 100,
        defaultSpeed: 1,
        autoPlay: false,
        showTranslation: false
    },
    
    // UI配置
    ui: {
        showServerInput: false, // 是否显示服务器地址输入框
        showLoadServerBtn: false, // 是否显示加载服务器按钮
        theme: 'default'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 