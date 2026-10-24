# เอกสาร API Specification — EDU Food Order (ตึกครุศาสตร์)

Base URL:
- Local Development: `http://localhost:5000/api`
- Docker Deployment: `http://localhost/api` (ผ่าน Nginx Reverse Proxy)

---

## 1. Public Endpoints (สำหรับผู้ใช้งานทั่วไป)

### 1.1 ดูรายการร้านอาหารทั้งหมด
- **Endpoint**: `GET /api/restaurants`
- **Query Parameters**:
  - `search` (string, optional): ค้นหาตามชื่อร้านหรือรายละเอียด
  - `cuisine` (string, optional): กรองตามประเภทอาหาร เช่น `ข้าวมันไก่`, `อาหารตามสั่ง`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ข้าวมันไก่ได้เฮียช้าง",
      "cuisine_type": "ข้าวมันไก่",
      "description": "ข้าวมันไก่สูตรไหหลำแท้ ข้าวนุ่มหอมกระเทียม ไก่ต้มตอนเนื้อฉ่ำ...",
      "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      "opening_time": "07:30",
      "closing_time": "16:00",
      "is_open": true,
      "preparation_minutes": 10,
      "slot_interval_minutes": 15,
      "max_orders_per_slot": 12
    }
  ]
}
```

---

### 1.2 ดูข้อมูลและเมนูของร้านอาหาร
- **Endpoint**: `GET /api/restaurants/:id/menu`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "restaurant": {
      "id": 1,
      "name": "ข้าวมันไก่ได้เฮียช้าง",
      "cuisine_type": "ข้าวมันไก่",
      "is_open": true
    },
    "categories": [
      { "id": 1, "restaurant_id": 1, "name": "ข้าวมันไก่จานเดี่ยว", "sort_order": 1 }
    ],
    "items": [
      {
        "id": 1,
        "restaurant_id": 1,
        "category_id": 1,
        "name": "ข้าวมันไก่ต้ม",
        "description": "ข้าวมันหอมนุ่ม เสิร์ฟพร้อมไก่ตอนเนื้อฉ่ำ แตงกวา น้ำจิ้มสูตรเต้าเจี้ยวพริกขิง",
        "price": 50,
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
        "is_available": true,
        "options": [
          { "id": 1, "option_name": "ขนาดจาน", "option_value": "ธรรมดา", "additional_price": 0 },
          { "id": 2, "option_name": "ขนาดจาน", "option_value": "พิเศษ (+ไก่และข้าว)", "additional_price": 15 }
        ]
      }
    ]
  }
}
```

---

### 1.3 เลือกรอบเวลารับอาหารที่ว่าง (Pickup Slots)
- **Endpoint**: `GET /api/restaurants/:id/pickup-slots`
- **Query Parameters**:
  - `date` (string, YYYY-MM-DD): วันที่ต้องการรับอาหาร (ค่าเริ่มต้นคือวันนี้)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "date": "2026-10-25",
    "restaurant_id": 1,
    "restaurant_name": "ข้าวมันไก่ได้เฮียช้าง",
    "is_open": true,
    "slots": [
      {
        "time": "11:45",
        "datetime": "2026-10-25T11:45:00.000Z",
        "isAvailable": true,
        "maxOrders": 12,
        "reservedOrders": 3,
        "remainingOrders": 9
      },
      {
        "time": "12:00",
        "datetime": "2026-10-25T12:00:00.000Z",
        "isAvailable": false,
        "maxOrders": 12,
        "reservedOrders": 12,
        "remainingOrders": 0,
        "reason": "คิวรับอาหารในช่วงเวลานี้เต็มแล้ว"
      }
    ]
  }
}
```

---

### 1.4 สร้างคำสั่งซื้อใหม่ (Create Order)
- **Endpoint**: `POST /api/orders`
- **Validation Rules**:
  - ตรวจสอบชื่อลูกค้า (`customer_name`) ห้ามว่าง
  - ตรวจสอบรูปแบบเบอร์โทรศัพท์ไทย (`customer_phone`) 10 หลัก (เช่น 0812345678)
  - ระบบคำนวณราคาจากฐานข้อมูลฝั่ง Server เท่านั้น (ป้องกัน Client tampering)
  - จองรอบเวลารับอาหารแบบ Atomic Transaction
- **Request Body**:
```json
{
  "restaurant_id": 1,
  "customer_name": "สมชาย ใจดี",
  "customer_phone": "0891234567",
  "pickup_date": "2026-10-25",
  "pickup_time": "12:15",
  "note": "ขอช้อนส้อม 1 ชุด",
  "items": [
    {
      "menu_item_id": 1,
      "quantity": 2,
      "selected_options": [
        { "option_name": "ขนาดจาน", "option_value": "พิเศษ (+ไก่และข้าว)", "additional_price": 15 }
      ],
      "item_note": "ไม่เอาหนังไก่"
    }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "สร้างคำสั่งซื้อสำเร็จ",
  "data": {
    "order": {
      "id": 14,
      "order_number": "EDU-20261025-A8F2",
      "restaurant_id": 1,
      "customer_name": "สมชาย ใจดี",
      "customer_phone": "0891234567",
      "pickup_date": "2026-10-25",
      "pickup_time": "12:15",
      "subtotal": 130,
      "total": 130,
      "status": "รอร้านรับออร์เดอร์",
      "created_at": "2026-10-24T14:15:00.000Z"
    },
    "restaurant": {
      "id": 1,
      "name": "ข้าวมันไก่ได้เฮียช้าง",
      "cuisine_type": "ข้าวมันไก่"
    }
  }
}
```

---

### 1.5 ติดตามสถานะคำสั่งซื้อ (Track Order)
- **Endpoint**: `GET /api/orders/track`
- **Security Check**: ต้องระบุทั้ง `order_number` และ `customer_phone` ที่ถูกต้องตรงกัน
- **Query Parameters**:
  - `order_number` (string)
  - `phone` (string)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 14,
      "order_number": "EDU-20261025-A8F2",
      "customer_name": "สมชาย ใจดี",
      "customer_phone": "0891234567",
      "pickup_date": "2026-10-25",
      "pickup_time": "12:15",
      "total": 130,
      "status": "ร้านรับออร์เดอร์แล้ว"
    },
    "restaurant": {
      "id": 1,
      "name": "ข้าวมันไก่ได้เฮียช้าง"
    },
    "items": [
      {
        "id": 20,
        "menu_name_snapshot": "ข้าวมันไก่ต้ม",
        "unit_price_snapshot": 65,
        "quantity": 2,
        "subtotal": 130,
        "selected_options": [
          { "option_name": "ขนาดจาน", "option_value": "พิเศษ (+ไก่และข้าว)", "additional_price": 15 }
        ]
      }
    ],
    "history": [
      {
        "previous_status": null,
        "new_status": "รอร้านรับออร์เดอร์",
        "changed_at": "2026-10-24T14:15:00.000Z",
        "note": "สร้างคำสั่งซื้อสำเร็จ"
      },
      {
        "previous_status": "รอร้านรับออร์เดอร์",
        "new_status": "ร้านรับออร์เดอร์แล้ว",
        "changed_at": "2026-10-24T14:16:30.000Z",
        "note": "ร้านค้ายืนยันรับออร์เดอร์"
      }
    ]
  }
}
```

---

## 2. Admin Endpoints (สำหรับผู้ดูแลระบบ)
> หมายเหตุ: ทุก Endpoint ที่ระบุ `(Protected)` ต้องแนบ Header:
> `Authorization: Bearer <JWT_TOKEN>`

### 2.1 เข้าสู่ระบบผู้ดูแล (Admin Login)
- **Endpoint**: `POST /api/admin/auth/login`
- **Request Body**:
```json
{
  "phone": "0812345678",
  "password": "<ค่าจาก ADMIN_DEFAULT_PASSWORD ใน .env>"
}
```

### 2.1.1 กำหนดบัญชีเข้าใช้งานให้ร้านค้า `(Protected)`
- **Endpoint**: `PUT /api/admin/restaurants/:id/account`
- **Request Body**: `{ "phone": "0812345679", "password": "รหัสผ่านอย่างน้อย 8 ตัว" }`
- Admin กำหนดได้หนึ่งบัญชีต่อร้าน เบอร์โทรศัพท์ต้องไม่ซ้ำกับบัญชีอื่น

- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "เข้าสู่ระบบสำเร็จ",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "ผู้ดูแลระบบตึกครุศาสตร์ (Admin)",
      "phone": "0812345678",
      "role": "admin"
    }
  }
}
```

---

### 2.2 ข้อมูลสรุปแดชบอร์ด (Dashboard Stats) `(Protected)`
- **Endpoint**: `GET /api/admin/dashboard`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "todayOrders": 12,
      "inProgressOrders": 4,
      "readyOrders": 2,
      "totalRevenue": 2450,
      "restaurantCount": 3
    },
    "chartData": [
      { "date": "2026-10-20", "orders": 15, "revenue": 1200 },
      { "date": "2026-10-24", "orders": 12, "revenue": 950 }
    ],
    "recentOrders": [ /* 10 รายการล่าสุด */ ]
  }
}
```

---

### 2.3 จัดการร้านอาหาร `(Protected)`
- `GET /api/admin/restaurants`: รายการร้านอาหารทั้งหมด
- `POST /api/admin/restaurants`: เพิ่มร้านอาหารใหม่
- `PUT /api/admin/restaurants/:id`: แก้ไขข้อมูลร้าน (เวลาทำการ, รอบรับอาหาร, เวลาเตรียมอาหาร)
- `PATCH /api/admin/restaurants/:id/status`: สลับสถานะ เปิด/ปิด ร้านชั่วคราว

---

### 2.4 จัดการเมนูอาหารและตัวเลือก `(Protected)`
- `POST /api/admin/restaurants/:id/menu`: เพิ่มเมนูใหม่พร้อมรายการตัวเลือก (Options)
- `PUT /api/admin/menu/:id`: แก้ไขชื่อ ราคา รายละเอียด รูปภาพ และตัวเลือก
- `PATCH /api/admin/menu/:id/availability`: สลับสถานะอาหารพร้อมขาย / หมดชั่วคราว
- `DELETE /api/admin/menu/:id`: ลบเมนูอาหารออกจากระบบ

---

### 2.5 อัปโหลดรูปภาพร้านและเมนู `(Protected)`
- **Endpoint**: `POST /api/admin/uploads`
- **Authorization**: `Authorization: Bearer <token>` สำหรับ Admin
- **Content-Type**: `multipart/form-data`, field `image`
- **ข้อจำกัด**: JPG, PNG หรือ WEBP, ไม่เกิน 5 MB
- **Response**: `{ "success": true, "data": { "image_url": "/uploads/<generated-name>.png" } }`
- ไฟล์เก็บใน `backend/uploads` และคงอยู่หลังรีสตาร์ต Docker ผ่าน volume mount

---

### 2.6 จัดการคำสั่งซื้อและพิมพ์ตั๋วครัว `(Protected)`
- `GET /api/admin/orders`: กรองออร์เดอร์ตามร้าน, สถานะ, วันที่ และค้นหา
- `GET /api/admin/orders/:id`: ดูรายละเอียดคำสั่งซื้อแบบเต็ม
- `PATCH /api/admin/orders/:id/status`: อัปเดตสถานะออร์เดอร์:
```json
{
  "status": "กำลังเตรียมอาหาร",
  "note": "เริ่มลงกระทะ"
}
```
*(สถานะที่รองรับ: `รอร้านรับออร์เดอร์`, `ร้านรับออร์เดอร์แล้ว`, `กำลังเตรียมอาหาร`, `พร้อมรับอาหาร`, `รับอาหารแล้ว`, `ยกเลิก`)*

---

## 3. Restaurant Portal Endpoints (สำหรับบัญชีร้านค้า)
- **เข้าสู่ระบบ**: `POST /api/restaurant-portal/auth/login` ด้วยเบอร์และรหัสผ่านที่ Admin ตั้งไว้
- **ดูออร์เดอร์ของร้านตนเอง**: `GET /api/restaurant-portal/orders` `(Protected)`
- **ดูรายละเอียดออร์เดอร์**: `GET /api/restaurant-portal/orders/:id` `(Protected)`
- **เปลี่ยนสถานะออร์เดอร์**: `PATCH /api/restaurant-portal/orders/:id/status` `(Protected)`
- ร้านค้าเห็นและเปลี่ยนสถานะได้เฉพาะออร์เดอร์ที่ผูกกับร้านของบัญชีนั้น
