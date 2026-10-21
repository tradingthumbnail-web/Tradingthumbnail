export type ClickLabPlatformId =
  | 'youtube'
  | 'youtube-shorts'
  | 'instagram'
  | 'reels'
  | 'tiktok'
  | 'twitter';

export interface ClickLabPlatform {
  id: ClickLabPlatformId;
  label: string;
  aspectRatio: string;
  width: number;
  height: number;
}

export const CLICKLAB_PLATFORMS: ClickLabPlatform[] = [
  { id: 'youtube', label: 'YouTube', aspectRatio: '16:9', width: 1280, height: 720 },
  { id: 'youtube-shorts', label: 'YouTube Shorts', aspectRatio: '9:16', width: 1080, height: 1920 },
  { id: 'instagram', label: 'Instagram Feed', aspectRatio: '1:1', width: 1080, height: 1080 },
  { id: 'reels', label: 'Reels', aspectRatio: '9:16', width: 1080, height: 1920 },
  { id: 'tiktok', label: 'TikTok', aspectRatio: '9:16', width: 1080, height: 1920 },
  { id: 'twitter', label: 'X / Twitter', aspectRatio: '16:9', width: 1200, height: 675 },
];
