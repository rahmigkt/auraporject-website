// New converted labels belong to their transformation producer. Legacy records
// without review metadata retain their original Claude ownership.
export function h4Kaynak(r){
 const ureten=r.review?.producer??'Claude';
 if(!['Claude','Codex'].includes(ureten))throw Error('Unknown H4 producer');
 return {id:`yerlesim-kisit:${r.id}`,ureten,dil:r.dil||r.language,durum:r.durum||r.state||{},mesajlar:r.mesajlar,islemler:r.islemler||r.actions||[],grup:r.grup||r.id};
}
