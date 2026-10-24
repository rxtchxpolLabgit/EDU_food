# EDU Food Order — ระบบสั่งอาหารออนไลน์ ตึกครุศาสตร์

ระบบเว็บแอปพลิเคชันสำหรับสั่งอาหารล่วงหน้าภายในมหาวิทยาลัย (บริเวณศูนย์อาหารตึกครุศาสตร์) ภายใต้สโลแกน **“สั่งง่าย รับไว ไม่ต้องรอคิว”** พัฒนาขึ้นเพื่อช่วยให้นักศึกษา อาจารย์ และบุคลากรสามารถวางแผนการรับประทานอาหาร สั่งล่วงหน้าตามรอบเวลาเรียน และช่วยให้ร้านค้าสามารถบริหารจัดการคิวและวัตถุดิบได้อย่างมีประสิทธิภาพสูงสุด

---

## 🌟 ฟังก์ชันเด่นของระบบ

### 1. ระบบสำหรับผู้ใช้งาน (User Experience)
- **หน้าแรก (Home)**:
  - ค้นหาร้านอาหาร และเมนูอาหารแบบเรียลไทม์
  - ตัวกรองประเภทร้านอาหาร: ข้าวมันไก่, ก๋วยเตี๋ยวและเกี๊ยวหมูแดง, อาหารตามสั่ง
  - การ์ดร้านอาหารพร้อมสถานะเปิด/ปิด และระยะเวลาเตรียมอาหารโดยประมาณ
- **หน้ารายการอาหาร (Restaurant Menu)**:
  - แยกหมวดหมู่อาหารชัดเจน
  - หน้าต่างปรับแต่งตัวเลือกอาหาร (Customization Modal) เช่น เลือกระดับความเผ็ด, เพิ่มไข่ดาว (+10 บาท), เลือกเส้น, เพิ่มพิเศษ
  - แสดงสถานะอาหารพร้อมขายหรือหมดชั่วคราว
- **ระบบตะกร้าสินค้า (Smart Cart)**:
  - กำหนดเงื่อนไข **1 คำสั่งซื้อต่อ 1 ร้านอาหาร** (Single-Restaurant Rule) เพื่อป้องกันปัญหาการรับอาหารต่างเวลากัน
  - มีกล่องแจ้งเตือนยืนยันหากต้องการสลับร้าน
  - ปรับเพิ่ม/ลดจำนวน ลบรายการ และใส่หมายเหตุอาหาร
- **เลือกรอบเวลารับอาหาร (Pickup Slot Picker)**:
  - คำนวณช่วงเวลารับอาหารอัตโนมัติรอบละ 15 นาทีตามเวลาทำการของร้าน
  - ป้องกันการเลือกรอบเวลาย้อนหลัง หรือเวลาที่ร้านปิด
  - แสดงจำนวนคิวคงเหลือของแต่ละรอบ และแสดงสถานะ "เต็มแล้ว" เมื่อถึงขีดจำกัดความจุ
  - ตรวจสอบรูปแบบเบอร์โทรศัพท์มือถือไทย 10 หลักอย่างถูกต้อง
- **หน้ารายละเอียดและยืนยันคำสั่งซื้อ (Order Confirmation)**:
  - สร้างหมายเลขคำสั่งซื้อเฉพาะ (เช่น `EDU-20261024-8F3K`)
  - ชำระเงินโดยตรงกับทางร้านค้าเมื่อมารับอาหาร (ไม่ต้องผูกบัตรเครดิต)
- **ติดตามสถานะคำสั่งซื้อ (Order Tracking)**:
  - ตรวจสอบคำสั่งซื้อด้วย **หมายเลขออร์เดอร์ + เบอร์โทรศัพท์** ร่วมกันเพื่อความปลอดภัย
  - แสดง Stepper Timeline 6 สถานะ:
    1. รอร้านรับออร์เดอร์
    2. ร้านรับออร์เดอร์แล้ว
    3. กำลังเตรียมอาหาร
    4. พร้อมรับอาหาร
    5. รับอาหารแล้ว
    6. ยกเลิก (พร้อมระบุเหตุผล)

---

### 2. ระบบผู้ดูแลและร้านค้า (Admin Portal)
- **ระบบความปลอดภัยและการเข้าสู่ระบบ (Authentication & Authorization)**:
  - รหัสผ่านถูกเข้ารหัสด้วย **Bcrypt** และตรวจสอบสิทธิ์ผ่าน **JWT Bearer Token**
  - มี Rate Limiting ป้องกันการ Brute Force
- **แดชบอร์ดภาพรวม (Dashboard)**:
  - การ์ดสถิติคำสั่งซื้อวันนี้, ออร์เดอร์ที่กำลังปรุง, ออร์เดอร์ที่พร้อมรับ, ยอดขายรวม และจำนวนร้านค้า
  - กราฟสรุปจำนวนคำสั่งซื้อและรายได้ย้อนหลัง 7 วัน
  - ตารางคำสั่งซื้อล่าสุด 10 รายการ
- **จัดการร้านอาหาร (Restaurant Management)**:
  - เปิด/ปิดร้านค้าชั่วคราวได้ทันที
  - ตั้งเวลาเปิด-ปิดร้าน, เวลาที่ใช้เตรียมอาหาร, ความยาวรอบเวลา (เช่น 15 นาที) และจำนวนออร์เดอร์สูงสุดต่อรอบ
- **จัดการเมนูอาหาร (Menu Management)**:
  - เลือกร้านอาหารที่ต้องการจัดการ
  - เพิ่ม/แก้ไข/ลบเมนูอาหาร กำหนดราคา และอัปโหลดรูปภาพ
  - สลับสถานะอาหารหมดชั่วคราวแบบเรียลไทม์ (ส่งผลต่อหน้าผู้ใช้ทันทีโดยไม่ต้องแก้โค้ด)
  - กำหนดตัวเลือกเพิ่มเติม (Options / Add-ons) พร้อมราคาบวกเพิ่ม
- **จัดการคำสั่งซื้อและพิมพ์ตั๋วครัว (Orders & Kitchen Ticket)**:
  - ดูรายการคำสั่งซื้อทั้งหมด ค้นหาตามหมายเลข ชื่อ หรือเบอร์โทร
  - ตัวกรองตามร้านอาหาร วันที่ และสถานะ
  - อัปเดตสถานะออร์เดอร์ตามขั้นตอนในครัว
  - ยกเลิกคำสั่งซื้อพร้อมระบุเหตุผล
  - **พิมพ์ใบเตรียมอาหาร (Thermal Slip 80mm)** สำหรับแปะหน้ากล่องอาหารหรือส่งให้พ่อครัว

---

## 🍽️ ข้อมูลร้านอาหารเริ่มต้น 3 ร้าน

1. **ข้าวมันไก่ได้เฮียช้าง**:
   - ประเภท: ข้าวมันไก่ (เปิด 07:30 - 16:00 น.)
   - ตัวอย่างเมนู: ข้าวมันไก่ต้ม, ข้าวมันไก่ทอด, ข้าวมันไก่ผสม, ข้าวมันไก่พิเศษจัมโบ้, ซุปมะนาวดอง
   - ตัวเลือก: ส่วนของเนื้อไก่, ไม่เอาหนัง, เพิ่มตับ, พิเศษ
2. **ร้านก๋วยเตี๋ยวเกี๊ยวหมูแดง**:
   - ประเภท: ก๋วยเตี๋ยวและเกี๊ยวหมูแดง (เปิด 08:00 - 17:00 น.)
   - ตัวอย่างเมนู: บะหมี่เกี๊ยวหมูแดง, ก๋วยเตี๋ยวหมูแดง, เกี๊ยวหมูแดงล้วน, บะหมี่แห้งต้มยำ
   - ตัวเลือก: เลือกเส้น, น้ำ/แห้ง/ต้มยำ, ไม่ใส่ถั่วงอก, เพิ่มเกี๊ยว
3. **ร้านอาหารตามสั่ง (ป้าสมร ตึกครุฯ)**:
   - ประเภท: อาหารตามสั่ง (เปิด 08:00 - 18:00 น.)
   - ตัวอย่างเมนู: ข้าวกะเพราหมูสับ, ข้าวคะน้าหมูกรอบ, ข้าวผัดพริกแกงหมูกรอบ, ข้าวผัดหมู/ไก่, ข้าวหมูกระเทียม, ข้าวไข่เจียวทรงเครื่อง
   - ตัวเลือก: ระดับความเผ็ด (ไม่เผ็ด - เผ็ดมาก), ท็อปปิ้งไข่ดาวสุก/ไม่สุก, ไข่เจียว, เพิ่มพิเศษ

---

## 💻 เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: Angular 21 (Standalone Components, Signals, Reactive State), TypeScript, Tailwind CSS, Responsive Design
- **Backend**: Node.js, Express REST API, Knex.js, Zod Validator, Helmet, Rate Limiter
- **Database**: PostgreSQL (Production & Docker) / SQLite dual-mode สำหรับ Local Dev Zero-Setup
- **Security**: JWT Authentication, Bcrypt Password Hashing, Server-side Price Re-calculation, Concurrency Safe Atomic Slot Reservation
- **Containerization**: Docker, Docker Compose, Nginx Multi-stage Build

---

## 🚀 วิธีการติดตั้งและรันระบบ

### บัญชีผู้ดูแลระบบสำหรับเครื่องพัฒนา
- **เบอร์โทรศัพท์**: `0812345678`
- **รหัสผ่าน**: `Admin@EduFood2026`
- ใช้เฉพาะ Local Development และควรเปลี่ยนก่อนใช้งานจริง

---

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำสำหรับ Production)

คัดลอก `.env.example` เป็น `.env` แล้วกำหนดรหัสผ่านฐานข้อมูล, JWT secret (อย่างน้อย 32 ตัวอักษร) และรหัสผ่าน Admin ที่ไม่ซ้ำ จากนั้นรัน:

```bash
cp .env.example .env
docker compose up --build
```

บน PowerShell ใช้ `Copy-Item .env.example .env` แทน `cp` ได้

- **Frontend (Web Application)**: เข้าใช้งานได้ที่ [http://localhost](http://localhost)
- **Backend API**: เข้าใช้งานได้ที่ [http://localhost:5000/api](http://localhost:5000/api)
- ระบบจะสร้างฐานข้อมูล PostgreSQL, รัน Migration และสร้างข้อมูลตั้งต้น 3 ร้านให้อัตโนมัติ

---

### วิธีที่ 2: รันในเครื่องสำหรับ Local Development (Zero-setup)

#### 1. รัน Backend API
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```
Backend API จะเริ่มต้นทำงานที่ `http://localhost:5000`

#### 2. รัน Frontend (Angular)
เปิด Terminal ใหม่แล้วรัน:
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
Frontend จะเริ่มต้นทำงานที่ `http://localhost:4200`

---

## 🧪 การรัน Automated Tests

โปรเจกต์มีชุดทดสอบครอบคลุมทั้ง Flow การสั่งซื้อ, การคำนวณราคาฝั่ง Server, การตรวจสอบรอบเวลา และสิทธิ์ผู้ดูแลระบบ:

```bash
cd backend
npm test
```

ผลการทดสอบ:
```
PASS src/tests/api.spec.ts
  EDU Food Order API Tests
    1. Public Restaurants & Menu API
      √ should list all initial restaurants
      √ should filter restaurants by cuisine
      √ should fetch restaurant menu with options
    2. Pickup Slots & Timing Validation
      √ should generate available pickup slots for tomorrow
      √ should mark past dates or times as unavailable
    3. Order Creation & Server-side Price Calculation
      √ should validate Thai phone number and required fields
      √ should securely compute prices on server and create order
    4. Order Tracking Flow
      √ should successfully track order with matching order number AND phone
    5. Admin Authentication & Role Authorization
      √ should reject unauthorized requests to admin endpoints
      √ should allow admin access with valid JWT token
      √ should allow admin to update order status through valid transitions

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
edu-food-order/
├── backend/
│   ├── src/
│   │   ├── config/             # การตั้งค่า Environment & JWT
│   │   ├── db/                 # Knex connection, migrations, seeds (3 ร้านค้า)
│   │   ├── controllers/        # Restaurant, Order, Admin controllers
│   │   ├── middleware/         # Auth (JWT), Rate limiting, Thai Phone validator
│   │   ├── services/           # Slot Engine (15-min slots) & Server Price Engine
│   │   ├── routes/             # REST API Routes
│   │   ├── tests/              # Jest/Supertest automated tests
│   │   ├── app.ts              # Express App setup
│   │   └── server.ts           # Server bootstrap
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # API service, Cart service, Auth service, Models
│   │   │   ├── shared/         # Navbar, Footer, Status Badge, Toast
│   │   │   └── features/
│   │   │       ├── user/       # Home, RestaurantDetail, Cart, Checkout, Track
│   │   │       └── admin/      # Login, Dashboard, Restaurant, Menu, Orders
│   │   ├── styles.css          # Tailwind CSS & Thermal ticket print styling
│   │   └── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml          # PostgreSQL + Backend + Frontend
├── API_DOCUMENTATION.md        # รายละเอียด REST API ทุก Endpoint
└── README.md
```
