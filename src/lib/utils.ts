// URL validation for YouTube and TikTok
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function extractTikTokId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/v\/(\d+)/,
    /vm\.tiktok\.com\/([\w]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isValidVideoUrl(url: string, platform: string): boolean {
  if (platform === "YOUTUBE") {
    return extractYouTubeId(url) !== null;
  }
  if (platform === "TIKTOK") {
    return extractTikTokId(url) !== null;
  }
  return false;
}

export function isWithinCampaignPeriod(
  uploadTime: Date,
  startTime: Date,
  endTime: Date
): boolean {
  const upload = new Date(uploadTime).getTime();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return upload >= start && upload <= end;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function getPlatformLabel(platform: string): string {
  return platform === "YOUTUBE" ? "YouTube" : "TikTok";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    SYNCED: "bg-blue-100 text-blue-800",
    INELIGIBLE: "bg-gray-100 text-gray-800",
    ELIGIBLE: "bg-green-100 text-green-800",
    EXPORTED: "bg-purple-100 text-purple-800",
    SENT: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

// Shop category detection from gameItemId prefix
const CATEGORY_MAP: Record<string, string> = {
  "10": "Newbie Packs",
  "11": "Limited Time Packs",
  "12": "Diamonds",
  "13": "Passes & Memberships",
  "14": "Level Fund",
  "15": "Clearance Packs",
  "16": "Rebuild",
  "17": "Core Chessboard",
  "18": "Kindling",
  "19": "Exploration & Merchant",
  "20": "Deep Space",
  "21": "Radar Supply",
  "22": "Upgrade Supply",
  "23": "Refine Supply",
};

export function detectCategory(gameItemId: string): string {
  const prefix = gameItemId.substring(0, 2);
  return CATEGORY_MAP[prefix] || "Other";
}

export function getAllCategories(): string[] {
  return [...new Set(Object.values(CATEGORY_MAP))].sort();
}
