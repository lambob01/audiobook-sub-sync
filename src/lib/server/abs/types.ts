export interface ABSUser {
  id: string;
  username: string;
  token: string;
  type: 'user' | 'guest';
}

export interface ABSLibrary {
  id: string;
  name: string;
  displayOrder: number;
  icon: string;
  mediaType: 'book' | 'podcast';
}

export interface ABSLibraryItem {
  id: string;
  ino: string;
  libraryId: string;
  media: {
    metadata: {
      title: string;
      authorName?: string;
      narratorName?: string;
      seriesName?: string;
      description?: string;
      genres?: string[];
      publishedYear?: string;
      language?: string;
      duration: number;
      explicit: boolean;
    };
    coverPath?: string;
    tags?: string[];
    numTracks: number;
    tracks: {
      index: number;
      startOffset: number;
      duration: number;
      title?: string;
      contentUrl: string;
      mimeType: string;
      metadata?: { filename?: string };
    }[];
    chapters: {
      id: number;
      start: number;
      end: number;
      title: string;
    }[];
  };
  libraryFiles?: {
    ino: string;
    metadata: {
      filename: string;
      ext: string;
      size: number;
      mtimeMs: number;
    };
  }[];
}

export interface ABSItemExpanded extends ABSLibraryItem {
  progress?: {
    currentTime: number;
    duration: number;
    isFinished: boolean;
    lastUpdate: number;
    ebookProgress?: number;
    ebookLocation?: string;
  };
}

export interface ABSPlaySession {
  id: string;
  userId: string;
  libraryItemId: string;
  currentTime: number;
  timeListened: number;
  duration: number;
  audioTracks: {
    index: number;
    ino?: string;
    startOffset: number;
    duration: number;
    title: string;
    contentUrl: string;
    mimeType: string;
    metadata?: { filename?: string };
  }[];
  chapters: {
    id: number;
    start: number;
    end: number;
    title: string;
  }[];
  startedAt: number;
  updatedAt: number;
}

export interface ABSLibraryResponse {
  results: ABSLibraryItem[];
  total: number;
  limit: number;
  page: number;
}

export interface ABSError {
  error: string;
  status?: number;
}
