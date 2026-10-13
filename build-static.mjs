import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root=path.dirname(fileURLToPath(import.meta.url));
const publicFiles=['index.html','styles.css','src/app.js','src/phrases.js','src/phrases-ui.js','src/phrases-bank.json','src/phrases-audio.json','src/answer-focus.js','src/spelling-diff.js','src/practice-novelty.js','src/fresh-practice/generator.mjs','src/fresh-practice/catalog.mjs','src/fresh-practice/context.mjs','src/fresh-practice/reading.mjs','src/fresh-practice/cloze.mjs','src/enter-practice.js','src/queue-policy.js','src/custom-sentences.js','src/local-translation.js','src/practice-timer.js','src/practice-time-ui.js','src/sentence-dictation.js','src/sentence-dictation.json','src/review-timing.js','src/correction.js','src/correction-ui.js','src/syllable-correction-manifest.json','src/mastery.js','src/context-audio.js','src/context-audio-manifest.json','src/adaptive.js','src/adaptive-ui.js','src/adaptive-context-bank.json','src/practice-audio-manifest.json','src/engine.js','src/storage.js','src/vocabulary.js','src/vocabulary-data.json','src/supplemental-vocabulary.json','src/memory-hints.json','src/scheduler.js','src/custom-words.js','src/phonics-context-pilot.json','src/audio.js','src/audio-manifest.json','src/dictionary.js','src/interactions.js','dictionary/manifest.json','dictionary/LICENSE.txt'];
const manifest=JSON.parse(await fs.readFile(path.join(root,'src/audio-manifest.json'),'utf8'));
const original=JSON.parse(await fs.readFile(path.join(root,'src/vocabulary-data.json'),'utf8')),supplement=JSON.parse(await fs.readFile(path.join(root,'src/supplemental-vocabulary.json'),'utf8'));
const expected=original.units.flatMap(u=>u.words).map(w=>w.id).concat(supplement.words.map(w=>w.id));
if(!Array.isArray(manifest.entries)||manifest.entries.length!==expected.length||expected.some(id=>!manifest.entries.some(e=>e.wordId===id)))throw new Error('Expected complete audio manifest for every canonical textbook word');
for(const entry of manifest.entries){if(!/^audio\/[a-zA-Z0-9_-]+\.mp3$/.test(entry.file))throw new Error('Invalid audio path');publicFiles.push(entry.file);}
const practiceManifest=JSON.parse(await fs.readFile(path.join(root,'src/practice-audio-manifest.json'),'utf8'));
for(const entry of practiceManifest.entries){if(!/^audio\/context-[a-f0-9]+\.mp3$/.test(entry.file))throw new Error('Invalid practice audio path');publicFiles.push(entry.file);}
const contextManifest=JSON.parse(await fs.readFile(path.join(root,'src/context-audio-manifest.json'),'utf8'));
for(const entry of contextManifest.entries){if(!/^audio\/context-safe-[a-f0-9]+\.mp3$/.test(entry.file))throw new Error('Invalid context sentence audio path');publicFiles.push(entry.file);}
const syllableManifest=JSON.parse(await fs.readFile(path.join(root,'src/syllable-correction-manifest.json'),'utf8'));
for(const file of new Set(syllableManifest.entries.flatMap(e=>e.syllables.map(s=>s.audioFile)))){if(!/^audio\/syllable-[a-zA-Z0-9_-]+\.mp3$/.test(file))throw new Error('Invalid syllable audio path');publicFiles.push(file);}
const sentenceBank=JSON.parse(await fs.readFile(path.join(root,'src/sentence-dictation.json'),'utf8'));
for(const item of sentenceBank.groups.flatMap(g=>g.items)){if(!/^audio\/sentence-dictation-[a-zA-Z0-9_-]+\.mp3$/.test(item.audioFile))throw new Error('Missing or invalid sentence audio');publicFiles.push(item.audioFile);}
const phraseAudio=JSON.parse(await fs.readFile(path.join(root,'src/phrases-audio.json'),'utf8'));for(const file of [...Object.values(phraseAudio.phraseFiles),...Object.values(phraseAudio.exampleFiles)]){if(!/^audio\/collocation-[a-zA-Z0-9_-]+\.mp3$/.test(file))throw new Error('Invalid phrase audio');publicFiles.push(file);}
publicFiles.push('audio/LICENSE.txt');
for(const folder of ['shards','lemmas'])for(const file of await fs.readdir(path.join(root,'dictionary',folder))){if(!/^[a-z_]{1,2}\.json$/.test(file))throw new Error('Invalid dictionary shard');publicFiles.push(`dictionary/${folder}/${file}`);}
for(const relative of publicFiles) {
  const input=path.join(root,relative),output=path.join(root,'dist',relative);
  await fs.mkdir(path.dirname(output),{recursive:true});
  await fs.copyFile(input,output);
  const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
  if(digest(await fs.readFile(input))!==digest(await fs.readFile(output))) throw new Error(`静态文件校验失败：${relative}`);
}
console.log(JSON.stringify({directory:path.join(root,'dist'),count:publicFiles.length,audioFiles:manifest.entries.length,verified:true}));
