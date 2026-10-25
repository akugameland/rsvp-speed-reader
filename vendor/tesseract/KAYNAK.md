# OCR dosyalarının kaynağı

Bu klasördeki dosyalar resmî npm deposundan (registry.npmjs.org) indirildi ve npm'in yayımladığı
sha512 bütünlük değeriyle doğrulandı (2026-10-25). Hiçbiri değiştirilmedi.
Diller: Türkçe (tur), İngilizce (eng), İspanyolca (spa), Almanca (deu).

| Dosya | Paket | Lisans |
|---|---|---|
| `tesseract.min.js`, `worker.min.js` | tesseract.js@5.1.1 (`dist/`) | Apache-2.0 (`LICENSE-tesseract.js.md`) |
| `core/*.wasm.js` | tesseract.js-core@5.1.1 | Apache-2.0 (`core/LICENSE`) |
| `lang/*.traineddata.gz` | @tesseract.js-data/{dil}@1.0.0 (`4.0.0_best_int/`) | Tesseract dil verisi Apache-2.0 (tesseract-ocr/tessdata_best), npm paketi MIT |

## Diğer lisans notları
- `tesseract.min.js.LICENSE.txt`, `worker.min.js.LICENSE.txt`: paketlenmiş küçük kütüphanelerin
  (regenerator-runtime MIT, buffer MIT, ieee754 BSD-3-Clause, zlib.js MIT) notları, pakettekiyle aynı.
- `core/*.wasm.js` içinde Tesseract OCR (Apache-2.0) ve Leptonica görüntü kütüphanesi
  (BSD-2-Clause benzeri, http://leptonica.org/about-the-license.html) derlenmiş olarak bulunur.

## SHA-256
```
8f04aa0cc81e7bde33f80e92fa01a7a665f0b4884d098acf5de9c7104a11dfaa *./core/tesseract-core-lstm.wasm.js
ce20eda9533cbed1e6c2b4276fbae1e0adc61b6754b5513084be601787b457cf *./core/tesseract-core-simd-lstm.wasm.js
306c4280d0cbed46fbff727486bd43b92730181bae80f56941a091f363bdf28b *./lang/deu.traineddata.gz
45b4cb346724ac1774f1c36f42f182b887bcdb28ebe63e6fff90ac41f3fcff91 *./lang/eng.traineddata.gz
40be52f97b5d4eb7460073dc1f94cd546b27150333c0bf854ed7e7132db6bceb *./lang/spa.traineddata.gz
384ba0dc28040451b7818d7d60e0a88df0d3003fa5a01d713a468779bc3d8c04 *./lang/tur.traineddata.gz
a8e29918d098b2b06e1012bdaeffb4aec0445c5d5654709023e0bd1f442a80e8 *./tesseract.min.js
aca1229639fc9907d86f96e825955a2b7c5716d17f3bc3acd71f9c7ab66181fc *./worker.min.js
```
