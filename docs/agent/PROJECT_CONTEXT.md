# 🧭 Project Context: Từ Điển Xơ Đăng - Việt

## 1. Thông Tin Tổng Quan
* **Tên dự án:** Từ Điển Xơ Đăng - Việt (Song ngữ Xơ Đăng - Việt)
* **Domain chính:** `https://hoctiengxodang.online/`
* **Kiến trúc:** Web PWA (Vite + TypeScript) & Desktop Application (Electron)
* **Trạng thái:** Hoàn tất Refactor Modular và Dọn sạch thư mục gốc (Tidy-Root).

---

## 2. Bảng Điều Khiển Notion (Notion Dashboard)
* **Trang cha (Parent Page):** [Notion Workspace Dashboard](https://app.notion.com/p/Antigravity-e2a596c3246a82a3b7cf013f6e800db1) (`e2a596c3-246a-82a3-b7cf-013f6e800db1`)
* **Các trang thành phần:**
  1. [Tiến độ dự án](https://app.notion.com/p/Ti-n-d-n-3ec596c3246a81f0940dda42a7f86022): Theo dõi toàn bộ 17 bước triển khai refactor và dọn gốc repo cùng commit hash tương ứng.
  2. [Quyết định kỹ thuật](https://app.notion.com/p/Quy-t-nh-k-thu-t-3ec596c3246a81bd84fdc68cb73b0658): 5 quyết định kiến trúc cốt lõi (D1–D5).
  3. [Rủi ro & Câu hỏi mở](https://app.notion.com/p/R-i-ro-C-u-h-i-m-3ec596c3246a812eb832ccdbfc1ddb5f): Quản trị rủi ro cache service worker, dung lượng âm thanh, quota Google Apps Script.
  4. [Duyệt từ vựng đóng góp (Dự thảo)](https://app.notion.com/p/Duy-t-t-v-ng-ng-g-p-D-th-o-3ec596c3246a81f5985ad5271c58e086): Khung quy trình và bảng thuộc tính phục vụ thẩm định từ bản ngữ.

---

## 3. Quy Tắc Đồng Bộ (Sync Protocol)
1. **Nguồn sự thật tuyệt đối (Single Source of Truth):** Toàn bộ file mã nguồn và tài liệu trong kho Git (`tudien-main`). Notion đóng vai trò bản sao hiển thị cho con người theo dõi.
2. **Chiều đồng bộ:** Một chiều từ `Git Repo` $\rightarrow$ `Notion`. Tuyệt đối không chỉnh sửa ngược mã nguồn theo nội dung trên Notion nếu chưa có chỉ thị từ người dùng.
3. **Bảo mật & Quyền riêng tư:** Tuyệt đối không đẩy lên Notion:
   * API Key, token bí mật, file cấu hình môi trường `.env`.
   * Dữ liệu người dùng, tiến độ học tập hoặc thông tin lưu trữ cá nhân (localStorage).
4. **Thời điểm cập nhật:** Chỉ thực hiện khi người dùng yêu cầu hoặc chạy lệnh `/wrap-up`.

---

## 4. Danh Sách Checkpoint & Git Tags
* `checkpoint-phase0-baseline`: Baseline 13 bài test hồi quy nguyên bản.
* `checkpoint-step1-infra`: Cấu hình nền tảng Vite + TypeScript + Vitest.
* `checkpoint-step2-css`: Tách rời CSS mô-đun và self-host font/icon offline.
* `checkpoint-step3-services`: Trích xuất TypeScript services & chuẩn hoá Unicode NFC.
* `checkpoint-step4-components`: Tách UI components, chống XSS, event delegation.
* `checkpoint-step5-shell`: Tinh gọn index.html xuống 12.8 KB và nạp CSP an toàn.
* `checkpoint-step6-onboarding`: Giới thiệu người dùng & hash router.
* `checkpoint-step7-games`: 4 trò chơi học từ vựng tương tác.
* `checkpoint-step8-electron-pwa`: Cầu nối IPC Electron & Service Worker PWA.
* `checkpoint-step9-final`: Hoàn tất chuyển đổi modular kiến trúc.
* `pre-tidy`: Tag đối chiếu trước khi dọn dẹp gốc kho mã nguồn.
