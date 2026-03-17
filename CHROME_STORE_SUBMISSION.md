# Ghi Chu Submit Chrome Web Store

Last updated: March 17, 2026

File nay la ban huong dan de ban dien tung o trong dashboard Chrome Web Store, kem theo noi dung co the copy-paste cho listing va `Privacy practices`.

## Huong Dan Dien Tung O

### 1. Tab `Account`

`Publisher name`

- Dien ten publisher ma ban muon hien duoi ten extension.
- Vi du: `Dokaka` hoac ten cong ty cua ban.

`Verify your email`

- Dung email ho tro that, con hoat dong.
- Email nay phai duoc xac minh truoc khi publish.

`Physical address`

- De trong neu ban khong ban tinh nang tra phi, subscription, hoac in-app purchases.

`Trusted tester accounts`

- Khong bat buoc.
- De trong neu ban launch cong khai binh thuong.

### 2. Tab `Package`

`Upload ZIP`

- Upload file ZIP dong goi extension.
- ZIP chi nen chua file can de chay extension.
- Khong dua vao cac thu muc local nhu `.idea`.

### 3. Tab `Store listing`

`Detailed description`

- Neu listing chinh la tieng Anh, paste noi dung trong phan `Detailed Description (EN)`.
- Neu ban tao localized listing tieng Viet, paste noi dung trong phan `Detailed Description (VI)`.

`Category`

- Goi y: `Productivity`.
- Day la khuyen nghi dua tren tinh nang hien tai, khong phai field bat buoc theo mot gia tri co dinh.

`Language`

- Goi y listing chinh: `English`.
- Neu muon, tao them localized listing tieng Viet.

`Store icon`

- Dung [icon128.png](C:/Users/Admin/Desktop/chrome-lock-pro-x-v2/icons/icon128.png).

`Screenshots`

- Upload it nhat 3 anh.
- Goi y:
  - popup hien lock state va quick actions
  - overlay khoa trang yeu cau nhap mat khau
  - options page hien lock policy, unlock scope, whitelist va privacy tools
  - neu muon, them anh phan biometric settings

`Promo video`

- Khong bat buoc cho build nay neu dashboard khong ep.

`Small promo tile`

- Khong bat buoc cho build nay neu dashboard khong ep.

`Marquee promo tile`

- Khong bat buoc.

`Official URL`

- Chi dien neu ban co website publisher that.

`Homepage URL`

- Goi y: trang san pham cong khai hoac trang gioi thieu.
- Neu ban chi dung GitHub Pages de host privacy policy, co the de trong.

`Support URL`

- Goi y: trang support cong khai, issue tracker, hoac contact page.

`Mature content`

- Chon `No`.

### 4. Tab `Privacy`

`Single purpose description`

- Neu listing chinh la tieng Anh, paste `Single Purpose Description (EN)`.
- Neu ban can ban tieng Viet de tham chieu noi bo, xem `Single Purpose Description (VI)`.

`Permissions justification`

- `storage`: dung noi dung trong phan `storage`.
- `tabs`: dung noi dung trong phan `tabs`.
- `alarms`: dung noi dung trong phan `alarms`.
- `idle`: dung noi dung trong phan `idle`.
- `windows`: dung noi dung trong phan `windows`.
- `host_permissions`: dung noi dung trong phan `host_permissions`.

`Remote code`

- Chon `No, I am not using remote code`.

`Website content / browsing activity`

- Neu dashboard hien field nay, chon `Yes`.
- Paste doan trong phan `Suggested Paste For Website Content / Browsing Activity (EN)`.

`Authentication / biometric`

- Neu dashboard hien field nay, chon `Yes`.
- Paste doan trong phan `Suggested Paste For Authentication / Biometric (EN)`.

`Data usage / collected data`

- Dung quy tac sau cho build hien tai:
  - `Website content / web browsing activity`: `Yes`
  - `Authentication information`: `Yes`, vi extension co luu metadata WebAuthn cục bộ
  - `Personally identifiable information`: `No`
  - `Health information`: `No`
  - `Financial and payment information`: `No`
  - `Personal communications`: `No`
  - `Location`: `No`
  - `Web history`: chi chon `Yes` neu wording trong dashboard khop ro rang voi viec extension xu ly URL/log tren trang web; neu dashboard da co field `website content / browsing activity` rieng thi uu tien field do
- Với cac checkbox chung nhan lien quan den viec ban, chia se, su dung du lieu cho muc dich khong lien quan, creditworthiness, lending... thi tra loi theo dung hanh vi hien tai cua build nay, tuc la local-only, khong ban, khong chuyen giao cho ben thu ba.

`Privacy policy URL`

- Dien URL HTTPS cong khai cua privacy policy.
- Neu ban dung GitHub Pages co san trong repo nay, URL se la:
  - `https://dokaka1997.github.io/Chrome_Lock_Pro_X/`

### 5. Tab `Distribution`

`Visibility`

- Goi y launch dau: `Public`.
- Dung `Private` neu ban muon tester vong kin truoc.

`Regions`

- Goi y: `All regions`.

`In-app purchases / paid features`

- Chon `No`.

### 6. Tab `Test instructions`

- Tab nay la optional theo tai lieu cua Chrome.
- Build nay khong can tai khoan restricted de test.
- Paste doan `Reviewer Notes Paste (EN)`.
- Neu field cho paste huong dan dai hon, dung them phan `Reviewer Test Flow`.

### 7. Luc bam submit

`Submit for review`

- Goi y: submit voi deferred publish neu ban muon xem lai listing mot lan nua sau khi duoc approve.
- Neu muon live ngay sau khi duoc duyệt, de che do publish tu dong.

## Noi Dung De Dan Len Dashboard

### Short Description (EN)

Lock regular web pages in Chrome with a password or Windows Hello, auto-lock timers, and per-site privacy tools.

### Detailed Description (EN)

Chrome Lock Pro X helps protect regular web pages in Chrome with a local-only lock overlay.

Use it to lock sensitive tabs, require a password before viewing page content, and control how unlock sessions work across domains. You can also enable optional biometric unlock through your device's platform authenticator, such as Windows Hello, fingerprint, face unlock, or device PIN.

Key features:

- Lock regular `http` and `https` pages with a full-page password overlay
- Optional biometric unlock through WebAuthn platform authenticators
- Auto-lock after idle time, on browser restart, or when Chrome loses focus or is minimized
- Unlock only the current domain or all domains during the current unlock session
- Advanced whitelist rules for allowed sites
- Per-domain profiles for custom lock behavior
- Privacy regions with blur, blackout, and pixelate modes
- Local security logs and privacy-region storage
- Local-only processing with no remote backend

Chrome Lock Pro X is designed for privacy and local control. All lock logic, timer logic, biometric verification flow, whitelist evaluation, and privacy-region features run locally in the browser.

Important limitations:

- This extension protects regular web pages inside Chrome
- It does not protect special browser pages such as `chrome://`
- It is not a replacement for operating-system security or enterprise device management

### Short Description (VI)

Khoa cac trang web thong thuong trong Chrome bang mat khau hoac Windows Hello, co hen gio tu khoa va cong cu rieng tu theo tung trang.

### Detailed Description (VI)

Chrome Lock Pro X giup bao ve cac trang web thong thuong trong Chrome bang overlay khoa chay hoan toan cuc bo.

Ban co the dung extension de khoa cac tab nhay cam, yeu cau nhap mat khau truoc khi xem noi dung trang, va kiem soat cach phien mo khoa hoat dong giua cac domain. Extension cung ho tro mo khoa sinh trac hoc thong qua trinh xac thuc cua thiet bi nhu Windows Hello, van tay, khuon mat hoac ma PIN cua may.

Tinh nang chinh:

- Khoa cac trang `http` va `https` bang overlay mat khau toan trang
- Ho tro mo khoa sinh trac hoc qua WebAuthn platform authenticator
- Tu khoa khi idle, khi khoi dong lai Chrome, khi Chrome mat focus hoac khi cua so bi minimize
- Chon chi mo domain hien tai hoac mo toan bo domain trong cung phien mo khoa
- Whitelist nang cao cho cac website duoc phep bo qua khoa
- Domain profiles de dat chinh sach rieng theo tung website
- Privacy regions voi cac che do blur, blackout va pixelate
- Security logs va du lieu privacy-region duoc luu cuc bo
- Toan bo xu ly chay cuc bo, khong dung backend tu xa

Chrome Lock Pro X duoc thiet ke cho nhu cau rieng tu va kiem soat cuc bo. Toan bo logic khoa, timer, xac minh sinh trac hoc, whitelist, profile va privacy-region deu chay trong trinh duyet.

Gioi han quan trong:

- Extension chi bao ve cac trang web thong thuong trong Chrome
- Extension khong bao ve cac trang dac biet nhu `chrome://`
- Extension khong thay the cho giai phap bao mat he dieu hanh hoac quan ly thiet bi

### Single Purpose Description (EN)

Chrome Lock Pro X protects regular web pages in Chrome by showing a password lock overlay, auto-locking idle sessions, supporting optional biometric unlock through the device's platform authenticator, and letting the user save per-site privacy regions and lock rules.

### Single Purpose Description (VI)

Chrome Lock Pro X bao ve cac trang web thong thuong trong Chrome bang overlay mat khau, tu khoa khi idle, ho tro mo khoa sinh trac hoc thong qua trinh xac thuc cua thiet bi, va cho phep luu privacy regions cung cac lock rules theo tung trang.

## Remote Code

Chrome Lock Pro X does not use remote code.
All executable code is packaged inside the extension bundle shipped to the Chrome Web Store.
The extension does not download, inject, or execute JavaScript from remote servers.

## Giai Trinh Quyen Han

### storage

Used to store the extension's local configuration and security state, including password-derived data, WebAuthn biometric credential metadata, lock timers, whitelist rules, domain profiles, session scope state, privacy regions, logs, and language preference.

### tabs

Used to identify eligible web tabs, send lock and unlock state changes to content scripts, deliver biometric unlock results back to the requesting tab, and operate on the current active page from the popup and background service worker.

### alarms

Used to schedule automatic relock events, including unlock-session expiration and auto-lock timers after configured idle periods.

### idle

Used to detect when the browser becomes idle so the extension can trigger the user-configured auto-lock behavior.

### windows

Used to detect when Chrome loses focus, when browser windows are minimized, and when the biometric popup window is opened so the optional immediate-lock policies and biometric flow can work correctly.

### host_permissions (`http://*/*`, `https://*/*`)

Used so the extension can run on regular web pages, show the lock overlay, restore saved privacy regions for the current site, evaluate whitelist and domain-profile rules against the current URL, enforce per-domain unlock scope, and mask page identity when the user enables that feature.

The extension does not run on special browser pages such as `chrome://`.

## Tom Tat Xu Ly Du Lieu

- All settings and logs are stored locally in `chrome.storage.local`.
- The extension stores optional WebAuthn biometric credential metadata locally, such as a credential ID, public key, algorithm, transports, and registration timestamp.
- The extension does not receive raw fingerprint, face, or device PIN data. Those checks are performed by Chrome and the operating system.
- The extension does not transmit user settings, password material, biometric metadata, logs, or privacy-region data to remote servers.
- The extension does not sell or share collected data with third parties.
- Any export of logs or settings happens only when the user explicitly triggers export.
- Settings export does not include password material or biometric credential material.

## Privacy Practices

Su dung cac cau tra loi sau trong dashboard:

- `Single purpose`: dung `Single Purpose Description (EN)`.
- `Remote code`: chon `No`.
- `Permissions`: dung cac doan trong phan giai trinh quyen han.
- `Website content / browsing activity`: dung doan `Suggested Paste For Website Content / Browsing Activity (EN)`.
- `Authentication / biometric`: dung doan `Suggested Paste For Authentication / Biometric (EN)`.
- `Data usage certification`: chi xac nhan neu listing cuoi cung van khop voi hanh vi local-only cua build nay.

### Suggested Paste For Website Content / Browsing Activity (EN)

This extension runs on regular web pages so it can decide whether a page should be locked, apply whitelist and domain-profile rules, restore privacy regions for the current site, and record local security events. It does not run on special Chrome pages such as `chrome://`.

### Suggested Paste For Authentication / Biometric (EN)

This extension optionally uses WebAuthn with the device's platform authenticator, such as Windows Hello. It stores only credential metadata locally, such as a credential ID and public key, and does not receive raw fingerprint, face, or PIN data.

## Checklist Truoc Khi Submit

- Them email lien he that trong dashboard.
- Xac minh email do.
- Host `PRIVACY_POLICY.md` tai URL HTTPS cong khai.
- Upload it nhat 3 screenshots.
- Dam bao mo ta listing noi ro extension chi chay tren trang `http` / `https` thong thuong va khong bao ve `chrome://`.
- Dam bao khong con placeholder nhu `support@your-domain.example`.

## GitHub Pages

Repo nay da co san ban privacy policy de host bang GitHub Pages tai [docs/index.html](C:/Users/Admin/Desktop/chrome-lock-pro-x-v2/docs/index.html).

Neu ban publish repository len GitHub, dung:

1. `Settings` -> `Pages`
2. `Build and deployment` -> `Deploy from a branch`
3. Branch: `main`
4. Folder: `/docs`

Privacy policy URL se la:

`https://dokaka1997.github.io/Chrome_Lock_Pro_X/`

## Anh Goi Y De Upload

Toi thieu nen co:

1. Popup hien current lock state va quick actions.
2. Overlay khoa trang yeu cau nhap mat khau.
3. Options page hien lock policy, unlock scope, whitelist va privacy tools.
4. Neu muon, them anh biometric settings.

## Huong Dan Reviewer Test

Reviewer co the test theo flow sau:

1. Install extension ban unpacked va mo `Options`.
2. Tao mat khau lan dau.
3. Mo mot trang `https` thong thuong va xac nhan overlay khoa xuat hien.
4. Mo khoa bang mat khau.
5. Neu muon, dang ky biometric unlock bang Windows Hello hoac device PIN trong `Options`.
6. Khoa lai trang va xac nhan co the mo khoa bang nut biometric.
7. Doi `Unlock scope` va xac nhan hanh vi thay doi giua current-domain-only va all-domains-in-session.

### Reviewer Notes Paste (EN)

This extension works only on regular `http` and `https` pages. It does not inject into or protect special browser pages such as `chrome://`. All password, biometric, whitelist, session-scope, and privacy-region logic runs locally in the browser. Optional biometric unlock uses WebAuthn with the platform authenticator, such as Windows Hello or the device PIN.

### Reviewer Notes Paste (VI)

Extension nay chi hoat dong tren cac trang `http` va `https` thong thuong. Extension khong inject vao va khong bao ve cac trang dac biet nhu `chrome://`. Toan bo logic mat khau, sinh trac hoc, whitelist, session-scope va privacy-region deu chay cuc bo trong trinh duyet. Tinh nang biometric unlock su dung WebAuthn voi platform authenticator nhu Windows Hello hoac ma PIN cua thiet bi.

## Notes For Review

Neu Chrome Web Store hoi ve backend hoac server-side, dung cau sau:

"This extension does not rely on a backend service and does not execute server-hosted code. All lock, timer, biometric, whitelist, profile, session-scope, and privacy-region logic runs locally in the browser."
