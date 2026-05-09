// auth.js - グローバルな権限管理とUI制御

document.addEventListener('DOMContentLoaded', () => {
    // LocalStorageから現在のモードを取得（デフォルトは調査員モード 'user' とする）
    const currentMode = localStorage.getItem('app_mode') || 'user';
    applyModeToUI(currentMode);

    // サイドバーのトグルにイベントリスナーを設定（存在する場合）
    const modeToggle = document.getElementById('globalModeToggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', () => {
            const newMode = modeToggle.getAttribute('data-mode') === 'admin' ? 'user' : 'admin';
            localStorage.setItem('app_mode', newMode);
            applyModeToUI(newMode);
        });
    }
});

function applyModeToUI(mode) {
    // トグルUIの更新
    const modeToggle = document.getElementById('globalModeToggle');
    if (modeToggle) {
        modeToggle.setAttribute('data-mode', mode);
        const options = modeToggle.querySelectorAll('.toggle-option');
        options.forEach(opt => {
            if (opt.getAttribute('data-val') === mode) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    // 表示制御
    const adminElements = document.querySelectorAll('.admin-only');
    if (mode === 'user') {
        adminElements.forEach(el => el.style.display = 'none');
        
        // もし現在 settings.html にいる場合は強制リダイレクト
        if (window.location.pathname.endsWith('settings.html')) {
            window.location.href = 'index.html';
        }
    } else {
        adminElements.forEach(el => el.style.display = ''); // デフォルトのdisplayに戻す
    }
}
