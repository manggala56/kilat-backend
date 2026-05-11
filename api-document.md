# Kilatz API Documentation

> **Versi:** v1  
> **Base URL:** `https://yourdomain.com/api/v1`  
> **Format:** JSON  
> **Last Updated:** 2026-05-11

---

## 🔐 Autentikasi & Keamanan

Semua request ke API harus menyertakan **dua lapisan keamanan** berikut:

### 1. API Key (Wajib semua endpoint)

Dikirim via HTTP Header untuk memastikan request berasal dari aplikasi Kilatz resmi.

```
X-Api-Key: YOUR_APP_API_KEY
```

> Nilai API Key dikonfigurasi lewat variabel environment `APP_API_KEY` di server.

### 2. Bearer Token — Sanctum (Wajib endpoint terproteksi)

Token personal kasir/pemilik yang didapat setelah login.

```
Authorization: Bearer {sanctum_token}
```

### 3. Tenant Resolver Header (Wajib endpoint yang butuh data toko)

Menentukan toko mana yang sedang diakses. Bisa menggunakan salah satu dari header berikut:

```
X-Tenant-ID: nama-toko-saya
```
*Atau (Legacy/Modul 1):*
```
X-Tenant-ID: nama-toko-saya
```

> Nilai ini adalah `store_id` yang terdaftar di tabel `tenants`.

### Ringkasan Keamanan per Tipe Endpoint

| Tipe Endpoint | `X-Api-Key` | `Authorization` | `X-Tenant-ID` / `Alias` |
|---|---|---|---|
| Public (ping/login) | ✅ | ❌ | ❌ |
| Authenticated | ✅ | ✅ | ✅ |

---

## 📦 Standard Response Format

### ✅ Success

```json
{
  "status": "success",
  "message": "Deskripsi opsional",
  "data": { }
}
```

### ❌ Error

```json
{
  "status": "error",
  "message": "Pesan error yang jelas",
  "errors": {
    "field_name": ["Validasi error message"]
  }
}
```

### HTTP Status Codes

| Kode | Arti |
|---|---|
| `200` | OK — Request berhasil |
| `201` | Created — Data baru berhasil dibuat |
| `400` | Bad Request — Header atau parameter kurang/salah |
| `401` | Unauthorized — API Key atau Token tidak valid |
| `403` | Forbidden — Tidak punya akses ke resource ini |
| `404` | Not Found — Data tidak ditemukan / store tidak aktif |
| `422` | Unprocessable — Validasi gagal / stok tidak cukup |
| `429` | Too Many Requests — Rate limit terlampaui (60 req/menit) |
| `500` | Server Error |

---

## ⚡ Rate Limiting

Semua endpoint dibatasi **60 request per menit per IP address**.

Saat limit terlampaui, server akan mengembalikan `HTTP 429`.

---

## 🔐 Modul 1 — Authentication

### `POST /auth/login`

Autentikasi user (kasir/owner) dan dapatkan Bearer Token.

**Headers:**
```
X-Api-Key: YOUR_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "owner@kilatz.com",
  "password": "password",
  "device_name": "iPhone 15 Pro"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "message": "Login berhasil.",
  "data": {
    "token": "1|abcde1234567890...",
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "owner@kilatz.com",
      "role": "owner"
    }
  }
}
```

---

### `POST /auth/logout`

Hapus token akses yang sedang digunakan.

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
```

**Response `200`:**
```json
{
  "status": "success",
  "message": "Logout berhasil."
}
```

---

## 🔵 Modul 1 — System & Health

### `GET /ping`

Cek apakah API berjalan dengan baik.

**Headers:**
```
X-Api-Key: YOUR_KEY
```

**Response `200`:**
```json
{
  "status": "success",
  "message": "API is running"
}
```

---

### `GET /user`

Ambil data user yang sedang login beserta tenant aktifnya.

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
X-Tenant-ID: nama-toko
```

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "budi@kilatz.com"
    },
    "active_tenant": {
      "id": 3,
      "business_name": "Warung Kopi Budi",
      "store_id": "warung-kopi-budi",
      "status": "active"
    }
  }
}
```

---

## 🟢 Modul 2 — Master Data & Catalog

### `GET /catalog/sync`

Tarik semua data (Kategori, Produk, Varian) sekaligus untuk cache offline di HP kasir.

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
X-Tenant-ID: nama-toko
```

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "categories": [
      { "id": 1, "name": "Minuman", "slug": "minuman" }
    ],
    "products": [
      {
        "id": 5,
        "category_id": 1,
        "name": "Es Teh Manis",
        "sku": "SKU-ESTH01",
        "price": "5000.00",
        "stock": 100,
        "has_variants": true,
        "image": "/storage/tenants/3/products/es-teh.jpg",
        "variants": [
          {
            "id": 2,
            "product_id": 5,
            "name": "Ekstra Keju",
            "additional_price": "5000.00",
            "stock": 50
          }
        ]
      }
    ],
    "synced_at": "2026-05-11T02:20:00+07:00"
  }
}
```

---

### `POST /catalog/products`

Tambah produk baru beserta variannya (opsional).

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
X-Tenant-ID: nama-toko
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Es Jeruk",
  "category_id": 1,
  "sku": "SKU-ESJRK01",
  "description": "Jeruk segar diperas langsung",
  "price": 8000,
  "stock": 50,
  "low_stock_threshold": 10,
  "has_variants": true,
  "variants": [
    { "name": "Ekstra Madu", "additional_price": 3000, "stock": 30 },
    { "name": "Tanpa Gula", "additional_price": 0, "stock": 20 }
  ]
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | string | ✅ | Nama produk |
| `category_id` | integer | ❌ | ID kategori |
| `sku` | string | ❌ | Auto-generate jika kosong |
| `price` | number | ✅ | Harga dasar produk |
| `stock` | integer | ✅ | Jumlah stok awal |
| `low_stock_threshold` | integer | ❌ | Default: 5 |
| `has_variants` | boolean | ❌ | Default: false |
| `variants` | array | ❌ | Daftar varian produk |

**Response `201`:**
```json
{
  "status": "success",
  "message": "Produk berhasil ditambahkan.",
  "data": {
    "id": 6,
    "name": "Es Jeruk",
    "sku": "SKU-ESJRK01",
    "price": "8000.00",
    "stock": 50,
    "variants": []
  }
}
```

---

### `PUT /catalog/products/{id}`

Update data produk yang sudah ada.

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
X-Tenant-ID: nama-toko
Content-Type: application/json
```

**Request Body** *(semua field opsional, kirim hanya yang ingin diubah):*
```json
{
  "name": "Es Jeruk Peras",
  "price": 9000,
  "stock": 80,
  "is_active": true
}
```

**Response `200`:**
```json
{
  "status": "success",
  "message": "Produk berhasil diperbarui.",
  "data": {}
}
```

---

## 🟡 Modul 2 — Inventory

### `GET /inventory/status`

Cek status stok semua produk aktif. Termasuk daftar produk yang stoknya di bawah threshold.

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
X-Tenant-ID: nama-toko
```

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "inventory": [
      {
        "id": 5,
        "name": "Es Teh Manis",
        "sku": "SKU-ESTH01",
        "stock": 3,
        "low_stock_threshold": 10
      }
    ],
    "low_stock_count": 1,
    "low_stock_items": [
      { "id": 5, "name": "Es Teh Manis", "stock": 3, "low_stock_threshold": 10 }
    ]
  }
}
```

---

### `POST /inventory/adjust`

Penyesuaian stok manual (Stock Opname). Otomatis mencatat audit log perubahan stok.

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
X-Tenant-ID: nama-toko
Content-Type: application/json
```

**Request Body:**
```json
{
  "product_id": 5,
  "new_quantity": 50,
  "type": "opname",
  "notes": "Stok opname mingguan"
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `product_id` | integer | ✅ | ID produk yang disesuaikan |
| `new_quantity` | integer | ✅ | Jumlah stok baru (bukan delta) |
| `type` | string | ✅ | `opname` / `restock` / `damage` / `sale_correction` |
| `notes` | string | ❌ | Catatan alasan penyesuaian |

**Response `200`:**
```json
{
  "status": "success",
  "message": "Stok berhasil disesuaikan.",
  "data": {
    "product_id": 5,
    "product_name": "Es Teh Manis",
    "quantity_before": 3,
    "quantity_after": 50,
    "delta": 47
  }
}
```

---

## 🔴 Modul 2 — POS Engine (Transaksi)

### `POST /pos/checkout`

Proses satu struk kasir secara real-time. Server **otomatis memotong stok** setiap produk/varian.

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
X-Tenant-ID: nama-toko
Content-Type: application/json
```

**Request Body:**
```json
{
  "payment_method": "cash",
  "amount_paid": 50000,
  "discount_amount": 2000,
  "notes": "Pelanggan langganan",
  "transacted_at": "2026-05-11T09:00:00+07:00",
  "items": [
    {
      "product_id": 5,
      "product_variant_id": null,
      "quantity": 2
    },
    {
      "product_id": 6,
      "product_variant_id": 2,
      "quantity": 1
    }
  ]
}
```

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `payment_method` | string | ✅ | `cash` / `qris` / `transfer` |
| `amount_paid` | number | ✅ | Uang yang dibayarkan pelanggan |
| `discount_amount` | number | ❌ | Total diskon (nominal, bukan %) |
| `transacted_at` | datetime | ❌ | Default: waktu server saat ini |
| `items` | array | ✅ | Minimal 1 item |
| `items.*.product_id` | integer | ✅ | ID produk |
| `items.*.product_variant_id` | integer | ❌ | ID varian (jika ada) |
| `items.*.quantity` | integer | ✅ | Jumlah yang dibeli, min 1 |

**Response `201`:**
```json
{
  "status": "success",
  "message": "Transaksi berhasil.",
  "data": {
    "id": 101,
    "receipt_number": "RCP-ABC123XYZ9",
    "subtotal": "18000.00",
    "discount_amount": "2000.00",
    "total_amount": "16000.00",
    "amount_paid": "50000.00",
    "change_amount": "34000.00",
    "payment_method": "cash",
    "status": "completed",
    "transacted_at": "2026-05-11T09:00:00.000000Z",
    "items": [
      {
        "product_name": "Es Teh Manis",
        "unit_price": "5000.00",
        "quantity": 2,
        "subtotal": "10000.00"
      }
    ]
  }
}
```

**Error `422` — Stok tidak cukup:**
```json
{
  "status": "error",
  "message": "Stok produk 'Es Teh Manis' tidak cukup."
}
```

---

### `POST /pos/sync-offline`

Kirim **bulk array** transaksi dari HP kasir yang baru mendapat sinyal internet.

**Headers:**
```
X-Api-Key: YOUR_KEY
Authorization: Bearer {token}
X-Tenant-ID: nama-toko
Content-Type: application/json
```

**Request Body:**
```json
{
  "transactions": [
    {
      "payment_method": "cash",
      "amount_paid": 20000,
      "transacted_at": "2026-05-11T08:10:00+07:00",
      "items": [
        { "product_id": 5, "quantity": 2 }
      ]
    },
    {
      "payment_method": "qris",
      "amount_paid": 8000,
      "transacted_at": "2026-05-11T08:25:00+07:00",
      "items": [
        { "product_id": 6, "product_variant_id": 2, "quantity": 1 }
      ]
    }
  ]
}
```

**Response `200` — Semua Berhasil:**
```json
{
  "status": "success",
  "message": "2 transaksi berhasil disinkronkan.",
  "data": {
    "synced": ["RCP-OFFL-AB12CD34", "RCP-OFFL-EF56GH78"],
    "failed": []
  }
}
```

**Response `200` — Partial (ada yang gagal):**
```json
{
  "status": "success",
  "message": "1 transaksi berhasil disinkronkan.",
  "data": {
    "synced": ["RCP-OFFL-AB12CD34"],
    "failed": [
      {
        "index": 1,
        "reason": "Stok produk 'Es Jeruk' tidak cukup."
      }
    ]
  }
}
```

---

## 🔷 Modul 3 — Shift & Cash Management *(Planned)*

### `POST /shifts/open`

Buka shift/laci kasir baru dengan modal awal.

**Request Body:**
```json
{
  "cashier_id": 5,
  "starting_cash": 150000
}
```

---

### `POST /shifts/petty-cash`

Catat uang keluar/masuk di luar transaksi (kas kecil).

**Request Body:**
```json
{
  "shift_id": 12,
  "type": "out",
  "amount": 20000,
  "reason": "Beli Galon"
}
```

| Field `type` | Keterangan |
|---|---|
| `out` | Uang keluar (pengeluaran) |
| `in` | Uang masuk (penerimaan lain-lain) |

---

### `POST /shifts/close`

Tutup shift dan hitung variance (selisih kas aktual vs sistem).

**Request Body:**
```json
{
  "shift_id": 12,
  "actual_cash": 2500000
}
```

**Response (planned):**
```json
{
  "status": "success",
  "data": {
    "shift_id": 12,
    "expected_cash": 2480000,
    "actual_cash": 2500000,
    "variance": 20000,
    "variance_status": "surplus"
  }
}
```

---

## 🟣 Modul 3 — Employee & Authorization *(Planned)*

### `POST /auth/override`

Validasi PIN Manager untuk otorisasi aksi sensitif (void, diskon manual).

**Request Body:**
```json
{
  "pin": "123456",
  "action": "void_item"
}
```

| Field `action` | Keterangan |
|---|---|
| `void_item` | Batalkan item dari struk |
| `manual_discount` | Berikan diskon manual |
| `void_transaction` | Batalkan seluruh transaksi |

**Response (planned):**
```json
{
  "authorized": true,
  "manager_id": 2,
  "manager_name": "Rina Manajer"
}
```

---

## 🟤 Modul 3 — CRM & Loyalty *(Planned)*

### `GET /crm/customers/search?phone={query}`

Pencarian pelanggan real-time (autocomplete) saat kasir mengetik nomor HP.

| Parameter | Keterangan |
|---|---|
| `phone` | Nomor HP (minimal 4 digit) |

**Response (planned):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 45,
      "name": "Andi Wijaya",
      "phone": "081234567890",
      "points": 1250,
      "total_transactions": 23
    }
  ]
}
```

---

### `POST /crm/redeem-points`

Validasi dan potong poin loyalty pelanggan sebelum checkout selesai.

**Request Body (planned):**
```json
{
  "customer_id": 45,
  "points_to_redeem": 500
}
```

---

## 📋 Daftar Semua Endpoint

| Metode | Endpoint | Auth | Status | Modul |
|---|---|---|---|---|
| `POST` | `/auth/login` | API Key | ✅ Live | 1 |
| `POST` | `/auth/logout` | API Key + Token | ✅ Live | 1 |
| `GET` | `/ping` | API Key | ✅ Live | 1 |
| `GET` | `/user` | API Key + Token + TenantID | ✅ Live | 1 |
| `GET` | `/catalog/sync` | API Key + Token + TenantID | ✅ Live | 2 |
| `POST` | `/catalog/products` | API Key + Token + TenantID | ✅ Live | 2 |
| `PUT` | `/catalog/products/{id}` | API Key + Token + TenantID | ✅ Live | 2 |
| `GET` | `/inventory/status` | API Key + Token + TenantID | ✅ Live | 2 |
| `POST` | `/inventory/adjust` | API Key + Token + TenantID | ✅ Live | 2 |
| `POST` | `/pos/checkout` | API Key + Token + TenantID | ✅ Live | 2 |
| `POST` | `/pos/sync-offline` | API Key + Token + TenantID | ✅ Live | 2 |
| `POST` | `/shifts/open` | API Key + Token + TenantID | 🔵 Planned | 3 |
| `POST` | `/shifts/petty-cash` | API Key + Token + TenantID | 🔵 Planned | 3 |
| `POST` | `/shifts/close` | API Key + Token + TenantID | 🔵 Planned | 3 |
| `POST` | `/auth/override` | API Key + Token + TenantID | 🔵 Planned | 3 |
| `GET` | `/crm/customers/search` | API Key + Token + TenantID | 🔵 Planned | 3 |
| `POST` | `/crm/redeem-points` | API Key + Token + TenantID | 🔵 Planned | 3 |

---

*Dokumentasi ini dibuat berdasarkan implementasi aktual di codebase Kilatz Backend v1.*
