# Chrome Lock Pro X

Chrome Lock Pro X la mot Chrome Extension (Manifest V3) dung de khoa cac trang web thong thuong bang overlay nhap mat khau. Du an nay hoat dong o muc `web content layer`, khong phai o muc he dieu hanh hay process Chrome.

## Tinh nang hien tai

- Khoa tab web bang overlay toan man hinh va mo khoa bang mat khau.
- Thiet lap mat khau lan dau ngay trong extension.
- Hash mat khau bang `PBKDF2 + SHA-256 + random salt`.
- Tu khoa khi mo lai Chrome, khi idle qua thoi gian cau hinh, khi bam panic hotkey, hoac khi toan bo cua so Chrome mat focus neu bat tuy chon do.
- Ho tro `temporary unlock session` voi thoi luong mac dinh hoac chon nhanh khi mo khoa.
- Chong brute-force bang `failed attempts` va `lockout`.
- Ho tro `Advanced Whitelist` theo cac rule:
  - `domain:example.com`
  - `host:app.example.com`
  - `pattern:https://mail.google.com/*`
  - `regex:^https://.*\\.corp\\.com/.*$`
- Ho tro `domain profiles` de override policy theo URL/domain:
  - session mac dinh rieng
  - page relock rieng
  - bypass global lock
  - force-lock / re-auth
  - region mode va mask title/favicon
- Co `privacy regions` tren trang:
  - blur
  - blackout
  - pixelate
  - keo, resize, xoa
  - luu theo domain
- Co `security logs` va `tamper logs`.
- Co popup UI, options page, import/export settings backup va export/clear logs.

## Gioi han ky thuat

Extension nay khong the:

- khoa tuyet doi toan bo ung dung Chrome
- chan nguoi dung vao `chrome://extensions`
- ngan disable hoac uninstall extension tren Chrome binh thuong
- inject vao cac trang dac biet nhu `chrome://*`, `edge://*`, `about:*`

Neu can ngan nguoi dung go extension, ban phai dung moi truong `managed` voi Chrome Enterprise policy nhu `force_installed`.

## Cai dat khi chay local

1. Mo `chrome://extensions`.
2. Bat `Developer mode`.
3. Chon `Load unpacked`.
4. Tro toi thu muc chua `manifest.json`.

## Su dung nhanh

1. Mo popup de xem trang thai lock hien tai.
2. Khi extension chua co mat khau, hoan tat buoc thiet lap mat khau lan dau.
3. Dung `Panic Lock` neu muon khoa ngay lap tuc.
4. Khi tab bi khoa, nhap mat khau tren overlay de mo lai.
5. Vao `Options` de chinh lock policy, whitelist, profiles, privacy tools va logs.

## Settings backup

- Export chi bao gom settings, whitelist, profiles va privacy regions luu theo domain.
- Backup khong bao gom password hash, salt hoac password material khac.

## Quyen dang dung

- `storage`
- `tabs`
- `alarms`
- `idle`
- `windows`
- `host_permissions: http://*/*`
- `host_permissions: https://*/*`

## Ghi chu quan trong

- Anti-remove overlay chi la best-effort o muc web page.
- Security log co the luu URL da duoc chuan hoa o dang `origin + path` de phuc vu audit cuc bo.
- Neu extension bi disable hoac go khoi Chrome thi overlay khong the tiep tuc ton tai.
- Privacy policy mau nam o `PRIVACY_POLICY.md`. Truoc khi submit Chrome Web Store, ban can host policy nay tai mot URL HTTPS cong khai.
- Noi dung copy-paste cho Chrome Web Store `Privacy practices` va checklist submit nam o `CHROME_STORE_SUBMISSION.md`.

## Phu hop cho

- khoa nhanh session lam viec tren web
- bao ve tam thoi tab nhay cam
- che cac vung thong tin rieng tu khi demo hoac chia se man hinh
- workflow privacy/control o muc trinh duyet

## Khong phu hop cho

- thay the giai phap endpoint security hoac device management
- chong nguoi dung co toan quyen tren he dieu hanh
- tao security boundary tuyet doi cho Chrome
