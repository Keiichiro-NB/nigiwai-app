// Lucide アイコンの初期化
lucide.createIcons();

// KNFレーダーチャートの描画
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('knfRadarChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', -apple-system, sans-serif";

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['活気', '滞留性', '会話量', '快適性', '多様性', '回遊性'],
            datasets: [
                {
                    label: '人評価 (最新)',
                    data: [4.2, 3.8, 4.5, 3.2, 4.0, 3.5],
                    backgroundColor: 'rgba(59, 130, 246, 0.25)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#3b82f6',
                    pointRadius: 4,
                },
                {
                    label: 'AI評価 (最新)',
                    data: [4.0, 4.1, 4.3, 3.5, 3.8, 3.7],
                    backgroundColor: 'rgba(139, 92, 246, 0.25)',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#8b5cf6',
                    pointRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#f8fafc',
                        font: {
                            size: 13,
                            weight: '600',
                            family: "'Outfit', sans-serif"
                        }
                    },
                    ticks: {
                        color: 'transparent',
                        backdropColor: 'transparent',
                        min: 0,
                        max: 5,
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8fafc',
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { size: 14 },
                    bodyFont: { size: 14, weight: 'bold' },
                    padding: 14,
                    cornerRadius: 10,
                    boxPadding: 6
                }
            }
        }
    });
});
