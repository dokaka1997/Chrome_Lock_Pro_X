(function initClpxI18n(globalScope) {
  const STORAGE_KEY = 'uiLanguage';
  const SUPPORTED_LANGUAGES = ['en', 'vi'];
  const listeners = new Set();

  const messages = {
    en: {
      'common.language.switch': 'Switch language',
      'common.language.short.en': 'EN',
      'common.language.short.vi': 'VI',
      'common.mode.blur': 'Blur',
      'common.mode.blackout': 'Blackout',
      'common.mode.pixelate': 'Pixelate',
      'common.mode.lower.blur': 'blur',
      'common.mode.lower.blackout': 'blackout',
      'common.mode.lower.pixelate': 'pixelate',
      'common.status.on': 'On',
      'common.status.off': 'Off',
      'common.status.locked': 'Locked',
      'common.status.open': 'Open',
      'common.status.setup': 'Setup',
      'common.action.remove': 'Remove',
      'common.action.test_rule': 'Test Rule',
      'common.action.save_settings': 'Save Settings',
      'common.action.export_logs': 'Export Logs JSON',
      'common.action.clear_logs': 'Clear Logs',
      'common.action.export_config': 'Export Config JSON',
      'common.action.import_config': 'Import Config JSON',
      'common.action.panic_lock': 'Panic Lock',
      'common.action.panic_lock_now': 'Panic Lock Now',
      'common.action.open_settings': 'Open Settings',
      'common.action.change_password': 'Change Password',
      'common.action.create_password': 'Create Password',
      'common.action.add_profile': 'Add Profile',
      'common.action.new_region': 'New Region',
      'common.action.clear_regions': 'Clear Regions',
      'common.action.unlock_on_page': 'Unlock on Page',
      'common.action.keep_open': 'Keep Open',
      'common.action.session_15m': '15m Session',
      'common.action.unlock': 'Unlock',
      'common.action.setup_and_unlock': 'Set Up and Unlock',
      'common.label.default': 'Default',
      'common.label.unlimited': 'Unlimited',
      'common.label.default_session': 'Default session',
      'common.label.whitelist': 'Whitelist',
      'common.label.attempts': 'Attempts',
      'common.label.auto_lock': 'Auto-lock',
      'common.label.session': 'Session',
      'common.label.blur_lock': 'Blur lock',
      'common.label.blur_zones': 'Blur zones',
      'common.label.privacy_mode': 'Privacy mode',
      'common.label.logs': 'Logs',
      'common.label.minutes_short': 'min',
      'common.label.entries': '{{count}} entries',
      'common.note.default_hotkey': 'Default hotkey:',
      'common.session.indefinite': 'indefinite',
      'common.session.until_locked': 'Until locked again',
      'common.rule_test.no_match': 'No whitelist rule matched this URL.',
      'common.rule_test.invalid_url': 'Invalid URL.',
      'common.rule_test.enter_url': 'Enter a URL to test.',
      'common.rule_test.http_only': 'Only http/https URLs are supported here.',
      'common.rule_test.special_page': 'Special pages such as chrome:// or extension pages cannot run the content script.',
      'common.rule_test.matched': 'Matched rule: {{rule}}',
      'common.no_logs': 'No logs yet',
      'common.no_logs_sub': 'Unlock events, failed attempts, tamper signals, and settings changes will appear here.',
      'popup.document_title': 'Chrome Lock Pro X',
      'popup.hero.loading_title': 'Loading status...',
      'popup.hero.loading_text': 'Reading lock state, session timer, and current policy.',
      'popup.hero.setup_title': 'Password setup required',
      'popup.hero.setup_text': 'Open a normal web page or Settings to create the first password.',
      'popup.hero.locked_title': 'Browser locked',
      'popup.hero.unlocked_title': 'Browser unlocked',
      'popup.hero.locked_text': 'Tabs outside the whitelist need a password.',
      'popup.hero.relock_text': 'Session will relock after {{time}}.',
      'popup.hero.open_text': 'Browser stays open until you lock it again or a policy triggers.',
      'popup.tool.saved_by_domain': 'Privacy regions are saved per domain for the current tab.',
      'popup.tool.default_region_label': 'New region default',
      'popup.tool.selection_active': 'Selection mode active. Drag on the page to create a privacy region or press Escape to cancel.',
      'popup.tool.profile_override': 'Profile "{{name}}" overrides this tab with {{mode}} mode{{masked}}',
      'popup.tool.profile_policy': 'Profile "{{name}}" active: {{policies}}. Mode: {{mode}}{{masked}}',
      'popup.tool.profile_flag.force_lock': 'force-lock',
      'popup.tool.profile_flag.reauth': 're-auth on visit',
      'popup.tool.profile_flag.bypass': 'bypass global lock',
      'popup.tool.profile_flag.page_unlock': 'page relock {{minutes}}',
      'popup.tool.profile_flag.page_unlock_indefinite': 'page relock indefinite',
      'popup.tool.profile_flag.default_session': 'default session {{minutes}}',
      'popup.tool.profile_flag.masked': 'masked identity',
      'popup.tool.regions_present': 'This tab has {{count}} privacy region(s). Active mode: {{mode}}{{masked}}',
      'popup.tool.default_mode': 'Default mode: {{defaultMode}}. Current page mode: {{activeMode}}{{masked}}',
      'popup.tool.masked_suffix': ' and masked title/favicon.',
      'popup.tool.period': '.',
      'popup.error.no_tab': 'Could not find the active tab.',
      'popup.error.no_response': 'The tab did not respond.',
      'popup.error.unsupported_page': 'This tab does not support the content script. It only works on normal web pages.',
      'popup.error.selection_mode': 'Could not start selection mode.',
      'popup.error.clear_regions': 'Could not clear privacy regions.',
      'popup.error.privacy_state': 'Could not read privacy state.',
      'popup.error.default_mode': 'Could not change the default mode.',
      'popup.session.note.setup': 'Finish password setup before temporary sessions or privacy tools.',
      'popup.session.note.locked': 'Default session: {{session}}.',
      'popup.session.note.timer': 'Blur lock: {{blurLock}}. Click "Keep Open" to clear the timer.',
      'popup.session.note.default': 'Default session: {{session}}. Blur lock: {{blurLock}}.',
      'options.document_title': 'Chrome Lock Pro X Settings',
      'options.hero.title': 'Security Console',
      'options.hero.text': 'Control session unlock timers, blur lock, whitelist rules, privacy tools, and backups.',
      'options.hero.pill': 'PBKDF2 + Salt',
      'options.password.initial_title': 'Initial Password Setup',
      'options.password.change_title': 'Change Password',
      'options.password.old_label': 'Current Password',
      'options.password.new_label': 'New Password',
      'options.password.confirm_label': 'Confirm New Password',
      'options.password.initial_hint': 'No password is configured yet. Create one to finish first-run setup.',
      'options.password.error.short': 'New password must be at least 6 characters.',
      'options.password.error.mismatch': 'Password confirmation does not match.',
      'options.password.error.update_failed': 'Could not update the password.',
      'options.password.success.initial': 'Initial password created successfully.',
      'options.password.success.changed': 'Password changed successfully.',
      'options.policy.title': 'Lock Policy',
      'options.policy.auto_lock_label': 'Idle minutes before locking',
      'options.policy.default_session_label': 'Default unlock session',
      'options.policy.default_session_hint': 'Set 0 to stay unlocked until you lock again.',
      'options.policy.max_attempts_label': 'Maximum failed attempts',
      'options.policy.lockout_minutes_label': 'Lockout duration (minutes)',
      'options.policy.blur_lock_toggle': 'Lock immediately when Chrome loses focus or when a browser window is minimized',
      'options.policy.domain_reauth_toggle': 'Require the password again when switching to a new domain',
      'options.policy.close_on_lockout_toggle': 'Close all Chrome windows when lockout is triggered by too many failed attempts',
      'options.privacy.title': 'Privacy Tools',
      'options.privacy.help': 'Set the default mode for new regions, mask the tab title/favicon, and create per-domain profiles.',
      'options.privacy.default_mode_label': 'Default privacy mode',
      'options.privacy.mask_identity_toggle': 'Mask the tab title and favicon while a locked page is protected. Domain profiles can force this even when unlocked.',
      'options.privacy.profile_help': 'Domain profiles are matched from top to bottom. The first matching rule wins.',
      'options.profile.empty_title': 'No domain profiles yet',
      'options.profile.empty_text': 'Add a profile if you want a domain to use a different session duration, region mode, or title masking rule.',
      'options.profile.title': 'Profile {{index}}',
      'options.profile.name_label': 'Profile name',
      'options.profile.match_label': 'Match rule',
      'options.profile.session_label': 'Default session minutes',
      'options.profile.session_placeholder': 'blank = global default',
      'options.profile.page_unlock_label': 'Page relock minutes',
      'options.profile.page_unlock_placeholder': 'blank = use profile/global session',
      'options.profile.mode_label': 'Region mode',
      'options.profile.mask_label': 'Always mask this tab title and favicon on matching pages',
      'options.profile.bypass_label': 'Bypass the global browser lock on matching pages',
      'options.profile.force_lock_label': 'Always force this page to re-authenticate',
      'options.profile.reauth_label': 'Require re-auth each time this page/domain is visited',
      'options.whitelist.title': 'Enterprise Whitelist',
      'options.whitelist.help': 'Supported formats, one rule per line:',
      'options.whitelist.rule.domain': 'to allow all subdomains.',
      'options.whitelist.rule.host': 'for an exact hostname match.',
      'options.whitelist.rule.pattern': 'for wildcard matching.',
      'options.whitelist.rule.regex': 'for regular expressions.',
      'options.whitelist.test_placeholder': 'Paste a URL to test which rule matches',
      'options.backup.title': 'Config Backup',
      'options.backup.muted': 'Export includes the current password hash and privacy regions saved by domain.',
      'options.logs.title': 'Unlock / Security Logs',
      'options.messages.settings_saved': 'Settings saved. Default session: {{session}}. Profiles: {{profiles}}.',
      'options.messages.config_exported': 'Config exported.',
      'options.messages.config_imported': 'Config imported.',
      'options.messages.logs_cleared': 'Logs cleared.',
      'options.messages.panic_lock': 'Panic lock triggered.',
      'options.messages.invalid_rule': 'Invalid whitelist rule: {{rule}}',
      'options.messages.invalid_profile_rule': 'Invalid profile match rule: {{rule}}',
      'options.messages.save_failed': 'Could not save the settings.',
      'options.messages.config_export_failed': 'Could not export config.',
      'options.messages.config_import_failed': 'Could not import config.',
      'options.messages.invalid_json': 'Invalid JSON file.',
      'content.page_mask_title': 'Private Session',
      'content.selection.unsupported_page': 'This page does not support privacy regions.',
      'content.selection.locked_page': 'Cannot create a privacy region while the tab is locked.',
      'content.selection.already_active': 'Selection mode is already active. Press Escape to cancel it.',
      'content.selection.hint': 'Drag to create a {{mode}} region. Press Escape to cancel.',
      'content.overlay.chip.product': 'Chrome Lock Pro X',
      'content.overlay.chip.protected': 'Protected Session',
      'content.overlay.title.locked': 'Browser is locked',
      'content.overlay.subtitle.locked': 'Enter your password to continue. The overlay will restore itself if the page tries to remove it.',
      'content.overlay.title.profile': 'Protected page',
      'content.overlay.subtitle.profile': 'This page is protected by profile "{{name}}". Enter your password to continue.',
      'content.overlay.title.setup': 'Set up your password',
      'content.overlay.subtitle.setup': 'No password has been created yet. Create one now to start using the extension.',
      'content.overlay.input.password': 'Enter password',
      'content.overlay.input.new_password': 'Create new password',
      'content.overlay.input.confirm_password': 'Confirm new password',
      'content.overlay.session_label': 'Unlock duration',
      'content.overlay.session_note.default': 'Selected: use default ({{session}}).',
      'content.overlay.session_note.unlimited': 'Selected: keep unlocked until you lock again.',
      'content.overlay.session_note.minutes': 'Selected: unlock for {{minutes}} minutes.',
      'content.overlay.button.unlock': 'Unlock',
      'content.overlay.button.setup': 'Set Up and Unlock',
      'content.overlay.setup_note': 'After setup, this tab will unlock immediately using the session option you selected.',
      'content.overlay.hint': 'Emergency hotkey: Ctrl+Shift+L / Cmd+Shift+L',
      'content.overlay.lockout': 'Too many failed attempts. Try again in {{time}}.',
      'content.overlay.error.short_password': 'New password must be at least 6 characters.',
      'content.overlay.error.mismatch': 'Password confirmation does not match.',
      'content.overlay.error.setup_failed': 'Could not create the password.',
      'content.overlay.error.unlock_failed': 'Could not unlock.',
      'content.overlay.error.no_response': 'The extension did not respond.',
      'content.overlay.error.try_after': '{{error}} Try again in {{time}}.',
      'content.overlay.error.failed_attempts': '{{error}} Failed attempts: {{attempts}}/{{maxAttempts}}.',
      'content.overlay.button.waiting': 'Please wait...',
      'content.region.mode_switch': 'Switch privacy mode',
      'content.region.remove': 'Remove privacy region',
      'content.region.resize': 'Resize privacy region',
      'content.region.save_failed': 'Could not save privacy regions.',
      'background.error.must_unlock_first': 'Browser is locked. Unlock it first.',
      'background.error.invalid_config_file': 'The config file is invalid.',
      'background.error.missing_credentials': 'passwordHash or passwordSalt is missing from the config.',
      'background.error.no_import_fields': 'No importable config fields were found.',
      'background.error.current_domain_unknown': 'Could not resolve the current tab domain.',
      'background.error.password_already_setup': 'The password has already been set.',
      'background.error.password_too_short': 'New password must be at least 6 characters.',
      'background.error.first_setup_required': 'You need to complete the first password setup first.',
      'background.error.old_password_wrong': 'The current password is incorrect.',
      'background.error.first_setup_before_unlock': 'You need to complete the first password setup before unlocking.',
      'background.error.temp_locked': 'Too many failed attempts. The extension is temporarily locked.',
      'background.error.wrong_password': 'Incorrect password.',
      'background.error.lockout_activated': 'Too many failed attempts. Temporary lockout activated.',
      'background.error.unknown_message': 'Unknown message type.',
      'background.error.unexpected': 'Unexpected error.'
    },
    vi: {
      'common.language.switch': 'Đổi ngôn ngữ',
      'common.language.short.en': 'EN',
      'common.language.short.vi': 'VI',
      'common.mode.blur': 'Làm mờ',
      'common.mode.blackout': 'Che đen',
      'common.mode.pixelate': 'Pixelate',
      'common.mode.lower.blur': 'làm mờ',
      'common.mode.lower.blackout': 'che đen',
      'common.mode.lower.pixelate': 'pixelate',
      'common.status.on': 'Bật',
      'common.status.off': 'Tắt',
      'common.status.locked': 'Đã khóa',
      'common.status.open': 'Đang mở',
      'common.status.setup': 'Thiết lập',
      'common.action.remove': 'Xóa',
      'common.action.test_rule': 'Kiểm tra rule',
      'common.action.save_settings': 'Lưu cài đặt',
      'common.action.export_logs': 'Xuất logs JSON',
      'common.action.clear_logs': 'Xóa logs',
      'common.action.export_config': 'Xuất config JSON',
      'common.action.import_config': 'Nhập config JSON',
      'common.action.panic_lock': 'Panic Lock',
      'common.action.panic_lock_now': 'Khóa ngay',
      'common.action.open_settings': 'Mở cài đặt',
      'common.action.change_password': 'Đổi mật khẩu',
      'common.action.create_password': 'Tạo mật khẩu',
      'common.action.add_profile': 'Thêm profile',
      'common.action.new_region': 'Tạo vùng mới',
      'common.action.clear_regions': 'Xóa các vùng',
      'common.action.unlock_on_page': 'Mở khóa trên trang',
      'common.action.keep_open': 'Giữ mở',
      'common.action.session_15m': 'Phiên 15 phút',
      'common.action.unlock': 'Mở khóa',
      'common.action.setup_and_unlock': 'Thiết lập và mở khóa',
      'common.label.default': 'Mặc định',
      'common.label.unlimited': 'Không giới hạn',
      'common.label.default_session': 'Phiên mặc định',
      'common.label.whitelist': 'Whitelist',
      'common.label.attempts': 'Lần thử',
      'common.label.auto_lock': 'Tự khóa',
      'common.label.session': 'Phiên',
      'common.label.blur_lock': 'Khóa khi mất focus',
      'common.label.blur_zones': 'Vùng làm mờ',
      'common.label.privacy_mode': 'Chế độ riêng tư',
      'common.label.logs': 'Logs',
      'common.label.minutes_short': 'phút',
      'common.label.entries': '{{count}} mục',
      'common.note.default_hotkey': 'Hotkey mặc định:',
      'common.session.indefinite': 'không giới hạn',
      'common.session.until_locked': 'Cho đến khi bạn khóa lại',
      'common.rule_test.no_match': 'Không có rule whitelist nào khớp URL này.',
      'common.rule_test.invalid_url': 'URL không hợp lệ.',
      'common.rule_test.enter_url': 'Hãy nhập URL để kiểm tra.',
      'common.rule_test.http_only': 'Chỉ hỗ trợ URL http/https.',
      'common.rule_test.special_page': 'Các trang đặc biệt như chrome:// hoặc extension page không thể chạy content script.',
      'common.rule_test.matched': 'Rule khớp: {{rule}}',
      'common.no_logs': 'Chưa có log',
      'common.no_logs_sub': 'Sự kiện mở khóa, nhập sai, tamper và thay đổi cài đặt sẽ xuất hiện ở đây.',
      'popup.document_title': 'Chrome Lock Pro X',
      'popup.hero.loading_title': 'Đang tải trạng thái...',
      'popup.hero.loading_text': 'Đang đọc trạng thái khóa, timer phiên và policy hiện tại.',
      'popup.hero.setup_title': 'Cần thiết lập mật khẩu',
      'popup.hero.setup_text': 'Mở một trang web thường hoặc trang Cài đặt để tạo mật khẩu lần đầu.',
      'popup.hero.locked_title': 'Trình duyệt đang bị khóa',
      'popup.hero.unlocked_title': 'Trình duyệt đang mở',
      'popup.hero.locked_text': 'Các tab ngoài whitelist sẽ cần mật khẩu.',
      'popup.hero.relock_text': 'Phiên sẽ tự khóa lại sau {{time}}.',
      'popup.hero.open_text': 'Trình duyệt sẽ mở cho đến khi bạn khóa lại hoặc policy kích hoạt.',
      'popup.tool.saved_by_domain': 'Các vùng riêng tư được lưu theo domain của tab hiện tại.',
      'popup.tool.default_region_label': 'Mặc định cho vùng mới',
      'popup.tool.selection_active': 'Đang ở chế độ chọn vùng. Kéo chuột trên trang để tạo vùng riêng tư hoặc nhấn Escape để hủy.',
      'popup.tool.profile_override': 'Profile "{{name}}" đang ghi đè tab này bằng chế độ {{mode}}{{masked}}',
      'popup.tool.regions_present': 'Tab này đang có {{count}} vùng riêng tư. Chế độ hiện tại: {{mode}}{{masked}}',
      'popup.tool.default_mode': 'Chế độ mặc định: {{defaultMode}}. Chế độ trên trang hiện tại: {{activeMode}}{{masked}}',
      'popup.tool.masked_suffix': ' và đang ẩn title/favicon.',
      'popup.tool.period': '.',
      'popup.error.no_tab': 'Không tìm thấy tab đang mở.',
      'popup.error.no_response': 'Tab không phản hồi.',
      'popup.error.unsupported_page': 'Tab hiện tại không hỗ trợ content script. Chỉ hoạt động trên trang web thông thường.',
      'popup.error.selection_mode': 'Không thể bật chế độ chọn vùng.',
      'popup.error.clear_regions': 'Không thể xóa các vùng riêng tư.',
      'popup.error.privacy_state': 'Không đọc được trạng thái riêng tư.',
      'popup.error.default_mode': 'Không đổi được chế độ mặc định.',
      'popup.session.note.setup': 'Hãy hoàn tất thiết lập mật khẩu trước khi dùng phiên tạm thời hoặc công cụ riêng tư.',
      'popup.session.note.locked': 'Phiên mặc định: {{session}}.',
      'popup.session.note.timer': 'Khóa khi mất focus: {{blurLock}}. Bấm "Giữ mở" để xóa timer hiện tại.',
      'popup.session.note.default': 'Phiên mặc định: {{session}}. Khóa khi mất focus: {{blurLock}}.',
      'options.document_title': 'Cài đặt Chrome Lock Pro X',
      'options.hero.title': 'Bảng Điều Khiển Bảo Mật',
      'options.hero.text': 'Điều khiển timer mở khóa, khóa khi mất focus, whitelist, công cụ riêng tư và backup.',
      'options.hero.pill': 'PBKDF2 + Salt',
      'options.password.initial_title': 'Thiết lập mật khẩu lần đầu',
      'options.password.change_title': 'Đổi mật khẩu',
      'options.password.old_label': 'Mật khẩu hiện tại',
      'options.password.new_label': 'Mật khẩu mới',
      'options.password.confirm_label': 'Xác nhận mật khẩu mới',
      'options.password.initial_hint': 'Extension chưa có mật khẩu. Hãy tạo mật khẩu để hoàn tất thiết lập lần đầu.',
      'options.password.error.short': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      'options.password.error.mismatch': 'Xác nhận mật khẩu không khớp.',
      'options.password.error.update_failed': 'Không thể cập nhật mật khẩu.',
      'options.password.success.initial': 'Đã thiết lập mật khẩu lần đầu thành công.',
      'options.password.success.changed': 'Đã đổi mật khẩu thành công.',
      'options.policy.title': 'Chính Sách Khóa',
      'options.policy.auto_lock_label': 'Số phút idle trước khi khóa',
      'options.policy.default_session_label': 'Phiên mở khóa mặc định',
      'options.policy.default_session_hint': 'Đặt 0 để giữ mở cho đến khi bạn khóa lại.',
      'options.policy.max_attempts_label': 'Số lần nhập sai tối đa',
      'options.policy.lockout_minutes_label': 'Thời gian lockout (phút)',
      'options.policy.blur_lock_toggle': 'Khóa ngay khi Chrome mất focus hoặc khi một cửa sổ trình duyệt bị thu nhỏ',
      'options.policy.domain_reauth_toggle': 'Yêu cầu nhập lại mật khẩu khi chuyển sang domain mới',
      'options.policy.close_on_lockout_toggle': 'Đóng tất cả cửa sổ Chrome khi lockout do nhập sai quá nhiều lần',
      'options.privacy.title': 'Công Cụ Riêng Tư',
      'options.privacy.help': 'Chọn mode mặc định cho vùng mới, ẩn title/favicon của tab, và tạo profile theo domain.',
      'options.privacy.default_mode_label': 'Chế độ riêng tư mặc định',
      'options.privacy.mask_identity_toggle': 'Ẩn title và favicon của tab khi trang bị khóa bảo vệ. Domain profile có thể ép bật ngay cả khi đang mở khóa.',
      'options.privacy.profile_help': 'Domain profile được áp theo thứ tự từ trên xuống. Rule khớp đầu tiên sẽ được dùng.',
      'options.profile.empty_title': 'Chưa có domain profile',
      'options.profile.empty_text': 'Thêm profile nếu bạn muốn một domain dùng thời lượng phiên, chế độ vùng hoặc rule ẩn title khác.',
      'options.profile.title': 'Profile {{index}}',
      'options.profile.name_label': 'Tên profile',
      'options.profile.match_label': 'Rule khớp',
      'options.profile.session_label': 'Số phút phiên mặc định',
      'options.profile.session_placeholder': 'để trống = dùng mặc định toàn cục',
      'options.profile.mode_label': 'Chế độ vùng',
      'options.profile.mask_label': 'Luôn ẩn title và favicon của tab trên trang khớp profile này',
      'options.whitelist.title': 'Enterprise Whitelist',
      'options.whitelist.help': 'Hỗ trợ các định dạng sau, mỗi dòng một rule:',
      'options.whitelist.rule.domain': 'để cho phép toàn bộ subdomain.',
      'options.whitelist.rule.host': 'để khớp chính xác một hostname.',
      'options.whitelist.rule.pattern': 'để dùng wildcard.',
      'options.whitelist.rule.regex': 'để dùng biểu thức chính quy.',
      'options.whitelist.test_placeholder': 'Dán URL để kiểm tra rule nào khớp',
      'options.backup.title': 'Sao Lưu Cấu Hình',
      'options.backup.muted': 'Export bao gồm password hash hiện tại và các vùng riêng tư lưu theo domain.',
      'options.logs.title': 'Unlock / Security Logs',
      'options.messages.settings_saved': 'Đã lưu cài đặt. Phiên mặc định: {{session}}. Số profile: {{profiles}}.',
      'options.messages.config_exported': 'Đã xuất config.',
      'options.messages.config_imported': 'Đã nhập config.',
      'options.messages.logs_cleared': 'Đã xóa logs.',
      'options.messages.panic_lock': 'Đã kích hoạt panic lock.',
      'options.messages.invalid_rule': 'Rule whitelist không hợp lệ: {{rule}}',
      'options.messages.invalid_profile_rule': 'Rule khớp của profile không hợp lệ: {{rule}}',
      'options.messages.save_failed': 'Không thể lưu cài đặt.',
      'options.messages.config_export_failed': 'Không thể xuất config.',
      'options.messages.config_import_failed': 'Không thể nhập config.',
      'options.messages.invalid_json': 'Tệp JSON không hợp lệ.',
      'content.page_mask_title': 'Phiên Riêng Tư',
      'content.selection.unsupported_page': 'Trang hiện tại không hỗ trợ vùng riêng tư.',
      'content.selection.locked_page': 'Không thể tạo vùng riêng tư khi tab đang bị khóa.',
      'content.selection.already_active': 'Đang ở chế độ chọn vùng. Nhấn Escape để hủy.',
      'content.selection.hint': 'Kéo chuột để tạo vùng {{mode}}. Nhấn Escape để hủy.',
      'content.overlay.chip.product': 'Chrome Lock Pro X',
      'content.overlay.chip.protected': 'Phiên Được Bảo Vệ',
      'content.overlay.title.locked': 'Trình duyệt đang bị khóa',
      'content.overlay.subtitle.locked': 'Nhập mật khẩu để tiếp tục. Overlay sẽ tự phục hồi nếu trang cố gỡ nó khỏi DOM.',
      'content.overlay.title.setup': 'Thiết lập mật khẩu',
      'content.overlay.subtitle.setup': 'Extension chưa có mật khẩu. Hãy tạo mật khẩu ngay để bắt đầu sử dụng.',
      'content.overlay.input.password': 'Nhập mật khẩu',
      'content.overlay.input.new_password': 'Tạo mật khẩu mới',
      'content.overlay.input.confirm_password': 'Xác nhận mật khẩu mới',
      'content.overlay.session_label': 'Thời lượng mở khóa',
      'content.overlay.session_note.default': 'Đã chọn: dùng mặc định ({{session}}).',
      'content.overlay.session_note.unlimited': 'Đã chọn: giữ mở cho đến khi bạn khóa lại.',
      'content.overlay.session_note.minutes': 'Đã chọn: mở trong {{minutes}} phút.',
      'content.overlay.button.unlock': 'Mở khóa',
      'content.overlay.button.setup': 'Thiết lập và mở khóa',
      'content.overlay.setup_note': 'Sau khi thiết lập, tab này sẽ mở khóa ngay bằng tùy chọn phiên bạn đã chọn.',
      'content.overlay.hint': 'Hotkey khẩn cấp: Ctrl+Shift+L / Cmd+Shift+L',
      'content.overlay.lockout': 'Bạn đã nhập sai quá nhiều lần. Hãy thử lại sau {{time}}.',
      'content.overlay.error.short_password': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      'content.overlay.error.mismatch': 'Xác nhận mật khẩu không khớp.',
      'content.overlay.error.setup_failed': 'Không thể tạo mật khẩu.',
      'content.overlay.error.unlock_failed': 'Không thể mở khóa.',
      'content.overlay.error.no_response': 'Extension không phản hồi.',
      'content.overlay.error.try_after': '{{error}} Thử lại sau {{time}}.',
      'content.overlay.error.failed_attempts': '{{error}} Lần sai: {{attempts}}/{{maxAttempts}}.',
      'content.overlay.button.waiting': 'Đang chờ...',
      'content.region.mode_switch': 'Chuyển chế độ riêng tư',
      'content.region.remove': 'Xóa vùng riêng tư',
      'content.region.resize': 'Đổi kích thước vùng riêng tư',
      'content.region.save_failed': 'Không thể lưu các vùng riêng tư.',
      'background.error.must_unlock_first': 'Trình duyệt đang bị khóa. Hãy mở khóa trước.',
      'background.error.invalid_config_file': 'Tệp cấu hình không hợp lệ.',
      'background.error.missing_credentials': 'Thiếu passwordHash hoặc passwordSalt trong cấu hình.',
      'background.error.no_import_fields': 'Không tìm thấy trường cấu hình nào có thể import.',
      'background.error.current_domain_unknown': 'Không xác định được domain của tab hiện tại.',
      'background.error.password_already_setup': 'Mật khẩu đã được thiết lập rồi.',
      'background.error.password_too_short': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      'background.error.first_setup_required': 'Bạn cần thiết lập mật khẩu lần đầu trước.',
      'background.error.old_password_wrong': 'Mật khẩu cũ không đúng.',
      'background.error.first_setup_before_unlock': 'Bạn cần thiết lập mật khẩu lần đầu trước khi mở khóa.',
      'background.error.temp_locked': 'Đang bị khóa tạm thời do nhập sai quá nhiều lần.',
      'background.error.wrong_password': 'Sai mật khẩu.',
      'background.error.lockout_activated': 'Đã khóa tạm thời do nhập sai quá nhiều lần.',
      'background.error.unknown_message': 'Loại message không hợp lệ.',
      'background.error.unexpected': 'Đã xảy ra lỗi không mong muốn.'
    }
  };

  Object.assign(messages.en, {
    'popup.tool.profile_policy': 'Profile "{{name}}" active: {{policies}}. Mode: {{mode}}{{masked}}',
    'popup.tool.profile_flag.force_lock': 'force-lock',
    'popup.tool.profile_flag.reauth': 're-auth on visit',
    'popup.tool.profile_flag.bypass': 'bypass global lock',
    'popup.tool.profile_flag.page_unlock': 'page relock {{minutes}}',
    'popup.tool.profile_flag.page_unlock_indefinite': 'page relock indefinite',
    'popup.tool.profile_flag.default_session': 'default session {{minutes}}',
    'popup.tool.profile_flag.masked': 'masked identity',
    'options.privacy.help': 'Set the default mode for new regions, mask the tab title/favicon, and create per-domain profiles with lock policies.',
    'options.privacy.profile_help': 'Domain profiles are matched from top to bottom. The first matching rule wins. Force-lock overrides bypass mode.',
    'options.profile.empty_text': 'Add a profile if you want a domain to use a different session duration, page relock policy, privacy mode, or lock behavior.',
    'options.profile.page_unlock_label': 'Page relock minutes',
    'options.profile.page_unlock_placeholder': 'blank = use profile/global session',
    'options.profile.bypass_label': 'Bypass the global browser lock on matching pages',
    'options.profile.force_lock_label': 'Always force this page to re-authenticate',
    'options.profile.reauth_label': 'Require re-auth each time this page/domain is visited',
    'content.overlay.title.profile': 'Protected page',
    'content.overlay.subtitle.profile': 'This page is protected by profile "{{name}}". Enter your password to continue.'
  });

  Object.assign(messages.vi, {
    'popup.tool.profile_policy': 'Profile "{{name}}" đang hoạt động: {{policies}}. Chế độ: {{mode}}{{masked}}',
    'popup.tool.profile_flag.force_lock': 'force-lock',
    'popup.tool.profile_flag.reauth': 'yêu cầu xác thực lại khi vào trang',
    'popup.tool.profile_flag.bypass': 'bỏ qua khóa toàn cục',
    'popup.tool.profile_flag.page_unlock': 'tự khóa trang sau {{minutes}}',
    'popup.tool.profile_flag.page_unlock_indefinite': 'trang giữ mở không giới hạn',
    'popup.tool.profile_flag.default_session': 'phiên mặc định {{minutes}}',
    'popup.tool.profile_flag.masked': 'ẩn danh tính tab',
    'options.privacy.help': 'Chọn mode mặc định cho vùng mới, ẩn title/favicon của tab, và tạo profile theo domain với lock policy riêng.',
    'options.privacy.profile_help': 'Domain profile được áp theo thứ tự từ trên xuống. Rule khớp đầu tiên sẽ được dùng. Force-lock sẽ ưu tiên hơn bypass.',
    'options.profile.empty_text': 'Thêm profile nếu bạn muốn một domain dùng thời lượng phiên, policy tự khóa trang, chế độ riêng tư hoặc hành vi khóa khác.',
    'options.profile.page_unlock_label': 'Số phút tự khóa riêng cho trang',
    'options.profile.page_unlock_placeholder': 'để trống = dùng phiên profile/toàn cục',
    'options.profile.bypass_label': 'Bỏ qua khóa trình duyệt toàn cục cho các trang khớp',
    'options.profile.force_lock_label': 'Luôn buộc trang này xác thực lại',
    'options.profile.reauth_label': 'Yêu cầu xác thực lại mỗi khi vào trang/domain này',
    'content.overlay.title.profile': 'Trang được bảo vệ',
    'content.overlay.subtitle.profile': 'Trang này được profile "{{name}}" bảo vệ. Hãy nhập mật khẩu để tiếp tục.'
  });

  Object.assign(messages.en, {
    'options.whitelist.title': 'Advanced Whitelist',
    'options.backup.title': 'Settings Backup',
    'options.backup.muted': 'Export includes lock settings, profiles, whitelist rules, and privacy regions saved by domain. Password material is never exported.'
  });

  Object.assign(messages.vi, {
    'options.whitelist.title': 'Whitelist nâng cao',
    'options.backup.title': 'Sao lÆ°u cÃ i Ä‘áº·t',
    'options.backup.muted': 'Export bao gá»“m cÃ i Ä‘áº·t khÃ³a, profile, whitelist vÃ  cÃ¡c vÃ¹ng riÃªng tÆ° lÆ°u theo domain. Password material sáº½ khÃ´ng bao giá» Ä‘Æ°á»£c xuáº¥t.'
  });

  function normalizeLanguage(language) {
    const normalized = String(language || '').trim().toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(normalized)) return normalized;

    const detected = typeof navigator !== 'undefined' ? String(navigator.language || '') : '';
    return detected.toLowerCase().startsWith('vi') ? 'vi' : 'en';
  }

  Object.assign(messages.en, {
    'options.policy.unlock_scope_label': 'Unlock scope',
    'options.policy.unlock_scope_hint': 'If you choose all domains, entering the password once will also open newly created tabs until the session expires or you lock again.',
    'options.policy.unlock_scope.domain': 'Only current domain',
    'options.policy.unlock_scope.global': 'All domains in the current unlock session',
    'common.action.register_biometric': 'Register Fingerprint / Face',
    'common.action.remove_biometric': 'Remove Biometric Unlock',
    'options.biometric.title': 'Biometric Unlock',
    'options.biometric.help': 'Use Windows Hello or another platform authenticator so Chrome can verify your fingerprint, face, or device PIN before unlocking.',
    'options.biometric.status.ready': 'Configured',
    'options.biometric.status.not_setup': 'Not set up',
    'options.biometric.messages.password_first': 'Create a password first, then register biometric unlock.',
    'options.biometric.messages.request_failed': 'Could not open the biometric window.',
    'options.biometric.messages.window_opened': 'Biometric window opened. Finish the prompt there.',
    'options.biometric.messages.registered': 'Biometric unlock is ready.',
    'options.biometric.messages.removed': 'Biometric unlock removed.',
    'options.biometric.messages.remove_failed': 'Could not remove biometric unlock.',
    'content.overlay.button.biometric': 'Use Fingerprint / Face',
    'content.overlay.button.biometric_waiting': 'Waiting for biometric...',
    'content.overlay.error.biometric_failed': 'Biometric verification failed.',
    'background.error.biometric_not_setup': 'Biometric unlock is not configured yet.',
    'background.error.biometric_request_missing': 'The biometric request is missing or expired.',
    'background.error.biometric_verification_failed': 'Biometric verification failed.',
    'background.error.biometric_cancelled': 'Biometric verification was cancelled.',
    'background.error.biometric_tab_missing': 'Could not find the tab that requested biometric unlock.',
    'background.error.biometric_public_key_missing': 'Chrome did not return a usable biometric public key.',
    'biometric.window.document_title': 'Chrome Lock Pro X Biometric',
    'biometric.window.title.setup': 'Register Biometric Unlock',
    'biometric.window.title.unlock': 'Unlock with Biometrics',
    'biometric.window.subtitle.setup': 'Chrome will ask your device to verify your fingerprint, face, or platform PIN and bind it to this extension.',
    'biometric.window.subtitle.unlock': 'Confirm with your fingerprint, face, or platform PIN to unlock the protected browser session.',
    'biometric.window.note': 'This extension does not read raw fingerprint or face data. Chrome only returns a verified WebAuthn result.',
    'biometric.window.button.setup': 'Register Now',
    'biometric.window.button.unlock': 'Verify and Unlock',
    'biometric.window.button.cancel': 'Cancel',
    'biometric.window.status.ready_setup': 'Ready to register biometric unlock for this extension.',
    'biometric.window.status.ready_unlock': 'Ready to verify your biometric unlock.',
    'biometric.window.status.running_setup': 'Waiting for your device to confirm biometric setup...',
    'biometric.window.status.running_unlock': 'Waiting for your device to verify you...',
    'biometric.window.status.success_setup': 'Biometric unlock registered.',
    'biometric.window.status.success_unlock': 'Biometric verification passed.',
    'biometric.window.error.cancelled': 'Biometric verification was cancelled.',
    'biometric.window.error.invalid_state': 'This biometric credential cannot be used in the current state.',
    'biometric.window.error.unsupported': 'This Chrome build does not support platform biometric WebAuthn here.',
    'biometric.window.error.platform_unavailable': 'No platform authenticator such as Windows Hello is available on this device.',
    'biometric.window.error.context_missing': 'The biometric request is missing or expired.',
    'biometric.window.error.no_public_key': 'Chrome did not return a usable credential for biometric unlock.',
    'biometric.window.error.not_configured': 'Biometric unlock has not been configured yet.',
    'biometric.window.error.generic': 'Biometric verification failed.'
  });

  Object.assign(messages.vi, {
    'options.policy.unlock_scope_label': 'Phạm vi mở khóa',
    'options.policy.unlock_scope_hint': 'Nếu chọn tất cả domain, chỉ cần nhập mật khẩu 1 lần thì các tab mới tạo trong cùng phiên sẽ không cần nhập lại cho đến khi hết hạn hoặc bạn khóa lại.',
    'options.policy.unlock_scope.domain': 'Chỉ domain hiện tại',
    'options.policy.unlock_scope.global': 'Tất cả domain trong phiên hiện tại',
    'common.action.register_biometric': 'Đăng ký vân tay / khuôn mặt',
    'common.action.remove_biometric': 'Xóa mở khóa sinh trắc học',
    'options.biometric.title': 'Mở khóa sinh trắc học',
    'options.biometric.help': 'Dùng Windows Hello hoặc trình xác thực trên thiết bị để Chrome xác minh vân tay, khuôn mặt hoặc mã PIN của máy trước khi mở khóa.',
    'options.biometric.status.ready': 'Đã cấu hình',
    'options.biometric.status.not_setup': 'Chưa thiết lập',
    'options.biometric.messages.password_first': 'Hãy tạo mật khẩu trước, sau đó mới đăng ký mở khóa sinh trắc học.',
    'options.biometric.messages.request_failed': 'Không mở được cửa sổ sinh trắc học.',
    'options.biometric.messages.window_opened': 'Đã mở cửa sổ sinh trắc học. Hãy hoàn tất xác minh tại đó.',
    'options.biometric.messages.registered': 'Mở khóa sinh trắc học đã sẵn sàng.',
    'options.biometric.messages.removed': 'Đã xóa mở khóa sinh trắc học.',
    'options.biometric.messages.remove_failed': 'Không thể xóa mở khóa sinh trắc học.',
    'content.overlay.button.biometric': 'Dùng vân tay / khuôn mặt',
    'content.overlay.button.biometric_waiting': 'Đang chờ xác minh sinh trắc học...',
    'content.overlay.error.biometric_failed': 'Xác minh sinh trắc học thất bại.',
    'background.error.biometric_not_setup': 'Chưa cấu hình mở khóa sinh trắc học.',
    'background.error.biometric_request_missing': 'Yêu cầu sinh trắc học đã hết hạn hoặc không tồn tại.',
    'background.error.biometric_verification_failed': 'Xác minh sinh trắc học thất bại.',
    'background.error.biometric_cancelled': 'Đã hủy xác minh sinh trắc học.',
    'background.error.biometric_tab_missing': 'Không tìm thấy tab yêu cầu mở khóa sinh trắc học.',
    'background.error.biometric_public_key_missing': 'Chrome không trả về dữ liệu khóa công khai hợp lệ cho sinh trắc học.',
    'biometric.window.document_title': 'Chrome Lock Pro X Sinh Trắc Học',
    'biometric.window.title.setup': 'Đăng ký mở khóa sinh trắc học',
    'biometric.window.title.unlock': 'Mở khóa bằng sinh trắc học',
    'biometric.window.subtitle.setup': 'Chrome sẽ yêu cầu thiết bị xác minh vân tay, khuôn mặt hoặc PIN hệ thống và gắn nó với extension này.',
    'biometric.window.subtitle.unlock': 'Xác nhận bằng vân tay, khuôn mặt hoặc PIN hệ thống để mở khóa phiên duyệt đang được bảo vệ.',
    'biometric.window.note': 'Extension không đọc dữ liệu vân tay hoặc khuôn mặt gốc. Chrome chỉ trả về kết quả WebAuthn đã được xác minh.',
    'biometric.window.button.setup': 'Đăng ký ngay',
    'biometric.window.button.unlock': 'Xác minh và mở khóa',
    'biometric.window.button.cancel': 'Hủy',
    'biometric.window.status.ready_setup': 'Sẵn sàng đăng ký mở khóa sinh trắc học cho extension này.',
    'biometric.window.status.ready_unlock': 'Sẵn sàng xác minh sinh trắc học để mở khóa.',
    'biometric.window.status.running_setup': 'Đang chờ thiết bị xác nhận thiết lập sinh trắc học...',
    'biometric.window.status.running_unlock': 'Đang chờ thiết bị xác minh bạn...',
    'biometric.window.status.success_setup': 'Đã đăng ký mở khóa sinh trắc học.',
    'biometric.window.status.success_unlock': 'Xác minh sinh trắc học thành công.',
    'biometric.window.error.cancelled': 'Đã hủy xác minh sinh trắc học.',
    'biometric.window.error.invalid_state': 'Thông tin sinh trắc học này không dùng được trong trạng thái hiện tại.',
    'biometric.window.error.unsupported': 'Bản Chrome hiện tại không hỗ trợ WebAuthn sinh trắc học tại đây.',
    'biometric.window.error.platform_unavailable': 'Thiết bị này không có trình xác thực hệ thống như Windows Hello.',
    'biometric.window.error.context_missing': 'Yêu cầu sinh trắc học đã hết hạn hoặc không tồn tại.',
    'biometric.window.error.no_public_key': 'Chrome không trả về dữ liệu credential hợp lệ cho mở khóa sinh trắc học.',
    'biometric.window.error.not_configured': 'Chưa cấu hình mở khóa sinh trắc học.',
    'biometric.window.error.generic': 'Xác minh sinh trắc học thất bại.'
  });

  let currentLanguage = normalizeLanguage('');
  let readyPromise = null;

  function applyTemplate(template, values = {}) {
    return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return key in values ? String(values[key]) : '';
    });
  }

  function translate(language, key, values = {}) {
    const lang = normalizeLanguage(language);
    const dictionary = messages[lang] || messages.en;
    const fallbackDictionary = messages.en;
    const template = dictionary[key] ?? fallbackDictionary[key] ?? key;
    return applyTemplate(template, values);
  }

  async function ready() {
    if (readyPromise) return readyPromise;

    readyPromise = (async () => {
      try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        currentLanguage = normalizeLanguage(data[STORAGE_KEY]);
        if (!data[STORAGE_KEY]) {
          await chrome.storage.local.set({ [STORAGE_KEY]: currentLanguage });
        }
      } catch {
        currentLanguage = normalizeLanguage('');
      }

      if (typeof document !== 'undefined') {
        document.documentElement.lang = currentLanguage;
      }

      return currentLanguage;
    })();

    return readyPromise;
  }

  function t(key, values = {}) {
    return translate(currentLanguage, key, values);
  }

  async function tAsync(key, values = {}) {
    await ready();
    return t(key, values);
  }

  function notify(nextLanguage) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLanguage;
    }
    listeners.forEach((listener) => {
      try {
        listener(nextLanguage);
      } catch {
        // ignore listener failures
      }
    });
  }

  async function setLanguage(language) {
    await ready();
    const nextLanguage = normalizeLanguage(language);
    if (nextLanguage === currentLanguage) {
      return nextLanguage;
    }

    currentLanguage = nextLanguage;
    await chrome.storage.local.set({ [STORAGE_KEY]: nextLanguage });
    notify(nextLanguage);
    return nextLanguage;
  }

  async function toggleLanguage() {
    await ready();
    return setLanguage(currentLanguage === 'vi' ? 'en' : 'vi');
  }

  function onChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes[STORAGE_KEY]) return;
      const nextLanguage = normalizeLanguage(changes[STORAGE_KEY].newValue);
      if (nextLanguage === currentLanguage) return;
      currentLanguage = nextLanguage;
      notify(nextLanguage);
    });
  }

  globalScope.CLPX_I18N = {
    STORAGE_KEY,
    SUPPORTED_LANGUAGES,
    messages,
    normalizeLanguage,
    translate,
    ready,
    t,
    tAsync,
    setLanguage,
    toggleLanguage,
    onChange,
    getLanguage() {
      return currentLanguage;
    }
  };
})(globalThis);
