// Excelパーサーとデータストア (SheetJSを利用)
const DataStore = {
    rawData: [],
    parsedData: {
        places: {},
        sessions: {},
        indicatorVersions: new Set()
    },
    
    // フィルタ状態: 'latest' (最新指標のみ) | 'all' (過去データ含む)
    filterMode: 'latest',
    
    // 最新の指標バージョン名（データ読み込み時に自動判定）
    latestVersion: '',

    init: function() {
        this.loadFromStorage();
    },

    // Excelファイル読み込み
    handleFileUpload: function(event, callback) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // 最初のシートを読み込む前提
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // JSONに変換
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            this.rawData = jsonData;
            
            // データ構造を解析・正規化
            this.processData();
            this.saveToStorage();
            
            if(callback) callback();
        };
        reader.readAsArrayBuffer(file);
    },

    // データの正規化
    processData: function() {
        this.parsedData = {
            places: {},
            sessions: {},
            indicatorVersions: new Set()
        };

        let latestDate = '';

        this.rawData.forEach(row => {
            // Excelの列名推定 (将来変更されてもいいように柔軟に取得)
            const placeName = row['対象地'] || row['TargetPlace'] || '不明な対象地';
            const placeType = row['アセット種別'] || row['AssetType'] || '未設定';
            const sessionDate = row['調査日'] || row['評価実施日'] || row['Date'] || '';
            const zoneName = row['ゾーン'] || row['Zone'] || '全体';
            const evalType = row['評価者タイプ'] || row['人/AI'] || '人';
            
            // 指標バージョンの特定 (明記されていなければ実施日から推測するかデフォルト値)
            let version = row['指標バージョン'] || row['Version'] || 'v1.0';
            this.parsedData.indicatorVersions.add(version);
            
            if (sessionDate > latestDate) {
                latestDate = sessionDate;
                this.latestVersion = version;
            }

            // 対象地の登録
            if (!this.parsedData.places[placeName]) {
                this.parsedData.places[placeName] = {
                    name: placeName,
                    type: placeType,
                    zoneCount: new Set(),
                    evaluatorCount: 0,
                    latestSession: '',
                    sessions: []
                };
            }
            this.parsedData.places[placeName].zoneCount.add(zoneName);
            if (sessionDate > this.parsedData.places[placeName].latestSession) {
                this.parsedData.places[placeName].latestSession = sessionDate;
            }
            
            // 指標スコアの動的抽出 (予約語以外の数値列を指標とみなす)
            const excludeKeys = ['対象地', 'TargetPlace', 'アセット種別', 'AssetType', '調査日', '評価実施日', 'Date', 'ゾーン', 'Zone', '評価者タイプ', '人/AI', '指標バージョン', 'Version', 'コメント', '備考'];
            const scores = {};
            Object.keys(row).forEach(key => {
                if (!excludeKeys.includes(key) && typeof row[key] === 'number') {
                    scores[key] = row[key];
                }
            });

            // セッションデータの構築
            const sessionId = `${placeName}_${sessionDate}`;
            if (!this.parsedData.sessions[sessionId]) {
                this.parsedData.sessions[sessionId] = {
                    id: sessionId,
                    placeName: placeName,
                    date: sessionDate,
                    version: version,
                    records: []
                };
                if (!this.parsedData.places[placeName].sessions.includes(sessionId)) {
                    this.parsedData.places[placeName].sessions.push(sessionId);
                }
            }
            
            this.parsedData.sessions[sessionId].records.push({
                zone: zoneName,
                evalType: evalType,
                scores: scores
            });
            
            // 評価者数カウント（簡易的に1行＝1評価とみなす）
            this.parsedData.places[placeName].evaluatorCount++;
        });
        
        // フォールバック
        if (!this.latestVersion && this.parsedData.indicatorVersions.size > 0) {
            this.latestVersion = Array.from(this.parsedData.indicatorVersions).sort().pop();
        }
    },

    // フィルタリングされた対象地リストを取得
    getFilteredPlaces: function() {
        const placesList = Object.values(this.parsedData.places);
        
        // フィルタリング処理（過去データを含むかどうか）
        // ※対象地自体はすべて表示するが、内部のセッション等で使う
        return placesList.map(place => {
            return {
                ...place,
                zoneCount: place.zoneCount.size
            }
        });
    },

    // フィルタリングされたグラフ用データの取得例
    getTrendData: function(placeName) {
        if (!this.parsedData.places[placeName]) return [];
        
        const sessions = this.parsedData.places[placeName].sessions.map(sid => this.parsedData.sessions[sid]);
        
        // 日付順にソート
        sessions.sort((a, b) => a.date.localeCompare(b.date));
        
        const trend = [];
        sessions.forEach(session => {
            // フィルタ適用：'latest' なら最新バージョン以外は除外
            if (this.filterMode === 'latest' && session.version !== this.latestVersion) {
                return;
            }
            
            // AI評価の平均スコアを計算
            let aiRecords = session.records.filter(r => r.evalType === 'AI' || r.evalType === 'AI評価');
            if (aiRecords.length === 0) aiRecords = session.records; // AIがなければ全部
            
            let totalScore = 0;
            let scoreCount = 0;
            
            aiRecords.forEach(record => {
                Object.values(record.scores).forEach(score => {
                    totalScore += score;
                    scoreCount++;
                });
            });
            
            const avg = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 0;
            trend.push({
                label: session.date,
                score: parseFloat(avg)
            });
        });
        
        return trend;
    },

    setFilterMode: function(mode) {
        this.filterMode = mode;
        this.saveToStorage();
    },

    saveToStorage: function() {
        localStorage.setItem('nigiwai_raw_data', JSON.stringify(this.rawData));
        localStorage.setItem('nigiwai_filter', this.filterMode);
    },

    loadFromStorage: function() {
        const saved = localStorage.getItem('nigiwai_raw_data');
        const filter = localStorage.getItem('nigiwai_filter');
        if (saved) {
            this.rawData = JSON.parse(saved);
            this.processData();
        }
        if (filter) {
            this.filterMode = filter;
        }
    }
};

// 初期化
DataStore.init();
