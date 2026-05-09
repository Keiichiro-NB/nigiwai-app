// Lucide アイコンの初期化
lucide.createIcons();

let trendChartInstance = null;

// ダッシュボードの描画関数
function renderDashboard() {
    const places = DataStore.getFilteredPlaces();
    
    // サマリカードの更新
    document.querySelector('.summary-cards .card:nth-child(1) .number').innerText = places.length || 0;
    
    let totalSessions = 0;
    let totalEvaluators = 0;
    places.forEach(p => {
        totalSessions += p.sessions.length;
        totalEvaluators += p.evaluatorCount;
    });
    
    document.querySelector('.summary-cards .card:nth-child(2) .number').innerText = totalSessions || 0;
    document.querySelector('.summary-cards .card:nth-child(3) .number').innerText = totalEvaluators || 0;

    // 対象地リストの更新 (HTML再構築)
    const placeCardsContainer = document.querySelector('.place-cards');
    if (places.length > 0) {
        placeCardsContainer.innerHTML = ''; // クリア
        
        places.forEach(place => {
            const cardHTML = `
                <div class="place-card glass hover-effect">
                    <div class="place-header">
                        <div>
                            <span class="badge">${place.type}</span>
                            <h3>${place.name}</h3>
                        </div>
                        <div class="status">
                            <span class="status-dot active"></span> 稼働中
                        </div>
                    </div>
                    <div class="place-stats">
                        <div class="stat">
                            <span class="label">ゾーン数</span>
                            <span class="value">${place.zoneCount}</span>
                        </div>
                        <div class="stat">
                            <span class="label">評価データ数</span>
                            <span class="value">${place.evaluatorCount}</span>
                        </div>
                        <div class="stat">
                            <span class="label">最新セッション</span>
                            <span class="value">${place.latestSession || '未実施'}</span>
                        </div>
                    </div>
                    <div class="place-actions">
                        <a href="place.html?place=${encodeURIComponent(place.name)}" class="btn-secondary" style="text-decoration: none; text-align: center; display: inline-block;">詳細を見る</a>
                        <button class="btn-icon"><i data-lucide="external-link"></i></button>
                    </div>
                </div>
            `;
            placeCardsContainer.innerHTML += cardHTML;
        });
        // 追加されたアイコンをレンダリング
        lucide.createIcons();
    }
    
    // チャートの更新（例として最初の対象地のトレンドを表示）
    const targetPlace = places.length > 0 ? places[0].name : 'メブクス豊洲';
    const trendData = DataStore.getTrendData(targetPlace);
    
    updateChart(trendData.length > 0 ? trendData : null);
}

// グラフ描画
function updateChart(trendData) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // データがなければデフォルトダミーデータを使用
    const labels = trendData ? trendData.map(d => d.label) : ['1回目', '2回目', '3回目', '4回目', '5回目', '6回目'];
    const dataPoints = trendData ? trendData.map(d => d.score) : [2.8, 3.1, 3.0, 3.5, 3.8, 4.2];

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', -apple-system, sans-serif";

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 240);
    gradientFill.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradientFill.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'AI評価平均スコア',
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: gradientFill,
                borderWidth: 3,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 5 },
                x: { grid: { display: false } }
            }
        }
    });
}

// 初期化・イベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    // UI初期化
    const filterSelect = document.getElementById('indicatorFilter');
    if (filterSelect) {
        filterSelect.value = DataStore.filterMode;
        filterSelect.addEventListener('change', (e) => {
            DataStore.setFilterMode(e.target.value);
            renderDashboard(); // フィルタ変更時に再描画
        });
    }

    const excelUpload = document.getElementById('excelUpload');
    if (excelUpload) {
        excelUpload.addEventListener('change', (e) => {
            DataStore.handleFileUpload(e, () => {
                renderDashboard();
                alert('Excelデータの読み込みと反映が完了しました！');
            });
        });
    }

    // 初回描画
    renderDashboard();
});
