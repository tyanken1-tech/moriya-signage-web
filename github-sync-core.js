(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MoriyaGithubCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  const MAX_BYTES = 8 * 1024 * 1024;
  const FILES = { sync: 'signage-sync/current.enc.json', backup: 'signage-sync/backup.enc.json' };
  function base64(bytes) {
    let text = '';
    for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(text);
  }
  function unbase64(text) {
    if (typeof text !== 'string' || text.length > MAX_BYTES * 2 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error('暗号化データの形式が不正です。');
    return Uint8Array.from(atob(text), c => c.charCodeAt(0));
  }
  function config(value) {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value?.repo || '')) throw new Error('リポジトリは owner/repository の形式で入力してください。');
    if (!/^[A-Za-z0-9_-]{16,200}$/.test(value.token || '')) throw new Error('GitHubの専用アクセストークンを入力してください。');
    if (unbase64(value.key).length !== 32) throw new Error('暗号鍵が不正です。');
    return { ...value, repo: value.repo, token: value.token, key: value.key };
  }
  function requireCrypto() {
    if (!globalThis.crypto?.subtle) throw new Error('暗号化にはHTTPSまたはlocalhostが必要です。Androidアプリでも利用できます。');
  }
  function newKey() { requireCrypto(); return base64(crypto.getRandomValues(new Uint8Array(32))); }
  async function keyFor(secret) { requireCrypto(); return crypto.subtle.importKey('raw', unbase64(secret), 'AES-GCM', false, ['encrypt', 'decrypt']); }
  function aad(repo, purpose) { return encoder.encode(`moriya-github-v1:${repo.toLowerCase()}:${purpose}`); }
  async function seal(value, secret, repo, purpose) {
    const text = encoder.encode(JSON.stringify(value));
    if (text.length > MAX_BYTES) throw new Error('設定が8MBを超えています。背景画像を減らすか文章バックアップを利用してください。');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(repo, purpose) }, await keyFor(secret), text);
    return { format: 'moriya-github-encrypted', version: 1, iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext)) };
  }
  async function open(envelope, secret, repo, purpose) {
    if (envelope?.format !== 'moriya-github-encrypted' || envelope.version !== 1 || unbase64(envelope.iv).length !== 12) throw new Error('対応していない暗号化データです。');
    let bytes;
    try { bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(envelope.iv), additionalData: aad(repo, purpose) }, await keyFor(secret), unbase64(envelope.ciphertext)); }
    catch { throw new Error('復号できません。接続用の暗号鍵が違うか、データが破損しています。'); }
    return JSON.parse(decoder.decode(bytes));
  }
  function invite(value) {
    const c = config(value);
    return 'MORIYA-GITHUB-1:' + base64(encoder.encode(JSON.stringify({ repo: c.repo, token: c.token, key: c.key, interval: c.interval || 60,
      scope:c.scope || 'shared',schedulesEnabled:c.schedulesEnabled !== false })));
  }
  function parseInvite(text) {
    const prefix = 'MORIYA-GITHUB-1:';
    if (typeof text !== 'string' || !text.trim().startsWith(prefix) || text.length > 3000) throw new Error('守谷サイネージのGitHub接続コードではありません。');
    return config(JSON.parse(decoder.decode(unbase64(text.trim().slice(prefix.length)))));
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function mergeSettings(base, local, remote) {
    if (!base || base.scope !== remote.scope || local.scope !== remote.scope) throw new Error('同期範囲が変わりました。「親機の設定を取得」で基準を更新してください。');
    const conflicts = [];
    function choose(before, mine, theirs, path) {
      if (!same(before, mine) && !same(mine, theirs)) { conflicts.push(path); return structuredClone(mine); }
      return structuredClone(theirs);
    }
    function merge(before, mine, theirs, path) {
      // Buttons are independent units; their positions are one layout unit.
      if (path === 'natureRemo.panelActions' && [before,mine,theirs].every(Array.isArray)) {
        const map = list => new Map(list.map(item => [item.id, item]));
        const old=map(before), own=map(mine), other=map(theirs);
        const withoutSlot = item => item === undefined ? undefined : Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'slot'));
        const layout = list => Object.fromEntries([...list].sort((a,b)=>a.id.localeCompare(b.id)).map(item => [item.id,item.slot]));
        const slots = choose(layout(before),layout(mine),layout(theirs),path+'.配置');
        const result=[];
        for (const id of new Set([...other.keys(),...own.keys(),...old.keys()])) {
          const item=choose(withoutSlot(old.get(id)),withoutSlot(own.get(id)),withoutSlot(other.get(id)),path+'.'+id);
          if (item !== undefined) result.push({...item,slot:slots[id] ?? own.get(id)?.slot ?? other.get(id)?.slot});
        }
        return result;
      }
      if (path === 'natureRemo.actions' && [before,mine,theirs].every(Array.isArray)) {
        return Array.from({length:Math.max(mine.length,theirs.length)},(_,index)=>choose(before[index],mine[index],theirs[index],path+'.'+index));
      }
      if ([before,mine,theirs].every(plain)) {
        return Object.fromEntries([...new Set([...Object.keys(before),...Object.keys(mine),...Object.keys(theirs)])]
          .filter(key => !['__proto__','prototype','constructor'].includes(key))
          .map(key=>[key,merge(before[key],mine[key],theirs[key],path ? path+'.'+key : key)]).filter(([,value])=>value !== undefined));
      }
      return choose(before,mine,theirs,path);
    }
    return {payload:{scope:remote.scope,settings:merge(base.settings,local.settings,remote.settings,'')},conflicts};
  }
  function scheduleDeviceId(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9-]{1,128}$/.test(value)) throw new Error('予約の端末IDが不正です。');
    return value;
  }
  function scheduleDocument(value, ownerId, now = Date.now()) {
    scheduleDeviceId(ownerId);
    if (value?.ownerId !== ownerId || value?.version !== 1 || !Array.isArray(value.schedules) || !Array.isArray(value.cancelled)) throw new Error('共有予約の形式が不正です。');
    const validId = id => typeof id === 'string' && /^[A-Za-z0-9-]{1,128}$/.test(id);
    const schedules=value.schedules.slice(0,500).filter(item=>validId(item?.id) && ['home','panel'].includes(item.source)
      && Number.isInteger(item.index) && item.index >= 0 && item.index < 36 && Number.isFinite(item.dueAt) && item.dueAt > now && item.dueAt <= now+86400000)
      .map(item=>({id:item.id,source:item.source,index:item.index,dueAt:item.dueAt,label:String(item.label||'家電操作').slice(0,80),
        actionId:typeof item.actionId === 'string' ? item.actionId.slice(0,128) : '',icon:typeof item.icon === 'string' ? item.icon.slice(0,32) : 'power',badge:typeof item.badge === 'string' ? item.badge.slice(0,32) : 'none'}));
    const cancelled=value.cancelled.slice(0,2000).filter(item=>validId(item?.id) && Number.isFinite(item.at) && item.at >= now-7*86400000 && item.at <= now+60000)
      .map(item=>({id:item.id,at:item.at}));
    return {version:1,ownerId,name:String(value.name||'別端末').slice(0,40),schedules,cancelled};
  }
  class Store {
    constructor(value, fetcher = (...args) => globalThis.fetch(...args)) {
      // Browser/WebView fetch requires its Window receiver, not the Store instance.
      this.config = config(value); this.fetcher = fetcher; this.branch = null;
    }
    async request(endpoint, method = 'GET', body, raw = false) {
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await this.fetcher('https://api.github.com/' + endpoint, {
          method, cache: 'no-store', credentials: 'omit', signal: controller.signal,
          headers: { Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', Authorization: 'Bearer ' + this.config.token, 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {})
        });
        if (response.status === 404) return null;
        if (!response.ok) {
          const errors = {401:'GitHubトークンが無効または期限切れです。',403:'GitHubの権限またはAPI制限を確認してください。',409:'別端末で設定が更新されました。再取得してから操作してください。',422:'GitHubに保存できません。Contents権限や競合を確認してください。'};
          throw new Error(errors[response.status] || `GitHub接続エラー（HTTP ${response.status}）`);
        }
        return raw ? await response.text() : await response.json();
      } catch (error) { if (error.name === 'AbortError') throw new Error('GitHub接続がタイムアウトしました。'); throw error; }
      finally { clearTimeout(timeout); }
    }
    async connect() {
      const info = await this.request('repos/' + this.config.repo);
      if (!info) throw new Error('リポジトリが見つかりません。名前とトークンのアクセス対象を確認してください。');
      if (info.private !== true) throw new Error('同期は非公開リポジトリのみ利用できます。');
      this.branch = info.default_branch;
      return info;
    }
    async read(purpose, ref) {
      if (!this.branch) await this.connect();
      if (!FILES[purpose]) throw new Error('用途が不正です。');
      if (ref && !/^[a-f0-9]{40}$/.test(ref)) throw new Error('履歴番号が不正です。');
      const endpoint = `repos/${this.config.repo}/contents/${FILES[purpose]}?ref=${encodeURIComponent(ref || this.branch)}`;
      const result = await this.request(endpoint);
      if (!result) return null;
      const text = result.content ? decoder.decode(unbase64(result.content.replace(/\s/g, ''))) : await this.request(endpoint, 'GET', undefined, true);
      return { sha: result.sha, data: await open(JSON.parse(text), this.config.key, this.config.repo, purpose) };
    }
    async write(purpose, data, sha) {
      if (!this.branch) await this.connect();
      if (!FILES[purpose]) throw new Error('用途が不正です。');
      const envelope = await seal(data, this.config.key, this.config.repo, purpose);
      const result = await this.request(`repos/${this.config.repo}/contents/${FILES[purpose]}`, 'PUT', {
        message: purpose === 'backup' ? 'Update encrypted signage backup' : 'Update encrypted signage settings',
        branch: this.branch, content: base64(encoder.encode(JSON.stringify(envelope))), ...(sha ? { sha } : {})
      });
      if (!result?.content?.sha) throw new Error('GitHubへの保存を確認できませんでした。');
      return result.content.sha;
    }
    async history(page = 1) {
      if (!this.branch) await this.connect();
      const list = await this.request(`repos/${this.config.repo}/commits?path=${FILES.backup}&sha=${encodeURIComponent(this.branch)}&per_page=20&page=${page}`);
      return (list || []).map(item => ({ sha: item.sha, date: item.commit?.committer?.date || '' }));
    }
    async listSchedules() {
      if (!this.branch) await this.connect();
      const items=await this.request(`repos/${this.config.repo}/contents/signage-sync/schedules?ref=${encodeURIComponent(this.branch)}`);
      return (Array.isArray(items)?items:[]).filter(item=>item.type==='file' && /^[A-Za-z0-9-]{1,128}\.enc\.json$/.test(item.name))
        .map(item=>({ownerId:item.name.slice(0,-9),sha:item.sha}));
    }
    async readSchedules(ownerId) {
      if (!this.branch) await this.connect();
      const result=await this.request(`repos/${this.config.repo}/contents/signage-sync/schedules/${scheduleDeviceId(ownerId)}.enc.json?ref=${encodeURIComponent(this.branch)}`);
      if (!result) return null;
      const envelope=JSON.parse(decoder.decode(unbase64(result.content.replace(/\s/g,''))));
      return {sha:result.sha,data:scheduleDocument(await open(envelope,this.config.key,this.config.repo,'schedules:'+ownerId),ownerId)};
    }
    async writeSchedules(ownerId, value, sha) {
      if (!this.branch) await this.connect();
      const data=scheduleDocument(value,scheduleDeviceId(ownerId));
      const envelope=await seal(data,this.config.key,this.config.repo,'schedules:'+ownerId);
      const result=await this.request(`repos/${this.config.repo}/contents/signage-sync/schedules/${ownerId}.enc.json`,'PUT',{
        message:'Update encrypted appliance schedules',branch:this.branch,content:base64(encoder.encode(JSON.stringify(envelope))),...(sha?{sha}:{})
      });
      if(!result?.content?.sha)throw new Error('予約の共有を確認できませんでした。');
      return result.content.sha;
    }
  }
  return { config, newKey, seal, open, invite, parseInvite, mergeSettings, scheduleDocument, scheduleDeviceId, Store, FILES };
});
