export interface Word {
  t: number;
  d: number;
  text: string;
}

export interface Cue {
  i: number;
  start: number;
  end: number;
  text: string;
  words: Word[];
}

export interface SubtitleTrack {
  id: string;
  source: 'abs' | 'upload';
  label: string;
  offsetMs: number;
  cues: Cue[];
  starts: Float64Array;
  wordLevel: boolean;
}

export interface Chapter {
  id: number;
  start: number;
  end: number;
  title: string;
}
