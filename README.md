# Minh họa Tấn công và Bảo mật API với Lỗ hổng BOLA (Broken Object Level Authorization)

## 1. Giới thiệu

Dự án này minh họa lỗ hổng bảo mật BOLA (Broken Object Level Authorization) trong API Web, một trong những lỗ hổng nguy hiểm nhất theo OWASP API Security Top 10. BOLA xảy ra khi ứng dụng không kiểm tra đúng quyền truy cập ở cấp đối tượng, cho phép người dùng truy cập hoặc sửa đổi dữ liệu của người khác mà họ không được phép truy cập.

### Lỗ hổng BOLA là gì?

BOLA (Broken Object Level Authorization) xảy ra khi một API chỉ xác thực người dùng (authentication) nhưng không kiểm tra xem người dùng đó có quyền truy cập đến tài nguyên cụ thể hay không (authorization). Điều này có thể dẫn đến tình huống người dùng có thể truy cập hoặc sửa đổi dữ liệu của người dùng khác.

## 2. Môi trường Thực nghiệm

### Kiến trúc Hệ thống

Hệ thống bao gồm:
- **Frontend**: Giao diện HTML/CSS/JavaScript đơn giản
- **Backend**: 
  - Server có lỗ hổng bảo mật (Vulnerable) chạy trên cổng 3000
  - Server an toàn (Secure) chạy trên cổng 3001
- **Xác thực**: Sử dụng JWT (JSON Web Token)

### Công nghệ sử dụng
- Node.js và Express.js cho backend
- HTML/CSS/JavaScript cho frontend
- JWT cho xác thực
- Postman cho việc thực hiện các yêu cầu API và khai thác lỗ hổng

### Cấu trúc Dự án
```
student-management/
├── package.json            # Cấu hình dự án và dependencies
├── public/                 # Tệp frontend
│   ├── app.js              # JavaScript client-side
│   └── index.html          # Giao diện người dùng HTML
├── secure/                 # Phiên bản bảo mật của API
│   └── server.js           # API với bảo vệ thích hợp
└── vulnerable/             # Phiên bản có lỗ hổng bảo mật của API
    └── server.js           # API có lỗ hổng BOLA
```

### Tài nguyên API
Cả hai phiên bản của API đều cung cấp các endpoint sau:
- `POST /api/login`: Đăng nhập và lấy token JWT
- `GET /api/users/{userId}`: Lấy thông tin hồ sơ người dùng
- `PUT /api/users/{userId}`: Cập nhật thông tin hồ sơ người dùng
- `GET /api/grades/{userId}`: Lấy điểm của sinh viên
- `PUT /api/grades/{gradeId}`: Cập nhật điểm của sinh viên

### Người dùng mẫu
- Alice: userId = 101, vai trò = student
- Bob: userId = 102, vai trò = student
- Admin: userId = 103, vai trò = admin

## 3. Phương pháp Thực nghiệm

### 3.1. Cài đặt

1. Clone dự án:
```bash
git clone <repository-url>
cd student-management
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Khởi chạy servers:
```bash
npm run start-both  # Chạy cả hai server
```
hoặc
```bash
npm run start-vulnerable  # Chỉ chạy server có lỗ hổng bảo mật
npm run start-secure      # Chỉ chạy server an toàn
```

### 3.2. Kịch bản Khai thác BOLA

#### Kịch bản: Alice truy cập thông tin của Bob

1. **Đăng nhập với tư cách là Alice**:
   - Sử dụng Postman để tạo yêu cầu POST đến `http://localhost:3000/api/login`
   - Body JSON: `{ "username": "alice", "password": "alice123" }`
   - Ghi lại token JWT từ phản hồi

2. **Xem hồ sơ của Bob**:
   - Sử dụng Postman để tạo yêu cầu GET đến `http://localhost:3000/api/users/102`
   - Thêm header Authorization: `Bearer <token của Alice>`
   - Server có lỗ hổng bảo mật sẽ trả về thông tin hồ sơ của Bob

3. **Sửa đổi hồ sơ của Bob**:
   - Tạo yêu cầu PUT đến `http://localhost:3000/api/users/102`
   - Thêm header Authorization: `Bearer <token của Alice>`
   - Body JSON: `{ "name": "Bob bị tấn công bởi Alice" }`
   - Server có lỗ hổng bảo mật sẽ cập nhật tên của Bob

4. **Xem điểm của Bob**:
   - Tạo yêu cầu GET đến `http://localhost:3000/api/grades/102`
   - Thêm header Authorization: `Bearer <token của Alice>`
   - Server có lỗ hổng bảo mật sẽ trả về điểm của Bob

#### Kịch bản: Alice chỉnh sửa điểm của chính mình và của Bob

1. **Đăng nhập với tư cách Alice**:
   - Tạo yêu cầu POST đến `http://localhost:3000/api/login`
   - Body JSON: `{ "username": "alice", "password": "alice123" }`
   - Lưu token JWT từ phản hồi

2. **Chỉnh sửa điểm của chính Alice**:
   - Tạo yêu cầu PUT đến `http://localhost:3000/api/grades/1` (Điểm Toán của Alice)
   - Thêm header: `Authorization: Bearer <token của Alice>`
   - Thêm header: `Content-Type: application/json`
   - Body JSON: `{ "grade": 100 }`
   - Tương tự, sửa điểm Khoa học bằng cách gửi yêu cầu đến `http://localhost:3000/api/grades/2`

3. **Chỉnh sửa điểm của Bob**:
   - Tạo yêu cầu PUT đến `http://localhost:3000/api/grades/3` (Điểm Toán của Bob)
   - Thêm header: `Authorization: Bearer <token của Alice>`
   - Thêm header: `Content-Type: application/json`
   - Body JSON: `{ "grade": 60 }`
   - Tương tự, sửa điểm Khoa học của Bob bằng yêu cầu đến `http://localhost:3000/api/grades/4`

4. **Xác minh điểm đã thay đổi**:
   - Tạo yêu cầu GET đến `http://localhost:3000/api/grades/101` để xem điểm của Alice
   - Tạo yêu cầu GET đến `http://localhost:3000/api/grades/102` để xem điểm của Bob
   - Xác nhận rằng điểm đã được cập nhật theo yêu cầu

#### Lưu ý khi khai thác lỗ hổng BOLA

Phiên bản có lỗ hổng bảo mật (`http://localhost:3000`) cho phép người dùng sửa điểm trực tiếp mà không cần quyền admin. Đây là một ví dụ về lỗ hổng BOLA nghiêm trọng, cho phép người dùng thông thường có thể thao túng dữ liệu mà họ không nên có quyền sửa đổi.

Phiên bản bảo mật (`http://localhost:3001`) đã khắc phục lỗ hổng này bằng cách kiểm tra phân quyền phù hợp. Khi bạn thử thực hiện các bước trên với phiên bản bảo mật, bạn sẽ nhận được thông báo lỗi 403 Forbidden.

### 3.3. Kiểm tra Phiên bản An toàn

Thực hiện các yêu cầu tương tự đối với server an toàn ở cổng 3001. Bạn sẽ thấy rằng các yêu cầu bị từ chối với lỗi 403 Forbidden vì server an toàn thực hiện kiểm tra cấp quyền đúng đắn.

## 4. Phân tích Lỗ hổng và Biện pháp Bảo vệ

### 4.1. Phân tích Lỗ hổng trong Phiên bản có lỗ hổng bảo mật

**Vấn đề**: Server có lỗ hổng bảo mật chỉ kiểm tra xác thực (authentication) mà không kiểm tra ủy quyền (authorization). Nó xác minh rằng người dùng đã đăng nhập, nhưng không kiểm tra xem người dùng đó có quyền truy cập tài nguyên cụ thể hay không.

Ví dụ trong đoạn mã có lỗ hổng bảo mật:
```javascript
app.get('/api/users/:userId', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // VULNERABLE: No check if the logged-in user is requesting their own profile
    // Any authenticated user can access any profile
    const userProfile = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
    };
    
    res.json(userProfile);
});
```

### 4.2. Biện pháp Bảo vệ trong Phiên bản An toàn

**Giải pháp**: Server an toàn thực hiện kiểm tra ủy quyền thích hợp, đảm bảo rằng người dùng chỉ có thể truy cập dữ liệu của chính họ hoặc là quản trị viên.

Ví dụ trong đoạn mã an toàn:
```javascript
app.get('/api/users/:userId', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // SECURE: Check if the logged-in user is requesting their own profile or is an admin
    if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }
    
    const userProfile = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
    };
    
    res.json(userProfile);
});
```

### 4.3. Nguyên tắc Bảo mật Chính

1. **Kiểm tra Ủy quyền Cấp Đối tượng**: Luôn xác minh rằng người dùng có quyền truy cập tài nguyên cụ thể.
2. **Nguyên tắc Đặc quyền Tối thiểu**: Người dùng chỉ nên có quyền truy cập vào dữ liệu mà họ thực sự cần.
3. **Không tin tưởng ID từ Client**: Luôn xác thực ID từ tham số yêu cầu.
4. **Tham chiếu Đối tượng Gián tiếp**: Sử dụng ID không thể đoán được thay vì ID tuần tự khi khả thi.

## 5. Kết luận

Dự án này minh họa tầm quan trọng của việc thực hiện kiểm tra ủy quyền cấp đối tượng trong API. Trong khi xác thực đảm bảo rằng người dùng là ai họ tuyên bố, ủy quyền đảm bảo rằng họ chỉ có thể truy cập dữ liệu mà họ được phép.

BOLA vẫn là một lỗ hổng phổ biến trong API vì lập trình viên thường tập trung vào chức năng và xác thực, nhưng bỏ qua kiểm tra ủy quyền cấp đối tượng. Qua minh họa này, chúng ta có thể thấy rằng việc thêm vài dòng mã để kiểm tra ủy quyền có thể ngăn chặn một lỗ hổng bảo mật nghiêm trọng.

## 6. Tài liệu Tham khảo

1. [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2019/en/0xa1-broken-object-level-authorization/)
2. [OWASP Broken Object Level Authorization Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
3. [JWT.io](https://jwt.io/) - Tìm hiểu về JWT