// QA-only dependency: use an existing jsdom install without adding it to the Site.
// WORD_GARDEN_JSDOM may point to an absolute jsdom/lib/api.js path.
import {pathToFileURL} from 'node:url';
const dependency=process.env.WORD_GARDEN_JSDOM;
const module=await import(dependency ? pathToFileURL(dependency).href : 'jsdom');
export const {JSDOM,VirtualConsole}=module;
