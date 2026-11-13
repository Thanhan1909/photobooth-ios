# BloomBooth — Khung của tôi (bản web độc lập)

## Luồng mới
1. Trên tab **Khung ảnh**, phần **Khung của tôi** nằm **trên** 41 mẫu mặc định.
2. Nhấn **Nhập ZIP khung**, chọn file ZIP chứa ảnh ref_01.jpg ... ref_14.jpg.
3. Màn hình hiển thị 14 ảnh xem trước. Bạn **tích chọn** chỉ những khung mình muốn giữ.
4. Nhấn **Lưu khung đã chọn**. Mỗi khung thành một bản ghi riêng trong IndexedDB của trình duyệt.
5. Các khung đã lưu xuất hiện ở trên cùng, có ảnh xem trước và nút **Chọn & chụp** / **Xóa**.
6. Chạm **Chọn & chụp** sẽ mở trình chỉnh sửa theo đúng vị trí và số ô của khung đó; nhấn **Mở camera trong khung**.
7. Mở lại PWA vào ngày hôm sau thì những khung đã lưu vẫn còn (trừ khi xóa dữ liệu website / ứng dụng).

## Lưu trữ và riêng tư
- Dùng **IndexedDB** trên chính iPhone/Chrome, không cần Windows, VPS, máy chủ database.
- ZIP và ảnh chụp **không upload** lên GitHub Pages; xử lý trong trình duyệt.
- Dùng cùng một domain/origin. Safari và PWA cài vào màn hình chính có thể có kho lưu trữ khác nhau trên iOS; nên nhập ZIP ngay trong PWA được cài.
- Nếu xóa dữ liệu website, đổi trình duyệt, hoặc đổi máy, những khung này **không tự đồng bộ**. Giữ ZIP để nhập lại.
- Giữ file ảnh tham khảo Pinterest riêng trên `E:\PhotoBooth\photobooth-ios\mobile\private-frames\`. Thư mục này bị Git ignore và không đóng gói vào site public.

## Phát hành không phụ thuộc laptop
- GitHub Pages xuất bản các tài nguyên PWA từ `dist/iphone`.
- Để bật công khai: `https://github.com/Thanhan1909/photobooth-ios/settings/pages` → Build and deployment → Source → GitHub Actions.
- Sau khi workflow **BloomBooth iPhone PWA (GitHub Pages)** có kết quả Success, dùng `https://thanhan1909.github.io/photobooth-ios/`.
- Trên Safari → Chia sẻ → Thêm vào Màn hình chính; không cần Developer Mode hay IPA.
- PWA dùng camera trên HTTPS và lưu ảnh bằng bảng chia sẻ iOS → Lưu hình ảnh (không thể tự lưu trực tiếp vào Photos như native app).
