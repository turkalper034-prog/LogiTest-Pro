# LogiTest Pro - Başlangıç Kılavuzu

LogiTest Pro, profesyonel bir depo ve lojistik yönetim sistemidir. Bu doküman projeyi kurmak ve çalıştırmak için gerekli adımları içerir.

## Ön Koşullar

Aşağıdaki araçların sisteminizde yüklü olduğundan emin olun:

- **Docker** ve **Docker Compose** (Önerilen)
- **Python 3.11+** (Geliştirme için)
- **Node.js 18+** ve **npm** (Geliştirme için)
- SQLite (Python ile birlikte gelir; ayrıca kurulum gerekmez)

## Proje Yapısı

```
LogiTest/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoint'leri
│   │   ├── core/           # Konfigürasyon ve güvenlik
│   │   ├── db/             # Veritabanı bağlantısı
│   │   ├── models/         # Veritabanı modelleri
│   │   ├── schemas/        # Pydantic şemaları
│   │   └── services/       # İş mantığı
│   └── requirements.txt
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # UI bileşenleri
│   │   ├── pages/          # Sayfalar
│   │   ├── services/       # API servisleri
│   │   └── types/          # TypeScript tipleri
│   └── package.json
├── tests/                  # Test otomasyonu
│   ├── api/               # Postman collection
│   ├── ui/                # Selenium testleri
│   └── bdd/               # Cucumber testleri
├── docker/                # Docker konfigürasyonları
├── docker-compose.yml     # Ana Docker Compose dosyası
└── .env.example          # Örnek ortam değişkenleri
```

## Kurulum Adımları

### 1. Depoyu Klonlayın (veya projeyi indirin)

```bash
cd LogiTest
```

### 2. Ortam Değişkenlerini Ayarlayın

Örnek dosyayı kopyalayın ve düzenleyin:

```bash
cp .env.example .env
cp .env.example backend/.env  # Manuel backend çalıştırma için
```

`.env` dosyasını açın ve production ortamı için güvenli değerler girin:
- `SECRET_KEY`: Güçlü bir rastgele anahtar
- `DATABASE_URL`: Veritabanı bağlantı dizesi

### 3. Docker ile Kurulum (Önerilen)

Tüm servisleri başlatmak için:

```bash
docker-compose up -d
```

Bu komut şunları başlatır:
- Kalıcı SQLite veritabanı (Docker volume içinde)
- FastAPI backend (port 8000)
- React frontend (port 80)

Servislerin durumunu kontrol edin:

```bash
docker-compose ps
```

Logları görüntülemek için:

```bash
docker-compose logs -f
```

Servisleri durdurmak için:

```bash
docker-compose down
```

### 4. Manuel Kurulum (Geliştirme İçin)

Eğer Docker kullanmak istemiyorsanız, servisleri manuel olarak başlatabilirsiniz.

#### Backend Kurulumu

```bash
cd backend

# Sanal ortam oluşturun
python -m venv venv

# Sanal ortamı aktive edin
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Uygulamayı başlatın
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Kurulumu

Yeni bir terminal açın:

```bash
cd frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Frontend http://localhost:5173 adresinde çalışacaktır.

## Doğrulama

### Backend Sağlık Kontrolü

Backend API'nin çalıştığını doğrulayın:

```bash
curl http://localhost:8000/api/v1/health
```

Beklenen yanıt:
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "LogiTest Pro API"
}
```

API dokümantasyonunu görmek için:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Erişimi

Tarayıcınızda şu adresleri açın:
- Docker ile: http://localhost
- Manuel kurulum: http://localhost:5173

Frontend, backend ile bağlantı kurmalı ve veritabanı durumunu göstermelidir.

### Veritabanı Bağlantısı

SQLite veritabanı backend ilk açıldığında `backend/logitest.db` dosyasında otomatik oluşturulur. Docker kullanımında dosya kalıcı `sqlite_data` volume'ünde tutulur. Tablo ve kolonları görmek için:

```bash
python -c "import sqlite3; print(sqlite3.connect('backend/logitest.db').execute('SELECT name FROM sqlite_master').fetchall())"
```

## Geliştirme

### Backend Geliştirme

Backend kodunda değişiklik yaptığınızda, `--reload` bayrağı sayesinde otomatik olarak yeniden başlar.

### Frontend Geliştirme

Frontend kodunda değişiklik yaptığınızda, Vite hot-reload özelliği sayesinde tarayıcı otomatik olarak güncellenir.

## Testler

Backend ürün API testlerini çalıştırmak için proje kökünde:

```bash
cd backend
python -m unittest discover -s tests -v
```

Frontend build kontrolü için:

```bash
cd frontend
npm run build
```

## Sorun Giderme

### Port Çakışmaları

Eğer portlar zaten kullanılıyorsa, `docker-compose.yml` dosyasındaki port numaralarını değiştirebilirsiniz.

### Veritabanı Bağlantı Hatası

- `.env` içindeki `DATABASE_URL` değerinin SQLite biçiminde (`sqlite:///./logitest.db`) olduğunu kontrol edin
- Backend'in veritabanı dosyasının bulunduğu dizine yazma izni olduğundan emin olun

### Modül Bulunamadı Hatası

Backend'de bu hatayı alırsanız:
```bash
pip install -r requirements.txt
```

Frontend'de bu hatayı alırsanız:
```bash
npm install
```

## Sonraki Adımlar

### Ürün modülünü öğrenme

CRUD, verideki dört temel işlemdir: **Create** (oluştur), **Read** (oku), **Update** (güncelle) ve **Delete** (sil). Örneğin ürün API'sinde:

```bash
curl http://localhost:8000/api/v1/products
curl -X POST http://localhost:8000/api/v1/products -H "Content-Type: application/json" -d "{\"name\":\"Vida\",\"sku\":\"VIDA-01\",\"quantity\":20,\"price\":1.25}"
curl -X PUT http://localhost:8000/api/v1/products/1 -H "Content-Type: application/json" -d "{\"price\":1.5}"
curl -X DELETE http://localhost:8000/api/v1/products/1
```

`GET /api/v1/products/{id}` belirli bir ürünü okur; `GET /api/v1/products?search=vida` isim ve SKU içinde arama yapar. `POST`, `PUT` ve `DELETE` sırasıyla kayıt ekler, değiştirir ve kaldırır. İsim/SKU boş olamaz; SKU tekrarlanamaz; fiyat ve stok sıfırdan küçük olamaz.

Stok miktarı ürün güncelleme endpoint'i ile doğrudan değiştirilemez; bunun yerine `POST /api/v1/inventory/warehouses` ile depo ekleyin ve `POST /api/v1/inventory/movements` ile giriş/çıkış kaydedin. Örnek hareket:

```json
{"product_id": 1, "warehouse_id": 1, "movement_type": "outbound", "quantity": 2, "note": "Sipariş sevki"}
```

Hareket ve ürün stoğu tek veritabanı işlemiyle güncellenir. Yetersiz stokta istek `409` döner; stok değişmez ve hareket kaydı eklenmez. Hareketlerin `GET /api/v1/inventory/movements` geçmişi SQLite'tan okunur. `GET /api/v1/inventory/analytics?low_stock_threshold=10` ürün, stok, değer, kategori ve hareket sayılarını mevcut veriden hesaplar.

Sipariş API'si `GET /api/v1/orders?search=ORD-...` ile arar/listeler, `GET /api/v1/orders/{id}` ile ayrıntı döndürür, `POST /api/v1/orders` ile depo ve ürün/miktar satırlarından sipariş oluşturur. `PATCH /api/v1/orders/{id}/status` durumunu günceller. Durum sırası `pending → confirmed → processing → shipped → delivered`; `pending` ve `confirmed` siparişler `cancelled` olabilir. Stok yalnızca `processing → shipped` geçişinde, sipariş ve stok hareketleriyle aynı SQLite transaction'ında düşer. Aynı duruma tekrar gönderilen istek idempotenttir; aynı stok iki kez düşülmez. Sipariş satırlarındaki fiyat, oluşturulma anındaki ürün fiyatının kopyasıdır.

SQLAlchemy'deki `Product` sınıfı Python nesnelerini SQLite'taki `products` tablosuna eşler. Örneğin `Product(name="Vida", sku="VIDA-01", quantity=20, price=1.25)` bir ürün nesnesidir; `db.add(...)` ve `db.commit()` SQLite dosyasına kalıcı yazar. Pydantic şemaları API isteğini doğrular, FastAPI endpoint'i doğrulanan veriyi veritabanı oturumuna aktarır.

React ekranı `frontend/src/services/products.ts` üzerinden `/api/v1/products` adresine HTTP istekleri gönderir. Vite geliştirme proxy'si `/api` isteklerini FastAPI'ye yönlendirir; FastAPI yanıtı JSON olarak tabloya gelir. Böylece örneğin ekleme formundaki **Create product** işlemi `POST` endpoint'ini, tabloda **Edit** ve **Delete** ise `PUT` ve `DELETE` endpoint'lerini çağırır.

## Destek

Sorularınız için proje dokümantasyonunu inceleyin veya geliştirici ekibiyle iletişime geçin.
