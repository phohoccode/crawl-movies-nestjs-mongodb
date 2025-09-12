# Exception Types

BadRequestException → 400 (client gửi request sai)

UnauthorizedException → 401 (chưa đăng nhập hoặc token không hợp lệ)

ForbiddenException → 403 (không có quyền truy cập)

NotFoundException → 404 (không tìm thấy dữ liệu)

ConflictException → 409 (xung đột dữ liệu, ví dụ: đăng ký user trùng email)

InternalServerErrorException → 500 (lỗi server)
