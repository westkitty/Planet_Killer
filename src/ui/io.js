export function downloadText(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function scenarioHash(json) {
  const bytes = new TextEncoder().encode(json);
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}

export function scenarioFromHash(hash) {
  const token = String(hash || '').replace(/^#scenario=/, '').replaceAll('-','+').replaceAll('_','/');
  if (!token) return null;
  const padded = token + '='.repeat((4 - token.length % 4) % 4);
  const binary = atob(padded), bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function copyShareLink(json) {
  const url = new URL(location.href); url.hash = `scenario=${scenarioHash(json)}`;
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url.toString());
  else {
    const input = document.createElement('textarea'); input.value = url.toString(); document.body.append(input); input.select();
    let copied = false;
    try { copied = document.execCommand('copy'); }
    finally { input.remove(); }
    if (!copied) throw new Error('Clipboard copy failed');
  }
  return url.toString();
}

export async function captureFrame(canvas, metadata, stem = 'planet-killer-frame') {
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Canvas capture failed')), 'image/png'));
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${stem}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  downloadText(`${stem}.json`, JSON.stringify(metadata, null, 2));
}
