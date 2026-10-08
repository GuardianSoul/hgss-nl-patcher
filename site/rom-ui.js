/* Menu artwork is read only from the user's verified ROM. No pixels are bundled. */
function ROMUIFactory() {
  'use strict';
  function view(bytes) { return new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength); }
  function file(rom,path) {
    const header=view(rom),fntAt=header.getUint32(0x40,true),fntSize=header.getUint32(0x44,true),fatAt=header.getUint32(0x48,true);
    const fnt=rom.subarray(fntAt,fntAt+fntSize),v=view(fnt),parts=path.split('/');let directory=0;
    for(let part=0;part<parts.length;part++){
      let at=v.getUint32(directory*8,true),id=v.getUint16(directory*8+4,true),found=false;
      while(at<fnt.length){
        const type=fnt[at++];if(!type)break;
        const isDirectory=!!(type&128),length=type&127;
        const name=String.fromCharCode(...fnt.subarray(at,at+length));at+=length;
        const next=isDirectory?v.getUint16(at,true):id++;if(isDirectory)at+=2;
        if(name!==parts[part])continue;
        if(part===parts.length-1){
          if(isDirectory)throw new Error('Expected a ROM file');
          const start=header.getUint32(fatAt+next*8,true),end=header.getUint32(fatAt+next*8+4,true);
          if(start>end||end>rom.length)throw new Error('Invalid ROM file range');
          return rom.subarray(start,end);
        }
        if(!isDirectory)throw new Error('Expected a ROM directory');directory=next-0xf000;found=true;break;
      }
      if(!found)throw new Error('ROM menu archive not found');
    }
  }
  function member(archive,index) {
    const v=view(archive);let at=16,start,end,data;
    if(String.fromCharCode(...archive.subarray(0,4))!=='NARC')throw new Error('Invalid menu archive');
    while(at+8<=archive.length){
      const tag=String.fromCharCode(...archive.subarray(at,at+4)),size=v.getUint32(at+4,true);
      if(size<8||at+size>archive.length)throw new Error('Invalid menu archive chunk');
      if(tag==='BTAF'){
        if(index>=v.getUint16(at+8,true))throw new Error('Menu member missing');
        start=v.getUint32(at+12+index*8,true);end=v.getUint32(at+16+index*8,true);
      }
      if(tag==='GMIF')data=at+8;at+=size;
    }
    if(data===undefined||start===undefined||start>end||data+end>archive.length)throw new Error('Invalid menu member');
    return archive.subarray(data+start,data+end);
  }
  function chunk(bytes,tag) {
    const v=view(bytes);let at=16;
    while(at+8<=bytes.length){
      const size=v.getUint32(at+4,true);
      if(size<8||at+size>bytes.length)break;
      if(String.fromCharCode(...bytes.subarray(at,at+4))===tag)return bytes.subarray(at+8,at+size);
      at+=size;
    }
    throw new Error('Menu graphic chunk missing');
  }
  function menuPixels(rom) {
    const archive=file(rom,'a/0/3/8');
    const chars=chunk(member(archive,0),'RAHC'),palette=chunk(member(archive,25),'TTLP'),cv=view(chars),pv=view(palette);
    if(cv.getUint16(0,true)!==3||cv.getUint16(2,true)!==3||cv.getUint32(4,true)!==3)throw new Error('Unexpected menu geometry');
    const size=cv.getUint32(16,true),offset=cv.getUint32(20,true);
    if(size!==9*32||offset+size>chars.length||palette.length<48)throw new Error('Invalid menu graphic');
    const tiles=chars.subarray(offset,offset+size),pixels=new Uint8ClampedArray(24*24*4);
    for(let tile=0;tile<9;tile++)for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      const value=(tiles[tile*32+y*4+(x>>1)]>>((x&1)*4))&15;
      if(!value)continue;
      const color=pv.getUint16(16+value*2,true),at=(((tile/3|0)*8+y)*24+(tile%3)*8+x)*4;
      pixels[at]=Math.round((color&31)*255/31);pixels[at+1]=Math.round(((color>>5)&31)*255/31);pixels[at+2]=Math.round(((color>>10)&31)*255/31);pixels[at+3]=value?255:0;
    }
    return pixels;
  }
  globalThis.ROMUI={menuPixels};
}
ROMUIFactory();
