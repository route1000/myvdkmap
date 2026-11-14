// Keep disposable tool state inside the checkout without changing the caller's HOME.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const runtime = resolve('.sites-runtime');
process.env.XDG_CONFIG_HOME ??= resolve(runtime, 'config');
process.env.WRANGLER_REGISTRY_PATH ??= resolve(runtime, 'registry');
process.env.WRANGLER_LOG_PATH ??= resolve(runtime, 'wrangler.log');
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';
process.env.WRANGLER_SEND_METRICS ??= 'false';
mkdirSync(process.env.XDG_CONFIG_HOME, {recursive:true});
mkdirSync(process.env.WRANGLER_REGISTRY_PATH, {recursive:true});
