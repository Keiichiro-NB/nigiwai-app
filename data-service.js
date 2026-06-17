/**
 * Firebase Firestore連携版 DataService
 * - HTMLファイルの修正不要でFirebase SDKを自動ロード
 * - async/await を使用してデータアクセスを抽象化
 */
const DataService = (function() {
  
  // ==========================================
  // 【設定手順】
  // ここに Firebase 管理画面から取得した firebaseConfig をコピペしてください。
  // ==========================================
  const firebaseConfig = {
    apiKey: "AIzaSyBDlx4sPUlLNIL5PUw18y-fcy-Uq6MYBcg",
    authDomain: "nigiwai-app.firebaseapp.com",
    projectId: "nigiwai-app",
    storageBucket: "nigiwai-app.firebasestorage.app",
    messagingSenderId: "298682683465",
    appId: "1:298682683465:web:19a1e4e1d257fd09a0af98"
  };

  // Firebaseの初期化状態を管理するPromise
  let firebaseInitPromise = null;

  async function ensureFirebaseInit() {
    if (firebaseInitPromise) return firebaseInitPromise;

    firebaseInitPromise = new Promise((resolve, reject) => {
      // 既に読み込み済みの場合はスキップ
      if (window.firebase && window.firebase.firestore) {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        resolve(firebase.firestore());
        return;
      }

      // CDNからSDKを動的に読み込む（HTML無編集で動作させるためのハック）
      const loadScript = (src) => {
        return new Promise((res, rej) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = res;
          script.onerror = rej;
          document.head.appendChild(script);
        });
      };

      // v8 compat ライブラリを読み込み（通常のスクリプト形式に最も適しているため）
      Promise.all([
        loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js")
      ]).then(() => {
        return loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js");
      }).then(() => {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        console.log("Firebase & Firestore loaded and initialized.");
        resolve(firebase.firestore());
      }).catch(err => {
        console.error("Firebase SDK の読み込みに失敗しました:", err);
        reject(err);
      });
    });

    return firebaseInitPromise;
  }

  // ==========================================
  // Firestore データ操作のヘルパー
  // ==========================================
  
  // Firestoreの特定のドキュメントから配列（マスタ）を取得する
  async function fetchMasterData(docName) {
    const db = await ensureFirebaseInit();
    try {
      const docRef = db.collection('master_data').doc(docName);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return docSnap.data().items || [];
      } else {
        return [];
      }
    } catch (e) {
      console.error(`Error fetching ${docName}:`, e);
      return [];
    }
  }

  // Firestoreの特定のドキュメントに配列（マスタ）を保存する
  async function saveMasterData(docName, items) {
    const db = await ensureFirebaseInit();
    try {
      const docRef = db.collection('master_data').doc(docName);
      await docRef.set({ items: items }, { merge: true });
    } catch (e) {
      console.error(`Error saving ${docName}:`, e);
    }
  }

  // ==========================================
  // 公開インターフェース
  // ==========================================
  return {
    
    // 🟢 マスタデータ系 (Firestore "master_data" コレクション内のドキュメントとして保存)
    async getPlaces() {
      return await fetchMasterData('sys_places');
    },
    async savePlaces(places) {
      await saveMasterData('sys_places', places);
    },

    async getIndicators() {
      return await fetchMasterData('nigiwai_indicators');
    },
    async saveIndicators(indicators) {
      await saveMasterData('nigiwai_indicators', indicators);
    },

    async getPersonas() {
      return await fetchMasterData('nigiwai_personas');
    },
    async savePersonas(personas) {
      await saveMasterData('nigiwai_personas', personas);
    },

    // 🔵 評価データ系 (Firestore "evaluations" コレクション内の個別ドキュメントとして保存)
    async getEvaluations() {
      const db = await ensureFirebaseInit();
      try {
        const snapshot = await db.collection('evaluations').get();
        let evals = [];
        snapshot.forEach(doc => {
          evals.push(doc.data());
        });
        // タイムスタンプで降順（新しい順）にソート
        evals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return evals;
      } catch (e) {
        console.error("Error fetching evaluations:", e);
        return [];
      }
    },

    async saveEvaluations(evals) {
      // LocalStorageからの移行に対応するため、与えられた配列状態を完全に再現する（差分同期）
      const db = await ensureFirebaseInit();
      try {
        const batch = db.batch();
        let count = 0;
        
        // 1. 新規・更新データの書き込み
        for (const ev of evals) {
          if (!ev.id) ev.id = 'eval_' + Date.now() + Math.floor(Math.random() * 1000);
          const docRef = db.collection('evaluations').doc(ev.id);
          batch.set(docRef, ev);
          count++;
          if (count >= 490) break; // バッチ上限の安全装置
        }
        if (count > 0) {
          await batch.commit();
        }
        
        // 2. 削除されたデータの反映（配列に存在しないドキュメントをFirestoreからも消す）
        const snapshot = await db.collection('evaluations').get();
        const incomingIds = evals.map(e => e.id);
        const deleteBatch = db.batch();
        let deleteCount = 0;
        
        snapshot.forEach(doc => {
          if (!incomingIds.includes(doc.id)) {
            deleteBatch.delete(doc.ref);
            deleteCount++;
          }
        });
        if (deleteCount > 0 && deleteCount < 490) {
          await deleteBatch.commit();
        }
      } catch (e) {
        console.error("Error saving evaluations:", e);
      }
    },

    async addEvaluation(newEval) {
      const db = await ensureFirebaseInit();
      try {
        if (!newEval.id) {
          newEval.id = 'eval_' + Date.now();
        }
        await db.collection('evaluations').doc(newEval.id).set(newEval);
      } catch (e) {
        console.error("Error adding evaluation:", e);
      }
    },

    // ⚪️ ローカル専用設定系 (デバイス固有のAPI設定などとして localStorage を維持)
    getLocalSetting(key) {
      return localStorage.getItem(key);
    },
    setLocalSetting(key, value) {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    }
  };
})();
