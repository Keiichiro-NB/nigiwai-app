// dashboard.js - L1/L2 ロジック統合版
lucide.createIcons();

let causeRadarChart = null;
let resultRadarChart = null;
let currentL2Data = null;

function getPlaceName(placeId) {
    const places = JSON.parse(localStorage.getItem('sys_places') || '[]');
    const p = places.find(x => x.id === placeId);
    return p ? p.name : placeId;
}

function getZoneName(placeId, zoneId) {
    const places = JSON.parse(localStorage.getItem('sys_places') || '[]');
    const p = places.find(x => x.id === placeId);
    if(p && p.zones) {
        const z = p.zones.find(x => x.id === zoneId);
        return z ? z.name : zoneId;
    }
    return zoneId;
}

function renderDashboard() {
    const places = JSON.parse(localStorage.getItem('sys_places') || '[]');
    const evals = JSON.parse(localStorage.getItem('sys_evaluations') || '[]');
    
    // Summary Cards
    const elPlaceCount = document.querySelector('.summary-cards .card:nth-child(1) .number');
    const elHumanEval = document.querySelector('.summary-cards .card:nth-child(2) .number');
    const elAiEval = document.querySelector('.summary-cards .card:nth-child(3) .number');
    
    if(elPlaceCount) elPlaceCount.innerText = places.length || 0;
    if(elHumanEval) elHumanEval.innerText = evals.filter(e => e.source === 'Human').length || 0;
    if(elAiEval) elAiEval.innerText = evals.filter(e => e.source && e.source.startsWith('AI')).length || 0;

    // L1 Table Data Grouping (by place, session date+time, zone)
    const tableDataMap = {};
    
    evals.forEach(ev => {
        const key = `${ev.placeId}_${ev.date}_${ev.time}_${ev.zoneId}`;
        if(!tableDataMap[key]) {
            tableDataMap[key] = {
                placeId: ev.placeId,
                date: ev.date,
                time: ev.time,
                zoneId: ev.zoneId,
                evaluators: 0,
                totalScores: [],
                allEvals: [] // row specific
            };
        }
        
        tableDataMap[key].evaluators++;
        tableDataMap[key].allEvals.push(ev);
        
        // Calculate average score for this eval
        if(ev.ratings) {
            const vals = Object.values(ev.ratings).map(Number);
            if(vals.length > 0) {
                const avg = vals.reduce((a,b)=>a+b, 0) / vals.length;
                tableDataMap[key].totalScores.push(avg);
            }
        }
    });

    const tbody = document.getElementById('eval-table-body');
    if(tbody) tbody.innerHTML = '';
    
    Object.values(tableDataMap).forEach(row => {
        const avgTotal = row.totalScores.length > 0 
            ? (row.totalScores.reduce((a,b)=>a+b,0) / row.totalScores.length).toFixed(1) 
            : '-';
            
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.className = 'hover-effect';
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        // Hover style handling
        tr.onmouseover = () => tr.style.background = 'rgba(255,255,255,0.05)';
        tr.onmouseout = () => tr.style.background = 'transparent';
        
        tr.onclick = () => openL2(row);
        
        tr.innerHTML = `
            <td style="padding: 12px 16px;">${getPlaceName(row.placeId)}</td>
            <td style="padding: 12px 16px;">${row.date} ${row.time}</td>
            <td style="padding: 12px 16px;">${getZoneName(row.placeId, row.zoneId)}</td>
            <td style="padding: 12px 16px; font-weight: bold; color: #3b82f6;">${avgTotal}</td>
            <td style="padding: 12px 16px;">${row.evaluators} 名/AI</td>
        `;
        if(tbody) tbody.appendChild(tr);
    });
}

// L2 View Logic
function openL2(rowData) {
    const allEvals = JSON.parse(localStorage.getItem('sys_evaluations') || '[]');
    const placeEvals = allEvals.filter(e => e.placeId === rowData.placeId);
    
    currentL2Data = {
        placeId: rowData.placeId,
        allEvals: placeEvals,
        initialZone: rowData.zoneId,
        initialSession: `${rowData.date}_${rowData.time}`,
        filteredEvals: []
    };

    document.getElementById('l2-detail-section').style.display = 'block';
    document.getElementById('l2-title-target').innerText = `${getPlaceName(rowData.placeId)} - 詳細分析`;
    
    initL2Filters();
    renderL2ChartsAndScores();

    // Scroll to L2
    document.getElementById('l2-detail-section').scrollIntoView({ behavior: 'smooth' });
}

function closeL2() {
    document.getElementById('l2-detail-section').style.display = 'none';
}

function initL2Filters() {
    const evals = currentL2Data.allEvals;
    
    // Get unique zones
    const zones = [...new Set(evals.map(e => e.zoneId))].filter(Boolean);
    const elZone = document.getElementById('l2-filter-zone');
    elZone.innerHTML = '';
    zones.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z;
        opt.text = getZoneName(currentL2Data.placeId, z);
        opt.style.color = 'black';
        if (z === currentL2Data.initialZone) opt.selected = true;
        elZone.appendChild(opt);
    });

    // Get unique sections (date_time)
    const sections = [...new Set(evals.map(e => `${e.date}_${e.time}`))].filter(s => s !== '_');
    const elSection = document.getElementById('l2-filter-section');
    elSection.innerHTML = '';
    sections.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.text = s.replace('_', ' ');
        opt.style.color = 'black';
        if (s === currentL2Data.initialSession) opt.selected = true;
        elSection.appendChild(opt);
    });

    // Get unique evaluators
    const evaluators = [...new Set(evals.map(e => {
        if(e.source === 'Human' && e.evaluator_name) return e.evaluator_name;
        return e.source;
    }))].filter(Boolean);
    const elEval = document.getElementById('l2-filter-evaluator');
    elEval.innerHTML = '<option value="all" style="color: black;">全員 (Human + AI)</option>';
    evaluators.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e;
        opt.text = e;
        opt.style.color = 'black';
        elEval.appendChild(opt);
    });
}

function renderL2ChartsAndScores() {
    if(!currentL2Data) return;

    const elZone = document.getElementById('l2-filter-zone');
    const selectedZones = Array.from(elZone.selectedOptions).map(o => o.value);
    
    const elSection = document.getElementById('l2-filter-section');
    const selectedSections = Array.from(elSection.selectedOptions).map(o => o.value);
    
    const elEval = document.getElementById('l2-filter-evaluator');
    const selectedEvaluator = elEval ? elEval.value : 'all';

    let filteredEvals = currentL2Data.allEvals;

    if (selectedZones.length > 0) {
        filteredEvals = filteredEvals.filter(e => selectedZones.includes(e.zoneId));
    }
    if (selectedSections.length > 0) {
        filteredEvals = filteredEvals.filter(e => selectedSections.includes(`${e.date}_${e.time}`));
    }
    if (selectedEvaluator !== 'all') {
        filteredEvals = filteredEvals.filter(e => {
            const evName = (e.source === 'Human' && e.evaluator_name) ? e.evaluator_name : e.source;
            return evName === selectedEvaluator;
        });
    }
    
    currentL2Data.filteredEvals = filteredEvals;
    
    const indicators = JSON.parse(localStorage.getItem('sys_indicators') || '[]');
    // 動的表示：その対象地のアセットに紐づく指標のみ（L2はフィルタされたデータなので、対象地アセットでフィルタする）
    const place = JSON.parse(localStorage.getItem('sys_places') || '[]').find(p => p.id === currentL2Data.placeId);
    const assetType = place ? place.asset : '';

    const validIndicators = indicators.filter(ind => {
        if(ind.isRepresentative) return true;
        if(assetType && ind.assets && ind.assets.includes(assetType)) return true;
        return false;
    });

    const causeInds = validIndicators.filter(i => i.type === 'cause');
    const resultInds = validIndicators.filter(i => i.type === 'result');
    
    const causeScores = {};
    const resultScores = {};
    
    // Initialize
    causeInds.forEach(i => causeScores[i.id] = { name: i.name, vals: [] });
    resultInds.forEach(i => resultScores[i.id] = { name: i.name, vals: [] });
    
    // Aggregate
    filteredEvals.forEach(ev => {
        if(ev.ratings) {
            Object.keys(ev.ratings).forEach(indId => {
                const val = Number(ev.ratings[indId]);
                if(causeScores[indId]) causeScores[indId].vals.push(val);
                if(resultScores[indId]) resultScores[indId].vals.push(val);
            });
        }
    });
    
    // Calc Averages
    const getAvg = (vals) => vals.length > 0 ? (vals.reduce((a,b)=>a+b,0) / vals.length) : 0;
    
    const causeLabels = causeInds.map(i => i.name);
    const causeData = causeInds.map(i => getAvg(causeScores[i.id].vals));
    
    const resultLabels = resultInds.map(i => i.name);
    const resultData = resultInds.map(i => getAvg(resultScores[i.id].vals));

    // Render Charts
    drawRadar('causeRadarChart', causeLabels, causeData, '#10b981', causeRadarChart);
    drawRadar('resultRadarChart', resultLabels, resultData, '#8b5cf6', resultRadarChart);

    // Render Score UI for inline editing
    renderScoreEditors('cause-scores-container', causeInds, causeScores);
    renderScoreEditors('result-scores-container', resultInds, resultScores);
}

function drawRadar(canvasId, labels, data, color, chartInstanceRef) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (window[canvasId + '_instance']) {
        window[canvasId + '_instance'].destroy();
    }

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', -apple-system, sans-serif";

    window[canvasId + '_instance'] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '平均スコア',
                data: data,
                backgroundColor: color + '33', // 20% opacity
                borderColor: color,
                pointBackgroundColor: color,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: { display: false, stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#cbd5e1', font: { size: 11 } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderScoreEditors(containerId, inds, scoreDataMap) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    
    inds.forEach(ind => {
        const vals = scoreDataMap[ind.id].vals;
        const avg = vals.length > 0 ? (vals.reduce((a,b)=>a+b,0) / vals.length).toFixed(1) : '-';
        
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 12px';
        row.style.background = 'rgba(0,0,0,0.2)';
        row.style.borderRadius = '6px';
        
        row.innerHTML = `
            <span style="font-size: 13px; color: #e2e8f0;">${ind.name}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; color: var(--text-secondary);">平均:</span>
                <input type="number" step="0.1" min="1" max="5" value="${avg !== '-' ? avg : ''}" 
                       data-ind-id="${ind.id}"
                       style="width: 60px; background: transparent; border: 1px solid var(--border-color); color: white; padding: 4px; border-radius: 4px; text-align: center; outline: none;"
                       onchange="overrideScore(this)">
            </div>
        `;
        container.appendChild(row);
    });
}

// L2 Inline Edit Logic
function overrideScore(inputElem) {
    const indId = inputElem.getAttribute('data-ind-id');
    let newVal = parseFloat(inputElem.value);
    
    if(isNaN(newVal) || newVal < 1 || newVal > 5) {
        alert('スコアは1〜5の間で入力してください');
        return;
    }
    
    if(currentL2Data.filteredEvals.length === 0) {
        alert('上書き対象のデータがありません（フィルタで0件です）');
        return;
    }
    
    if(confirm('現在表示されているフィルタ済みの全評価データに対して、この指標のスコアを上書き保存しますか？')) {
        const evals = JSON.parse(localStorage.getItem('sys_evaluations') || '[]');
        
        const targetIds = currentL2Data.filteredEvals.map(e => e.id);
        
        evals.forEach(ev => {
            if(targetIds.includes(ev.id)) {
                if(!ev.ratings) ev.ratings = {};
                ev.ratings[indId] = newVal;
            }
        });
        
        localStorage.setItem('sys_evaluations', JSON.stringify(evals));
        
        // 再描画
        renderDashboard(); // L1 update
        
        // currentL2Data の allEvals も更新
        currentL2Data.allEvals.forEach(ev => {
            if(targetIds.includes(ev.id)) {
                if(!ev.ratings) ev.ratings = {};
                ev.ratings[indId] = newVal;
            }
        });
        
        renderL2ChartsAndScores();
        
        alert('スコアを上書き保存しました。');
    } else {
        renderL2ChartsAndScores();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
});
