// Translation keys — add new entries here, then run t() in components
// Languages: en, ja, zh-TW, ko

export const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
] as const;

export type LangCode = (typeof languages)[number]["code"];

type TranslationDict = Record<string, Record<LangCode, string>>;

export const dict: TranslationDict = {
  // ── Nav / Common ──
  "nav.dashboard": { en: "Dashboard", ja: "ダッシュボード", "zh-TW": "儀表板", ko: "대시보드" },
  "nav.profile": { en: "Profile", ja: "プロフィール", "zh-TW": "個人資料", ko: "프로필" },
  "nav.submit": { en: "Submit Video", ja: "動画を投稿", "zh-TW": "提交影片", ko: "비디오 제출" },
  "nav.videos": { en: "My Videos", ja: "マイ動画", "zh-TW": "我的影片", ko: "내 비디오" },
  "nav.shop": { en: "Reward Shop", ja: "報酬ショップ", "zh-TW": "獎勵商店", ko: "보상 상점" },
  "nav.special": { en: "Special Rewards", ja: "特別報酬", "zh-TW": "特別獎勵", ko: "특별 보상" },
  "nav.orders": { en: "Order History", ja: "注文履歴", "zh-TW": "訂單記錄", ko: "주문 내역" },
  "nav.signout": { en: "Sign Out", ja: "ログアウト", "zh-TW": "登出", ko: "로그아웃" },
  "nav.creators": { en: "Creators", ja: "クリエイター", "zh-TW": "創作者", ko: "크리에이터" },
  "nav.campaigns": { en: "Campaigns", ja: "キャンペーン", "zh-TW": "活動", ko: "캠페인" },
  "nav.review": { en: "Video Review", ja: "動画レビュー", "zh-TW": "影片審核", ko: "비디오 검토" },
  "nav.milestones": { en: "Milestones", ja: "マイルストーン", "zh-TW": "里程碑", ko: "마일스톤" },
  "nav.shopitems": { en: "Shop Items", ja: "ショップ商品", "zh-TW": "商店物品", ko: "상점 아이템" },
  "nav.rewardorders": { en: "Reward Orders", ja: "報酬注文", "zh-TW": "獎勵訂單", ko: "보상 주문" },
  "nav.specialrewards": { en: "Special Rewards", ja: "特別報酬", "zh-TW": "特別獎勵", ko: "특별 보상" },

  // ── Dashboard ──
  "dashboard.welcome": { en: "Welcome", ja: "ようこそ", "zh-TW": "歡迎", ko: "환영합니다" },
  "dashboard.creditBalance": { en: "Credit Balance", ja: "クレジット残高", "zh-TW": "積分餘額", ko: "크레딧 잔액" },
  "dashboard.totalEarned": { en: "Total Earned", ja: "総獲得額", "zh-TW": "總收益", ko: "총 획득" },
  "dashboard.videos": { en: "Videos", ja: "動画", "zh-TW": "影片", ko: "비디오" },
  "dashboard.orders": { en: "Orders", ja: "注文", "zh-TW": "訂單", ko: "주문" },
  "dashboard.milestoneProgress": { en: "Milestone Progress", ja: "マイルストーン進捗", "zh-TW": "里程碑進度", ko: "마일스톤 진행" },
  "dashboard.youtubeRewards": { en: "YouTube Rewards", ja: "YouTube報酬", "zh-TW": "YouTube獎勵", ko: "YouTube 보상" },
  "dashboard.tiktokRewards": { en: "TikTok Rewards", ja: "TikTok報酬", "zh-TW": "TikTok獎勵", ko: "TikTok 보상" },
  "dashboard.totalViews": { en: "Total views", ja: "総視聴回数", "zh-TW": "總觀看數", ko: "총 조회수" },
  "dashboard.nextMilestone": { en: "Next milestone", ja: "次のマイルストーン", "zh-TW": "下一個里程碑", ko: "다음 마일스톤" },
  "dashboard.moreNeeded": { en: "more needed", ja: "必要", "zh-TW": "還需要", ko: "더 필요" },
  "dashboard.allReached": { en: "All milestones reached!", ja: "全マイルストーン達成！", "zh-TW": "所有里程碑已達成！", ko: "모든 마일스톤 달성!" },
  "dashboard.recentOrders": { en: "Recent Orders", ja: "最近の注文", "zh-TW": "近期訂單", ko: "최근 주문" },
  "dashboard.quickActions": { en: "Quick Actions", ja: "クイック操作", "zh-TW": "快速操作", ko: "빠른 작업" },

  // ── Submit ──
  "submit.title": { en: "Submit Video", ja: "動画を投稿", "zh-TW": "提交影片", ko: "비디오 제출" },
  "submit.hashtagHint": { en: "All submissions must include", ja: "投稿には必ず", "zh-TW": "所有提交必須包含", ko: "모든 제출물에는" },
  "submit.hashtagHint2": { en: "in the video title or description to qualify.", ja: "を動画タイトルか説明に含めてください。", "zh-TW": "在影片標題或描述中才能符合資格。", ko: "을(를) 비디오 제목이나 설명에 포함해야 합니다." },
  "submit.platform": { en: "Platform", ja: "プラットフォーム", "zh-TW": "平台", ko: "플랫폼" },
  "submit.campaign": { en: "Campaign", ja: "キャンペーン", "zh-TW": "活動", ko: "캠페인" },
  "submit.videoUrl": { en: "Video URL", ja: "動画URL", "zh-TW": "影片網址", ko: "비디오 URL" },
  "submit.autoDetect": { en: "Auto-Detect", ja: "自動検出", "zh-TW": "自動偵測", ko: "자동 감지" },
  "submit.detecting": { en: "Detecting...", ja: "検出中...", "zh-TW": "偵測中...", ko: "감지 중..." },
  "submit.videoTitle": { en: "Video Title", ja: "動画タイトル", "zh-TW": "影片標題", ko: "비디오 제목" },
  "submit.publishTime": { en: "Video Publish Time", ja: "公開日", "zh-TW": "發布日期", ko: "게시 날짜" },
  "submit.submitBtn": { en: "Submit Video", ja: "投稿する", "zh-TW": "提交影片", ko: "비디오 제출" },
  "submit.submitting": { en: "Submitting...", ja: "投稿中...", "zh-TW": "提交中...", ko: "제출 중..." },

  // ── Videos ──
  "videos.title": { en: "My Videos", ja: "マイ動画", "zh-TW": "我的影片", ko: "내 비디오" },
  "videos.sync": { en: "Sync Views", ja: "視聴回数を同期", "zh-TW": "同步觀看數", ko: "조회수 동기화" },
  "videos.syncing": { en: "Syncing...", ja: "同期中...", "zh-TW": "同步中...", ko: "동기화 중..." },
  "videos.claim": { en: "Claim", ja: "報酬を受け取る", "zh-TW": "領取", ko: "수령" },
  "videos.published": { en: "Published", ja: "公開日", "zh-TW": "發布", ko: "게시" },
  "videos.views": { en: "Views", ja: "視聴回数", "zh-TW": "觀看", ko: "조회수" },
  "videos.synced": { en: "Synced", ja: "同期済み", "zh-TW": "已同步", ko: "동기화됨" },
  "videos.claimed": { en: "claimed", ja: "受取済み", "zh-TW": "已領取", ko: "수령함" },
  "videos.campaignProgress": { en: "Campaign Milestone Progress", ja: "キャンペーンマイルストーン進捗", "zh-TW": "活動里程碑進度", ko: "캠페인 마일스톤 진행" },

  // ── Special Rewards ──
  "special.title": { en: "Special Bonus Rewards", ja: "特別ボーナス報酬", "zh-TW": "特別獎勵", ko: "특별 보너스 보상" },
  "special.subtitle": { en: "Apply for special bonus rewards. Each reward has specific requirements. All rewards stack with milestone tier rewards.", ja: "特別ボーナス報酬に応募できます。各報酬には特定の要件があります。すべてマイルストーン報酬と重複して受け取れます。", "zh-TW": "申請特別獎勵。每個獎勵有特定要求。所有獎勵可與里程碑獎勵疊加。", ko: "특별 보너스 보상을 신청하세요. 각 보상에는 특정 요구사항이 있습니다. 모든 보상은 마일스톤 보상과 중복 수령 가능합니다." },
  "special.apply": { en: "Apply", ja: "応募する", "zh-TW": "申請", ko: "신청" },
  "special.applyAgain": { en: "Apply Again", ja: "再度応募", "zh-TW": "再次申請", ko: "다시 신청" },
  "special.pending": { en: "Pending", ja: "審査中", "zh-TW": "審核中", ko: "대기 중" },
  "special.approved": { en: "Approved", ja: "承認済み", "zh-TW": "已批准", ko: "승인됨" },
  "special.rejected": { en: "Rejected", ja: "却下", "zh-TW": "已拒絕", ko: "거부됨" },
  "special.received": { en: "Received", ja: "受取済み", "zh-TW": "已領取", ko: "수령함" },
  "special.confirmTitle": { en: "Confirm your application for", ja: "以下の応募を確認", "zh-TW": "確認申請", ko: "신청 확인" },
  "special.confirmBtn": { en: "Confirm Application", ja: "応募を確定", "zh-TW": "確認申請", ko: "신청 확정" },
  "special.cancel": { en: "Cancel", ja: "キャンセル", "zh-TW": "取消", ko: "취소" },
  "special.diamonds": { en: "Diamonds", ja: "ダイヤモンド", "zh-TW": "鑽石", ko: "다이아몬드" },
  "special.campaign": { en: "Campaign", ja: "キャンペーン", "zh-TW": "活動", ko: "캠페인" },
  "special.selectVideo": { en: "Select a video with", ja: "タグ付き動画を選択", "zh-TW": "選擇帶有標籤的影片", ko: "태그가 있는 비디오 선택" },
  "special.noVideo": { en: "You have no videos with", ja: "タグ付き動画がありません", "zh-TW": "沒有帶標籤的影片", ko: "태그가 있는 비디오가 없습니다" },
  "special.followerCount": { en: "Your follower count", ja: "フォロワー数", "zh-TW": "粉絲數", ko: "팔로워 수" },
  "special.profileUrl": { en: "Your profile page URL", ja: "プロフィールURL", "zh-TW": "個人主頁網址", ko: "프로필 페이지 URL" },
  "special.notes": { en: "Additional notes (optional)", ja: "備考（任意）", "zh-TW": "備註（選填）", ko: "추가 메모 (선택사항)" },

  // ── Shop ──
  "shop.title": { en: "Reward Shop", ja: "報酬ショップ", "zh-TW": "獎勵商店", ko: "보상 상점" },
  "shop.balance": { en: "Your Balance", ja: "残高", "zh-TW": "你的餘額", ko: "잔액" },
  "shop.cart": { en: "Cart", ja: "カート", "zh-TW": "購物車", ko: "장바구니" },
  "shop.redeem": { en: "Redeem", ja: "交換する", "zh-TW": "兌換", ko: "교환" },
  "shop.credits": { en: "credits", ja: "クレジット", "zh-TW": "積分", ko: "크레딧" },
  "shop.unlimited": { en: "Unlimited", ja: "無制限", "zh-TW": "無限", ko: "무제한" },
  "shop.stock": { en: "Stock", ja: "在庫", "zh-TW": "庫存", ko: "재고" },
  "shop.addToCart": { en: "Add to Cart", ja: "カートに追加", "zh-TW": "加入購物車", ko: "장바구니에 추가" },
  "shop.empty": { en: "Your cart is empty", ja: "カートは空です", "zh-TW": "購物車是空的", ko: "장바구니가 비어 있습니다" },
  "shop.emptyHint": { en: "Add items from the shop to redeem them.", ja: "ショップから商品を追加してください。", "zh-TW": "從商店添加物品來兌換。", ko: "상점에서 아이템을 추가하여 교환하세요." },

  // ── Orders ──
  "orders.title": { en: "Order History", ja: "注文履歴", "zh-TW": "訂單記錄", ko: "주문 내역" },
  "orders.empty": { en: "No orders yet.", ja: "まだ注文はありません。", "zh-TW": "尚無訂單。", ko: "아직 주문이 없습니다." },
  "orders.playerId": { en: "Player ID", ja: "プレイヤーID", "zh-TW": "玩家ID", ko: "플레이어 ID" },
  "orders.cost": { en: "credits", ja: "クレジット", "zh-TW": "積分", ko: "크레딧" },

  // ── Profile ──
  "profile.title": { en: "Creator Profile", ja: "クリエイタープロフィール", "zh-TW": "創作者資料", ko: "크리에이터 프로필" },
  "profile.playerId": { en: "Game Player ID", ja: "ゲームプレイヤーID", "zh-TW": "遊戲玩家ID", ko: "게임 플레이어 ID" },
  "profile.playerIdLocked": { en: "Player ID is locked after binding", ja: "プレイヤーIDはバインド後にロックされます", "zh-TW": "玩家ID綁定後將鎖定", ko: "플레이어 ID는 바인딩 후 잠깁니다" },
  "profile.save": { en: "Save & Lock", ja: "保存してロック", "zh-TW": "儲存並鎖定", ko: "저장 및 잠금" },
  "profile.saved": { en: "Player ID saved and locked!", ja: "プレイヤーIDが保存されました！", "zh-TW": "玩家ID已儲存並鎖定！", ko: "플레이어 ID가 저장되고 잠겼습니다!" },
  "profile.channelSaved": { en: "YouTube channel saved!", ja: "YouTubeチャンネルが保存されました！", "zh-TW": "YouTube頻道已儲存！", ko: "YouTube 채널이 저장되었습니다!" },
  "profile.bindYoutube": { en: "Bind YouTube Channel", ja: "YouTubeチャンネルをバインド", "zh-TW": "綁定YouTube頻道", ko: "YouTube 채널 바인딩" },
  "profile.bindDiscord": { en: "Bind Discord", ja: "Discordをバインド", "zh-TW": "綁定Discord", ko: "Discord 바인딩" },

  // ── Social Sidebar ──
  "social.official": { en: "Official", ja: "公式", "zh-TW": "官方", ko: "공식" },
  "social.hide": { en: "Hide", ja: "閉じる", "zh-TW": "隱藏", ko: "숨기기" },
  "social.officialLinks": { en: "Official Links", ja: "公式リンク", "zh-TW": "官方連結", ko: "공식 링크" },

  // ── General ──
  "general.loading": { en: "Loading...", ja: "読み込み中...", "zh-TW": "載入中...", ko: "로딩 중..." },
  "general.error": { en: "Error", ja: "エラー", "zh-TW": "錯誤", ko: "오류" },
  "general.success": { en: "Success", ja: "成功", "zh-TW": "成功", ko: "성공" },
  "general.viewAll": { en: "View all", ja: "すべて見る", "zh-TW": "查看全部", ko: "전체 보기" },
  "general.by": { en: "by", ja: "by", "zh-TW": "by", ko: "by" },
  "general.submitVideo": { en: "Submit New Video", ja: "新規動画を投稿", "zh-TW": "提交新影片", ko: "새 비디오 제출" },
  "general.myVideosClaim": { en: "My Videos & Claim Rewards", ja: "動画と報酬受取", "zh-TW": "我的影片與領取獎勵", ko: "내 비디오 및 보상 수령" },
  "general.browseShop": { en: "Browse Reward Shop", ja: "報酬ショップを見る", "zh-TW": "瀏覽獎勵商店", ko: "보상 상점 둘러보기" },
  "general.noVideos": { en: "No videos submitted yet.", ja: "まだ動画が投稿されていません。", "zh-TW": "尚未提交影片。", ko: "아직 제출된 비디오가 없습니다." },
  "general.submitFirst": { en: "Submit your first video", ja: "最初の動画を投稿する", "zh-TW": "提交你的第一個影片", ko: "첫 비디오 제출하기" },

  // ── Admin ──
  "admin.dashboard": { en: "Pathfinder Program · Admin", ja: "パスファインダー · 管理者", "zh-TW": "尋路者計劃 · 管理", ko: "패스파인더 · 관리자" },
  "admin.dashboardTitle": { en: "Dashboard", ja: "ダッシュボード", "zh-TW": "儀表板", ko: "대시보드" },
  "admin.totalCreators": { en: "Total Creators", ja: "クリエイター総数", "zh-TW": "創作者總數", ko: "총 크리에이터" },
  "admin.pendingReviews": { en: "Pending Reviews", ja: "レビュー待ち", "zh-TW": "待審核", ko: "검토 대기" },
  "admin.pendingOrders": { en: "Pending Orders", ja: "注文待ち", "zh-TW": "待處理訂單", ko: "주문 대기" },
  "admin.totalVideos": { en: "Total Videos", ja: "動画総数", "zh-TW": "影片總數", ko: "총 비디오" },
  "admin.activeCampaigns": { en: "Active Campaigns", ja: "アクティブキャンペーン", "zh-TW": "進行中活動", ko: "활성 캠페인" },
  "admin.creditsIssued": { en: "Credits Issued", ja: "発行済クレジット", "zh-TW": "已發放積分", ko: "발행된 크레딧" },

  // ── Status labels ──
  "status.pending": { en: "Pending", ja: "審査中", "zh-TW": "待審核", ko: "대기 중" },
  "status.approved": { en: "Approved", ja: "承認済み", "zh-TW": "已批准", ko: "승인됨" },
  "status.rejected": { en: "Rejected", ja: "却下", "zh-TW": "已拒絕", ko: "거부됨" },
  "status.eligible": { en: "Eligible", ja: "対象", "zh-TW": "符合資格", ko: "적격" },
  "status.ineligible": { en: "Ineligible", ja: "対象外", "zh-TW": "不符合資格", ko: "부적격" },
  "status.active": { en: "Active", ja: "有効", "zh-TW": "進行中", ko: "활성" },
  "status.inactive": { en: "Inactive", ja: "無効", "zh-TW": "已停用", ko: "비활성" },
  "status.exported": { en: "Exported", ja: "エクスポート済み", "zh-TW": "已匯出", ko: "내보냄" },
  "status.sent": { en: "Sent", ja: "送信済み", "zh-TW": "已發送", ko: "전송됨" },
  "status.failed": { en: "Failed", ja: "失敗", "zh-TW": "失敗", ko: "실패" },

  // ── Profile page ──
  "profile.creatorCode": { en: "Creator Code", ja: "クリエイターコード", "zh-TW": "創作者代碼", ko: "크리에이터 코드" },
  "profile.email": { en: "Email", ja: "メール", "zh-TW": "電郵", ko: "이메일" },
  "profile.joined": { en: "Joined", ja: "参加日", "zh-TW": "加入日期", ko: "가입일" },
  "profile.setPlayerId": { en: "Set your in-game Player ID to receive rewards", ja: "報酬を受け取るためにゲーム内プレイヤーIDを設定してください", "zh-TW": "設定遊戲內玩家ID以接收獎勵", ko: "보상을 받으려면 게임 내 플레이어 ID를 설정하세요" },
  "profile.playerIdHint": { en: "Once bound, Player ID cannot be changed.", ja: "バインド後は変更できません。", "zh-TW": "綁定後無法更改。", ko: "바인딩 후에는 변경할 수 없습니다." },

  // ── Dashboard extended ──
  "dashboard.overview": { en: "Overview", ja: "概要", "zh-TW": "總覽", ko: "개요" },
  "dashboard.playerIdWarning": { en: "You haven't bound your game Player ID yet.", ja: "ゲームプレイヤーIDがまだバインドされていません。", "zh-TW": "你尚未綁定遊戲玩家ID。", ko: "게임 플레이어 ID를 아직 바인딩하지 않았습니다." },
  "dashboard.setItNow": { en: "Set it now →", ja: "今すぐ設定 →", "zh-TW": "立即設定 →", ko: "지금 설정 →" },

  // ── Galaxy Defense branding ──
  "brand.tagline": { en: "Galaxy Defense · Pathfinder Program", ja: "ギャラクシーディフェンス · パスファインダー", "zh-TW": "星系防禦 · 尋路者計劃", ko: "갤럭시 디펜스 · 패스파인더" },
  "brand.heroSub": { en: "Create content, earn milestones, redeem epic rewards.", ja: "コンテンツを作成し、マイルストーンを達成して、報酬をゲット。", "zh-TW": "創作內容，達成里程碑，兌換豐厚獎勵。", ko: "콘텐츠를 만들고 마일스톤을 달성하여 보상을 받으세요." },

  // ── Submit extended ──
  "submit.selectCampaign": { en: "Select a campaign...", ja: "キャンペーンを選択...", "zh-TW": "選擇活動...", ko: "캠페인 선택..." },
  "submit.aiComicHint": { en: "For AI Comic Award, add", ja: "AIコミック賞には", "zh-TW": "AI漫劇獎請加上", ko: "AI 코믹상은" },
  "submit.aiComicHint2": { en: "in the title.", ja: "をタイトルに入れてください。", "zh-TW": "在標題中。", ko: "을(를) 제목에 넣으세요." },
  "submit.autoDetected": { en: "auto-detected", ja: "自動検出", "zh-TW": "已自動偵測", ko: "자동 감지됨" },
  "submit.adjustHint": { en: "Automatically detected. Adjust if needed.", ja: "自動検出されました。必要に応じて調整してください。", "zh-TW": "已自動偵測，可手動調整。", ko: "자동으로 감지되었습니다. 필요시 조정하세요." },
  "submit.pasteHint": { en: "Paste URL and click Auto-Detect. If detection fails, enter manually.", ja: "URLを貼り付けて自動検出をクリック。失敗した場合は手動入力。", "zh-TW": "貼上網址並點擊自動偵測。如失敗請手動輸入。", ko: "URL을 붙여넣고 자동 감지를 클릭하세요. 실패시 수동 입력." },
  "submit.eligible": { en: "Eligible for rewards", ja: "報酬対象", "zh-TW": "符合獎勵資格", ko: "보상 대상" },
  "submit.notEligible": { en: "Not eligible (outside campaign period)", ja: "対象外（キャンペーン期間外）", "zh-TW": "不符合資格（活動期間外）", ko: "부적격 (캠페인 기간 외)" },
  "submit.submitted": { en: "Video submitted!", ja: "動画が投稿されました！", "zh-TW": "影片已提交！", ko: "비디오가 제출되었습니다!" },
  "submit.failed": { en: "Failed to submit video", ja: "動画の投稿に失敗しました", "zh-TW": "提交影片失敗", ko: "비디오 제출 실패" },

  // ── Order status ──
  "order.pending": { en: "Pending", ja: "処理待ち", "zh-TW": "待處理", ko: "대기 중" },
  "order.exported": { en: "Exported", ja: "エクスポート済み", "zh-TW": "已匯出", ko: "내보냄" },
  "order.sent": { en: "Sent", ja: "送信済み", "zh-TW": "已發送", ko: "전송됨" },

  // ── Shop extended ──
  "shop.browseShop": { en: "Browse Reward Shop", ja: "報酬ショップを見る", "zh-TW": "瀏覽獎勵商店", ko: "보상 상점 둘러보기" },
  "shop.totalCost": { en: "Total", ja: "合計", "zh-TW": "合計", ko: "합계" },
  "shop.redeemSuccess": { en: "Order placed successfully!", ja: "注文が完了しました！", "zh-TW": "訂單已下達！", ko: "주문이 완료되었습니다!" },

  // ── Videos extended ──
  "videos.untitled": { en: "Untitled Video", ja: "無題の動画", "zh-TW": "未命名影片", ko: "제목 없는 비디오" },
  "videos.filterAll": { en: "All", ja: "すべて", "zh-TW": "全部", ko: "전체" },
  "videos.empty": { en: "No videos submitted yet.", ja: "まだ動画がありません。", "zh-TW": "尚無影片。", ko: "아직 비디오가 없습니다." },
  "videos.emptyHint": { en: "Submit your first video →", ja: "最初の動画を投稿 →", "zh-TW": "提交你的第一個影片 →", ko: "첫 비디오 제출 →" },
  "videos.claiming": { en: "Claiming...", ja: "受取中...", "zh-TW": "領取中...", ko: "수령 중..." },

  // ── Admin extended ──
  "admin.recentSubmissions": { en: "Recent Video Submissions", ja: "最近の動画投稿", "zh-TW": "近期影片提交", ko: "최근 비디오 제출" },
  "admin.campaignManagement": { en: "Campaign Management", ja: "キャンペーン管理", "zh-TW": "活動管理", ko: "캠페인 관리" },
  "admin.videoReview": { en: "Video Review", ja: "動画レビュー", "zh-TW": "影片審核", ko: "비디오 검토" },
  "admin.shopManagement": { en: "Shop Management", ja: "ショップ管理", "zh-TW": "商店管理", ko: "상점 관리" },
  "admin.specialRewardApps": { en: "Special Reward Applications", ja: "特別報酬申請", "zh-TW": "特別獎勵申請", ko: "특별 보상 신청" },
  "admin.importCsv": { en: "Import CSV", ja: "CSVインポート", "zh-TW": "匯入CSV", ko: "CSV 가져오기" },

  // ── Reward descriptions (for special rewards page) ──
  "reward.REGISTRATION.desc": { en: "Complete the registration form to receive this bonus. One-time per creator.", ja: "登録フォームを完了すると、このボーナスを受け取れます。クリエイター1人につき1回。", "zh-TW": "完成報名表即可獲得此獎勵。每位創作者僅限一次。", ko: "등록 양식을 완료하면 이 보너스를 받을 수 있습니다. 크리에이터당 1회." },
  "reward.PARTICIPATION.desc": { en: "Submit 1 valid video to qualify. Once per platform-wide. Stacks with tier rewards.", ja: "有効な動画を1本投稿で対象。プラットフォーム全体で1回。段階報酬と重複可。", "zh-TW": "有效投稿1篇即符合資格。全平台僅能獲獎1次，與梯度獎勵疊加。", ko: "유효한 비디오 1개 제출 시 자격 부여. 플랫폼 전체 1회. 단계별 보상과 중복 가능." },
  "reward.DILIGENCE.desc": { en: "15+ active publishing days during the campaign with videos reaching ≥200 views. Stacks with tier rewards.", ja: "キャンペーン期間中に15日以上のアクティブな公開日、動画の視聴回数200以上。段階報酬と重複可。", "zh-TW": "活動期間內，全平台累計有效發布天數≥15天，入選稿件播放/瀏覽量≥200。與梯度獎勵疊加。", ko: "캠페인 기간 중 15일 이상 활성 게시, 비디오 조회수 200 이상. 단계별 보상과 중복 가능." },
  "reward.STAR_CREATOR.desc": { en: "Account with 5,000+ real followers. Complete basic content tasks for extra bonus. Stacks with tier rewards.", ja: "5,000人以上のフォロワーを持つアカウント。基本コンテンツタスク完了で追加ボーナス。段階報酬と重複可。", "zh-TW": "報名帳號真實原始粉絲達5,000及以上，完成基礎內容任務後發放額外加碼福利。與梯度獎勵疊加。", ko: "5,000명 이상의 실제 팔로워를 보유한 계정. 기본 콘텐츠 작업 완료 시 추가 보너스. 단계별 보상과 중복 가능." },
  "reward.AI_COMIC.desc": { en: "AI-created 30s+ video in My Defense World universe with complete storyline. 500 diamonds per video.", ja: "AIツールで作成した30秒以上の動画。完全なストーリー。1本500ダイヤ。", "zh-TW": "用AI工具創作30秒以上的我的防線世界觀短視頻，劇情完整。500鑽石/篇。", ko: "AI 도구로 제작한 30초 이상의 비디오. 완전한 스토리. 비디오당 500 다이아." },

  // ── Special rewards status ──
  "special.pendingReview": { en: "⏳ Pending Review", ja: "⏳ 審査中", "zh-TW": "⏳ 審核中", ko: "⏳ 심사 중" },
  "special.approvedIssued": { en: "✅ Approved — Diamonds issued!", ja: "✅ 承認済み — ダイヤ発行済！", "zh-TW": "✅ 已通過 — 鑽石已發放！", ko: "✅ 승인됨 — 다이아 지급 완료!" },
  "special.rejectedRetry": { en: "❌ Rejected — Apply again", ja: "❌ 却下 — 再申請可", "zh-TW": "❌ 審核失敗 — 點擊重新申請", ko: "❌ 거부됨 — 다시 신청" },

  // ── P0/P1 missing keys ──
  "dashboard.total": { en: "Total", ja: "合計", "zh-TW": "總計", ko: "합계" },
  "dashboard.noMilestones": { en: "No milestones configured yet.", ja: "マイルストーンはまだ設定されていません。", "zh-TW": "尚未設定里程碑。", ko: "아직 마일스톤이 설정되지 않았습니다." },
  "dashboard.views": { en: "views", ja: "視聴", "zh-TW": "觀看", ko: "조회" },
  "dashboard.cr": { en: "cr", ja: "cr", "zh-TW": "積分", ko: "cr" },
  "dashboard.video": { en: "video", ja: "動画", "zh-TW": "影片", ko: "비디오" },
  "dashboard.videos_plural": { en: "videos", ja: "動画", "zh-TW": "影片", ko: "비디오" },

  "profile.username": { en: "Username", ja: "ユーザー名", "zh-TW": "用戶名", ko: "사용자명" },
  "profile.displayName": { en: "Display Name", ja: "表示名", "zh-TW": "顯示名稱", ko: "표시 이름" },
  "profile.credits": { en: "Credits", ja: "クレジット", "zh-TW": "積分", ko: "크레딧" },
  "profile.accountInfo": { en: "Account Info", ja: "アカウント情報", "zh-TW": "帳戶資訊", ko: "계정 정보" },
  "profile.notFound": { en: "Profile not found.", ja: "プロフィールが見つかりません。", "zh-TW": "找不到資料。", ko: "프로필을 찾을 수 없습니다." },
  "profile.playerIdLockedMsg": { en: "Player ID locked:", ja: "プレイヤーIDロック済:", "zh-TW": "玩家ID已鎖定:", ko: "플레이어 ID 잠김:" },
  "profile.playerIdPlaceholder": { en: "e.g., S5HDh2khfrSkZjhVfUiDpW6fwZG3", ja: "例: S5HDh2khfrSkZjhVfUiDpW6fwZG3", "zh-TW": "例如: S5HDh2khfrSkZjhVfUiDpW6fwZG3", ko: "예: S5HDh2khfrSkZjhVfUiDpW6fwZG3" },
  "profile.ytLabel": { en: "YouTube Channel ID / Handle", ja: "YouTubeチャンネルID / ハンドル", "zh-TW": "YouTube頻道ID / 帳號", ko: "YouTube 채널 ID / 핸들" },
  "profile.ytPlaceholder": { en: "e.g., @YourChannel or UCxxxxxxxxxx", ja: "例: @YourChannel または UCxxxxxxxxxx", "zh-TW": "例如: @YourChannel 或 UCxxxxxxxxxx", ko: "예: @YourChannel 또는 UCxxxxxxxxxx" },
  "profile.ytHint": { en: "Bind your channel to enable view count sync. Can be updated anytime.", ja: "チャンネルをバインドして視聴回数同期を有効にします。いつでも更新可能です。", "zh-TW": "綁定頻道以啟用觀看數同步。可隨時更新。", ko: "채널을 바인딩하여 조회수 동기화를 활성화하세요. 언제든지 업데이트 가능합니다." },

  "shop.left": { en: "left", ja: "残り", "zh-TW": "剩餘", ko: "남음" },

  "submit.videoSubmitted": { en: "Video submitted!", ja: "動画が投稿されました！", "zh-TW": "影片已提交！", ko: "비디오가 제출되었습니다!" },
  "submit.status": { en: "Status", ja: "状態", "zh-TW": "狀態", ko: "상태" },
  "submit.unknownTitle": { en: "Unknown title", ja: "不明なタイトル", "zh-TW": "未知標題", ko: "알 수 없는 제목" },
  "submit.unknownChannel": { en: "Unknown channel", ja: "不明なチャンネル", "zh-TW": "未知頻道", ko: "알 수 없는 채널" },
  "submit.autoDetectedMsg": { en: "Auto-detected", ja: "自動検出されました", "zh-TW": "已自動偵測", ko: "자동 감지됨" },
  "submit.fetchFailed": { en: "Failed to fetch video info. Please enter manually.", ja: "動画情報の取得に失敗しました。手動で入力してください。", "zh-TW": "無法獲取影片資訊，請手動輸入。", ko: "비디오 정보를 가져오지 못했습니다. 수동으로 입력하세요." },
  "submit.placeholder": { en: "Auto-detected or enter manually", ja: "自動検出または手動入力", "zh-TW": "自動偵測或手動輸入", ko: "자동 감지 또는 수동 입력" },
  "submit.selectVideo": { en: "Select a video...", ja: "動画を選択...", "zh-TW": "選擇影片...", ko: "비디오 선택..." },
  "submit.followerPlaceholder": { en: "e.g. 5000", ja: "例: 5000", "zh-TW": "例如: 5000", ko: "예: 5000" },
  "submit.notesPlaceholder": { en: "Any additional info for the admin...", ja: "管理者への追加情報...", "zh-TW": "給管理員的補充資訊...", ko: "관리자를 위한 추가 정보..." },

  "special.submitting": { en: "Submitting...", ja: "送信中...", "zh-TW": "提交中...", ko: "제출 중..." },
  "special.applied": { en: "Application submitted successfully!", ja: "申請が送信されました！", "zh-TW": "申請已成功提交！", ko: "신청이 제출되었습니다!" },
  "special.appliedCount": { en: "Applied", ja: "申請済", "zh-TW": "已申請", ko: "신청함" },

  // ── Reward names ──
  "reward.REGISTRATION.name": { en: "Registration Bonus", ja: "登録ボーナス", "zh-TW": "報名獎", ko: "등록 보너스" },
  "reward.PARTICIPATION.name": { en: "Participation Award", ja: "参加賞", "zh-TW": "陽光普照獎", ko: "참여상" },
  "reward.DILIGENCE.name": { en: "Diligence Award", ja: "努力賞", "zh-TW": "勤勤懇懇獎", ko: "근면상" },
  "reward.STAR_CREATOR.name": { en: "Star Creator Award", ja: "スタークリエイター賞", "zh-TW": "明星帳號獎", ko: "스타 크리에이터상" },
  "reward.AI_COMIC.name": { en: "AI Comic Award", ja: "AIコミック賞", "zh-TW": "AI漫劇獎", ko: "AI 코믹상" },

  // ── Scheme selection ──
  "scheme.title": { en: "Choose Your Reward Scheme", ja: "報酬スキームを選択", "zh-TW": "選擇你的獎勵方案", ko: "보상 방식을 선택하세요" },
  "scheme.subtitle": { en: "Before claiming your first milestone reward, choose how you want to receive rewards. This cannot be changed later.", ja: "最初の報酬を受け取る前に、受け取り方法を選択してください。後から変更できません。", "zh-TW": "在領取第一個里程碑獎勵前，請選擇獎勵方式。選定後無法更改。", ko: "첫 마일스톤 보상을 받기 전에 보상 방식을 선택하세요. 나중에 변경할 수 없습니다." },
  "scheme.diamondTitle": { en: "💎 Diamond Rewards", ja: "💎 ダイヤモンド報酬", "zh-TW": "💎 鑽石獎勵", ko: "💎 다이아몬드 보상" },
  "scheme.diamondDesc": { en: "Earn diamonds tracked weekly (Sat–Fri). Admin sends diamonds to your game account. Diamonds are NOT usable in the Reward Shop.", ja: "毎週（土～金）のダイヤモンドを記録。管理者がゲームアカウントに送信します。ショップでは使えません。", "zh-TW": "每週（週六至週五）統計鑽石，管理員手動發放到你的遊戲帳號。鑽石無法在獎勵商店使用。", ko: "매주(토~금) 다이아몬드를 기록합니다. 관리자가 게임 계정으로 보냅니다. 상점에서 사용할 수 없습니다." },
  "scheme.pointsTitle": { en: "🪙 Game Points (Shop)", ja: "🪙 ゲームポイント（ショップ用）", "zh-TW": "🪙 遊戲積分（商店用）", ko: "🪙 게임 포인트 (상점용)" },
  "scheme.pointsDesc": { en: "1 point = $1 USD. Points are credited to your wallet and can be used in the Reward Shop to redeem items.", ja: "1ポイント＝$1。ウォレットにクレジットされ、ショップでアイテムと交換できます。", "zh-TW": "1積分＝1美元。積分會存入錢包，可在獎勵商店兌換商品。", ko: "1포인트 = $1. 지갑에 적립되어 상점에서 아이템을 교환할 수 있습니다." },
};
