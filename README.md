# 📦 LogiTest Pro

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&color=22C55E&center=true&vCenter=true&width=850&lines=Depo+ve+stok+y%C3%B6netimini+kolayla%C5%9Ft%C4%B1r;FastAPI+ve+React+ile+geli%C5%9Ftirildi;API+testlerini+Newman+ve+Jenkins+ile+otomatikle%C5%9Ftir" alt="LogiTest Pro: envanter yönetimi ve API test otomasyonu" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Newman-FF6C37?logo=postman&logoColor=white" alt="Newman" />
  <img src="https://img.shields.io/badge/Jenkins-Pipeline-D24939?logo=jenkins&logoColor=white" alt="Jenkins Pipeline" />
</p>

**LogiTest Pro**, ürünleri, depoları, stok hareketlerini ve siparişleri yönetmek için geliştirilmiş bir envanter yönetimi uygulamasıdır. Proje; FastAPI tabanlı bir REST API, React/Vite arayüzü ve Postman/Newman API test otomasyonu içerir.

## ✨ Özellikler

- 📦 Ürün oluşturma, listeleme, arama, detay görüntüleme, güncelleme ve silme
- 🏬 Depo yönetimi; giriş/çıkış hareketleri ve stok takibi
- 📊 Stok, ürün, düşük stok eşiği ve hareketler için analitik uç noktaları
- 🧾 Sipariş oluşturma, arama, detay görüntüleme ve durum güncelleme
- ❤️ API sağlık kontrolü ve FastAPI Swagger arayüzü
- 🧪 Postman koleksiyonu ile pozitif ve negatif API senaryoları
- 📊 Newman ile komut satırından test çalıştırma ve HTML raporu üretme
- ⚙️ Jenkins Pipeline ile API testlerini çalıştırma ve HTML raporunu yayımlama
- 🐳 Docker Compose yapılandırması ile uygulamanın container'larda çalıştırılması

## 🧰 Teknolojiler

| Alan | Teknoloji |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Veritabanı | SQLite |
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| API testleri | Postman, Newman, Newman HTML Extra |
| CI | Jenkins Pipeline, HTML Publisher |
| Container | Docker, Docker Compose, Nginx |

## 📋 Gereksinimler

- Python 3 ve `backend/requirements.txt` içindeki bağımlılıklar
- Node.js ve npm
- Postman; Newman çalıştırmak için Node.js/npm
- Docker Desktop veya Docker Engine ve Docker Compose (container ile çalıştırmak için)
- Jenkins, Jenkins Pipeline ve HTML Publisher eklentileri (CI için)

## 🚀 Yerel geliştirme

### Backend

Komutları proje kök dizininde çalıştırın:

```powershell
python -m venv .venv
```

```powershell
.\.venv\Scripts\Activate.ps1
```

```powershell
cd backend
```

```powershell
pip install -r requirements.txt
```

Örnek ortam dosyasını backend dizinine kopyalayın:

```powershell
Copy-Item ..\.env.example .env
```

`.env` içindeki `SECRET_KEY` değerini yerel kullanımınıza göre değiştirin. Örnek dosyadaki değer yalnızca placeholder'dır; gerçek anahtar veya parola değildir. Backend dizinindeyken API'yi başlatın:

```powershell
uvicorn app.main:app --reload
```

Varsayılan yerel API adresi `http://localhost:8000`'dır. Backend'in yapılandırması ve SQLite veritabanı çalışma dizinine bağlıdır; yerel çalıştırmada backend dizininde başlatın.

### Frontend

Yeni bir terminal açıp proje kökünden şu komutları çalıştırın:

```powershell
cd frontend
```

```powershell
npm install
```

```powershell
npm run dev
```

Vite geliştirme sunucusu terminalde gösterilen yerel adreste açılır (varsayılan olarak `http://localhost:5173`).

### API ve Swagger

Backend çalışırken:

- Sağlık kontrolü: `GET http://localhost:8000/api/v1/health`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI şeması: `http://localhost:8000/api/v1/openapi.json`

Temel API yolları (`/api/v1` önekiyle):

| İşlem | Endpoint |
|---|---|
| Ürünleri listeleme / oluşturma | `/api/v1/products` |
| Ürün detayını görüntüleme / güncelleme / silme | `/api/v1/products/{product_id}` |
| Depoları listeleme / oluşturma | `/api/v1/inventory/warehouses` |
| Stok hareketleri ve analitik | `/api/v1/inventory/movements`, `/api/v1/inventory/analytics` |
| Sipariş oluşturma / listeleme / detay | `/api/v1/orders`, `/api/v1/orders/{order_id}` |
| Sipariş durumunu güncelleme | `/api/v1/orders/{order_id}/status` |

Ürün ve sipariş listeleri arama parametrelerini de destekler. İstek gövdeleri, yanıtlar ve geçerli alanlar için çalışan Swagger belgesini esas alın.

## 🐳 Docker Compose

Proje kökünde, Docker Compose yapılandırmasının bulunduğu dizinde:

```powershell
docker compose up --build
```

Container'ları arka planda başlatmak için:

```powershell
docker compose up --build -d
```

Yapılandırmada frontend/Nginx için 80, backend için 8000 portu kullanılır; Nginx `/api` isteklerini backend servisine yönlendirir. SQLite verisi Docker volume üzerinden `/data` altında tutulacak şekilde yapılandırılmıştır. Compose ortamı için kökteki `.env.example` dosyasını `.env` olarak kopyalayın ve placeholder `SECRET_KEY` değerini değiştirin. Yerel makinede Docker kurulu değilse bu adımlar çalıştırılamaz; container başlatılmadan portların ve servislerin kullanılabilir olduğu varsayılmamalıdır.

## 🧪 Postman ve Newman API testleri

Koleksiyonu Postman'e içe aktarmak için proje kökündeki **`LogiTest Pro API Tests.postman_collection.json`** dosyasını seçin. İsteklerin varsayılan API adresi `http://localhost:8000`'dır; testlerden önce API'nin bu adreste çalıştığını doğrulayın.

Mevcut koleksiyon **12 istek ve 50 assertion** içerir. Ürün, depo, stok hareketi ve sipariş oluşturma senaryoları veritabanına kayıt ekleyebilir. Koleksiyonu tekrar çalıştırmak mevcut proje veritabanında test kayıtları bırakabileceğinden, önemli veya paylaşılan veritabanlarında çalıştırmayın.

Newman ve HTML Extra reporter'ı yükleyin:

```powershell
npm install -g newman newman-reporter-htmlextra
```

Proje kök dizininden koleksiyonu çalıştırıp Jenkins ile aynı dosya adına HTML raporu üretin:

```powershell
newman run "LogiTest Pro API Tests.postman_collection.json" --reporters cli,htmlextra --reporter-htmlextra-export "LogiTest-Pro-Newman-Report.html"
```

Komut tekrar çalıştırıldığında proje kökündeki `LogiTest-Pro-Newman-Report.html` yeniden oluşturulur. Raporu tarayıcıda açın:

```powershell
Start-Process ".\LogiTest-Pro-Newman-Report.html"
```

Newman HTML raporları `.gitignore` kapsamındadır; rapor dosyası Git'e eklenmez.

## ⚙️ Jenkins Pipeline

Kök dizindeki `Jenkinsfile`, Postman koleksiyonunu Newman ile çalıştırır ve `LogiTest-Pro-Newman-Report.html` raporunu Jenkins HTML Publisher ile yayımlar. Pipeline komutu koleksiyon ve rapor için proje kökünü kullanır. Testlerin çalışabilmesi için API'nin **Jenkins agent'ında** `http://localhost:8000` adresinde erişilebilir olması gerekir; `localhost`, Jenkins controller'ı değil komutu çalıştıran agent makinesini ifade eder.

Jenkins'te bu repository ve `main` branch'i kullanan bir Pipeline işi yapılandırın. Agent'ta Node.js/npm, Newman, `newman-reporter-htmlextra` ve Jenkins HTML Publisher eklentisi kurulu olmalıdır. Jenkinsfile `bat` adımını kullandığından Windows agent gerektirir. İş yapılandırmasına göre build'i Jenkins arayüzünden başlatın; başarılı veya raporu oluşturmuş bir build sonrasında ilgili build sayfasındaki **LogiTest Pro API Test Raporu** bağlantısından HTML raporuna erişin.

GitHub push işlemlerinin Jenkins build'ini otomatik tetiklediği bu dokümantasyonda doğrulanmış değildir; otomatik tetikleme/webhook yapılandırması olduğu varsayılmamalıdır. Build sonuçları ve test metrikleri çalıştırmadan çalıştırmaya değişebilir.

## ✅ Backend testleri

Proje kökünden backend birim testlerini çalıştırın:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend\tests -v
```

## 🗂️ Proje yapısı

```text
.
├── backend/                         # FastAPI uygulaması, bağımlılıklar ve testler
├── frontend/                        # React/Vite arayüzü
├── docker/                          # Backend/frontend Dockerfile'ları ve Nginx ayarı
├── reports/                         # Yerel test raporları için dizin
├── .env.example                     # Örnek ortam değişkenleri (placeholder değerler)
├── docker-compose.yml               # Yerel container yapılandırması
├── Jenkinsfile                      # Newman CI ve HTML rapor yayımlama adımları
└── LogiTest Pro API Tests.postman_collection.json
```

## 🔐 Güvenlik ve yerel dosyalar

Gerçek sırları, parolaları ve kişisel ortam dosyalarını Git'e eklemeyin. `.env.example` yalnızca örnek yapılandırmadır; üretimde kullanılacak anahtarları güvenli bir secret yönetimiyle sağlayın. SQLite veritabanı, sanal ortamlar, derleme çıktıları ve Newman HTML raporları `.gitignore` kurallarıyla dışarıda tutulur.
