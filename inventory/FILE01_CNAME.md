# KIỂM KÊ CHI TIẾT: FILE01 — `CNAME`

- **Đường dẫn:** `C:\Users\umnuar\Downloads\tudien-goc\CNAME`
- **Loại tập tin:** Khác / DNS CNAME Record
- **Số dòng:** 1 dòng (21 bytes)
- **Nội dung thực tế:** `hoctiengxodang.online`

---

## A. HÀM / CLASS / METHOD
*Không có (Tập tin cấu hình tên miền).*

## B. EVENT & BINDING
*Không có.*

## C. PHẦN TỬ HTML TƯƠNG TÁC & SELECTORS
*Không có.*

## D. STATE & DỮ LIỆU
| ID | Tên dữ liệu / Cấu hình | Kiểu | Nơi đọc | Nơi ghi | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S001_F01** | `CNAME` Domain Target | String | GitHub Pages DNS Server | Cấu hình DNS Nhà cung cấp | Trỏ tên miền tùy chỉnh `hoctiengxodang.online` về máy chủ GitHub Pages |

## E. LUỒNG KHỞI TẠO & BẤT ĐỒNG BỘ
*Không có (Phục vụ phân giải DNS cấp hạ tầng mạng).*

## F. UI LOGIC
*Không có.*

## G. CSS
*Không có.*

## H. PHỤ THUỘC & THỨ TỰ NẠP
- Phụ thuộc: DNS Record trỏ về `tudienxedang.github.io`.
- Thứ tự nạp: Phân giải trước khi HTTP request tới máy chủ web.

---

## BƯỚC 2: Tự kiểm đếm CLI
- Lệnh kiểm tra: `Get-Content C:\Users\umnuar\Downloads\tudien-goc\CNAME | Measure-Object -Line`
- Kết quả thực tế: 1 dòng.
- Số mục dữ liệu kiểm kê: 1 mục (S001_F01).
- Trạng thái khớp: 100%.
