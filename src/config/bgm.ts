/** 背景音乐列表（文件位于 public/music/，构建后由 BASE_URL 解析） */
export type BgmTrack = {
  id: string
  /** public 下的路径片段，不含 BASE_URL */
  file: string
  /** 界面展示曲名 */
  title: string
}

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: 'jiu',
    file: 'music/jiu-niunan.mp3',
    title: '「玖」被念存的，和被遗忘的',
  },
  {
    id: 'xunyuan',
    file: 'music/xunyuan.mp3',
    title: '寻愿',
  },
]

export function bgmUrl(track: BgmTrack): string {
  const base = import.meta.env.BASE_URL
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}${track.file}`
}
