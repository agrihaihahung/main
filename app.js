/* UI controller — form → preview. Geometry lives in door-drawing.js */
const $=id=>document.getElementById(id);
const FOUR=['T<','S<','S>','T>'];
const SYSTEMS={
 'sliding-turn-4':    {title:'CỬA ĐI TRƯỢT QUAY 4 CÁNH',type:'4C-N (Trượt quay)',code:'TQ-4C',panels:4,plan:FOUR,handles:[2]},
 'sliding-turn-4-fix':{title:'CỬA ĐI TRƯỢT QUAY 4 CÁNH CÓ Ô FIX',type:'4C-FIX (Trượt quay)',code:'TQ-4C-FIX',panels:4,plan:FOUR,handles:[2],fix:true},
 'sliding-turn-2-fix':{title:'CỬA ĐI TRƯỢT QUAY 2 CÁNH CÓ Ô FIX',type:'2C-FIX (Trượt quay)',code:'TQ-2C-FIX',panels:2,plan:['T<','S<'],handles:[1],fix:true},
 'sliding-2':         {title:'CỬA TRƯỢT QUAY 2 CÁNH',type:'2C (Cửa lùa)',code:'L-2C',panels:2,plan:['T<','S<'],handles:[1]},
 'sliding-3':         {title:'CỬA LÙA 3 CÁNH',type:'3C (Cửa lùa)',code:'L-3C',panels:3,plan:['F','S<','S<'],handles:[2]},
 'slim-oneway-2':     {title:'CỬA ĐI TRƯỢT QUAY SLIM 1 CHIỀU 2 CÁNH',type:'2C Slim (Trượt quay 1 chiều)',code:'TQS-2C',panels:2,plan:{left:['T<','S<'],right:['S>','T>']},handles:[1],oneWay:true,slim:true},
 'slim-oneway-4':     {title:'CỬA ĐI TRƯỢT QUAY SLIM 1 CHIỀU 4 CÁNH',type:'4C Slim (Trượt quay 1 chiều)',code:'TQS-4C',panels:4,plan:FOUR,handles:[2],oneWay:true,slim:true},
 'swing-2':           {title:'CỬA MỞ QUAY 2 CÁNH',type:'2C (Mở quay)',code:'MQ-2C',panels:2,plan:['W<','W>']},
 'swing-1':           {title:'CỬA MỞ QUAY 1 CÁNH',type:'1C (Mở quay)',code:'MQ-1C',panels:1,plan:['W<']}
};
const PREFIX='BẢN VẼ KỸ THUẬT SẢN XUẤT ';
// ô nhập → phần tử hiển thị (chép nguyên văn)
const MIRROR={company:['vCompany','vFooterCompany'],address:['vAddress','vFooterAddress'],brand:['vBrand','p2Brand'],
 profile:['vProfile','p2Profile'],leaf:['vLeaf'],color:['vColor'],lock:['vLock'],glass:['vGlass'],hardware:['vHardware'],
 maker:['vMaker'],notes:['vNotes'],approver:['vApprover']};

const val=id=>$(id).value;
const dims=()=>({w:Math.max(100,+val('width')||2800),h:Math.max(100,+val('height')||2400)});
const state=()=>{
  const sys=SYSTEMS[val('system')],{w,h}=dims(),side=val('openSide')==='right'?'right':'left';
  const dir=val('openingDirection')==='inside'?'inside':'outside';
  const code=`BVSX: ${sys.code}${sys.oneWay?(side==='left'?'-T':'-P'):''}-${w}x${h}`;
  return {sys,w,h,side,dir,code};
};

function setLayout(){
  const land=val('layout')==='landscape';
  document.body.classList.toggle('landscape',land);
  let st=$('pageStyle');
  if(!st){st=document.createElement('style');st.id='pageStyle';document.head.appendChild(st);}
  st.textContent=`@page{size:A4 ${land?'landscape':'portrait'};margin:0}`;
}

function setSectionImage(S){
  const img=$('p2Img'),frame=$('p2Frame');
  const cands=window.DoorDrawing.sectionCandidates({panels:S.sys.panels,slim:S.sys.slim,openDir:S.dir,openSide:S.side});
  // 1 và 3 cánh chưa có ảnh mặt cắt riêng
  const supported=[2,4].includes(S.sys.panels);
  const key=supported?cands.join('|'):'none';
  if(img.dataset.key===key)return;
  img.dataset.key=key;
  frame.classList.toggle('missing',!supported);
  $('imgHint').textContent=supported?'':'Chưa có ảnh mặt cắt cho kiểu cửa này (chỉ có ảnh 2 và 4 cánh).';
  if(!supported){img.removeAttribute('src');return;}
  let k=0;
  img.onload=()=>{$('imgHint').textContent=k>0?`Chưa có ${cands[0]} — đang dùng ảnh tạm ${cands[k]}.`:'';};
  img.onerror=()=>{
    if(k<cands.length-1){img.src=cands[++k];}
    else{frame.classList.add('missing');$('imgHint').textContent=`Không tìm thấy ảnh: ${cands.join(' hoặc ')}`;}
  };
  img.src=cands[0];
}

function update(){
  setLayout();
  const S=state(),{sys}=S;
  $('openSideWrap').hidden=!sys.oneWay;
  $('codeInput').value=S.code;
  window.DoorDrawing.render({svg:$('doorSvg'),width:S.w,height:S.h,system:{...sys,openSide:S.side},open:$('open').value/100});

  for(const [src,targets] of Object.entries(MIRROR)) targets.forEach(t=>$(t).textContent=val(src));
  $('vTitle').textContent=PREFIX+sys.title;
  $('vCode').textContent=S.code;
  $('vWidth').textContent=S.w+' mm';$('vHeight').textContent=S.h+' mm';$('vType').textContent=sys.type;
  $('vProject').textContent='Công trình: '+sys.type+' - Khách hàng';
  const d=val('date');
  if(d){const [y,m,dd]=d.split('-');$('vDate').textContent=`${dd}-${m}-${y}`;}

  // trang 2
  $('p2Company').textContent=val('company')+' - SƠ ĐỒ MẶT CẮT SẢN XUẤT';
  $('p2Dimensions').textContent=`${S.w} × ${S.h} mm`;
  $('p2Title').textContent='BẢN VẼ KỸ THUẬT HỆ CỬA — '+(S.dir==='outside'?'MỞ NGOÀI':'MỞ TRONG')
    +(sys.oneWay?` — MỞ QUA ${S.side==='left'?'TRÁI':'PHẢI'}`:'');
  setSectionImage(S);
  quote(S);saveHash();
}

function resetExample(){
  Object.assign($('system'),{value:'sliding-turn-4'});$('width').value=2800;$('height').value=2400;
  $('brand').value='Kögen';$('profile').value='Hệ TQ-86';$('leaf').value='35 x 86 mm';$('color').value='Ghi Xám';update();
}
$('resetBtn').onclick=resetExample;
$('printBtn').onclick=()=>window.print();
document.querySelectorAll('.controls input,.controls select,.controls textarea').forEach(el=>{
  el.addEventListener('input',update);el.addEventListener('change',update);
});

/* ---- báo giá nhanh: đơn giá do người dùng nhập, không có giá mặc định ---- */
const vnd=n=>Math.round(n).toLocaleString('vi-VN')+' đ';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function calc(S){
  const area=S.w*S.h/1e6,price=+val('price')||0,qty=Math.max(1,+val('qty')||1),sub=area*price*qty;
  return {area,price,qty,sub,vat:sub*(+val('vat')||0)/100};
}
function quote(S){
  const c=calc(S),f=x=>c.price?vnd(x):'—';
  $('qArea').textContent=c.area.toFixed(2)+' m²'+(c.qty>1?` × ${c.qty}`:'');
  $('qSub').textContent=f(c.sub);$('qVat').textContent=f(c.vat);$('qTotal').textContent=f(c.sub+c.vat);
  $('p3Co').textContent=val('company');$('p3Date').textContent=val('date').split('-').reverse().join('-');
}
/* ---- cấu hình nằm trong URL (#...) để gửi cho khách / mở lại ---- */
const fields=()=>[...document.querySelectorAll('.controls input,.controls select,.controls textarea')].filter(e=>e.id&&!e.readOnly);
function saveHash(){
  try{const o={};fields().forEach(e=>o[e.id]=e.value);
    history.replaceState(null,'','#'+btoa(unescape(encodeURIComponent(JSON.stringify(o)))));}catch(e){}
}
try{const o=JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
  fields().forEach(e=>{if(o[e.id]!==undefined)e.value=o[e.id];});}catch(e){} // không có hash hợp lệ thì dùng mặc định
$('linkBtn').onclick=()=>navigator.clipboard.writeText(location.href).then(()=>{$('linkBtn').textContent='Đã sao chép liên kết';setTimeout(()=>$('linkBtn').textContent='Sao chép liên kết cấu hình',1600);});
$('svgBtn').onclick=()=>{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(cleanSvg())],{type:'image/svg+xml'}));
  a.download=state().code.replace(/[^\w-]+/g,'_')+'.svg';a.click();URL.revokeObjectURL(a.href);
};
/* ---- mô phỏng mở cửa ---- */
$('open').addEventListener('input',update);
let anim=0;
$('playBtn').onclick=()=>{
  if(anim){cancelAnimationFrame(anim);anim=0;return;}
  const t0=performance.now(),from=+$('open').value;
  const tick=t=>{const p=((t-t0)/2600+from/200)%1;           // 0→1→0 một vòng 2,6 giây
    $('open').value=Math.round((p<.5?p*2:2-p*2)*100);update();anim=requestAnimationFrame(tick);};
  anim=requestAnimationFrame(tick);
};
// bản in luôn ở trạng thái đóng cửa
let keep=0;
addEventListener('beforeprint',()=>{keep=$('open').value;$('open').value=0;update();});
addEventListener('afterprint',()=>{$('open').value=keep;update();});

const cleanSvg=()=>{const c=$('doorSvg').cloneNode(true);c.querySelectorAll('.grip').forEach(n=>n.remove());return c;};
/* ---- bảng báo giá nhiều cửa (lưu trong trình duyệt) → trang 3 tự sinh ---- */
const KEY='hhh-quote';let items=[];
try{items=JSON.parse(localStorage.getItem(KEY))||[];}catch(e){}
function renderItems(){
  try{localStorage.setItem(KEY,JSON.stringify(items));}catch(e){}
  $('qList').innerHTML=items.map((t,i)=>`<div class="qi"><button data-load="${i}">${i+1}. ${t.w}×${t.h} ×${t.qty} — ${vnd(t.sub+t.vat)}</button><button data-del="${i}" aria-label="Xóa">×</button></div>`).join('')
    +(items.length?'<button class="btn" id="clrBtn" style="margin:8px 0 0;width:100%">Xóa toàn bộ bảng báo giá</button>':'');
  $('p3').hidden=!items.length;
  const T=items.reduce((a,t)=>({sub:a.sub+t.sub,vat:a.vat+t.vat}),{sub:0,vat:0}); // shortcut: 1 trang A4 ≈ 15 hạng mục, nhiều hơn thì tách trang
  $('p3Body').innerHTML='<table class="qt"><tr><th>STT</th><th>Hạng mục</th><th>Kích thước (mm)</th><th class="n">SL</th><th class="n">Diện tích</th><th class="n">Đơn giá</th><th class="n">Thành tiền</th></tr>'
   +items.map((t,i)=>`<tr><td>${i+1}</td><td>${esc(t.desc)}</td><td>${t.w} × ${t.h}</td><td class="n">${t.qty}</td><td class="n">${(t.area*t.qty).toFixed(2)} m²</td><td class="n">${t.price?vnd(t.price):'—'}</td><td class="n">${vnd(t.sub)}</td></tr>`).join('')
   +`<tr class="tt"><td colspan="6">Cộng</td><td class="n">${vnd(T.sub)}</td></tr><tr class="tt"><td colspan="6">VAT</td><td class="n">${vnd(T.vat)}</td></tr><tr class="tt big"><td colspan="6">TỔNG CỘNG</td><td class="n">${vnd(T.sub+T.vat)}</td></tr></table>`;
}
$('addBtn').onclick=()=>{
  const S=state(),cfg={};fields().forEach(e=>cfg[e.id]=e.value);
  items.push({cfg,desc:`${S.sys.title} — ${val('brand')} ${val('profile')}, ${val('color')}, kính ${val('glass')}`,w:S.w,h:S.h,...calc(S)});
  renderItems();
};
$('qList').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.load){Object.entries(items[+b.dataset.load].cfg).forEach(([k,v])=>{if($(k))$(k).value=v;});update();return;}
  if(b.id==='clrBtn')items=[];else items.splice(+b.dataset.del,1);
  renderItems();
};
renderItems();
/* ---- kéo chấm xanh trên bản vẽ để đổi W / H (bước 10 mm) ---- */
(()=>{const svg=$('doorSvg');let d=null;
 svg.addEventListener('pointerdown',e=>{
  const g=e.target.dataset&&e.target.dataset.g;if(!g)return;
  const geo=svg.dataset.geo.split(',').map(Number);
  d={g,x:e.clientX,y:e.clientY,...dims(),fw:geo[2],fh:geo[3],k:svg.getScreenCTM().a};
  svg.setPointerCapture(e.pointerId);e.preventDefault();});
 svg.addEventListener('pointermove',e=>{
  if(!d)return;const snap=v=>Math.min(9990,Math.max(300,Math.round(v/10)*10));
  // khung được căn giữa nên mỗi px kéo ăn ×2 vào kích thước; xấp xỉ khi khung chạm biên vùng vẽ
  if(d.g==='w')$('width').value=snap(d.w+2*(e.clientX-d.x)/d.k*d.w/d.fw);
  else $('height').value=snap(d.h+2*(e.clientY-d.y)/d.k*d.h/d.fh);
  update();});
 svg.addEventListener('pointerup',()=>d=null);svg.addEventListener('pointercancel',()=>d=null);})();
/* ---- ảnh PNG để gửi Zalo ---- */
$('pngBtn').onclick=()=>{
  const c=cleanSvg();c.setAttribute('width',1600);c.setAttribute('height',1200);
  const img=new Image();
  img.onload=()=>{const cv=document.createElement('canvas');cv.width=1600;cv.height=1200;cv.getContext('2d').drawImage(img,0,0);
    cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=state().code.replace(/[^\w-]+/g,'_')+'.png';a.click();URL.revokeObjectURL(a.href);});};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(c));
};
update();
