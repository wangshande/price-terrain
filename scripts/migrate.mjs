import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);if(args.some(x=>!['--remote'].includes(x)))throw new Error('Only --remote is supported');
const result=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js',import.meta.url)),'d1','migrations','apply','DB',args.includes('--remote')?'--remote':'--local','--config','wrangler.jsonc',...(!args.includes('--remote')?['--persist-to','.wrangler/state']:[])],{stdio:'inherit'});process.exit(result.status??1);
