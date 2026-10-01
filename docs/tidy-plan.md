# KẾ HOẠCH DỌN GỐC DỰ ÁN TUDIEN-MAIN (TIDY-ROOT PLAN)

> **Mục tiêu**: Làm sạch và tổ chức lại gốc thư mục dự án sau đợt refactor kiến trúc modular, bảo toàn 100% URL công khai, không làm gián đoạn PWA, không gây lỗi 404 cho asset, và đảm bảo bản build `dist` chứa đầy đủ file phục vụ production.  
> **Branch**: `chore/tidy-root` | **Tag gốc**: `pre-tidy` (`73e7d59`)

---

## 1. BẢNG PHÂN LOẠI & KIỂM KÊ TOÀN BỘ FILE/THƯ MỤC GỐC

| STT | File / Thư mục ở gốc | Phân loại | Ai tham chiếu (Đường dẫn : Dòng) | Đích đề xuất (`git mv`) | Tham chiếu cần cập nhật |
|:---:|:---|:---:|:---|:---|:---|
| 1 | `robots.txt` | **A** | `index.html` (Chuẩn SEO web crawler mặc định truy cập `/robots.txt`) | `public/robots.txt` | Không (giữ URL `https://hoctiengxodang.online/robots.txt`) |
| 2 | `sitemap.xml` | **A** | `index.html:64`<br>`robots.txt:3` | `public/sitemap.xml` | Không (giữ URL `https://hoctiengxodang.online/sitemap.xml`) |
| 3 | `CNAME` | **A** | GitHub Pages Routing (Chỉ định domain `hoctiengxodang.online`) | `public/CNAME` | Không (Vite tự copy sang `dist/CNAME` khi build) |
| 4 | `google752b7efc6d08d97f.html` | **A** | Google Search Console Crawler xác minh quyền sở hữu web | `public/google752b7efc6d08d97f.html` | Không (giữ nguyên token URL ở cấp gốc) |
| 5 | `favicon.png` | **A** | `index.html:67` | `public/favicon.png` | Không (giữ URL `https://hoctiengxodang.online/favicon.png`) |
| 6 | `Thumnail.jpg` | **A** | `index.html:12` (`meta[name="thumbnail"]`)<br>`index.html:46` (`meta[property="og:image"]`)<br>`index.html:47` (`meta[property="og:image:secure_url"]`)<br>`index.html:60` (`meta[name="twitter:image"]`) | `public/Thumnail.jpg` | Không (giữ nguyên URL tuyệt đối `https://hoctiengxodang.online/Thumnail.jpg`) |
| 7 | `manifest.json` | **A** | `index.html:33`<br>`src/renderer/service-worker.ts:15` | `public/manifest.json` | Cập nhật các đường dẫn icon trong `public/manifest.json` từ `./icon-*` sang `./icons/icon-*` |
| 8 | `og-image.png` (6.54 MB) | **A** | Mạng xã hội / backlink bên ngoài có thể đã lưu cache URL gốc | `public/og-image.png` | Không (giữ URL `https://hoctiengxodang.online/og-image.png`) |
| 9 | `og-image_v2.png` (2.38 MB) | **A** | Mạng xã hội / backlink bên ngoài có thể đã lưu cache URL gốc | `public/og-image_v2.png` | Không (giữ URL `https://hoctiengxodang.online/og-image_v2.png`) |
| 10 | `twitter-card.png` (247 KB) | **A** | Mạng xã hội / backlink bên ngoài có thể đã lưu cache URL gốc | `public/twitter-card.png` | Không (giữ URL `https://hoctiengxodang.online/twitter-card.png`) |
| 11 | `icon-48x48.png` | **B** | `manifest.json:12` | `public/icons/icon-48x48.png` | `public/manifest.json:12` (sửa thành `./icons/icon-48x48.png`) |
| 12 | `icon-72x72.png` | **B** | `manifest.json:17` | `public/icons/icon-72x72.png` | `public/manifest.json:17` (sửa thành `./icons/icon-72x72.png`) |
| 13 | `icon-96x96.png` | **B** | `manifest.json:22` | `public/icons/icon-96x96.png` | `public/manifest.json:22` (sửa thành `./icons/icon-96x96.png`) |
| 14 | `icon-128x128.png` | **B** | `manifest.json:27` | `public/icons/icon-128x128.png` | `public/manifest.json:27` (sửa thành `./icons/icon-128x128.png`) |
| 15 | `icon-144x144.png` | **B** | `manifest.json:32` | `public/icons/icon-144x144.png` | `public/manifest.json:32` (sửa thành `./icons/icon-144x144.png`) |
| 16 | `icon-152x152.png` | **B** (Dự phòng) | Hiện không có tham chiếu trực tiếp (thuộc bộ icon iOS PWA) | `public/icons/icon-152x152.png` | Không có tham chiếu cần sửa |
| 17 | `icon-192x192.png` | **B** | `index.html:39`<br>`manifest.json:37` | `public/icons/icon-192x192.png` | `index.html:39` (sửa thành `./icons/icon-192x192.png`)<br>`public/manifest.json:37` (sửa thành `./icons/icon-192x192.png`) |
| 18 | `icon-256x256.png` | **B** (Dự phòng) | Hiện không có tham chiếu trực tiếp (thuộc bộ icon PWA) | `public/icons/icon-256x256.png` | Không có tham chiếu cần sửa |
| 19 | `icon-384x384.png` | **B** (Dự phòng) | Hiện không có tham chiếu trực tiếp (thuộc bộ icon PWA) | `public/icons/icon-384x384.png` | Không có tham chiếu cần sửa |
| 20 | `icon-512x512.png` | **B** | `manifest.json:43` | `public/icons/icon-512x512.png` | `public/manifest.json:43` (sửa thành `./icons/icon-512x512.png`) |
| 21 | `badge-72x72.png` | **B** (Dự phòng) | Hiện không có tham chiếu trực tiếp (thuộc bộ icon notification badge) | `public/icons/badge-72x72.png` | Không có tham chiếu cần sửa |
| 22 | `Bao_cao_giai_phap_PWA.md` | **C** | Tài liệu kiến trúc PWA cũ | `docs/archive/Bao_cao_giai_phap_PWA.md` | Không có code tham chiếu |
| 23 | `Danh_gia_va_Toi_uu_Du_an.md` | **C** | Tài liệu đánh giá dự án cũ | `docs/archive/Danh_gia_va_Toi_uu_Du_an.md` | Không có code tham chiếu |
| 24 | `audio/` (Thư mục 1.264 file) | **Đặc biệt** (Mục 3.1) | `src/renderer/services/audio.service.ts:13`<br>`src/renderer/services/offline-sync.service.ts:100, 131`<br>`tests/audio.test.ts:7-8` | `public/audio/` | Không cần đổi code URL (`./audio/${id}.webm` vẫn hoạt động nguyên vẹn khi Vite phát hành sang `dist/audio/`) |
| 25 | `index.html` | **Hạ tầng gốc** | File HTML vỏ (Shell) của Vite | Giữ nguyên tại gốc | Cập nhật `link[rel="apple-touch-icon"]` trỏ tới `./icons/icon-192x192.png` ở Bước 4 |
| 26 | `package.json` | **Hạ tầng gốc** | Cấu hình dự án Node.js | Giữ nguyên tại gốc | Không đổi |
| 27 | `package-lock.json` | **Hạ tầng gốc** | Khóa phiên bản npm | Giữ nguyên tại gốc | Không đổi |
| 28 | `tsconfig.json` | **Hạ tầng gốc** | Cấu hình TypeScript compiler | Giữ nguyên tại gốc | Không đổi |
| 29 | `tsconfig.node.json` | **Hạ tầng gốc** | Cấu hình TypeScript Node/Vite | Giữ nguyên tại gốc | Không đổi |
| 30 | `vite.config.ts` | **Hạ tầng gốc** | Cấu hình Vite build/dev | Giữ nguyên tại gốc | Không đổi |
| 31 | `vitest.config.ts` | **Hạ tầng gốc** | Cấu hình kiểm thử Vitest | Giữ nguyên tại gốc | Không đổi |
| 32 | `.env.example` | **Hạ tầng gốc** | Mẫu cấu hình môi trường | Giữ nguyên tại gốc | Không đổi |
| 33 | `.gitignore` | **Hạ tầng gốc** | Danh sách bỏ qua của Git | Giữ nguyên tại gốc | Bổ sung `src/shared/data/snapshot/` ở Bước 7 |
| 34 | `.agents/` | **Hạ tầng** | Cấu hình agent / rules | Giữ nguyên tại gốc | Không đụng vào |
| 35 | `.git/` | **Hạ tầng** | Kho lưu trữ Git | Giữ nguyên tại gốc | Không đụng vào |
| 36 | `node_modules/` | **Hạ tầng** | Thư viện phụ thuộc | Giữ nguyên tại gốc | Không đụng vào |
| 37 | `public/` | **Hạ tầng** | Thư mục tài sản tĩnh của Vite | Giữ nguyên tại gốc | Tiếp nhận file A, B, audio |
| 38 | `scripts/` | **Hạ tầng** | Script tiện ích (`generate-snapshot.ts`) | Giữ nguyên tại gốc | Không đổi |
| 39 | `src/` | **Hạ tầng** | Mã nguồn TypeScript/HTML/CSS | Giữ nguyên tại gốc | Không đổi |
| 40 | `tests/` | **Hạ tầng** | Bộ test tự động (13 test suites) | Giữ nguyên tại gốc | Không đổi |
| 41 | `dist/` | **Build output** | Thư mục đầu ra sản phẩm | Giữ nguyên tại gốc (gitignored) | Được kiểm chứng sau mỗi bước build |
| 42 | `docs/` | **Tài liệu** | Chứa tài liệu lưu trữ và kế hoạch dọn dẹp | Giữ nguyên tại gốc | Chứa `archive/` và `tidy-plan.md` |

---

## 2. KẾT QUẢ XÁC MINH CÁC ĐIỂM Ở MỤC 3

### 2.1 Thư mục audio/ và bản build production
- **Hiện trạng kiểm tra**: 
  - Thư mục `audio/` ở gốc chứa **1.264 file `.webm`** với tổng dung lượng **38.74 MB**.
  - Kiểm tra bản build hiện tại (`dist/`): `dist/audio/` **KHÔNG TỒN TẠI** (do Vite chỉ đóng gói tài sản tĩnh từ thư mục `public/`).
  - Cách ứng dụng truy cập:
    - `src/renderer/services/audio.service.ts` dòng 13: `return cleanId ? './audio/' + cleanId + '.webm' : '';`
    - `src/renderer/services/offline-sync.service.ts` dòng 100, 131: `./audio/${encodeURIComponent(id)}.webm`
- **Kết luận & Đề xuất**:
  - Nếu triển khai từ `dist/`, tính năng nghe phát âm offline trên production sẽ hỏng hoàn toàn (lỗi 404).
  - Đề xuất di chuyển `audio/` vào `public/audio/` bằng `git mv audio public/audio`.
  - Khi đó, lệnh `npm run build` của Vite sẽ tự động copy toàn bộ `public/audio/` sang `dist/audio/`.
  - Đường dẫn tương đối `./audio/${cleanId}.webm` trong mã nguồn và các bài test giữ nguyên 100%, không cần sửa bất kỳ dòng mã nào.
  - Tên file giữ nguyên 100% theo ID Google Drive cũ.
  - Service worker `src/renderer/service-worker.ts`: logic fetch tại dòng 81 bắt request có `url.pathname.includes('/audio/') || url.pathname.endsWith('.webm')`, ưu tiên cache `tudien-audio` và fetch fallback sang network, hoạt động hoàn hảo với `dist/audio/`.
  - Electron `extraResources`: Khi đóng gói desktop từ thư mục `dist/`, toàn bộ thư mục `dist/audio/` sẽ được đóng gói đi kèm `dist/index.html`.

### 2.2 Cách deploy (Triển khai)
- **Hiện trạng kiểm tra**:
  - Trong kho mã nguồn **KHÔNG CÓ** thư mục `.github/workflows` hay script CI/CD nào.
  - Không có remote Git nào được cấu hình nội bộ (`git remote -v` trả về rỗng).
  - File `CNAME` tại gốc chứa tên miền: `hoctiengxodang.online`.
  - File `robots.txt` dòng 3 và `sitemap.xml` dòng 4, 10 vẫn tham chiếu URL cũ `https://tudienxedang.github.io/tudien/`. (Tuân thủ luật: KHÔNG tự ý sửa nội dung file, chỉ di chuyển giữ nguyên).
- **Phân tích rủi ro & Bảo đảm**:
  - Trước đây dự án triển khai trực tiếp từ gốc repo. Khi chuyển sang dự án Vite MPA/SPA, thư mục cần deploy lên máy chủ/GitHub Pages là `dist/`.
  - Do đó, việc di chuyển `CNAME` và `google752b7efc6d08d97f.html` vào `public/` là **bắt buộc** để khi build, `dist/CNAME` và `dist/google752b7efc6d08d97f.html` luôn hiện diện ở cấp gốc của domain thật.

### 2.3 Ảnh chia sẻ mạng xã hội & Thẻ Meta
- **Hiện trạng kiểm tra**:
  - `Thumnail.jpg` (96,211 bytes, ~94 KB, kích thước 720x390): Là ảnh **duy nhất** đang được `index.html` tham chiếu ở dòng 12 (`thumbnail`), dòng 46-47 (`og:image`), dòng 60 (`twitter:image`).
  - `og-image.png` (6,858,107 bytes, ~6.54 MB, kích thước 2848x1504): Quá lớn, hiện không có file nào tham chiếu.
  - `og-image_v2.png` (2,495,954 bytes, ~2.38 MB, kích thước 2848x1504): Quá lớn, hiện không có file nào tham chiếu.
  - `twitter-card.png` (252,833 bytes, ~247 KB, kích thước 500x500): Hiện không có file nào tham chiếu.
- **Xử lý**:
  - Cả 4 file ảnh trên đều được chuyển vào `public/` ở cấp gốc. Mọi URL tuyệt đối cũ (`https://hoctiengxodang.online/Thumnail.jpg`, `og-image.png`, v.v.) đều tiếp tục phục vụ mã HTTP 200 OK.
  - Đề xuất tùy chọn cho Bước 6 (chờ người dùng duyệt): Tạo bản ảnh tối ưu 1200x630 (<= 300 KB) cho Open Graph card, nhưng vẫn giữ nguyên các file ảnh cũ để tránh vỡ cache mạng xã hội.

### 2.4 Precache của Service Worker
- **Hiện trạng kiểm tra**:
  - Mảng `STATIC_PRECACHE` trong `src/renderer/service-worker.ts` (dòng 11-20) được khai báo tĩnh, chỉ gồm:
    `'./'`, `'./index.html'`, `'./offline.html'`, `'./manifest.json'`, `'./fonts/fontawesome/all.min.css'`, và 3 file font `.woff2`.
  - Service worker **KHÔNG** sử dụng wildcard hay glob pattern quét toàn bộ thư mục `public/`.
  - Toàn bộ ảnh nặng (`og-image*`, `twitter-card`, `Thumnail.jpg`) và 1.264 file trong `audio/` **KHÔNG** bị đưa vào precache, bảo đảm dung lượng tải lần đầu của PWA luôn nhẹ (< 200 KB).

### 2.5 Nội dung manifest.json và tính tương thích PWA
- **Hiện trạng kiểm tra**:
  - `manifest.json` có `"start_url": "./index.html"`, `"display": "standalone"`, và danh sách 7 icon từ 48x48 đến 512x512.
- **Kế hoạch cập nhật**:
  - Khi chuyển `manifest.json` vào `public/manifest.json`:
    - Giữ nguyên `"start_url": "./index.html"`, `"scope"`, `"shortcuts"`.
    - Cập nhật các đường dẫn icon trong trường `icons[].src` từ `"./icon-48x48.png"` sang `"./icons/icon-48x48.png"`.
  - Trong `index.html`: Cập nhật `<link rel="apple-touch-icon" href="./icons/icon-192x192.png">`.
  - Bảo đảm người dùng đã cài PWA trước đó khi có mạng sẽ nhận được Service Worker mới và manifest mới mà không bị lỗi khởi chạy hay mất shortcut.

---

## 3. LỘ TRÌNH THỰC HIỆN TỪNG BƯỚC

- [ ] **Bước 1**: Kiểm kê và phân loại (mục 2), kiểm tra mục 3. Chưa di chuyển gì. *(Đang ở bước này - chờ duyệt)*
- [ ] **Bước 2**: Loại C (tài liệu → `docs/archive/`). Commit.
- [ ] **Bước 3**: Loại A → `public/` (cấp gốc). Không đổi tên, không đổi URL. Commit.
- [ ] **Bước 4**: Loại B → `public/icons/`, cập nhật `manifest.json`, `index.html` (apple-touch-icon). Commit.
- [ ] **Bước 5**: Xử lý `audio/` → `public/audio/`. Commit riêng.
- [ ] **Bước 6**: (Tùy chọn, chờ duyệt) Tạo bản ảnh chia sẻ đã nén, cập nhật meta, giữ file cũ. Commit riêng.
- [ ] **Bước 7**: Bổ sung `src/shared/data/snapshot/` vào `.gitignore`, chạy kiểm chứng đối chiếu `dist`, test suites, và linter.
