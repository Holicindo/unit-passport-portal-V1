#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <PZEM004Tv30.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>

// --- KONFIGURASI MQTT ---
const char* mqtt_server = "broker.hivemq.com"; // MQTT Publik gratis untuk tes POC
const int mqtt_port = 1883;

// --- IDENTITAS ALAT ---
// ⚙️  GANTI nilai unit_id ini agar cocok dengan kolom iot_unit_id di database Supabase.
//     Caranya: buka Admin Dashboard → pilih unit yang akan dipasang ESP32 ini
//     → isi field "IoT Unit ID" dengan nilai yang sama persis dengan di bawah ini.
//     Contoh: jika serial number unit adalah "HLC-COOL-001", set iot_unit_id = "HC-0001"
const char* unit_id = "A26051860";
const char* mqtt_topic = "holicindo/units/A26051860/telemetry";

// --- INISIALISASI KONEKSI ---
WiFiClient espClient;
PubSubClient client(espClient);

// --- INISIALISASI SENSOR ---
// PZEM-004T v4 pada Serial2 (Pindah ke RX=18, TX=19 untuk menghindari konflik internal PSRAM ESP32)
PZEM004Tv30 pzem(Serial2, 18, 19);

// DS18B20 pada GPIO 13 (Pin Aman)
const int oneWireBus = 13;
OneWire oneWire(oneWireBus);
DallasTemperature sensors(&oneWire);

// Sensor Pintu 1 pada GPIO 27
const int doorSensor1Pin = 27;
// Sensor Pintu 2 pada GPIO 26
const int doorSensor2Pin = 26;

unsigned long lastMsg = 0;

void setup_wifi() {
  Serial.println("\nMemulai Sistem WiFiManager...");
  
  // Inisialisasi WiFiManager
  WiFiManager wm;
  

  // ==========================================
  const char* custom_css = 
    "<style>"
    "body { background-color: #F4F7FB; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin:0; padding: 10px; box-sizing:border-box; }"
    "h1 { display: none; }"
    /* Card wrapper — lebih lebar */
    ".wrap { background: #ffffff; padding: 28px 24px 20px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,31,63,0.08); width: 100%; max-width: 480px; margin: 16px auto; box-sizing:border-box; }"
    /* Semua tombol default full-width */
    "a { display:block; text-decoration:none; margin-bottom:10px; }"
    "button { background-color: #2E5BFF !important; color: white; border: none; border-radius: 12px; padding: 14px 20px; font-size: 16px; font-weight: bold; width: 100%; box-shadow: 0 4px 15px rgba(46,91,255,0.25); transition: all 0.3s; display:block; box-sizing:border-box; cursor:pointer; }"
    "button:active { transform: scale(0.97); opacity:0.9; }"
    /* Row khusus Info & Exit — kanan kiri, tombol lebih kecil */
    ".btn-row { display:flex; gap:10px; margin-bottom:10px; }"
    ".btn-row a { flex:1; margin-bottom:0; }"
    ".btn-row button { padding: 9px 8px !important; font-size:14px !important; border-radius:10px !important; opacity:0.82; box-shadow: none !important; }"
    /* Input */
    "input[type=text], input[type=password] { border-radius: 8px !important; border: 1.5px solid #cbd5e1 !important; padding: 12px !important; font-size: 15px !important; margin-bottom: 10px !important; width:100%; box-sizing:border-box; }"
    "input:focus { outline: none; border-color: #2E5BFF !important; box-shadow: 0 0 0 3px rgba(46,91,255,0.1) !important; }"
    /* Logo */
    ".holicindo-logo { text-align: center; margin-bottom: 20px; }"
    ".holicindo-logo svg { width: 56px; height: 60px; color: #2E5BFF; margin-bottom: 10px; }"
    ".holicindo-logo h2 { color: #001F3F; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 2px; }"
    ".holicindo-subtitle { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 5px; }"
    ".holicindo-footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; font-weight: 600; }"
    "hr { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }"
    "</style>"
    "<script>"
    "window.onload = function() {"
    "  var wrap = document.querySelector('.wrap');"
    "  if(wrap) {"
    /* Logo asli Holicindo dari holic-icon.svg (inline SVG) */
    "    var logoSvg = '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 210\" fill=\"none\">' +"
    "      '<polyline points=\"100,8 8,182 20,198 180,198 192,182 100,8\" stroke=\"currentColor\" stroke-width=\"10\" stroke-linejoin=\"miter\" stroke-linecap=\"square\" fill=\"none\"/>' +"
    "      '<line x1=\"93\" y1=\"20\" x2=\"93\" y2=\"198\" stroke=\"currentColor\" stroke-width=\"8\" stroke-linecap=\"square\"/>' +"
    "      '<line x1=\"107\" y1=\"20\" x2=\"107\" y2=\"198\" stroke=\"currentColor\" stroke-width=\"8\" stroke-linecap=\"square\"/>' +"
    "      '<polyline points=\"107,75 150,75 150,128\" stroke=\"currentColor\" stroke-width=\"8\" stroke-linecap=\"square\" stroke-linejoin=\"miter\" fill=\"none\"/>' +"
    "      '<polyline points=\"107,87 138,87 138,128\" stroke=\"currentColor\" stroke-width=\"8\" stroke-linecap=\"square\" stroke-linejoin=\"miter\" fill=\"none\"/>' +"
    "      '<polyline points=\"107,128 168,128 168,175\" stroke=\"currentColor\" stroke-width=\"8\" stroke-linecap=\"square\" stroke-linejoin=\"miter\" fill=\"none\"/>' +"
    "      '<polyline points=\"107,140 156,140 156,175\" stroke=\"currentColor\" stroke-width=\"8\" stroke-linecap=\"square\" stroke-linejoin=\"miter\" fill=\"none\"/>' +"
    "      '</svg>';"
    "    var logoHtml = '<div class=\"holicindo-logo\">' + logoSvg +"
    "      '<h2>HOLICINDO</h2>' +"
    "      '<div class=\"holicindo-subtitle\">Unit Passport Configuration</div>' +"
    "      '</div>';"
    "    wrap.insertAdjacentHTML('afterbegin', logoHtml);"
    /* Cari anchor Info & Exit, wrap jadi row */
    "    var anchors = wrap.querySelectorAll('a');"
    "    var infoA = null, exitA = null;"
    "    for(var i=0;i<anchors.length;i++) {"
    "      var txt = anchors[i].innerText || anchors[i].textContent;"
    "      txt = txt.trim();"
    "      if(txt === 'Info') infoA = anchors[i];"
    "      else if(txt === 'Exit') exitA = anchors[i];"
    "    }"
    "    if(infoA && exitA) {"
    "      var row = document.createElement('div');"
    "      row.className = 'btn-row';"
    "      infoA.parentNode.insertBefore(row, infoA);"
    "      row.appendChild(infoA);"
    "      row.appendChild(exitA);"
    "    }"
    "    var footerHtml = '<div class=\"holicindo-footer\">\u00a9 2026 Holicindo IoT System</div>';"
    "    wrap.insertAdjacentHTML('beforeend', footerHtml);"
    "  }"
    "};"
    "</script>";

  // Terapkan custom styling ke halaman
  wm.setCustomHeadElement(custom_css);
  
  // Mencoba connect ke WiFi yang tersimpan (di memori Flash)
  // Apabila jaringan tidak ditemukan, ESP32 akan otomatis berubah menjadi Access Point
  // dan memancarkan hotspot dengan nama: "Setup Unit Holicindo"
  bool res = wm.autoConnect("Setup Unit Holicindo");
  
  if(!res) {
    Serial.println("Gagal terhubung. ESP32 akan restart otomatis...");
    delay(3000);
    ESP.restart(); // Melakukan restart otomatis jika terjadi kegagalan
    delay(5000);
  }
  
  // Jika sampai sini berarti berhasil terkoneksi ke jaringan
  Serial.println("\nWiFi Sukses Terkoneksi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Mencoba menghubungkan ke MQTT Broker...");
    // Attempt to connect (using unit_id as the MQTT client ID)
    if (client.connect(unit_id)) {
      Serial.println("Sukses terkoneksi MQTT!");
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" mencoba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

void setup() {
  // Setup Serial Monitor untuk melihat log di laptop
  Serial.begin(115200);
  
  // Memulai sensor suhu
  sensors.begin();
  
  // Setup Sensor Pintu (Menggunakan Pull-Up internal agar tidak perlu resistor tambahan)
  pinMode(doorSensor1Pin, INPUT_PULLUP);
  pinMode(doorSensor2Pin, INPUT_PULLUP);
  
  // Memulai koneksi WiFi dan MQTT
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  
  Serial.println("Setup Selesai. Alat siap membaca sensor...");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  // Kirim data setiap 10 detik
  if (now - lastMsg > 10000) {
    lastMsg = now;

    // 1. BACA 3 SENSOR SUHU
    sensors.requestTemperatures(); 
    float tempCabinet    = sensors.getTempCByIndex(0);
    float tempEvaporator = sensors.getTempCByIndex(1);
    float tempCondenser  = sensors.getTempCByIndex(2);

    // ── Sanitasi nilai DS18B20 ──────────────────────────────────────────────
    // -127.0 = DEVICE_DISCONNECTED_C (sensor copot / tidak terpasang)
    //  85.0  = POR default value DS18B20 (power-on reset / konversi gagal)
    // Keduanya bukan suhu valid → kirim sebagai -127 agar dashboard tampilkan "—"
    if (tempCabinet    == 85.0 || tempCabinet    == -127.0) tempCabinet    = -127.0;
    if (tempEvaporator == 85.0 || tempEvaporator == -127.0) tempEvaporator = -127.0;
    if (tempCondenser  == 85.0 || tempCondenser  == -127.0) tempCondenser  = -127.0;
    // ────────────────────────────────────────────────────────────────────────

    // 2. BACA SENSOR KELISTRIKAN
    float voltage = pzem.voltage();
    float current = pzem.current();
    float power = pzem.power();

    // 3. BACA SENSOR PINTU
    // Magnet menempel (pintu tertutup) = LOW (0). Magnet menjauh (pintu terbuka) = HIGH (1).
    bool isDoor1Open = digitalRead(doorSensor1Pin) == HIGH;
    bool isDoor2Open = digitalRead(doorSensor2Pin) == HIGH;

    // Validasi Jika PZEM tidak terbaca (belum dicolok listrik AC), isi dengan 0
    if(isnan(voltage)) {
        voltage = 0.0; 
        current = 0.0; 
        power = 0.0;
    }

    // 4. BUAT PAYLOAD JSON
    // StaticJsonDocument<256> (diperbesar sedikit karena data bertambah)
    StaticJsonDocument<256> doc;
    doc["unitId"] = unit_id;
    doc["tempCabinet"] = tempCabinet;
    doc["tempEvaporator"] = tempEvaporator;
    doc["tempCondenser"] = tempCondenser;
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["power"] = power;
    doc["isDoor1Open"] = isDoor1Open;
    doc["isDoor2Open"] = isDoor2Open;
    

    char jsonBuffer[256];
    serializeJson(doc, jsonBuffer);

    // 4. PRINT KE SERIAL & PUBLISH KE MQTT
    Serial.print("Mengirim Payload: ");
    Serial.println(jsonBuffer);
    
    // Publikasi data ke MQTT
    client.publish(mqtt_topic, jsonBuffer);
  }
}
