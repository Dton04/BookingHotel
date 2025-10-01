# Hướng dẫn sử dụng chức năng Quản lý Dịch vụ Khách sạn

## Tổng quan
Chức năng quản lý dịch vụ khách sạn cho phép admin thêm, sửa, xóa và quản lý các dịch vụ của từng khách sạn. Admin cũng có thể tạo và quản lý các danh mục dịch vụ. Người dùng có thể lọc khách sạn theo dịch vụ khi tìm kiếm.

## Tính năng chính

### 1. Quản lý dịch vụ (Admin)
- **Thêm dịch vụ mới**: Tạo dịch vụ với thông tin chi tiết
- **Chỉnh sửa dịch vụ**: Cập nhật thông tin dịch vụ hiện có
- **Xóa dịch vụ**: Xóa dịch vụ không còn sử dụng
- **Bật/tắt dịch vụ**: Kích hoạt hoặc tạm ngưng dịch vụ
- **Lọc và tìm kiếm**: Lọc dịch vụ theo khách sạn, danh mục, trạng thái

### 2. Quản lý danh mục dịch vụ (Admin)
- **Thêm danh mục mới**: Tạo danh mục dịch vụ tùy chỉnh
- **Chỉnh sửa danh mục**: Cập nhật thông tin danh mục
- **Xóa danh mục**: Xóa danh mục không sử dụng (chỉ khi không có dịch vụ nào sử dụng)
- **Bật/tắt danh mục**: Kích hoạt hoặc tạm ngưng danh mục
- **Thống kê danh mục**: Xem số lượng dịch vụ trong từng danh mục
- **Sắp xếp thứ tự**: Điều chỉnh thứ tự hiển thị danh mục

### 3. Hiển thị dịch vụ (User)
- **Bộ lọc dịch vụ**: Lọc khách sạn theo loại dịch vụ mong muốn
- **Hiển thị dịch vụ**: Xem danh sách dịch vụ của từng khách sạn
- **Chi tiết dịch vụ**: Modal hiển thị thông tin chi tiết dịch vụ

## Cấu trúc dữ liệu

### Model Service
```javascript
{
  name: String,           // Tên dịch vụ
  description: String,    // Mô tả dịch vụ
  price: Number,          // Giá dịch vụ
  category: String,       // Danh mục (tham chiếu đến ServiceCategory)
  icon: String,           // Icon FontAwesome
  isAvailable: Boolean,   // Trạng thái hoạt động
  hotelId: ObjectId,      // ID khách sạn
  imageUrl: String,       // URL hình ảnh
  operatingHours: {       // Giờ hoạt động
    open: String,
    close: String
  },
  capacity: Number,       // Sức chứa (0 = không giới hạn)
  requiresBooking: Boolean, // Cần đặt trước
  isFree: Boolean         // Miễn phí
}
```

### Model ServiceCategory
```javascript
{
  name: String,           // Tên danh mục
  value: String,          // Giá trị (unique, lowercase)
  icon: String,           // Icon FontAwesome
  description: String,    // Mô tả danh mục
  color: String,          // Màu sắc hiển thị
  isActive: Boolean,      // Trạng thái hoạt động
  sortOrder: Number,      // Thứ tự hiển thị
  createdBy: ObjectId     // ID người tạo
}
```

### Danh mục dịch vụ mặc định
- **Nhà hàng** (restaurant): Ẩm thực, buffet
- **Spa & Massage** (spa): Dịch vụ thư giãn
- **Phòng gym** (fitness): Tập luyện thể thao
- **Hồ bơi** (pool): Bơi lội, giải trí
- **Vận chuyển** (transport): Đưa đón, taxi
- **Concierge** (concierge): Dịch vụ hỗ trợ
- **Giặt ủi** (laundry): Dịch vụ giặt là
- **Khác** (other): Dịch vụ khác

## API Endpoints

### Public APIs
- `GET /api/services` - Lấy danh sách dịch vụ
- `GET /api/services/:id` - Lấy chi tiết dịch vụ
- `GET /api/services/hotel/:hotelId` - Lấy dịch vụ theo khách sạn
- `GET /api/services/categories` - Lấy danh mục dịch vụ
- `GET /api/service-categories` - Lấy danh sách danh mục dịch vụ
- `GET /api/service-categories/:id` - Lấy chi tiết danh mục dịch vụ

### Admin APIs (Yêu cầu authentication)
- `POST /api/services` - Tạo dịch vụ mới
- `PUT /api/services/:id` - Cập nhật dịch vụ
- `DELETE /api/services/:id` - Xóa dịch vụ
- `PATCH /api/services/:id/toggle` - Bật/tắt dịch vụ
- `POST /api/service-categories` - Tạo danh mục mới
- `PUT /api/service-categories/:id` - Cập nhật danh mục
- `DELETE /api/service-categories/:id` - Xóa danh mục
- `PATCH /api/service-categories/:id/toggle` - Bật/tắt danh mục
- `GET /api/service-categories/:id/stats` - Thống kê danh mục

## Hướng dẫn sử dụng

### Cho Admin

#### Quản lý dịch vụ
1. **Truy cập trang quản lý dịch vụ**:
   - Đăng nhập với tài khoản admin
   - Vào menu "Quản lý dịch vụ" trong dropdown user

2. **Thêm dịch vụ mới**:
   - Click nút "Thêm dịch vụ mới"
   - Điền đầy đủ thông tin bắt buộc (*)
   - Chọn khách sạn và danh mục
   - Click "Tạo dịch vụ"

3. **Chỉnh sửa dịch vụ**:
   - Click nút "Chỉnh sửa" (biểu tượng bút chì)
   - Thay đổi thông tin cần thiết
   - Click "Cập nhật"

4. **Xóa dịch vụ**:
   - Click nút "Xóa" (biểu tượng thùng rác)
   - Xác nhận xóa

5. **Bật/tắt dịch vụ**:
   - Click nút "Kích hoạt/Tạm ngưng" (biểu tượng mắt)
   - Dịch vụ sẽ thay đổi trạng thái ngay lập tức

#### Quản lý danh mục dịch vụ
1. **Truy cập trang quản lý danh mục**:
   - Đăng nhập với tài khoản admin
   - Vào menu "Quản lý danh mục dịch vụ" trong dropdown user

2. **Thêm danh mục mới**:
   - Click nút "Thêm danh mục mới"
   - Điền tên danh mục (giá trị sẽ tự động tạo)
   - Chọn icon và màu sắc
   - Thêm mô tả và thứ tự hiển thị
   - Click "Tạo danh mục"

3. **Chỉnh sửa danh mục**:
   - Click nút "Chỉnh sửa" (biểu tượng bút chì)
   - Thay đổi thông tin cần thiết
   - Click "Cập nhật"

4. **Xem thống kê danh mục**:
   - Click nút "Thống kê" (biểu tượng biểu đồ)
   - Xem số lượng dịch vụ trong danh mục

5. **Xóa danh mục**:
   - Chỉ có thể xóa khi không có dịch vụ nào sử dụng
   - Click nút "Xóa" (biểu tượng thùng rác)
   - Xác nhận xóa

### Cho User

1. **Lọc khách sạn theo dịch vụ**:
   - Vào trang tìm kiếm khách sạn
   - Trong bộ lọc bên trái, chọn "Dịch vụ khách sạn"
   - Tick vào các dịch vụ mong muốn
   - Kết quả sẽ hiển thị khách sạn có dịch vụ tương ứng

2. **Xem dịch vụ khách sạn**:
   - Trong danh sách khách sạn, click nút "Dịch vụ"
   - Modal sẽ hiển thị tất cả dịch vụ của khách sạn đó

3. **Xem chi tiết dịch vụ**:
   - Trong card khách sạn, phần "Dịch vụ khách sạn" hiển thị 6 dịch vụ đầu tiên
   - Click "Dịch vụ" để xem tất cả dịch vụ

## Khởi tạo dữ liệu mẫu

### Chạy script khởi tạo danh mục mặc định
```bash
cd server
node scripts/initServiceCategories.js
```

Script này sẽ tạo các danh mục dịch vụ mặc định nếu chưa có dữ liệu trong database.

## Tính năng nâng cao

### Bộ lọc thông minh
- Lọc theo khách sạn cụ thể
- Lọc theo danh mục dịch vụ
- Lọc theo trạng thái hoạt động
- Kết hợp nhiều bộ lọc

### Phân trang
- Hiển thị 10 dịch vụ/danh mục mỗi trang
- Điều hướng dễ dàng

### Responsive Design
- Tương thích với mobile
- Giao diện thân thiện

### Validation
- Kiểm tra dữ liệu đầu vào
- Thông báo lỗi rõ ràng
- Xác nhận trước khi xóa
- Kiểm tra ràng buộc khi xóa danh mục

### Thống kê
- Số lượng dịch vụ theo danh mục
- Trạng thái hoạt động của dịch vụ
- Biểu đồ trực quan

## Lưu ý quan trọng

1. **Quyền truy cập**: Chỉ admin mới có quyền quản lý dịch vụ và danh mục
2. **Dữ liệu**: Dịch vụ được liên kết với khách sạn cụ thể
3. **Trạng thái**: Dịch vụ và danh mục có thể bật/tắt mà không cần xóa
4. **Giá cả**: Có thể đặt dịch vụ miễn phí hoặc có phí
5. **Đặt trước**: Một số dịch vụ có thể yêu cầu đặt trước
6. **Ràng buộc**: Không thể xóa danh mục đang có dịch vụ sử dụng
7. **Tự động**: Giá trị danh mục được tự động tạo từ tên

## Troubleshooting

### Lỗi thường gặp
1. **Không thể tạo dịch vụ**: Kiểm tra quyền admin và dữ liệu đầu vào
2. **Dịch vụ không hiển thị**: Kiểm tra trạng thái isAvailable
3. **Không thể xóa danh mục**: Kiểm tra xem có dịch vụ nào đang sử dụng không
4. **Lỗi API**: Kiểm tra kết nối server và authentication

### Hỗ trợ
Nếu gặp vấn đề, vui lòng liên hệ admin hoặc kiểm tra console để xem lỗi chi tiết. 