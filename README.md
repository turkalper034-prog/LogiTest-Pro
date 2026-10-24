# 🚚 LogiTest Pro

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&color=22C55E&center=true&vCenter=true&width=850&lines=Depo+ve+stok+y%C3%B6netimini+kolayla%C5%9Ft%C4%B1r;FastAPI+ve+React+ile+geli%C5%9Ftirildi;%C3%9Cr%C3%BCnler%2C+stoklar+ve+sipari%C5%9Fler+tek+panelde" alt="LogiTest Pro: depo, stok ve sipariş yönetimi" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker ready" />
</p>

**LogiTest Pro**, ürün, depo, stok hareketi ve sipariş süreçlerini tek bir arayüzden yönetmek için geliştirilmiş tam yığın bir lojistik uygulamasıdır. FastAPI tabanlı REST API; React ve TypeScript arayüzüyle, SQLite veritabanıyla ve Docker Compose desteğiyle birlikte gelir.

## ✨ Öne çıkanlar

- 📦 Ürünleri oluşturma, listeleme, arama, düzenleme ve silme
- 🏬 Depo yönetimi ve ürün bazında stok takibi
- 🔄 Giriş/çıkış stok hareketleri ve hareket geçmişi
- 📊 Stok, ürün ve düşük stok eşiği için analitik özetler
- 🧾 Sipariş oluşturma, arama, detay görüntüleme ve durum akışı
- 🛡️ Girdi doğrulama, benzersiz SKU kontrolü ve yetersiz stok koruması
- 🧪 5 istek ve 24 assertion içeren Postman API test koleksiyonu; Newman ile komut satırından çalıştırma ve HTML raporlama
- 🔧 Jenkins entegrasyonu için çalıştırma ve rapor yayımlama yönergeleri
- 🐳 Docker Compose ile frontend ve API'yi birlikte çalıştırma

## 🧰 Teknolojiler

| Katman | Teknolojiler |
| --- | --- |
| Arayüz | React 18, TypeScript, Vite, Tailwind CSS |
| API | Python 3.11+, FastAPI, Pydantic |
| Veri | SQLAlchemy, SQLite |
| Test | Python `unittest`, Postman |
| Dağıtım | Docker, Docker Compose, Nginx |

## 🚀 Hızlı başlangıç

### Docker ile

Gereksinimler: Docker ve Docker Compose.

```bash
git clone https://github.com/turkalper034-prog/LogiTest-Pro.git
```

```bash
cd LogiTest-Pro
```

```bash
docker compose up --build
```

Uygulama hazır olduğunda:

- 🌐 Arayüz: <http://localhost>
- ⚙️ API: <http://localhost:8000>
- 📚 Swagger dokümantasyonu: <http://localhost:8000/docs>
- ❤️ Sağlık kontrolü: <http://localhost:8000/api/v1/health>

Servisleri durdurmak için `docker compose down` komutunu kullanın. Veritabanı Docker volume'ünde saklanır.

### Yerel geliştirme

Gereksinimler: Python 3.11+, Node.js 18+ ve npm.

**1. API'yi başlatın** (proje kök dizininde):

```bash
cd backend
```

```bash
python -m venv .venv
```

Windows PowerShell'de sanal ortamı etkinleştirin:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux'ta:

```bash
source .venv/bin/activate
```

Ardından API bağımlılıklarını yükleyip sunucuyu çalıştırın:

```bash
pip install -r requirements.txt
```

```bash
uvicorn app.main:app --reload
```

**2. Arayüzü ayrı bir terminalde başlatın:**

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

Geliştirme arayüzü <http://localhost:5173>, API ise <http://localhost:8000> adresinde açılır. Vite, `/api` isteklerini yerel API'ye yönlendirir.

> 🔐 Yerel API ayarlarını özelleştirmek için kökteki `.env.example` dosyasını `backend/.env` konumuna kopyalayın. Docker Compose kullanırken `.env` dosyası proje kökünde olmalıdır. Gerçek anahtarları ve parolaları Git'e eklemeyin; `SECRET_KEY` değerini üretim ortamında mutlaka değiştirin.

## 🧪 Testler

Backend testleri:

```bash
cd backend
```

```bash
python -m unittest discover -s tests -v
```

Frontend derleme kontrolü:

```bash
cd frontend
```

```bash
npm run build
```

## 🧪 API Test Otomasyonu ve CI

LogiTest Pro, Postman koleksiyonuyla API testlerini otomatikleştirir. Koleksiyon ürün listeleme ve getirme, bulunmayan ürünü doğrulama, ürün oluşturma ve yinelenen SKU kontrolü senaryolarını; HTTP durum kodu ve yanıt gövdesi assertion'larıyla kapsar.

### Newman ile testleri çalıştırma

Önce API'yi `http://localhost:8000` adresinde çalıştırın. Newman ve HTML raporlayıcısını kurmak için:

```bash
npm install -g newman newman-reporter-htmlextra
```

Postman koleksiyonunu Newman ile çalıştırın:

```bash
newman run "LogiTest Pro API Tests.postman_collection.json"
```

CLI çıktısına ek olarak etkileşimli HTML raporu oluşturun:

```bash
newman run "LogiTest Pro API Tests.postman_collection.json" --reporters cli,htmlextra --reporter-htmlextra-export "LogiTest-Pro-Newman-Report.html"
```

Oluşturulan `LogiTest-Pro-Newman-Report.html` dosyası `.gitignore` kapsamındadır; her çalıştırmada yerel olarak yeniden oluşturulur.

### Jenkins pipeline durumu

`LogiTest-Pro-API-Automation` Jenkins işi, Pipeline kodunu GitHub deposunun `main` branch'indeki `Jenkinsfile` dosyasından alır ve başarıyla çalıştırır. Newman, Postman API koleksiyonunu çalıştırır; oluşturulan HTML raporu Jenkins HTML Publisher ile yayımlanır. Testlerin çalışabilmesi için API'nin Jenkins agent'ında `http://localhost:8000` adresinde erişilebilir olması gerekir. GitHub push işlemlerinin Jenkins'i otomatik tetiklediği doğrulanmamıştır.

### Son doğrulanan test çalıştırması

Jenkins'te doğrulanan son build sonucu **SUCCESS**: **5 API isteği**, **24 assertion**, **0 başarısız test**. Ortalama API yanıt süresi **41 ms** olarak ölçülmüştür. Newman HTML raporu Jenkins HTML Publisher üzerinden yayımlanmıştır. Sonuçlar sonraki çalıştırmalarda değişebilir.

### GitHub üzerinden Jenkins Pipeline

Jenkins işi **`LogiTest-Pro-API-Automation`**, GitHub deposunun `main` branch'indeki `Jenkinsfile` dosyasını kullanır. Pipeline, Postman API koleksiyonunu Newman ile otomatik çalıştırır ve HTML raporunu Jenkins HTML Publisher ile arşivler.

Son doğrulanan build sonucu **SUCCESS**: **5 istek**, **24 assertion**, **0 başarısız test**. Ortalama API yanıt süresi **41 ms** olarak ölçülmüştür.

Postman'de incelemek veya çalıştırmak için kökteki **`LogiTest Pro API Tests.postman_collection.json`** dosyasını içe aktarın. İstekler varsayılan olarak `http://localhost:8000` adresindeki API'yi kullanır.

## 🔌 API uç noktaları

Tüm API yolları `/api/v1` önekiyle başlar.

| Alan | Uç noktalar |
| --- | --- |
| ❤️ Sağlık | `GET /health` |
| 📦 Ürünler | `GET, POST /products`; `GET, PUT, DELETE /products/{product_id}` |
| 🏬 Depolar | `GET, POST /inventory/warehouses` |
| 🔄 Stok | `GET, POST /inventory/movements`; `GET /inventory/analytics` |
| 🧾 Siparişler | `GET, POST /orders`; `GET /orders/{order_id}`; `PATCH /orders/{order_id}/status` |

## 🗂️ Proje yapısı

```text
.
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI uç noktaları
│   │   ├── core/         # Yapılandırma ve güvenlik
│   │   ├── db/           # Veritabanı bağlantısı
│   │   ├── models/       # SQLAlchemy modelleri
│   │   ├── schemas/      # Pydantic şemaları
│   │   └── services/     # İş kuralları
│   └── tests/            # Backend testleri
├── frontend/
│   └── src/
│       ├── components/   # Uygulama ekranları
│       ├── services/     # API istemcileri
│       └── types/        # TypeScript tipleri
├── docker/               # Docker ve Nginx yapılandırmaları
├── docs/                 # Başlangıç ve kullanım kılavuzu
├── docker-compose.yml
└── LogiTest Pro API Tests.postman_collection.json
```

## 📖 Daha fazla bilgi

Kurulum, doğrulama ve kullanım örnekleri için [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) dosyasına göz atın.

---

<p align="center">📦 Daha düzenli stok, daha akıcı lojistik.</p>
