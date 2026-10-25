# Hızlı Okuma (RSVP)

Kelimeleri ekranın ortasında tek tek gösteren hızlı okuma programı. Her kelimede gözün odaklanacağı harf
renkli gösterilir (ORP, "en iyi tanıma noktası"), böylece göz satırda gezinmeden okur.
Fotoğraftaki metni otomatik okur ve kütüphanede saklar.

Tek bir HTML dosyasıdır, kurulum gerekmez.

## Kullanım
1. `Baslat.bat` dosyasına çift tıkla. Program tarayıcıda açılır.
   (Python gerekir. Simge durumunda küçük bir pencere açılır; kapatırsan program durur.)
2. **Metin Ekle** sekmesinde metni yapıştır ya da fotoğrafı sürükle / `Ctrl+V` ile yapıştır.
3. **Oku** sekmesinde `Boşluk` ile başlat.

Programı hep `Baslat.bat` ile aç. Kütüphane tarayıcıda bu adrese bağlı saklanır.

## Özellikler
- Hız: dakikada 60–1500 kelime, aynı anda 1–4 kelime
- Virgül, cümle sonu, paragraf, uzun kelime ve sayılarda ayarlanabilir duraklama
- Yavaş başlama (ısınma), 3-2-1 geri sayım, durunca birkaç kelime geri sarma
- 11 renk teması (kırmızı-sarı, göz yormayan koyu, gece, Spritz, sepya, disleksi dostu, renk körü dostu,
  yüksek kontrast…). Hepsi WCAG kontrast oranıyla ölçüldü; bloktaki harf rengi otomatik okunaklı seçilebilir
- Odak stili, odak işareti (üçgen / çizgi), Poppins ve diğer yazı tipleri, boyut, kalınlık
- Fotoğraftan metin okuma (Türkçe, İngilizce, İspanyolca, Almanca), birden fazla fotoğrafı birleştirme
- Kütüphane: kaldığın yerden devam, arama, yedek indirme / geri yükleme
- Metnin tamamını açıp bir kelimeye tıklayarak oradan devam etme

## Klavye
| Tuş | İşlev |
|---|---|
| `Boşluk` | Başlat / durdur |
| `←` `→` | Bir kelime geri / ileri |
| `Ctrl` + `←` `→` | Bir cümle geri / ileri |
| `↑` `↓` | Hız ±25 |
| `1`–`4` | Aynı anda gösterilen kelime sayısı |
| `R` | Baştan |
| `F` | Tam ekran |

## Gizlilik
- **Tamamen çevrimdışı çalışır.** Program internete hiç bağlanmaz; her şey bu klasörün içindedir.
- Metinler, fotoğraflar ve kütüphane **sadece senin bilgisayarında**, tarayıcının içinde kalır. Hiçbir sunucuya gönderilmez.
- Fotoğraftan metin okuma ([Tesseract.js](https://github.com/naptha/tesseract.js) 5.1.1) tarayıcının içinde çalışır.
  Motor, çekirdek ve 4 dilin verisi `vendor/tesseract/` klasöründedir (yaklaşık 16 MB). Kaynakları ve
  parmak izleri `vendor/tesseract/KAYNAK.md` dosyasında.
- Güvenlik kuralı (Content-Security-Policy) hem sayfada hem sunucu yanıtlarında: sayfa ve OCR işçisi sadece
  bu klasördeki dosyaları yükleyebilir, başka hiçbir adrese bağlanamaz. Satır içi betik yasaktır; sayfaya
  bir şekilde HTML sızsa bile kod çalıştıramaz. OCR motoru parmak iziyle (SRI) doğrulanır.
- İçe aktarılan yedek dosyaları ve tarayıcı deposundaki kayıtlar her açılışta doğrulanıp temizlenir.
- `Baslat.bat`'ın açtığı yerel sunucu (`sunucu.py`):
  - sadece bu bilgisayardan erişilebilir (`127.0.0.1`), ağdaki diğer cihazlar göremez;
  - izin listesiyle çalışır: sadece programın kendi dosyalarını verir (`.git`, yedekler, başka hiçbir dosya verilmez);
  - `Host` başlığını kontrol eder, böylece kötü niyetli bir site DNS yeniden bağlama ile dosya okuyamaz;
  - portu başka programla paylaşmaz; port doluysa uyarır ve tarayıcıyı açmaz.
- Tarayıcı verilerini silersen kütüphane de silinir. Arada bir **Kütüphane → Yedeği indir** ile yedek al.
  Yedek dosyaları (`*.json`) metinlerini içerir, paylaşırken dikkat et.

## Bilinmesi gereken
- Araştırmalar, hız arttıkça anlamanın düştüğünü gösteriyor. Dakikada 250–400 kelime çoğu metin için rahattır;
  yoğun ya da teknik metinlerde yavaşla.
- Fotoğraf ne kadar net, düz ve yakınsa okuma o kadar iyi olur. Okuma güveni düşükse metni kontrol et.

## Lisans
MIT. Ayrıntı için `LICENSE` dosyasına bak. OCR için kullanılan Tesseract.js Apache 2.0 lisanslıdır.
`fonts/` klasöründeki Poppins yazı tipi SIL Open Font License 1.1 ile dağıtılır (`fonts/OFL.txt`);
yerelden yüklenir, Google'a bağlanılmaz.
