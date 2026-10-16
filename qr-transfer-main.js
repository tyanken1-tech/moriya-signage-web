(function(){'use strict';var bridge=window.MoriyaSettingsBridge;if(!bridge){return;}
 window.MoriyaQrTransferAdapter={
  export:function(kind,done){if(kind==='settings'){bridge.qrBackup().then(function(text){done(null,{format:'moriya-qr-transfer',version:1,kind:kind,backup:text});},done);}else{var s=bridge.export('all').settings;done(null,{format:'moriya-qr-transfer',version:1,kind:kind,credentials:{switchBot:{token:s.switchBot.token,secret:s.switchBot.secret},icalUrl:s.icalUrl}});}},
  describe:function(value){return value.kind==='settings'?'本家の保存済み設定一式（GitHub接続情報を含む／動画は除外）':'AIU向け認証情報（SwitchBot Token・Secret Key・iCal URL）';},
  apply:function(value,done){try{if(value.kind==='settings'){bridge.restore(value.backup).then(function(){done();},done);return;}var c=value.credentials;if(!c||typeof c!=='object'){throw Error('認証情報が不正です。');}var data=bridge.export('all');if(c.switchBot){data.settings.switchBot=c.switchBot;}if(typeof c.natureRemoToken==='string'){data.settings.natureRemo.token=c.natureRemoToken;}if(c.smartLife){data.settings.smartLife=c.smartLife;}if(typeof c.icalUrl==='string'){data.settings.icalUrl=c.icalUrl;}bridge.apply(data).then(function(){done();},done);}catch(e){done(e);}}
 };
}());
