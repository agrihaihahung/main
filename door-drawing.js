/* DOOR DRAWING ENGINE v2 — vẽ mặt đứng theo "plan" (mô tả vai trò từng cánh).
   Token trong plan, từ trái sang phải:
     S< S>  cánh trượt, mũi tên thẳng theo hướng trượt
     T< T>  cánh trượt quay: chữ V + mũi tên gập; chữ V có đỉnh ở phía bản lề (< = trái, > = phải)
     W< W>  cánh mở quay: chữ V + tay gạt, bản lề phía < hoặc >
     F      cánh cố định (không ký hiệu)
   system: {panels, plan | {left,right}, handles:[chỉ số đố giữa 2 cánh], fix, slim, openSide}
   API: DoorDrawing.render({svg,width,height,system}) · DoorDrawing.sectionCandidates({panels,slim,openDir,openSide}) */
(function(g){
'use strict';
const C={frame:'#a5a9a8',edge:'#6d7473',glass:'#b0f5e8',glassEdge:'#6f7877',hi:'#8fdcd0',
  bTop:'#bcc0bf',bBot:'#a0a4a3',bL:'#b2b6b5',bR:'#9fa3a2',bEdge:'#7b8282',
  move:'#2d6cb5',handle:'#141c2b',dim:'#34495e',seam:'#4f5758',text:'#172033'};
const G={vb:{w:800,h:600},fit:{l:90,t:70,w:640,h:450},fixPane:.146,fixTotal:.182,handleY:.61,handleH:.18};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const f=n=>Math.round(n*100)/100;

/* ---------- primitives ---------- */
const rect=(x,y,w,h,fill,stroke=C.edge,sw=1)=>`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line=(x1,y1,x2,y2,stroke=C.edge,sw=1,dash='')=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${sw}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const poly=(pts,fill,stroke=C.edge,sw=1)=>`<polygon points="${pts.map(p=>p.map(f).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;

/* Khung vát mép 45°; glass=null để khung rỗng */
function bevel(x,y,w,h,b,glass){
  let s=rect(x,y,w,h,C.frame);
  const X=x+w,Y=y+h,e=C.bEdge;
  s+=poly([[x,y],[X,y],[X-b,y+b],[x+b,y+b]],C.bTop,e,.6);
  s+=poly([[x,Y],[X,Y],[X-b,Y-b],[x+b,Y-b]],C.bBot,e,.6);
  s+=poly([[x,y],[x+b,y+b],[x+b,Y-b],[x,Y]],C.bL,e,.6);
  s+=poly([[X,y],[X-b,y+b],[X-b,Y-b],[X,Y]],C.bR,e,.6);
  if(glass){
    s+=rect(x+b,y+b,w-2*b,h-2*b,C.glass,C.glassEdge,.8);
    if(w-2*b>8&&h-2*b>8)s+=rect(x+b+2,y+b+2,w-2*b-4,h-2*b-4,'none',C.hi,.4);
  }
  return s;
}

/* ---------- ký hiệu ---------- */
function arrow(cx,cy,len,head,dir){
  const tip=cx+dir*len/2,tail=cx-dir*len/2,hh=head*.68;
  return line(tail,cy,tip-dir*head*.6,cy,C.move,1.3)+poly([[tip,cy],[tip-dir*head,cy-hh],[tip-dir*head,cy+hh]],C.move,C.move,.4);
}
function bentArrow(cx,cy,len,head,dir){
  const vl=len*.5,ys=cy-vl/2,xs=cx-dir*len/2,xe=cx+dir*len/2,hh=head*.68;
  return `<polyline points="${f(xs)},${f(ys)} ${f(xe)},${f(ys)} ${f(xe)},${f(ys+vl-head*.6)}" fill="none" stroke="${C.move}" stroke-width="1.3" stroke-linejoin="round"/>`
    +poly([[xe,ys+vl],[xe-hh,ys+vl-head],[xe+hh,ys+vl-head]],C.move,C.move,.4);
}
function chevron(apexX,farX,top,bot){
  const m=(top+bot)/2;
  return line(farX,top,apexX,m,C.move,1.2)+line(apexX,m,farX,bot,C.move,1.2);
}
function bracket(x0,cy,hw,hh,side){
  const y0=cy-hh/2,ft=Math.max(3,hh*.09),bt=Math.max(2,hw*.32);
  const d=side==='L'
    ?`M${f(x0)} ${f(y0)}H${f(x0+hw)}V${f(y0+ft)}H${f(x0+bt)}V${f(y0+hh-ft)}H${f(x0+hw)}V${f(y0+hh)}H${f(x0)}Z`
    :`M${f(x0+hw)} ${f(y0)}H${f(x0)}V${f(y0+ft)}H${f(x0+hw-bt)}V${f(y0+hh-ft)}H${f(x0)}V${f(y0+hh)}H${f(x0+hw)}Z`;
  return `<path d="${d}" fill="${C.handle}" stroke="${C.handle}" stroke-width=".8" stroke-linejoin="round"/>`;
}
function handlePair(cx,y,h,w,s){
  const hw=Math.min(w*.0154,s*.62),gap=hw*.35,hh=h*G.handleH,cy=y+h*G.handleY;
  return bracket(cx-gap-hw,cy,hw,hh,'L')+bracket(cx+gap,cy,hw,hh,'R');
}
function lever(x,y,h){ // tay gạt cánh mở quay
  const hh=h*.12;
  return `<rect x="${f(x)}" y="${f(y+h*.5-hh/2)}" width="3.4" height="${f(hh)}" rx="1.7" fill="${C.handle}"/>`;
}

/* ---------- cánh cửa theo plan ---------- */
const tok=t=>({role:t[0],dir:t[1]==='>'?1:-1});

function drawLeaves(x,y,w,h,s,plan,handles,open=0){
  const L=plan.map(tok),n=L.length;
  const ov=L.some(l=>l.role==='W')||n<2?0:s;          // cánh trượt chồng lên nhau, cánh quay thì không
  const lw=(w+(n-1)*ov)/n, step=lw-ov;
  const gT=y+s,gB=y+h-s,cy=y+h/2;
  const X=i=>x+i*step+(L[i].role==='S'?L[i].dir*step*open:0); // cánh trượt dịch theo hướng mũi tên
  const gw=lw-2*s,len=Math.min(gw*.4,70),head=Math.min(gw*.12,22);
  let out='',marks='';
  // cánh trượt vẽ sau cùng để đè lên cánh cố định / cánh quay
  const order=L.map((_,i)=>i).sort((a,b)=>((L[a].role==='S')-(L[b].role==='S'))||a-b);
  for(const i of order) out+=bevel(X(i),y,lw,h,s,true);
  for(let b=1;b<n;b++) if(ov&&!open) out+=line(x+b*step+ov/2,y+1,x+b*step+ov/2,y+h-1,C.seam,1);
  L.forEach((l,i)=>{
    const lx=X(i),cx=lx+lw/2;
    if(l.role==='S') marks+=arrow(cx,cy,len,head,l.dir);
    if(l.role==='T'||l.role==='W'){
      const hingeLeft=l.dir<0;
      marks+=hingeLeft?chevron(lx+s+1.5,lx+lw-s/2,gT,gB):chevron(lx+lw-s-1.5,lx+s/2,gT,gB);
      if(l.role==='T') marks+=bentArrow(cx,cy,len,head,l.dir);
      else marks+=lever(hingeLeft?lx+lw-s-7:lx+s+3.6,y,h);
    }
  });
  for(const b of open?[]:handles||[]) if(b>0&&b<n) marks+=handlePair(x+b*step+ov/2,y,h,w,s);
  return {svg:out+marks,mullions:Array.from({length:n-1},(_,i)=>x+(i+1)*step+ov/2)};
}

/* ---------- kích thước ---------- */
const TXT='font-family="Arial,sans-serif" font-size="15" font-weight="700"';
function dimH(x1,x2,y,label){
  return line(x1,y,x2,y,C.dim,1,'3 2')+line(x1,y-5,x1,y+5,C.dim)+line(x2,y-5,x2,y+5,C.dim)
    +`<text x="${f((x1+x2)/2)}" y="${f(y-7)}" text-anchor="middle" ${TXT} fill="${C.text}">${label}</text>`;
}
function dimV(x,y1,y2,label){
  const cy=(y1+y2)/2;
  return line(x,y1,x,y2,C.dim,1,'3 2')+line(x-5,y1,x+5,y1,C.dim)+line(x-5,y2,x+5,y2,C.dim)
    +`<text x="${f(x-8)}" y="${f(cy)}" text-anchor="middle" transform="rotate(-90 ${f(x-8)} ${f(cy)})" ${TXT} fill="${C.text}">${label}</text>`;
}

/* ---------- ô fix phía trên ---------- */
function drawTransom(ix,iy,iw,ih,s,mullions){
  const total=ih*G.fixTotal,pane=ih*G.fixPane,q=Math.max(2.5,s*.2),mw=s*.65;
  let o=rect(ix,iy,iw,total,C.frame);
  const cuts=[ix,...mullions.flatMap(m=>[m-mw/2,m+mw/2]),ix+iw];
  for(let i=0;i<cuts.length;i+=2){
    const px=cuts[i],pw=cuts[i+1]-cuts[i];
    o+=rect(px+q,iy+q,pw-2*q,pane-q,C.glass,C.glassEdge,.8)+rect(px+q+2,iy+q+2,pw-2*q-4,pane-q-4,'none',C.hi,.4);
  }
  const bh=total-pane,ty=iy+pane;
  return o+rect(ix,ty,iw,bh,C.frame)+line(ix,ty+bh*.28,ix+iw,ty+bh*.28,C.bEdge,.7)+line(ix,ty+bh*.5,ix+iw,ty+bh*.5,C.bEdge,.5);
}

/* ---------- render ---------- */
function resolvePlan(sys){
  const p=sys.plan;
  if(Array.isArray(p)) return p;
  if(p&&typeof p==='object') return p[sys.openSide==='right'?'right':'left'];
  return Array.from({length:Number(sys.panels)||2},()=> 'S<');
}
function render({svg,width,height,system,open}){
  open=clamp(+open||0,0,1);
  const w=Math.max(100,+width||2800),h=Math.max(100,+height||2400),sys=system||{};
  const {vb,fit}=G,aspect=w/h;
  let fw=fit.w,fh=fw/aspect;
  if(fh>fit.h){fh=fit.h;fw=fh*aspect;}
  fw=Math.max(70,fw);fh=Math.max(90,fh);
  const x=fit.l+(fit.w-fw)/2,y=fit.t+(fit.h-fh)/2,u=Math.min(fw,fh);
  const t=clamp(u*.016,5,14),s=clamp(u*.028,8,22)*(sys.slim?.62:1);
  const ix=x+t,iy=y+t,iw=fw-2*t,ih=fh-2*t;
  const plan=resolvePlan(sys);

  let out=rect(0,0,vb.w,vb.h,'#fff','none',0)+dimH(x,x+fw,y-18,`${w} mm`)+dimV(x-25,y,y+fh,`${h} mm`)+bevel(x,y,fw,fh,t,null);
  if(sys.fix){
    const tot=ih*G.fixTotal,leaves=drawLeaves(ix,iy+tot,iw,ih-tot,s,plan,sys.handles,open);
    out+=drawTransom(ix,iy,iw,ih,s,leaves.mullions)+leaves.svg;
  } else out+=drawLeaves(ix,iy,iw,ih,s,plan,sys.handles,open).svg;

  const grip=(a,gx,gy,gw,gh,c)=>`<rect data-g="${a}" x="${f(gx)}" y="${f(gy)}" width="${gw}" height="${gh}" rx="4" fill="#2f6fd8" stroke="#fff" stroke-width="1.5" style="cursor:${c}"/>`;
  out+=`<g class="grip">${grip('w',x+fw-4,y+fh/2-18,8,36,'ew-resize')}${grip('h',x+fw/2-18,y+fh-4,36,8,'ns-resize')}</g>`;
  if(svg.dataset)svg.dataset.geo=[x,y,fw,fh].map(f).join();
  svg.setAttribute('viewBox',`0 0 ${vb.w} ${vb.h}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.innerHTML=out;
}

/* ---------- ảnh mặt cắt trang 2 ----------
   Thường : {2|4}-{inside|outside}.png
   Slim 2 : slim-2-{dir}-{left|right}.png     Slim 4: slim-4-{dir}.png
   Trả về danh sách ưu tiên: ảnh đúng cấu hình → ảnh hệ thường tương ứng. */
function sectionCandidates(o){
  const n=Number(o.panels)===4?4:2,dir=o.openDir==='inside'?'inside':'outside',side=o.openSide==='right'?'right':'left';
  const plain=`assets/${n}-${dir}.png`;
  if(!o.slim) return [plain];
  return [`assets/slim-${n}-${dir}${n===2?'-'+side:''}.png`,plain];
}
g.DoorDrawing={render,sectionCandidates,drawLeaves};
})(window);
