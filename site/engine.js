/* Original patch engine. No game code, fonts or graphics are embedded. */
function HGNLEngineFactory() {
  'use strict';
  const fail = text => { throw new Error(text); };
  // SHA-256 for private LAN HTTP, where browsers do not expose SubtleCrypto.
  // Processes input blocks directly, without a second ROM-sized allocation.
  function softwareSha256(bytes, onProgress) {
    const k = new Uint32Array([
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ]);
    const h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    const w = new Uint32Array(64);
    const rotate = (x,n) => (x>>>n)|(x<<(32-n));
    function block(input,offset) {
      for(let i=0;i<16;i++){const at=offset+i*4;w[i]=(input[at]<<24)|(input[at+1]<<16)|(input[at+2]<<8)|input[at+3];}
      for(let i=16;i<64;i++){
        const x=w[i-15],y=w[i-2];
        w[i]=w[i-16]+(rotate(x,7)^rotate(x,18)^(x>>>3))+w[i-7]+(rotate(y,17)^rotate(y,19)^(y>>>10));
      }
      let a=h[0]|0,b=h[1]|0,c=h[2]|0,d=h[3]|0,e=h[4]|0,f=h[5]|0,g=h[6]|0,t=h[7]|0;
      for(let i=0;i<64;i++){
        const one=(t+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+k[i]+w[i])|0;
        const two=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))|0;
        t=g;g=f;f=e;e=(d+one)|0;d=c;c=b;b=a;a=(one+two)|0;
      }
      h[0]+=a;h[1]+=b;h[2]+=c;h[3]+=d;h[4]+=e;h[5]+=f;h[6]+=g;h[7]+=t;
    }
    const full=bytes.length-bytes.length%64;
    for(let offset=0;offset<full;offset+=64){
      block(bytes,offset);
      if(onProgress && (offset & 0xfffff)===0)onProgress(offset/bytes.length);
    }
    const tail=new Uint8Array(bytes.length-full<56?64:128);
    tail.set(bytes.subarray(full));tail[bytes.length-full]=0x80;
    const view=new DataView(tail.buffer);
    view.setUint32(tail.length-8,Math.floor(bytes.length/0x20000000));view.setUint32(tail.length-4,(bytes.length*8)>>>0);
    for(let offset=0;offset<tail.length;offset+=64)block(tail,offset);
    if(onProgress)onProgress(1);
    return Array.from(h,b=>b.toString(16).padStart(8,'0')).join('');
  }
  async function sha256(bytes, onProgress) {
    if(globalThis.crypto?.subtle){
      try{
        if(onProgress)onProgress(0);
        const hash=await crypto.subtle.digest('SHA-256',bytes);
        if(onProgress)onProgress(1);
        return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
      }catch(e){/* Local fallback if native crypto is unavailable or rejects. */}
    }
    if(globalThis.HGNLFastSha){try{return await HGNLFastSha.sha256(bytes,onProgress);}catch(e){/* Portable software fallback. */}}
    return softwareSha256(bytes,onProgress);
  }
  async function knownIdentity(bytes,candidates,onProgress){
    if(!globalThis.crypto?.subtle && globalThis.HGNLFastSha && candidates.every(x=>x.sha1)){
      try{const hash=await HGNLFastSha.sha1(bytes,onProgress);const match=candidates.find(x=>x.sha1===hash);if(match)return match;}catch(e){/* Full SHA-256 fallback below. */}
    }
    const hash=await sha256(bytes,onProgress);
    return candidates.find(x=>x.sha256===hash);
  }

  function applyXor(rom, patch) {
    if (!(rom instanceof Uint8Array) || !(patch instanceof Uint8Array)) fail('Ongeldige patchinvoer.');
    if (patch.length < 20 || String.fromCharCode(...patch.subarray(0, 8)) !== 'HGNLXOR1') fail('Dit is geen geldig vertaalpakket.');
    const v = new DataView(patch.buffer, patch.byteOffset, patch.byteLength);
    const source = v.getUint32(8, true), target = v.getUint32(12, true), count = v.getUint32(16, true);
    if (source !== rom.length || source !== target || count > Math.ceil(source / 4096)) fail('De patch past niet bij dit bestand.');
    let pos = 20, end = 0;
    // Validate every range before touching the user's working buffer.
    for (let i = 0; i < count; i++) {
      if (pos + 8 > patch.length) fail('Het vertaalpakket is onvolledig.');
      const offset = v.getUint32(pos, true), length = v.getUint32(pos + 4, true); pos += 8;
      if (!length || length > 4096 || offset < end || offset + length > source || pos + length > patch.length) fail('Ongeldig patchbereik.');
      pos += length; end = offset + length;
    }
    if (pos !== patch.length) fail('Onverwachte gegevens in het vertaalpakket.');
    pos = 20;
    for (let i = 0; i < count; i++) {
      const offset = v.getUint32(pos, true), length = v.getUint32(pos + 4, true); pos += 8;
      for (let j = 0; j < length; j++) rom[offset + j] ^= patch[pos + j];
      pos += length;
    }
    return rom;
  }
  function applyPatch(rom, patch) {
    if (patch.length >= 20 && String.fromCharCode(...patch.subarray(0, 8)) === 'HGNLMAP1') {
      const view = new DataView(patch.buffer, patch.byteOffset, patch.byteLength);
      const source = view.getUint32(8, true), target = view.getUint32(12, true), count = view.getUint32(16, true);
      if (source !== rom.length || source !== target || count > 20000 || 20 + count * 12 + 20 > patch.length) fail('Ongeldige versieomzetting.');
      let pos = 20;
      for (let i = 0; i < count; i++) {
        const dst = view.getUint32(pos, true), src = view.getUint32(pos + 4, true), n = view.getUint32(pos + 8, true); pos += 12;
        if (!n || dst + n > target || src + n > source) fail('Ongeldig kopieerbereik.');
      }
      const output = rom.slice(); pos = 20;
      for (let i = 0; i < count; i++) {
        const dst = view.getUint32(pos, true), src = view.getUint32(pos + 4, true), n = view.getUint32(pos + 8, true); pos += 12;
        output.set(rom.subarray(src, src + n), dst);
      }
      return applyXor(output, patch.subarray(pos));
    }
    return applyXor(rom, patch);
  }
  async function unpack(bytes) {
    if (typeof DecompressionStream === 'undefined') fail('Deze browser kan het vertaalpakket niet uitpakken. Gebruik een recente Chrome, Firefox, Edge of Safari.');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const chunks = []; let total = 0;
    for (const reader = stream.getReader();;) {
      const {value, done} = await reader.read(); if (done) break;
      total += value.length;
      if (total > 140 * 1024 * 1024) { await reader.cancel(); fail('Het vertaalpakket is te groot.'); }
      chunks.push(value);
    }
    const result = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return result;
  }
  async function identify(input, manifest, onProgress) {
    if (input.length < 0x200 || input.length > 134217728) fail('Kies een ongewijzigde HeartGold- of SoulSilver-ROM (.nds).');
    const code = String.fromCharCode(...input.subarray(12, 16));
    if (!/^IP[KG][EFDISJ]$/.test(code)) fail('Dit bestand is geen ondersteunde HeartGold- of SoulSilver-ROM.');
    // Only proven trailing fill bytes can be restored, never missing game data.
    const candidates = manifest.inputs.filter(x => x.size > input.length && input.length >= x.trimEnd && code[2] === (x.game === 'heartgold' ? 'K' : 'G'));
    const groups = new Map();
    for(const candidate of candidates){
      const key=candidate.size+':'+candidate.padding;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(candidate);
    }
    const exact = manifest.inputs.filter(x => x.size === input.length);
    const total=(exact.length?1:0)+groups.size;
    let completed=0;
    const report=fraction=>{if(onProgress)onProgress((completed+fraction)/total);};
    if(exact.length){
      const match=await knownIdentity(input,exact,report);
      if(match)return {rom:input,input:match,trimmed:false};
      completed++;
    }
    // Different regional releases can share the same padding: hash each
    // restored byte sequence once, then compare all applicable identities.
    for(const group of groups.values()){
      const candidate=group[0];
      const full=new Uint8Array(candidate.size);full.fill(candidate.padding);full.set(input);
      const match=await knownIdentity(full,group,report);
      if(match)return {rom:full,input:match,trimmed:true};
      completed++;
    }
    fail('Deze ROM is gewijzigd, beschadigd of een nog niet ondersteunde revisie. De veertien gecontroleerde retail-uitgaven staan bij “Welke versies?”. Er is niets aangepast.');
  }
  function banner(rom) {
    if (rom.length < 0x6c) return null;
    const offset = new DataView(rom.buffer, rom.byteOffset, rom.byteLength).getUint32(0x68, true);
    if (!offset || offset + 0x240 > rom.length) return null;
    const pixels = new Uint8ClampedArray(32 * 32 * 4), v = new DataView(rom.buffer, rom.byteOffset, rom.byteLength);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const tile = (y >> 3) * 4 + (x >> 3), n = (y & 7) * 8 + (x & 7);
      const packed = rom[offset + 0x20 + tile * 32 + (n >> 1)], color = (packed >> ((n & 1) * 4)) & 15;
      const rgb = v.getUint16(offset + 0x220 + color * 2, true), p = (y * 32 + x) * 4;
      pixels[p] = Math.round((rgb & 31) * 255 / 31); pixels[p + 1] = Math.round(((rgb >> 5) & 31) * 255 / 31); pixels[p + 2] = Math.round(((rgb >> 10) & 31) * 255 / 31); pixels[p + 3] = color ? 255 : 0;
    }
    return pixels;
  }
  globalThis.HGNL = {sha256, applyXor, applyPatch, unpack, identify, banner};
}
HGNLEngineFactory();
