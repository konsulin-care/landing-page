// scripts/clear-hugo-lock.mjs — reset Hugo build-lock state around the suite.
// A run killed mid-build (test-tool or attempt timeout) orphans its Hugo child,
// which keeps .hugo_build.lock held and makes every later build queue forever.
import fs from 'node:fs';
import path from 'node:path';

function pidsWithComm(comm) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync('/proc'); } catch { return out; } // non-Linux: nothing to reap
  for (const d of entries) {
    if (!/^[0-9]+$/.test(d)) continue;
    try {
      if (fs.readFileSync(`/proc/${d}/comm`, 'utf8').trim() === comm) out.push(Number(d));
    } catch { /* process exited mid-scan */ }
  }
  return out;
}

// 1) Terminate only ORPHANED Hugo processes (reparented to init, ppid 1) — a dev
//    server's Hugo has a live parent and is never touched.
for (const pid of pidsWithComm('hugo')) {
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    const ppid = stat.slice(stat.lastIndexOf(')') + 1).trim().split(' ')[1];
    if (ppid === '1') process.kill(pid, 'SIGKILL');
  } catch { /* raced */ }
}

// 2) Clear the lock file only when no Hugo process remains — never races a live build.
if (pidsWithComm('hugo').length === 0) {
  try { fs.rmSync(path.join(import.meta.dirname, '..', '.hugo_build.lock'), { force: true }); } catch { /* ignore */ }
}
