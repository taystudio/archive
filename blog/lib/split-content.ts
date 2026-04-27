export type ContentSplit = {
  before: string;
  after: string;
  didSplit: boolean;
};

export function splitContentForMidAd(source: string, minChars = 1200): ContentSplit {
  if (source.length < minChars * 1.6) {
    return { before: source, after: '', didSplit: false };
  }

  const lines = source.split('\n');
  let running = 0;
  let splitIdx = -1;
  let firstCandidate = -1;

  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l.trim())) inFence = !inFence;
    running += l.length + 1;

    if (inFence) continue;
    const isH2 = /^##\s+/.test(l);
    const isParaBreak = l.trim() === '' && i > 0 && lines[i - 1].trim() !== '';

    if (running >= minChars) {
      if (isH2) {
        splitIdx = i;
        break;
      }
      if (isParaBreak && firstCandidate === -1) {
        firstCandidate = i;
      }
    }
  }

  if (splitIdx === -1) splitIdx = firstCandidate;
  if (splitIdx === -1 || splitIdx >= lines.length - 2) {
    return { before: source, after: '', didSplit: false };
  }

  const before = lines.slice(0, splitIdx).join('\n');
  const after = lines.slice(splitIdx).join('\n');
  return { before, after, didSplit: true };
}
