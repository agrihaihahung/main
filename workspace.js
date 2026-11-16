/* Bàn làm việc + chuyển màn hình. Phải nạp TRƯỚC app.js (app.js ghi đè #hash khi khởi động). */
(()=>{
const g=id=>document.getElementById(id),body=document.body;

// Mở bằng liên kết cấu hình khách gửi (có #...) → vào thẳng bản vẽ; mở bình thường → Bàn làm việc
body.classList.toggle('home',location.hash.length<=1);

function openQuote(sys){
  if(sys){const s=g('system');s.value=sys;s.dispatchEvent(new Event('change'));}
  body.classList.remove('home');
}
const goHome=()=>{body.classList.add('home');g('viewHome').scrollTop=0;};

// mục "Trượt quay" xổ ra / thu lại; 2 mục con mở thẳng bản vẽ
g('tqToggle').onclick=e=>{
  const open=e.currentTarget.getAttribute('aria-expanded')!=='true';
  e.currentTarget.setAttribute('aria-expanded',open);g('tqSub').hidden=!open;
};
document.querySelectorAll('#tqSub [data-system]').forEach(b=>b.onclick=()=>openQuote(b.dataset.system));
g('homeBtn').onclick=goHome;

/* CẤU HÌNH ĐƯỜNG DẪN: dán địa chỉ triển khai thực tế của từng ứng dụng vào đây */
const APP_URLS={
  qltk:"https://qltk-haihahung.store/",   // QLTK NHÔM
  crm:"http://crm-haihahung.io.vn/",      // CRM NHÔM
  novada:""                               // NOVADA — dán link tại đây
  // https://haihahung.lovable.app (site công ty)
};
document.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>{
  const url=APP_URLS[b.dataset.app];
  if(!url){alert("Bạn chưa cấu hình đường dẫn cho ứng dụng này. Hãy mở file workspace.js và nhập URL trong phần APP_URLS.");return;}
  window.open(url,"_blank","noopener,noreferrer");
});

g('today').textContent="📅 "+new Date().toLocaleDateString("vi-VN",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
})();
