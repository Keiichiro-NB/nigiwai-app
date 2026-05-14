// 初期データ生成ロジック (デモ環境用)
function initializeDemoData() {
    // 1. Places (対象地) の初期化
    if (!localStorage.getItem('sys_places') || JSON.parse(localStorage.getItem('sys_places')).length === 0) {
        const demoPlaces = [
            {
                id: 'place_demo_1',
                name: 'メブクス豊洲',
                concept: '開放的なマルシェ空間',
                asset: 'マルシェ', // アセット種別を追加
                zones: [
                    { id: 'zone_demo_1a', name: 'エントランス付近', attr: '入口・待機' },
                    { id: 'zone_demo_1b', name: '飲食メインエリア', attr: '滞在・飲食' },
                    { id: 'zone_demo_1c', name: '芝生広場', attr: '休憩・子供遊び' }
                ]
            },
            {
                id: 'place_demo_2',
                name: '〇〇公園',
                concept: '地域住民の憩いの場',
                asset: '公園',
                zones: [
                    { id: 'zone_demo_2a', name: '遊具エリア', attr: '遊び' },
                    { id: 'zone_demo_2b', name: 'ベンチエリア', attr: '休憩' }
                ]
            }
        ];
        localStorage.setItem('sys_places', JSON.stringify(demoPlaces));
    }

    // 2. 指標 (Indicators) の初期化
    if (!localStorage.getItem('sys_indicators')) {
        const demoIndicators = [
            // --- 代表指標 (全てのアセットに適用) ---
            // 原因 (Cause)
            { id: 'ind_c1', type: 'cause', isRepresentative: true, name: '歩きやすさ・動線の広さ', assets: [] },
            { id: 'ind_c2', type: 'cause', isRepresentative: true, name: '清潔感・美観の良さ', assets: [] },
            { id: 'ind_c3', type: 'cause', isRepresentative: true, name: '座る場所・滞留スペースの多さ', assets: [] },
            { id: 'ind_c4', type: 'cause', isRepresentative: true, name: '安全性・安心感', assets: [] },
            // 結果 (Result)
            { id: 'ind_r1', type: 'result', isRepresentative: true, name: '全体の活気・盛り上がり', assets: [] },
            { id: 'ind_r2', type: 'result', isRepresentative: true, name: '居心地の良さ・リラックス感', assets: [] },
            { id: 'ind_r3', type: 'result', isRepresentative: true, name: '来訪者の多様性（年齢層など）', assets: [] },
            { id: 'ind_r4', type: 'result', isRepresentative: true, name: '笑顔・ポジティブな表情', assets: [] },

            // --- 固有指標 (特定のアセットにのみ適用) ---
            // マルシェ向け
            { id: 'ind_c5', type: 'cause', isRepresentative: false, name: '飲食やコンテンツの魅力', assets: ['マルシェ'] },
            { id: 'ind_c6', type: 'cause', isRepresentative: false, name: '店舗の呼び込み・BGM', assets: ['マルシェ'] },
            { id: 'ind_r5', type: 'result', isRepresentative: false, name: '商品購買の活発さ', assets: ['マルシェ'] },
            { id: 'ind_r6', type: 'result', isRepresentative: false, name: 'イベントや音楽への参加度', assets: ['マルシェ'] },
            // 公園向け
            { id: 'ind_c7', type: 'cause', isRepresentative: false, name: '緑・自然の豊かさ', assets: ['公園'] },
            { id: 'ind_c8', type: 'cause', isRepresentative: false, name: '遊具の充実度', assets: ['公園'] },
            { id: 'ind_r7', type: 'result', isRepresentative: false, name: '子供の遊び・走り回り', assets: ['公園'] },
            { id: 'ind_r8', type: 'result', isRepresentative: false, name: 'スポーツや運動の活発さ', assets: ['公園'] },
        ];
        localStorage.setItem('sys_indicators', JSON.stringify(demoIndicators));
    }

    // 3. 評価データ (Evaluations) の初期化
    if (!localStorage.getItem('sys_evaluations') || JSON.parse(localStorage.getItem('sys_evaluations')).length === 0) {
        const dummyEvals = [];
        const indicators = JSON.parse(localStorage.getItem('sys_indicators'));
        
        // メブクス豊洲 (マルシェ) 用データ作成
        const placeId = 'place_demo_1';
        const zoneIds = ['zone_demo_1a', 'zone_demo_1b', 'zone_demo_1c'];
        const sessions = [
            { date: '2026-05-10', time: '12:00', weather: '晴' },
            { date: '2026-05-10', time: '15:00', weather: '晴' },
            { date: '2026-05-11', time: '12:00', weather: '曇' }
        ];

        let evalId = 1;

        sessions.forEach(session => {
            zoneIds.forEach(zoneId => {
                // 1つのゾーン・セッションにつき、人間1件、AI1件の評価を生成
                
                // Human
                const humanRatings = {};
                indicators.forEach(ind => {
                    if (ind.isRepresentative || ind.assets.includes('マルシェ')) {
                        humanRatings[ind.id] = Math.floor(Math.random() * 3) + 3; // 3〜5
                    }
                });
                
                dummyEvals.push({
                    id: 'eval_init_' + (evalId++),
                    timestamp: new Date(`${session.date}T${session.time}:00Z`).toISOString(),
                    audioTime: session.time, // or original session
                    date: session.date,
                    time: session.time,
                    weather: session.weather,
                    placeId: placeId,
                    zoneId: zoneId,
                    source: 'Human',
                    evaluator_name: '田中 太郎',
                    ratings: humanRatings,
                    comment: 'デモ用の初期データ（人間）です。'
                });

                // AI
                const aiRatings = {};
                indicators.forEach(ind => {
                    if (ind.isRepresentative || ind.assets.includes('マルシェ')) {
                        aiRatings[ind.id] = Math.floor(Math.random() * 3) + 2; // 2〜4 (少し厳しめ)
                    }
                });

                dummyEvals.push({
                    id: 'eval_init_' + (evalId++),
                    timestamp: new Date(`${session.date}T${session.time}:00Z`).toISOString(),
                    audioTime: session.time,
                    date: session.date,
                    time: session.time,
                    weather: session.weather,
                    placeId: placeId,
                    zoneId: zoneId,
                    source: 'AI (活気重視)',
                    evaluator_name: 'AI ペルソナ A',
                    ratings: aiRatings,
                    comment: 'デモ用の初期データ（AI）です。活気を感じました。'
                });
            });
        });

        localStorage.setItem('sys_evaluations', JSON.stringify(dummyEvals));
    }
}

// 実行
initializeDemoData();
