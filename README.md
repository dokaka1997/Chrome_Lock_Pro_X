# Chrome Lock Pro X

Chrome Lock Pro X là Chrome Extension (Manifest V3) dùng để khóa các trang web thông thường bằng overlay mật khẩu, quản lý phiên mở khóa, và thêm các công cụ riêng tư ngay trên trang. Dự án này hoạt động ở mức `web content layer`, không phải ở mức hệ điều hành hay process Chrome.

## Tính năng hiện tại

- Khóa các trang `http` / `https` bằng overlay toàn màn hình và mở khóa bằng mật khẩu.
- Thiết lập mật khẩu lần đầu trong extension. Nếu chưa có mật khẩu, extension mở `Options` để onboarding thay vì khóa toàn bộ web.
- Hash mật khẩu bằng `PBKDF2 + SHA-256 + random salt`.
- Mở khóa bằng sinh trắc học thông qua WebAuthn platform authenticator:
  - Windows Hello
  - vân tay / khuôn mặt
  - mã PIN của thiết bị
- Hỗ trợ cả `ES256` và `RS256` khi đăng ký credential sinh trắc học.
- Hỗ trợ `unlock session` với thời lượng mặc định, chọn nhanh trong popup, và tự khóa lại khi session hết hạn.
- Tính năng `Unlock scope`:
  - chỉ mở domain hiện tại
  - hoặc mở tất cả domain trong cùng phiên mở khóa hiện tại
- Khi chọn mở toàn bộ domain, nhập mật khẩu một lần sẽ áp dụng cho cả tab mới cho đến khi session hết hạn hoặc bị khóa lại.
- Có `page-only unlock` cho profile theo domain khi cần yêu cầu xác thực riêng trên một trang / nhóm trang.
- Tự khóa khi:
  - mở lại Chrome
  - idle quá thời gian cấu hình
  - bấm panic hotkey `Ctrl+Shift+L` / `Cmd+Shift+L`
  - Chrome mất focus nếu bật tùy chọn đó
  - một cửa sổ trình duyệt bị minimize nếu bật tùy chọn đó
- Chống brute-force bằng `failed attempts`, `max attempts`, và `lockout duration`.
- Hỗ trợ `Advanced Whitelist` theo các rule:
  - `domain:example.com`
  - `host:app.example.com`
  - `pattern:https://mail.google.com/*`
  - `regex:^https://.*\\.corp\\.com/.*$`
- Hỗ trợ `domain profiles` để override policy theo URL/domain:
  - phiên mở khóa riêng
  - page unlock riêng
  - bypass global lock
  - force lock
  - re-auth khi truy cập lại
  - chế độ riêng tư riêng
  - mask title / favicon riêng
- Có `privacy regions` trên trang:
  - blur
  - blackout
  - pixelate
  - tạo mới, kéo, resize, xóa
  - lưu theo domain
- Hỗ trợ `default privacy mode` cho region mới.
- Có thể `mask page identity` để ẩn title tab và favicon khi trang đang được bảo vệ. Domain profile có thể ép mode này.
- Popup UI hỗ trợ:
  - xem lock state
  - xem timer / status nhanh
  - panic lock
  - session quick action
  - tạo / xóa privacy regions trên tab hiện tại
- Options page hỗ trợ:
  - đổi mật khẩu
  - đăng ký / xóa sinh trắc học
  - lock policy
  - unlock scope
  - whitelist
  - domain profiles
  - công cụ riêng tư
  - export / import config
  - export / clear logs
- Có `security logs` và `tamper logs`.
- Giao diện đã có nội địa hóa `English` và `Vietnamese`.

## Giới hạn kỹ thuật

Extension này không thể:

- khóa tuyệt đối toàn bộ ứng dụng Chrome
- chặn truy cập `chrome://extensions`
- ngăn disable hoặc uninstall extension trên Chrome thông thường
- inject vào các trang đặc biệt như `chrome://*`, `edge://*`, `about:*`
- đọc dữ liệu vân tay / khuôn mặt gốc từ thiết bị

Nếu cần ngăn người dùng gỡ extension, bạn phải dùng môi trường `managed` với Chrome Enterprise policy như `force_installed`.

## Cài đặt khi chạy local

1. Mở `chrome://extensions`.
2. Bật `Developer mode`.
3. Chọn `Load unpacked`.
4. Trỏ tới thư mục chứa `manifest.json`.
5. Sau mỗi lần sửa code background/content, `Reload` extension để service worker và content scripts nhận bản mới.

## Sử dụng nhanh

1. Mở popup để xem lock state hiện tại và thực hiện `Panic Lock` nếu cần.
2. Nếu extension chưa có mật khẩu, mở `Options` và tạo mật khẩu lần đầu.
3. Khi muốn dùng sinh trắc học, vào `Options` và `Register Fingerprint / Face`.
4. Khi tab bị khóa, nhập mật khẩu hoặc dùng nút sinh trắc học trên overlay để mở khóa.
5. Vào `Options` để chỉnh lock policy, unlock scope, whitelist, profiles, privacy tools và logs.

## Settings backup

- Export bao gồm lock settings, whitelist rules, domain profiles và privacy regions lưu theo domain.
- Backup không bao gồm password hash, salt hay bất kỳ password material nào.
- Backup được xuất / nhập ở dạng JSON.

## Quyền đang dùng

- `storage`
- `tabs`
- `alarms`
- `idle`
- `windows`
- `host_permissions: http://*/*`
- `host_permissions: https://*/*`

## Ghi chú quan trọng

- Overlay anti-remove chỉ là best-effort ở mức web page.
- Mặc định unlock session được giới hạn theo domain. Muốn mở khóa toàn cục cho mọi trang trong cùng session, đổi `Unlock scope` trong `Options`.
- Sinh trắc học được triển khai qua WebAuthn platform authenticator. Extension không nhận raw biometric data, chỉ nhận kết quả xác minh từ Chrome / hệ điều hành.
- Security log có thể lưu URL đã được chuẩn hóa ở dạng `origin + path` để phục vụ audit cục bộ.
- Nếu extension bị disable hoặc gỡ khỏi Chrome thì overlay không thể tiếp tục tồn tại.
- Privacy policy mẫu nằm ở `PRIVACY_POLICY.md`. Trước khi submit Chrome Web Store, bạn cần host policy này tại một URL HTTPS công khai.
- Nội dung copy-paste cho Chrome Web Store `Privacy practices` và checklist submit nằm ở `CHROME_STORE_SUBMISSION.md`.
- Bản HTML sẵn cho GitHub Pages nằm ở `docs/index.html`. Nếu publish repo lên GitHub và bật Pages từ branch `main` + folder `/docs`, URL privacy policy sẽ là `https://<github-username>.github.io/<repo-name>/`.

## Phù hợp cho

- khóa nhanh session làm việc trên web
- bảo vệ tạm thời các tab nhạy cảm
- che vùng thông tin riêng tư khi demo, họp online, hoặc chia sẻ màn hình
- workflow privacy / control ở mức trình duyệt

## Không phù hợp cho

- thay thế giải pháp endpoint security hoặc device management
- chống người dùng có toàn quyền trên hệ điều hành
- tạo security boundary tuyệt đối cho Chrome
