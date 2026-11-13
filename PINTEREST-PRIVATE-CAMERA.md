# BloomBooth — Chụp trực tiếp vào 14 khung JPG cá nhân

## Đã triển khai

- 14 hình tham khảo người dùng đã tải từ Pinterest: E:\PhotoBooth\references\pinterest\ref_01.jpg ... ref_14.jpg
- Bản dùng cá nhân (không push lên GitHub): E:\PhotoBooth\photobooth-ios\mobile\private-frames\
- Bảng xem ảnh gốc và từng vùng camera: http://localhost:8085/mobile/private-frames/gallery.html
- ZIP dành cho việc nhập một lần trên iPhone: http://localhost:8085/mobile/private-frames/Pinterest-14-personal-frames.zip
- Bản xem trước PNG ở E:\PhotoBooth\previews\pinterest-original-14-photo-slots.png

## Dùng trên laptop (Windows)

1. Mở http://localhost:8085/mobile/ rồi vào Chỉnh sửa.
2. Bấm Nạp 14 mẫu từ ổ E (trên mạng LAN). Công cụ tải các JPG từ private-frames/ và lưu vào IndexedDB.
3. Trong Thư viện khung cá nhân, chọn một mẫu gốc đã nhập. Ảnh nền, chữ và sticker giữ nguyên.
4. Bấm Mở camera trong khung. Chụp ô 1, ô 2...; camera tự đổi ô.
5. Những ảnh đã chụp chỉ vẽ trong các ô ảnh. Dùng công cụ kéo/thu phóng/góc nghiêng để sửa đúng vị trí.
6. Khi đủ ảnh, bản native iOS có thể tự lưu vào Photos nếu bật checkbox; bản web dùng bảng Chia sẻ.

## Dùng bằng link trên iPhone, độc lập với laptop

1. Bật GitHub Pages cho repository nếu chưa bật: Settings > Pages > Build and deployment > Source GitHub Actions.
2. Mở ứng dụng bằng HTTPS GitHub Pages: https://thanhan1909.github.io/photobooth-ios/ .
3. Khi laptop còn bật và iPhone cùng Wi-Fi, tải ZIP riêng từ link LAN phía trên, lưu vào Files trên iPhone rồi giải nén.
4. Trong trình Chỉnh sửa PWA, chọn Nạp mẫu từ iPhone và chọn các file ref_01.jpg...ref_14.jpg.
5. Các ảnh mẫu sẽ được lưu vào IndexedDB trong phạm vi ứng dụng của URL GitHub Pages, không upload lên GitHub hay VPS.
6. Thêm PWA vào màn hình chính Safari. Sau lần tải đầu và khi cache còn, bạn dùng offline không cần bật laptop.

## Quan trọng

- 14 JPG Pinterest chỉ phục vụ thư viện cá nhân và không nằm trong GitHub, build IPA công khai hoặc Github Pages.
- Bản khung JPG là ảnh phẳng. Các ô đã khoanh là gần đúng, cho phép kéo, thay kích thước và xoay từng ô để khớp.
- Khung vé rạp có người mẫu, người đó chỉ bị thay tại ô ảnh đã chọn; nếu vùng khoanh còn lệch cần căn lại.
- Trên Safari, Web Share phải được người dùng xác nhận khi lưu vào Photos. Không thể âm thầm lưu trực tiếp như bản IPA native.
- IndexedDB có thể bị iOS dọn khi thiếu dung lượng hoặc khi xóa dữ liệu site; nên giữ ZIP gốc để khôi phục.
- Các thiết kế từ Pinterest có thể thuộc quyền tác giả. Không tái phân phối trên trang web công khai nếu chưa có giấy phép.