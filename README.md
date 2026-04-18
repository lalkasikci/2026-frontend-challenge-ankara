# Jotform Frontend Challenge Project

## User Information
Please fill in your information after forking this repository:

- **Name**: Zeynep Lal Kaşıkçı

## Project Description
**Missing Podo** - Dedektif tarzı bir soruşturma uygulaması. Jotform API'lerinden gerçek verileri çekerek, kişilerin hareketlerini takip eder ve şüpheli sıralaması yapar.

Bu proje, Jotform formlarından gelen check-in, mesaj, gözlem, not ve ihbar verilerini normalize ederek, interaktif bir soruşturma panosu sunar.

## Özellikler
- 🔍 **Gerçek Zamanlı Veri Çekme**: Jotform API'lerinden çoklu form verilerini alır
- 👥 **Dinamik Kişi Kataloğu**: Verilerden otomatik kişi çıkarımı
- 📊 **Şüpheli Sıralaması**: Yakınlık ve kayıt türüne göre puanlama algoritması
- 🕐 **Zaman Çizelgesi**: Kronolojik olay akışı
- 🔎 **Arama ve Filtreleme**: Kişi ve konum bazlı filtreleme
- 📱 **Responsive Tasarım**: Mobil uyumlu modern arayüz

## Teknoloji Stack
- **Frontend**: React 18, Create React App
- **Backend**: Node.js, Express (Proxy Server)
- **API**: Jotform REST API
- **Styling**: Custom CSS (Tailwind-inspired)

## Kurulum ve Çalıştırma Talimatları

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn
- Git

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/[YOUR_USERNAME]/2026-frontend-challenge-ankara.git
cd 2026-frontend-challenge-ankara
```

### 2. Bağımlılıkları Yükleyin
```bash
cd missing-podo
npm install
```

### 3. API Anahtarlarını Yapılandırın
`src/api.js` dosyasında Jotform API anahtarlarınızı ve form ID'lerinizi ayarlayın:

```javascript
// Örnek yapılandırma
export const API_KEYS = [
  'your_api_key_1',
  'your_api_key_2',
  // ...
];

export const FORM_IDS = {
  checkins: 'your_checkin_form_id',
  messages: 'your_messages_form_id',
  // ...
};
```

### 4. Proxy Server'ı Başlatın
Backend proxy server'ı ayrı bir terminalde çalıştırın:
```bash
# missing-podo klasöründe
node server.js
```
Server varsayılan olarak http://localhost:5001 adresinde çalışacaktır.

### 5. React Uygulamasını Başlatın
Yeni bir terminal açın ve frontend'i başlatın:
```bash
# missing-podo klasöründe
npm start
```
Uygulama http://localhost:3000 adresinde açılacaktır.

### 6. Testleri Çalıştırın
```bash
npm test
```

## Proje Yapısı
```
missing-podo/
├── public/                 # Statik dosyalar
├── src/
│   ├── api.js             # API yapılandırması
│   ├── App.js             # Ana uygulama bileşeni
│   ├── App.css            # Özel stiller
│   └── ...
├── server.js              # Proxy server
└── package.json           # Bağımlılıklar
```

## API Yapısı
Uygulama aşağıdaki Jotform form türlerini kullanır:
- **Check-ins**: Kişilerin konum girişleri
- **Messages**: İletişim kayıtları
- **Sightings**: Gözlem raporları
- **Notes**: Özel notlar
- **Tips**: İhbarlar

## Sorun Giderme
- **Port çakışması**: Eğer 3000 veya 5001 portları kullanımda ise, alternatif port kullanın
- **API hataları**: API anahtarlarınızın geçerli olduğundan emin olun
- **CORS hataları**: Proxy server'ın çalıştığından emin olun

## Geliştirme
Bu proje Jotform Frontend Challenge için geliştirilmiştir ve gerçek dünya senaryosu simülasyonu içerir.

