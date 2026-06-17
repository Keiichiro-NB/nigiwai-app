// 初期データ生成ロジック (デモ環境用)
async function initializeDemoData() {
    // マスタが未定義の場合のみ初期化を行う（本番運用向け）

    // 1. Places (対象地) の初期化
    const currentPlaces = await DataService.getPlaces();
    if (currentPlaces.length === 0) {
        const demoPlaces = [
            {
                id: 'メブクス豊洲',
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
                id: '〇〇公園',
                name: '〇〇公園',
                concept: '地域住民の憩いの場',
                asset: '公園',
                zones: [
                    { id: 'zone_demo_2a', name: '遊具エリア', attr: '遊び' },
                    { id: 'zone_demo_2b', name: 'ベンチエリア', attr: '休憩' }
                ]
            }
        ];
        await DataService.savePlaces(demoPlaces);
    }

    // 2. ペルソナマスタ (Personas) の初期化
    const currentPersonas = await DataService.getPersonas();
    if (currentPersonas.length === 0) {
        const defaultPersonas = [
            { id: 1, name: "30代働く女性（タイパ・心地よさ重視）", attributes: "30代半ば、都内近郊在住。働く女性（単身または共働き）。", lifestyle: "日常の中に「自分なりの心地よさ」や「小さな特別感」を取り入れたい。モノやサービスの背景にある「ストーリー」や「質の良さ」に投資する傾向。", sensitivity: "マスメディアの流行に流されず、Instagramの保存機能、Pinterest、信頼するインフルエンサーから「パーソナライズされた1次情報」を能動的にキャッチ。", comfort: "無駄なストレス（複雑すぎる動線、不快な混雑、分かりにくい案内など）がないこと。", emotional: "視覚的な美しさ（色彩、デザインの統一感）、五感への配慮（明るさや雰囲気）、その空間にいることで自分の気分が上がるような「世界観」があること。" },
            { id: 2, name: "Z世代：トレンド＆体験消費層", attributes: "21歳／女性／大学生。同伴形態：大学の友人グループ（2〜3人）。", lifestyle: "リアルな場での「体験」や「思い出作り」を重視。SNSでの自己表現が生活の一部であり、友人との共有時間を最大化することに価値を感じる。", sensitivity: "TikTok、Instagramのリール、Lemon8等から、視覚的・直感的に「エモい」情報をキャッチ。ハッシュタグで能動的にトレンドを追う。", comfort: "スマート決済の導入など、デジタルでのスムーズさ。多少の混雑は「人気スポットだし仕方ない」と容認できる。", emotional: "フォトジェニックで「映える」視覚演出、動画に撮りたくなる動き（体験型イベントやオープンキッチンなど）、自分たちの世界に没入できる活気。" },
            { id: 3, name: "ファミリー：乳幼児子育て世代", attributes: "34歳／女性（または男性）／主婦・主夫（または育休中・時短勤務）。同伴形態：家族（夫婦＋3歳と0歳の子ども、ベビーカー利用）。", lifestyle: "生活のすべてが「子ども中心」。休日は子どもが安全に楽しめ、同時に大人の気分転換（育児ストレス解消）も兼ねたお出かけをしたい。", sensitivity: "子連れお出かけ専門のSNSアカウントやブログ、ママ友・パパ友からのリアルな口コミ。事前に授乳室、おむつ替えスペース、段差の有無を徹底的に調べる。", comfort: "ベビーカーがスムーズを通れる広い通路・動線、清潔で充実したアメニティ、安全性が確保された物理的環境。", emotional: "子どもが退屈せず楽しめる動的なにぎわい（キッズスペースや広場）、周囲に気を使わずに済む「ウェルカムな空気感」や適度なガヤガヤ感。" },
            { id: 4, name: "ミドル現役：多忙な共働き世代", attributes: "45歳／男性／会社員（管理職）。同伴形態：夫婦（子どもが大きくなり、夫婦2人での行動が増えた）。", lifestyle: "仕事と家庭で多忙を極めるため、休日のお出かけは「効率の良さ（タイパ）」と「上質さ」を両立させたい。ごちゃごちゃした場所を避け、洗練された落ち着いた時間を好む。", sensitivity: "ビジネス系メディア、ライフスタイル雑誌、信頼できるWebマガジン。目的を持って計画的に情報を収集し、無駄な移動や不確定要素を嫌う。", comfort: "直感的にわかりやすい案内サイン、スムーズな買い回り・移動ができる洗練された動線、待たされないスムーズなオペレーション。", emotional: "モダンで上品なデザイン、落ち着いたBGMや大人の上質さを感じさせるトータルな世界観、不快な混雑のない静けさと適度な活気の調和。" },
            { id: 5, name: "ソロ活：おひとりさま質重視層", attributes: "38歳／男性（または女性）／独身・会社員。同伴形態：完全に1人（単独）。", lifestyle: "誰にも気を使わず、自分のペースで時間やお金を贅沢に使いたい。自分の趣味やこだわり（本、カメラ、こだわりの食、インテリアなど）に投資する。", sensitivity: "X（旧Twitter）のニッチな情報、個人ブログ、専門誌。マスメディアの流行よりも、独自の価値やディープな専門性を好む。", comfort: "1人でも利用しやすい席配置・カウンター、過度な干渉をしない（でも丁寧な）距離感の接客、自分のペースを乱されない空間設計。", emotional: "周囲の視線が気にならない適度なパーソナルスペース（こもり感）、静かに思考や鑑賞に没入できる、うるさすぎない適度な雑音環境。" },
            { id: 6, name: "アクティブシニア：健康＆本物志向層", attributes: "68歳／女性／主婦（夫はリタイア）。同伴形態：夫婦、または同世代の友人（2人）。", lifestyle: "健康維持と知的好奇心を満たすお出かけを好む。流行りものよりも、長く愛されている老舗や、信頼できる「本物・ホンモノ」に価値を感じる。", sensitivity: "新聞、テレビの旅・紀行番組、シニア向け雑誌、信頼できる知人からの紹介。スマホは使うが、文字が大きく分かりやすいデザインを好む。", comfort: "段差のないユニバーサルデザイン、見やすい大きな文字の案内板、途点で休憩できるベンチの多さ。", emotional: "安心・安全を感じる清潔感、スタッフの温かみのある丁寧な接客（コミュニケーション）、騒々しすぎない穏やかで上質なにぎわい。" },
            { id: 7, name: "インバウンド：訪日外国人旅行客", attributes: "28歳／男性／アメリカ人（ITエンジニア）。同伴形態：パートナー（恋人）と2人。", lifestyle: "日本独自の文化、歴史、あるいは「ローカルな日常の活気」を直接体験したい。観光地化されすぎた場所よりも、地元の人に愛されているリアルなスポットを好む。", sensitivity: "Reddit、トリップアドバイザー、海外インフルエンサーのYouTube/TikTok。Googleマップの英語レビューを非常に重視する。", comfort: "英語（多言語）対応や直感的なピクトグラム、キャッシュレス決済・タッチ決済の完全対応、フリーWi-Fiの安定性。", emotional: "日本的なデザインや文化の要素（異国情緒）、地元の人々のリアルな活気、ウェルカムでオープンなコミュニティの雰囲気。" },
            { id: 8, name: "ワークスタイル：リモート＆ノマドワーカー", attributes: "29歳／男性／フリーランスのデザイナー。同伴形態：1人（仕事目的だが、合間のリフレッシュも兼ねる）。", lifestyle: "仕事とプライベートの境界がシームレス。自宅以外の「サードプレイス（第3の居場所）」を常に探し、空間の機能性とインスピレーション（刺激）を重視する。", sensitivity: "note、テック・デザイン系メディア、ノマド向けカフェまとめアカウント。利便性とデザイン性の両面から空間を選ぶ。", comfort: "電源・高速Wi-Fiの確保、長時間のPC作業に適した椅子と机、長居しても罪悪感のないオペレーション。", emotional: "静かすぎず、適度なガヤガヤ感（カフェの雑音やホワイトノイズ）、クリエイティブな刺激を受ける洗練されたインテリアや照明デザイン。" },
            { id: 9, name: "地元ローカル：郊外・近領住民層", attributes: "52歳／女性／パートタイム勤務。同伴形態：1人、または地元の友人。", lifestyle: "遠出するよりも、慣れ親しんだ地元で普段着のままリラックスして過ごしたい。派手なトレンドよりも、「いつもの安心感」や「コスパの良さ」が日常の幸せ。", sensitivity: "地域のフリーペーパー、LINEの地域グループ、知人からの口コミ。日々の生活圏内の情報に最も敏感。", comfort: "気軽に立ち寄れるアクセス性、普段使いしやすい価格帯の店舗構成、顔なじみのスタッフによる安心感。", emotional: "気気取らないカジュアルな雰囲気、地域コミュニティとしての温かみのある活気（アットホーム感）、生活に溶け込む親しみやすいデザイン。" },
            { id: 10, name: "コスト重視：学生・若者コミュニティ層", attributes: "19歳／男性／専門学校生。同伴形態：学校や趣味の友人グループ（3〜5人）。", lifestyle: "自由に使えるお金は少ないが、仲間と集まって楽しく過ごす時間を何より大切にしたい。", sensitivity: "友人同士のリアルタイムな口コミ、SNS（鍵垢や身内のグループ通話等）での閉じた情報交換。コスパ情報に敏感。", comfort: "持ち込みや長居に対して寛容、または少額で利用できるカジュアルな飲食環境・フリースペース。", emotional: "周囲に気兼ねなく仲間とワイワイ騒げる・リラックスできる活気、フォーマルすぎない親しみやすい空間。" }
        ];
        await DataService.savePersonas(defaultPersonas);
    }

    // 3. 指標マスタ (Indicators) の初期化
    const currentIndicators = await DataService.getIndicators();
    if (currentIndicators.length === 0) {
        const defaultIndicators = [
            // 【原因レイヤー（空間・設備：11項目）】
            // 共通指標（旧：代表指標）
            { id: 1, name: '訪れやすい場所にある', type: 'cause', category: 'representative', assetId: 'all', shortName: 'アクセス性' },
            { id: 2, name: '人を継続的に呼び込むイベントを企画・開催している', type: 'cause', category: 'representative', assetId: 'all', shortName: 'イベント企画' },
            { id: 3, name: '施設のターゲットやコンセプトが明確に定義され、施設に反映されている', type: 'cause', category: 'representative', assetId: 'all', shortName: 'コンセプト' },
            { id: 4, name: '窮屈に思わないルールが設定されている', type: 'cause', category: 'representative', assetId: 'all', shortName: '利用ルール' },
            { id: 5, name: '気軽に利用できるベンチや休憩スペースが確保されている', type: 'cause', category: 'representative', assetId: 'all', shortName: '休憩空間' },
            { id: 6, name: 'ユニアバーサルなアメニティ(トイレ・ゴミ箱・多言語案内・公衆Wi-Fi・日除け・休憩席・バリアフリー動線・ペット/ 授乳対応設備 など)が確保されている', type: 'cause', category: 'representative', assetId: 'all', shortName: 'ユニバーサル' },
            // 固有指標
            { id: 7, name: '話題性・集客力のあるテナントを誘致できている', type: 'cause', category: 'unique', assetId: 'marche', shortName: 'テナント誘致' },
            { id: 8, name: '商品やサービス、接客により滞在価値を高められるテナントのオペレーションが存在する', type: 'cause', category: 'unique', assetId: 'marche', shortName: '店舗運営' },
            { id: 9, name: 'コンセプトと合致する五感への刺激（音楽、香り、空調など）が設計されている', type: 'cause', category: 'unique', assetId: 'marche', shortName: '五感刺激' },
            { id: 10, name: 'ターゲット層に訴求する多彩なイベントを定期的に開催する計画が立てられている', type: 'cause', category: 'unique', assetId: 'marche', shortName: 'イベント計画' },
            { id: 11, name: '飲み物や軽食を気軽に楽しめる利便性の高い飲食環境が計画されている', type: 'cause', category: 'unique', assetId: 'marche', shortName: '飲食環境' },

            // 【結果レイヤー（人の行動：13項目）】
            // 共通指標（旧：代表指標）
            { id: 12, name: '様々な目的・属性の方が施設を利用している', type: 'effect', category: 'representative', assetId: 'all', shortName: '多様客層' },
            { id: 13, name: '施設への継続的な人の流入が見られる', type: 'effect', category: 'representative', assetId: 'all', shortName: '人の流入' },
            { id: 14, name: '長く滞在している利用者が多い', type: 'effect', category: 'representative', assetId: 'all', shortName: '長期滞在' },
            { id: 15, name: '適切な人口密度であり、閑散または不快なほどの混嫌を感じない', type: 'effect', category: 'representative', assetId: 'all', shortName: '人口密度' },
            { id: 16, name: '会話や笑い声等により、ポジティブな印象/活気が感じられる', type: 'effect', category: 'representative', assetId: 'all', shortName: '音・活気' },
            { id: 17, name: '休憩場所でリラックスして過ごす人々が見られる', type: 'effect', category: 'representative', assetId: 'all', shortName: '休憩風景' },
            { id: 18, name: '施設内で利用者が回遊している', type: 'effect', category: 'representative', assetId: 'all', shortName: '人の回遊' },
            // 固有指標
            { id: 19, name: '気軽にランチ/軽食を楽しむ人々が見られる', type: 'effect', category: 'unique', assetId: 'marche', shortName: '飲食風景' },
            { id: 20, name: '客単価や回転率が高く、施設全体としての活発活動が行われていると感じる', type: 'effect', category: 'unique', assetId: 'marche', shortName: '活発な購買' },
            { id: 21, name: '店員と客、客同士の弾む会話や笑い声が聞こえ、活気が感じられる', type: 'effect', category: 'unique', assetId: 'marche', shortName: '弾む会話' },
            { id: 22, name: '適度な音量でBGMが流れ、寂しさを感じない', type: 'effect', category: 'unique', assetId: 'marche', shortName: '心地よいBGM' },
            { id: 23, name: '販売員が活気ある呼び込みや丁寧な接客を行っていると感じられる', type: 'effect', category: 'unique', assetId: 'marche', shortName: '活発な接客' },
            { id: 24, name: '集客イベントが開催されて盛り上がりを感じることができる', type: 'effect', category: 'unique', assetId: 'marche', shortName: 'イベント盛況' }
        ];
        await DataService.saveIndicators(defaultIndicators);
    }
}

// 実行
initializeDemoData();
