// Language mapping for file extensions
export const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  go: 'go',
  rs: 'rust',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  txt: 'plaintext',
  asm: 'assembly',
};

export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return LANGUAGE_MAP[ext] || 'plaintext';
};
