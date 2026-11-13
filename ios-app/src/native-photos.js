'use strict';
import {Capacitor,registerPlugin} from '@capacitor/core';
const Media=registerPlugin('Media');
window.BloomNativePhotos={
  isNative:()=>Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='ios',
  async savePhoto(dataUrl){
    if(!Capacitor.isNativePlatform())throw Error('Native Photos requires an iOS app');
    if(typeof dataUrl!=='string'||!dataUrl.startsWith('data:image/jpeg;base64,')){
      throw Error('Unsupported image encoding');
    }
    const result=await Media.savePhoto({path:dataUrl});
    if(!result||typeof result.identifier!=='string'||!result.identifier){
      throw Error('iOS did not confirm a Photos asset identifier');
    }
    return result.identifier;
  }
};
