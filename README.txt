WEB BÁO GIÁ CỬA v2 — 2 trang A4 (dọc/ngang)

Cấu trúc: index.html · workspace.js (Bàn làm việc + chuyển màn hình) · app.js (form → bản xem trước) · door-drawing.js (engine vẽ) · assets/ (ảnh mặt cắt)
Chạy: giải nén cả thư mục, mở index.html bằng Chrome/Edge, chọn kiểu cửa, bấm In → Save as PDF.

Engine vẽ (door-drawing.js) chạy theo "plan": mỗi cánh là một token
  S< S>  trượt (mũi tên thẳng)   T< T>  trượt quay (chữ V + mũi tên gập, đỉnh V ở phía bản lề)
  W< W>  mở quay (chữ V + tay gạt)   F  cố định
Thêm kiểu cửa mới = thêm 1 dòng vào SYSTEMS trong app.js, ví dụ  {panels:3,plan:['S<','F','S>'],handles:[1]}.
  handles = chỉ số đố giữa hai cánh có tay nắm đôi; fix:true = thêm ô fix phía trên; slim:true = khung mảnh.

Ảnh mặt cắt trang 2 (assets/): {2|4}-{inside|outside}.png ; slim-2-{dir}-{left|right}.png ; slim-4-{dir}.png
Chưa có ảnh cho cửa 1 và 3 cánh nên trang 2 hiện thông báo thay vì ảnh sai.
Ảnh gốc giữ nguyên, không suy kích thước cắt nhôm/kính từ ảnh.

BÀN LÀM VIỆC: mở index.html sẽ vào Bàn làm việc. Cột "CÁC HỆ THỐNG" có mục "Trượt quay" (bấm để xổ/thu) với 2 mục con:
  - Trượt quay            → mở bản vẽ cửa trượt quay 4 cánh
  - Trượt quay slim 1 chiều → mở bản vẽ slim 1 chiều 4 cánh
Trong màn hình bản vẽ có nút "⌂ Bàn làm việc" để quay lại. Liên kết cấu hình (có #...) mở thẳng bản vẽ.
Đường dẫn QLTK / CRM / NOVADA sửa trong APP_URLS ở workspace.js.
