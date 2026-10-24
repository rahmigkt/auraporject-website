// The upstream helper rewrites TimecodeScale to 1ms. Apply only to our own matching recordings.
export async function fixRecordedDuration(blob,milliseconds){
 if(!blob.type.startsWith('video/webm'))return blob;
 if(!Number.isFinite(milliseconds)||milliseconds<=0||milliseconds>60000||blob.size>80*1024*1024)throw Error('Video süre sınırı aşıldı.');
 const header=new Uint8Array(await blob.slice(0,65536).arrayBuffer()),marker=[0x2a,0xd7,0xb1,0x83,0x0f,0x42,0x40];
 let expected=false;for(let i=0;i<=header.length-marker.length;i++)if(marker.every((b,j)=>header[i+j]===b)){expected=true;break;}
 if(!expected)return blob;
 await import('../vendor/fix-webm-duration/fix-webm-duration.js');
 return window.ysFixWebmDuration(blob,milliseconds,{logger:false});
}
