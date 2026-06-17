// dashboard.js - L1/L2 ロジック統合版
lucide.createIcons();

let causeRadarChart = null;
let resultRadarChart = null;
let currentL2Data = null;

function getPlaceName(places, placeId) {
    const p = places.find(x => x.id === placeId);
    return p ? p.name : placeId;
}

function getZoneName(places, placeId, zoneId) {
    const p = places.find(x => x.id === placeId);
    if(p && p.zones) {
        const z = p.zones.find(x => x.id === zoneId);
        return z ? z.name : zoneId;
    }
    return zoneId;
}

function mapTimeCategory(timeStr) {
    if(!timeStr) return '';
    if(['午前', '昼', '午後', '夕方', '夜'].includes(timeStr)) return timeStr;
    const match = timeStr.match(/^(\d{1,2}):/);
    if(match) {
        const h = parseInt(match[1], 10);
        if(h >= 5 && h < 11) return '午前';
        if(h >= 11 && h < 14) return '昼';
        if(h >= 14 && h < 17) return '午後';
        if(h >= 17 && h < 19) return '夕方';
        return '夜';
    }
    return timeStr;
}

async function renderDashboard() {
    const places = await DataService.getPlaces();
    const evals = await DataService.getEvaluations();
    
    // 時間の互換性マッピング
    evals.forEach(ev => ev.time = mapTimeCategory(ev.time));
    
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
            <td style="padding: 12px 16px;">${row.placeId}</td>
            <td style="padding: 12px 16px;">${row.date} ${row.time}</td>
            <td style="padding: 12px 16px;">${getZoneName(places, row.placeId, row.zoneId)}</td>
            <td style="padding: 12px 16px; font-weight: bold; color: #3b82f6;">${avgTotal}</td>
            <td style="padding: 12px 16px;">${row.evaluators} 名/AI</td>
        `;
        if(tbody) tbody.appendChild(tr);
    });
}

// L2 View Logic
async function openL2(rowData) {
    const allEvals = await DataService.getEvaluations();
    const placeEvals = allEvals.filter(e => e.placeId === rowData.placeId);
    
    currentL2Data = {
        placeId: rowData.placeId,
        allEvals: placeEvals,
        initialZone: rowData.zoneId,
        initialSession: `${rowData.date}_${rowData.time}`,
        filteredEvals: []
    };

    document.getElementById('l2-detail-section').style.display = 'block';
    document.getElementById('l2-title-target').innerText = `${rowData.placeId} - 詳細分析`;
    
    await initL2Filters();
    await renderL2ChartsAndScores();

    // Scroll to L2
    document.getElementById('l2-detail-section').scrollIntoView({ behavior: 'smooth' });
}

function closeL2() {
    document.getElementById('l2-detail-section').style.display = 'none';
}

function openChartModal() {
    document.getElementById('chart-modal').style.display = 'flex';
    lucide.createIcons();
    // Re-render so Chart.js recalculates dimensions on visible canvases
    renderL2ChartsAndScores();
}

function closeChartModal() {
    document.getElementById('chart-modal').style.display = 'none';
}

function openInsightReport() {
    if(currentL2Data && currentL2Data.placeId) {
        window.location.href = 'insight_report.html?placeId=' + currentL2Data.placeId;
    }
}

async function initL2Filters() {
    const evals = currentL2Data.allEvals;
    const places = await DataService.getPlaces();
    
    // Get unique zones
    const zones = [...new Set(evals.map(e => e.zoneId))].filter(Boolean);
    const elZone = document.getElementById('l2-filter-zone');
    elZone.innerHTML = '';
    zones.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z;
        opt.text = getZoneName(places, currentL2Data.placeId, z);
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
    elEval.innerHTML = '';
    
    // Default options
    const defaultOptions = [
        { value: 'all', text: '全員 (Human + AI)' },
        { value: 'all_human', text: '全員 (Human)' },
        { value: 'all_ai', text: '全員 (AI)' }
    ];
    
    defaultOptions.forEach(optData => {
        const opt = document.createElement('option');
        opt.value = optData.value;
        opt.text = optData.text;
        opt.style.color = 'black';
        elEval.appendChild(opt);
    });

    evaluators.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e;
        opt.text = e;
        opt.style.color = 'black';
        elEval.appendChild(opt);
    });
}

async function renderL2ChartsAndScores() {
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
        if (selectedEvaluator === 'all_human') {
            filteredEvals = filteredEvals.filter(e => e.source === 'Human');
        } else if (selectedEvaluator === 'all_ai') {
            filteredEvals = filteredEvals.filter(e => e.source && e.source.startsWith('AI'));
        } else {
            filteredEvals = filteredEvals.filter(e => {
                const evName = (e.source === 'Human' && e.evaluator_name) ? e.evaluator_name : e.source;
                return evName === selectedEvaluator;
            });
        }
    }
    
    currentL2Data.filteredEvals = filteredEvals;
    
    const indicators = await DataService.getIndicators();
    // 動的表示：その対象地のアセットに紐づく指標のみ
    indicators.forEach(ind => {
        if (ind.assetId === 'marche') ind.assetId = ['マルシェ'];
        else if (typeof ind.assetId === 'string' && ind.assetId !== 'all') ind.assetId = [ind.assetId];
    });
    
    const places = await DataService.getPlaces();
    const personas = await DataService.getPersonas();
    const place = places.find(p => p.id === currentL2Data.placeId);
    const assetType = place ? place.asset : '';

    const validIndicators = indicators.filter(ind => {
        if(ind.category === 'representative' || ind.assetId === 'all') return true;
        if(assetType) {
            if(Array.isArray(ind.assetId)) return ind.assetId.includes(assetType);
            return ind.assetId === assetType;
        }
        return false;
    });

    const causeInds = validIndicators.filter(i => i.type === 'cause');
    const resultInds = validIndicators.filter(i => i.type === 'result' || i.type === 'effect');
    
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
    
    // 頂点のラベルを「01好立地」のように数字と略称を組み合わせた形式に変更
    const causeLabels = causeInds.map(i => String(i.id).padStart(2, '0') + (i.shortName || ''));
    const causeData = causeInds.map(i => getAvg(causeScores[i.id].vals));
    
    const resultLabels = resultInds.map(i => String(i.id).padStart(2, '0') + (i.shortName || ''));
    const resultData = resultInds.map(i => getAvg(resultScores[i.id].vals));

    // Render Charts
    drawRadar('causeRadarChart', causeLabels, causeData, '#10b981', causeRadarChart);
    drawRadar('resultRadarChart', resultLabels, resultData, '#8b5cf6', resultRadarChart);

    // Also render to modal if present
    drawRadar('causeRadarChartModal', causeLabels, causeData, '#10b981', window.causeRadarChartModal, true);
    drawRadar('resultRadarChartModal', resultLabels, resultData, '#8b5cf6', window.resultRadarChartModal, true);

    // Render Legends
    renderLegend('cause-legend-container', causeInds);
    renderLegend('result-legend-container', resultInds);

    // Modal Legends
    renderLegend('cause-legend-container-modal', causeInds);
    renderLegend('result-legend-container-modal', resultInds);

    // Render Score UI for inline editing
    renderScoreEditors('cause-scores-container', causeInds, causeScores);
    renderScoreEditors('result-scores-container', resultInds, resultScores);

    // --- 定性コメントの動的レンダリングロジック ---
    const commentsContainer = document.getElementById('l2-comments-container');
    if (commentsContainer) {
        commentsContainer.innerHTML = '';
        commentsContainer.style.maxHeight = '550px';
        commentsContainer.style.overflowY = 'auto';
        
        // 全体所感、または構造化された個別コメント・画像があるデータをすべて抽出
        const evalsWithContent = filteredEvals.filter(ev => 
            (ev.comment && ev.comment.trim() !== '') || 
            (ev.comments && Object.keys(ev.comments).length > 0) ||
            (ev.images && Object.keys(ev.images).length > 0)
        );
        
        if (evalsWithContent.length === 0) {
            commentsContainer.innerHTML = '<div style="color: #94a3b8; font-size: 13px; text-align: center; padding: 20px;">選択された条件に合致する定性コメントはありません。</div>';
        } else {
            evalsWithContent.forEach(ev => {
                const dateStr = ev.date || ev.timestamp.split('T')[0];
                const placeName = getPlaceName(places, ev.placeId);
                const zoneName = getZoneName(places, ev.placeId, ev.zoneId);
                
                // AI判定
                if (ev.source && ev.source.startsWith('AI')) {
                    // AI評価（表形式で完全復元）
                    const personaName = ev.source.replace('AI (', '').replace(')', '').trim();
                    const avgScore = ev.avgScore ? Number(ev.avgScore).toFixed(1) : '-';
                    
                    let firstImpression = '特記なし';
                    let causeText = '';
                    let resultText = '';
                    
                    // コメントブロックをパース
                    const parts1 = ev.comment.split('【原因レイヤー】');
                    if (parts1.length === 2) {
                        firstImpression = parts1[0].replace('【第一印象】', '').trim();
                        const parts2 = parts1[1].split('【結果レイヤー】');
                        causeText = parts2[0].trim();
                        resultText = parts2.length > 1 ? parts2[1].trim() : '';
                    } else {
                        // 古いフォーマット等のフォールバック
                        firstImpression = ev.comment;
                    }
                    
                    const parseLinesToTable = (text) => {
                        let html = `<table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; table-layout: fixed; margin-bottom: 8px;">
                            <thead><tr style="color: #60a5fa; border-bottom: 1px solid #334155;">
                            <th style="padding: 8px 4px; width: 8%;">#</th>
                            <th style="padding: 8px 4px; width: 22%;">指標</th>
                            <th style="padding: 8px 4px; width: 15%;">点数</th>
                            <th style="padding: 8px 4px; width: 55%;">根拠（主観感想）</th>
                            </tr></thead><tbody>`;
                            
                        const lines = text.split('\n');
                        let count = 1;
                        lines.forEach(line => {
                            if (!line.trim().startsWith('・[')) return;
                            // format: ・[指標名] : X点（根拠）
                            const match = line.match(/^・\[(.*?)\]\s*:\s*(\d+)点（(.*)）$/);
                            if (match) {
                                const indName = match[1];
                                const val = match[2];
                                const reason = match[3];
                                html += `
                                    <tr style="border-bottom: 1px solid #1e293b;">
                                        <td style="padding: 8px 4px; vertical-align: top; color: #94a3b8;">${count++}</td>
                                        <td style="padding: 8px 4px; vertical-align: top; font-weight: 500;">${indName}</td>
                                        <td style="padding: 8px 4px; vertical-align: top;"><span style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${val}</span></td>
                                        <td style="padding: 8px 4px; vertical-align: top; opacity: 0.9; line-height: 1.4; white-space: normal;">${reason}</td>
                                    </tr>`;
                            }
                        });
                        html += `</tbody></table>`;
                        return html;
                    };
                    
                    const causeHtml = causeText ? parseLinesToTable(causeText) : '<p style="color: #94a3b8;">データなし</p>';
                    const resultHtml = resultText ? parseLinesToTable(resultText) : '<p style="color: #94a3b8;">データなし</p>';
                    
                    // ペルソナ属性の抽出
                    const personaObj = personas.find(p => p.name === personaName);
                    const pAttr = personaObj ? personaObj.attributes : 'ペルソナ';

                    const cardHtml = `
                        <div class="eval-result-card" style="font-size: 13px; line-height: 1.5; color: #cbd5e1; background: #0f172a; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <h4 style="font-size: 16px; margin: 0; color: #60a5fa; display: flex; align-items: center; gap: 8px;"><i data-lucide="bot"></i> ${personaName}</h4>
                                <span style="font-size: 11px; color: #94a3b8;">📅 ${dateStr} ${ev.time || ''} | 🗺️ ${placeName} (${zoneName})</span>
                            </div>
                            <div style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 8px;">推計満足度: ${avgScore} / 5.0</div>
                            
                            <div style="margin-bottom: 16px;">
                                <strong style="color: #60a5fa; font-size: 14px;">【第一印象】</strong><br>
                                <div style="white-space: pre-wrap;">${firstImpression}</div>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <strong style="color: #60a5fa; font-size: 14px;">【原因レイヤー (環境・仕掛け)】</strong><br>
                                ${causeHtml}
                            </div>
                            <div style="margin-bottom: 16px;">
                                <strong style="color: #60a5fa; font-size: 14px;">【結果レイヤー (人の振る舞い)】</strong><br>
                                ${resultHtml}
                            </div>
                            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #334155;">
                                <strong style="color: #60a5fa; font-size: 14px;">【分析総括】</strong><br>
                                ${pAttr}の視点からは、アセットに該当する固有指標において強みと弱みがはっきりと分かれる結果となりました。これらの個別要因を分析し、空間のさらなるアップデートに繋げてください。
                            </div>
                        </div>
                    `;
                    commentsContainer.insertAdjacentHTML('beforeend', cardHtml);

                } else {
                    // 人間の評価（アウターの validIndicators をそのまま再利用してクリーンに抽出）
                    const evaluatorName = ev.evaluator_name || '評価者';
                    const avgScore = ev.avgScore ? Number(ev.avgScore).toFixed(1) : '-';
                    const firstImpression = ev.comment && ev.comment.trim() !== '' ? ev.comment : '特記なし';
                    
                    const buildTableHtml = (indsList) => {
                        if (indsList.length === 0) return '<p style="color: #94a3b8;">データなし</p>';
                        
                        let html = `<table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; table-layout: fixed; margin-bottom: 8px;">
                            <thead><tr style="color: #34d399; border-bottom: 1px solid #334155;">
                            <th style="padding: 8px 4px; width: 8%;">#</th>
                            <th style="padding: 8px 4px; width: 22%;">指標</th>
                            <th style="padding: 8px 4px; width: 15%;">点数</th>
                            <th style="padding: 8px 4px; width: 55%;">根拠（定性コメント）</th>
                            </tr></thead><tbody>`;
                            
                        let count = 1;
                        indsList.forEach(ind => {
                            const indId = String(ind.id);
                            const val = ev.ratings && ev.ratings[indId] ? ev.ratings[indId] : '-';
                            const commentText = ev.comments && ev.comments[indId] ? ev.comments[indId].trim() : '';
                            const imgBase64 = ev.images && ev.images[indId] ? ev.images[indId] : null;
                            
                            // テキストも画像もない場合は特記なし、画像だけある場合はテキスト部分は特記なしとする
                            const reasonText = commentText !== '' ? commentText : '特記なし';
                            
                            let imageHtml = '';
                            if (imgBase64) {
                                imageHtml = `<div style="margin-top: 10px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); max-width: 320px;"><img src="${imgBase64}" style="width: 100%; max-height: 180px; object-fit: cover; display: block;"></div>`;
                            }
                            
                            html += `
                                <tr style="border-bottom: 1px solid #1e293b;">
                                    <td style="padding: 8px 4px; vertical-align: top; color: #94a3b8;">${count++}</td>
                                    <td style="padding: 8px 4px; vertical-align: top; font-weight: 500;">${ind.name}</td>
                                    <td style="padding: 8px 4px; vertical-align: top;"><span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${val}</span></td>
                                    <td style="padding: 8px 4px; vertical-align: top; opacity: 0.9; line-height: 1.4; white-space: normal;">
                                        ${reasonText}
                                        ${imageHtml}
                                    </td>
                                </tr>`;
                        });
                        html += `</tbody></table>`;
                        return html;
                    };
                    
                    const causeHtml = buildTableHtml(causeInds);
                    const resultHtml = buildTableHtml(resultInds);

                    const cardHtml = `
                        <div class="eval-result-card" style="font-size: 13px; line-height: 1.5; color: #cbd5e1; background: #0f172a; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <h4 style="font-size: 16px; margin: 0; color: #34d399; display: flex; align-items: center; gap: 8px;"><i data-lucide="user"></i> ${evaluatorName}</h4>
                                <span style="font-size: 11px; color: #94a3b8;">📅 ${dateStr} ${ev.time || ''} | 🗺️ ${placeName} (${zoneName})</span>
                            </div>
                            <div style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 8px;">推計満足度: ${avgScore} / 5.0</div>
                            
                            <div style="margin-bottom: 16px;">
                                <strong style="color: #34d399; font-size: 14px;">【全体所感・第一印象】</strong><br>
                                <div style="white-space: pre-wrap;">${firstImpression}</div>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <strong style="color: #34d399; font-size: 14px;">【原因レイヤー (環境・仕掛け)】</strong><br>
                                ${causeHtml}
                            </div>
                            <div style="margin-bottom: 16px;">
                                <strong style="color: #34d399; font-size: 14px;">【結果レイヤー (人の振る舞い)】</strong><br>
                                ${resultHtml}
                            </div>
                            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #334155;">
                                <strong style="color: #34d399; font-size: 14px;">【分析総括】</strong><br>
                                人間の評価者（${evaluatorName}）による現地調査データです。現地のリアルな状況や感覚が反映されています。
                            </div>
                        </div>
                    `;
                    commentsContainer.insertAdjacentHTML('beforeend', cardHtml);
                }
            });
        }
        lucide.createIcons();
    }
}

function renderLegend(containerId, inds) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const isModal = containerId.includes('modal');
    const numColor = isModal ? '#94a3b8' : '#cbd5e1';
    const textColor = isModal ? '#334155' : 'inherit';
    
    inds.forEach(ind => {
        const idStr = String(ind.id).padStart(2, '0');
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.innerHTML = `<span style="color: ${numColor}; font-family: monospace; font-weight: bold;">${idStr}</span> <span style="color: ${textColor};">${ind.name}</span>`;
        container.appendChild(row);
    });
}

function drawRadar(canvasId, labels, data, color, chartInstanceRef, isModal = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (window[canvasId + '_instance']) {
        window[canvasId + '_instance'].destroy();
    }

    Chart.defaults.color = isModal ? '#64748b' : '#94a3b8';
    Chart.defaults.font.family = "'Outfit', -apple-system, sans-serif";

    window[canvasId + '_instance'] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '平均スコア',
                data: data,
                backgroundColor: color + (isModal ? '1a' : '33'), // lighter fill on white
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
                    grid: { color: isModal ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
                    angleLines: { color: isModal ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: isModal ? '#64748b' : '#cbd5e1', font: { size: 11 } }
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
        
        const idStr = String(ind.id).padStart(2, '0');
        row.innerHTML = `
            <span style="font-size: 13px; color: #e2e8f0;"><span style="color: #cbd5e1; font-family: monospace; font-weight: bold; margin-right: 6px;">${idStr}</span>${ind.name}</span>
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
async function overrideScore(inputElem) {
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
        const evals = await DataService.getEvaluations();
        
        const targetIds = currentL2Data.filteredEvals.map(e => e.id);
        
        evals.forEach(ev => {
            if(targetIds.includes(ev.id)) {
                if(!ev.ratings) ev.ratings = {};
                ev.ratings[indId] = newVal;
            }
        });
        
        await DataService.saveEvaluations(evals);
        
        // 再描画
        await renderDashboard(); // L1 update
        
        // currentL2Data の allEvals も更新
        currentL2Data.allEvals.forEach(ev => {
            if(targetIds.includes(ev.id)) {
                if(!ev.ratings) ev.ratings = {};
                ev.ratings[indId] = newVal;
            }
        });
        
        await renderL2ChartsAndScores();
        
        alert('スコアを上書き保存しました。');
    } else {
        await renderL2ChartsAndScores();
    }
}

async function initDashboard() {
    if (typeof initializeDemoData === 'function') {
        await initializeDemoData();
    }
    await renderDashboard();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
