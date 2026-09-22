#!/usr/bin/env node
// scripts/_apply-edit.mjs — exact-match, count-must-be-1 file patcher.
// Usage: node scripts/_apply-edit.mjs <target> <old.txt> <new.txt>
import { readFileSync, writeFileSync } from 'fs';
const [, , target, oldFile, newFile] = process.argv;
if (!target || !oldFile || !newFile) {
  console.error('Usage: node scripts/_apply-edit.mjs <target> <old.txt> <new.txt>');
  process.exit(1);
}
const src = readFileSync(target, 'utf8');
const oldStr = readFileSync(oldFile, 'utf8').replace(/\n$/, '');
const newStr = readFileSync(newFile, 'utf8').replace(/\n$/, '');
const count = src.split(oldStr).length - 1;
if (count !== 1) {
  console.error(`ABORT: anchor found ${count} time(s) in ${target}, expected exactly 1.`);
  process.exit(1);
}
writeFileSync(target, src.split(oldStr).join(newStr));
console.log(`OK: patched ${target} (1 match replaced).`);
