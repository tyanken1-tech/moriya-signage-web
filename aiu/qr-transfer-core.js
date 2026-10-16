(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports){module.exports=api;}else{root.MoriyaQrTransferCore=api;}}(this,function(){
  'use strict';
  function hash(s){var crc=-1,i,j;for(i=0;i<s.length;i++){crc^=s.charCodeAt(i);for(j=0;j<8;j++){crc=(crc>>>1)^((crc&1)?0xedb88320:0);}}return ('00000000'+((crc^-1)>>>0).toString(16)).slice(-8);}
  function frames(value){var data=JSON.stringify(value), encoded=btoa(unescape(encodeURIComponent(data))), result=[],i,count=Math.ceil(encoded.length/700),id=Date.now().toString(36)+Math.random().toString(36).slice(2,8),sum=hash(encoded);
    if(data.length>65536||count>180){throw Error('設定が大きすぎます。動画や大きなメモを除いてください。');}
    for(i=0;i<count;i++){result.push(['MRQ1',id,count,i,sum,encoded.slice(i*700,(i+1)*700)].join('|'));}return result;
  }
  function Receiver(){this.reset();}
  Receiver.prototype.reset=function(){this.id='';this.parts={};this.count=0;this.received=0;this.sum='';this.created=Date.now();};
  Receiver.prototype.add=function(text){var p=String(text).split('|'),n,index,data='',i,value;
    if(p.length!==6||p[0]!=='MRQ1'||! /^[a-z0-9]{1,40}$/.test(p[1])||! /^[a-f0-9]{8}$/.test(p[4])||! /^[A-Za-z0-9+/=]{1,700}$/.test(p[5])){throw Error('対応する設定QRではありません。');}
    n=Number(p[2]);index=Number(p[3]);if(n%1||index%1||n<1||n>180||index<0||index>=n){throw Error('QRの番号が不正です。');}
    if(Date.now()-this.created>180000){this.reset();}
    if(this.id&&(this.id!==p[1]||this.count!==n||this.sum!==p[4])){throw Error('別の送信が混ざっています。「最初から」を押してください。');}
    this.id=p[1];this.count=n;this.sum=p[4];
    if(this.parts[index]&&this.parts[index]!==p[5]){throw Error('QRデータが一致しません。');}
    if(!this.parts[index]){this.parts[index]=p[5];this.received++;}
    if(this.received===n){for(i=0;i<n;i++){data+=this.parts[i];}if(hash(data)!==this.sum){throw Error('QRデータの検査に失敗しました。');}
      value=JSON.parse(decodeURIComponent(escape(atob(data))));
      if(!value||value.format!=='moriya-qr-transfer'||value.version!==1||! /^(settings|credentials)$/.test(value.kind)){throw Error('対応していない設定形式です。');}
      return {received:n,total:n,value:value};}
    return {received:this.received,total:n};
  };
  return {frames:frames,Receiver:Receiver,hash:hash};
}));
