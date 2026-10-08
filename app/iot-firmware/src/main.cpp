#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <PZEM004Tv30.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>

// =============================================================================
// KONFIGURASI MQTT
// =============================================================================
const char* mqtt_server = "broker.hivemq.com";
const int   mqtt_port   = 1883;

// =============================================================================
// IDENTITAS UNIT
// Sesuaikan dengan serial number unit yang akan dipasang.
// Nilai ini harus sama persis dengan kolom serial_number atau iot_unit_id di DB.
// =============================================================================
const char* unit_id    = "A26051860";
const char* mqtt_topic = "holicindo/units/A26051860/telemetry";

// =============================================================================
// DATA KALIBRASI UNIT (isi setelah unit berjalan penuh)
// =============================================================================
struct UnitCalibration {
    float compressor_normal_ampere  = 4.2;   // Ampere normal kompressor
    float fan_evap_normal_ampere    = 0.8;   // Ampere normal fan evaporator
    float kondensor_normal_ampere   = 1.2;   // Ampere normal fan kondensor
    float cabinet_temp_min          = -2.0;  // Suhu kabinet minimum (°C)
    float cabinet_temp_max          = 10.0;  // Suhu kabinet maksimum (°C)
    float cabinet_temp_critical     = 15.0;  // Suhu kabinet critical (°C)
    int   normal_cooldown_minutes   = 15;    // Waktu normal cooldown (menit)
    int   defrost_cycle_minutes     = 20;    // Durasi normal defrost (menit)
    int   compressor_max_off_minutes= 30;    // Max kompressor boleh off (menit)
    float ampere_tolerance          = 0.3;   // Toleransi ampere (±)
} calibration;

// =============================================================================
// PIN DEFINITION
// D25 & D26 mendukung INPUT_PULLUP internal ESP32 (tidak butuh resistor tambahan!)
// PZEM → Serial2, RX=18, TX=19
// DS18B20 → D13
// =============================================================================
const int DOOR1_PIN   = 25;   // Pintu 1 -> support INPUT_PULLUP
const int DOOR2_PIN   = 26;   // Pintu 2 -> support INPUT_PULLUP
const int DOOR3_PIN   = 27;   // Pintu 3 -> support INPUT_PULLUP
const int DOOR4_PIN   = 14;   // Pintu 4 -> support INPUT_PULLUP
const int DS18B20_PIN = 13;   // Sensor suhu DS18B20

// =============================================================================
// INISIALISASI OBJEK
// =============================================================================
WiFiClient    espClient;
PubSubClient  client(espClient);
PZEM004Tv30   pzem(Serial2, 18, 19);   // Serial2: RX=18, TX=19
OneWire       oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);

unsigned long lastMsg       = 0;
unsigned long lastTempReq   = 0;    // Waktu terakhir requestTemperatures() dipanggil
bool          tempRequested  = false; // Flag: apakah konversi sedang berjalan?
const unsigned long SEND_INTERVAL    = 2000;  // Kirim setiap 2 detik
const unsigned long TEMP_CONV_TIME   = 750;   // DS18B20 butuh ~750ms konversi 12-bit

// =============================================================================
// ANOMALY DURATION TRACKING
// =============================================================================
unsigned long compressor_off_start = 0;
unsigned long led_anomaly_start    = 0;
unsigned long overheat_start       = 0;
bool compressor_was_off  = false;
bool led_was_anomaly     = false;
bool was_overheating     = false;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

int getDurationMinutes(unsigned long start_time) {
    if (start_time == 0) return 0;
    return (millis() - start_time) / 60000;
}

bool isCompressorOn(float current_ampere) {
    float lower = calibration.compressor_normal_ampere - calibration.ampere_tolerance;
    float upper = calibration.compressor_normal_ampere + calibration.ampere_tolerance;
    return (current_ampere >= lower && current_ampere <= upper);
}

bool isMainPowerOn(float voltage) {
    return voltage > 180.0;
}

// =============================================================================
// HEALTH STATUS
// =============================================================================
struct HealthStatus {
    String status;
    String alert_message;
    bool   technician_dispatch;
};

HealthStatus calculateHealthStatus(
    float cabinet_temp, float evap_temp, float condenser_temp,
    float voltage, float current,
    bool door_closed
) {
    HealthStatus health;
    health.technician_dispatch = false;

    bool main_power   = isMainPowerOn(voltage);
    bool compressor_on = isCompressorOn(current);

    // CRITICAL: Kompressor mati padahal power ON dan suhu kabinet tinggi
    if (main_power && !compressor_on && cabinet_temp > calibration.cabinet_temp_max) {
        if (!compressor_was_off) {
            compressor_off_start = millis();
            compressor_was_off   = true;
        }
        int duration = getDurationMinutes(compressor_off_start);
        if (duration > calibration.compressor_max_off_minutes) {
            health.status               = "CRITICAL";
            health.alert_message        = "Compressor Not Starting - " + String(duration) + " mins";
            health.technician_dispatch  = true;
            return health;
        }
    } else {
        compressor_was_off   = false;
        compressor_off_start = 0;
    }

    // CRITICAL: Suhu kabinet melebihi batas critical
    if (cabinet_temp > calibration.cabinet_temp_critical && compressor_on) {
        if (!was_overheating) {
            overheat_start   = millis();
            was_overheating  = true;
        }
        int duration = getDurationMinutes(overheat_start);
        if (duration > calibration.normal_cooldown_minutes) {
            health.status               = "CRITICAL";
            health.alert_message        = "Cooling Failure - Temp: " + String(cabinet_temp, 1) + "°C";
            health.technician_dispatch  = true;
            return health;
        }
    } else {
        was_overheating = false;
        overheat_start  = 0;
    }

    // CRITICAL: Listrik mati
    if (!main_power) {
        health.status               = "CRITICAL";
        health.alert_message        = "Power Outage";
        health.technician_dispatch  = true;
        return health;
    }

    // DEFROST cycle
    if (cabinet_temp > calibration.cabinet_temp_min &&
        cabinet_temp < calibration.cabinet_temp_critical &&
        evap_temp > 0 && compressor_on) {
        health.status        = "DEFROST";
        health.alert_message = "Normal Defrost Cycle";
        return health;
    }

    // NORMAL
    health.status        = "NORMAL";
    health.alert_message = "All Systems Operational";
    return health;
}

// =============================================================================
// WiFi SETUP (WiFiManager — captive portal jika belum ada config)
// =============================================================================
void setup_wifi() {
    Serial.println("\nMemulai WiFiManager...");

    WiFiManager wm;

    const char* custom_css =
        "<style>"
        "body{background:#F4F7FB;font-family:'Segoe UI',sans-serif;color:#1e293b;margin:0;padding:10px}"
        ".wrap{background:#fff;padding:28px 24px;border-radius:20px;box-shadow:0 10px 40px rgba(0,31,63,.08);max-width:480px;margin:16px auto}"
        "button{background:#2E5BFF!important;color:#fff;border:none;border-radius:12px;padding:14px;font-size:16px;font-weight:700;width:100%;cursor:pointer}"
        "input[type=text],input[type=password]{border-radius:8px!important;border:1.5px solid #cbd5e1!important;padding:12px!important;font-size:15px!important;width:100%;box-sizing:border-box}"
        "</style>";

    wm.setCustomHeadElement(custom_css);

    Serial.println("\n>>> MENGHUBUNGKAN KE WIFI... <<<");
    bool res = wm.autoConnect("Setup Unit Holicindo");
    if (!res) {
        Serial.println("Gagal konek WiFi. Restart...");
        delay(3000);
        ESP.restart();
    }

    Serial.println("WiFi berhasil terkoneksi!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
}

// =============================================================================
// MQTT RECONNECT
// =============================================================================
void reconnect() {
    while (!client.connected()) {
        Serial.print("Menghubungkan MQTT (broker.hivemq.com)...");
        String clientId = "ESP32-";
        clientId += unit_id;
        clientId += "-";
        clientId += String(random(0xffff), HEX);

        if (client.connect(clientId.c_str())) {
            Serial.println(" OK!");
        } else {
            Serial.print(" Gagal, rc=");
            Serial.print(client.state());
            Serial.println(". Coba lagi 5 detik...");
            delay(5000);
        }
    }
}

// =============================================================================
// SETUP
// =============================================================================
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("=================================");
    Serial.println("  HOLICINDO IoT Firmware v2.0   ");
    Serial.println("=================================");

    // Inisialisasi sensor suhu
    sensors.begin();
    sensors.setWaitForConversion(false); // Non-blocking: jangan block loop 750ms
    int deviceCount = sensors.getDeviceCount();
    Serial.print("DS18B20 sensor ditemukan: ");
    Serial.println(deviceCount);

    // Scan & print ROM address setiap sensor agar urutan fisik jelas
    DeviceAddress tempAddress;
    for (int i = 0; i < deviceCount; i++) {
        if (sensors.getAddress(tempAddress, i)) {
            Serial.print("  [Index ");
            Serial.print(i);
            Serial.print("] ROM ID: ");
            for (uint8_t b = 0; b < 8; b++) {
                if (tempAddress[b] < 16) Serial.print("0");
                Serial.print(tempAddress[b], HEX);
                if (b < 7) Serial.print(":");
            }
            Serial.println();
        }
    }

    // Setup pin pintu — D25/D26/D27/D14 menggunakan INPUT_PULLUP internal ESP32
    pinMode(DOOR1_PIN, INPUT_PULLUP);
    pinMode(DOOR2_PIN, INPUT_PULLUP);
    pinMode(DOOR3_PIN, INPUT_PULLUP);
    pinMode(DOOR4_PIN, INPUT_PULLUP);
    Serial.println("Door pins configured: D25 (Pintu1), D26 (Pintu2), D27 (Pintu3), D14 (Pintu4) with INPUT_PULLUP");

    // Tes baca awal
    Serial.print("Door 1 init read: ");
    Serial.println(digitalRead(DOOR1_PIN) == LOW ? "CLOSED" : "OPEN");
    Serial.print("Door 2 init read: ");
    Serial.println(digitalRead(DOOR2_PIN) == LOW ? "CLOSED" : "OPEN");
    Serial.print("Door 3 init read: ");
    Serial.println(digitalRead(DOOR3_PIN) == LOW ? "CLOSED" : "OPEN");
    Serial.print("Door 4 init read: ");
    Serial.println(digitalRead(DOOR4_PIN) == LOW ? "CLOSED" : "OPEN");

    // Koneksi WiFi & MQTT
    setup_wifi();
    client.setServer(mqtt_server, mqtt_port);
    client.setBufferSize(512); // PENTING: default PubSubClient hanya 128/256 bytes, JSON kita butuh 512 bytes

    Serial.println("Setup selesai. Mulai kirim data tiap 2 detik (real-time mode)...\n");
}

// =============================================================================
// LOOP
// =============================================================================
void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    unsigned long now = millis();

    // ── Kick off async DS18B20 conversion tiap SEND_INTERVAL ────────────────
    if (!tempRequested && (now - lastMsg >= SEND_INTERVAL)) {
        sensors.requestTemperatures(); // Mulai konversi (non-blocking)
        lastTempReq    = now;
        tempRequested  = true;
    }

    // ── Baca & kirim setelah konversi selesai (≥750ms) ──────────────────────
    if (tempRequested && (now - lastTempReq >= TEMP_CONV_TIME)) {
        tempRequested = false;
        lastMsg = now;

        // ── 1. BACA SENSOR SUHU DS18B20 ─────────────────────────────────
        // (requestTemperatures() sudah dipanggil async di atas, tinggal baca)

        // Koreksi Index: Pada unit dengan 3 sensor tertancap,
        // ROM ID Kondensor terurut di Index 1 dan Evaporator di Index 2.
        float tempCabinet    = sensors.getTempCByIndex(0);
        float tempCondenser  = sensors.getTempCByIndex(1); // Index 1 = Kondensor
        float tempEvaporator = sensors.getTempCByIndex(2); // Index 2 = Evaporator

        // Sanitasi: -127 = sensor tidak terpasang, 85 = power-on reset DS18B20
        if (tempCabinet    == 85.0 || tempCabinet    == -127.0) tempCabinet    = -127.0;
        if (tempEvaporator == 85.0 || tempEvaporator == -127.0) tempEvaporator = -127.0;
        if (tempCondenser  == 85.0 || tempCondenser  == -127.0) tempCondenser  = -127.0;

        Serial.println("--- SENSOR SUHU ---");
        Serial.print("Kabinet   : "); Serial.print(tempCabinet);    Serial.println("°C");
        Serial.print("Evaporator: "); Serial.print(tempEvaporator); Serial.println("°C");
        Serial.print("Kondensor : "); Serial.print(tempCondenser);  Serial.println("°C");

        // ── 2. BACA PZEM (Kelistrikan) ───────────────────────────────────
        float voltage = pzem.voltage();
        float current = pzem.current();
        float power   = pzem.power();

        if (isnan(voltage) || voltage == 0) {
            Serial.println("⚠️  PZEM tidak terbaca — cek kabel TX/RX dan power AC");
            voltage = 0.0;
            current = 0.0;
            power   = 0.0;
        } else {
            Serial.println("--- KELISTRIKAN (PZEM REAL-TIME) ---");
            Serial.print("Tegangan Total : "); Serial.print(voltage); Serial.println(" V");
            Serial.print("Arus Total     : "); Serial.print(current); Serial.println(" A");
            Serial.print("Daya Total     : "); Serial.print(power);   Serial.println(" W");

            Serial.println("\n--- TARGET KALIBRASI BEBAN ARUS (BENCHMARK) ---");
            Serial.print("  [1] Kompresor Normal       : "); Serial.print(calibration.compressor_normal_ampere); Serial.println(" A (±0.3A)");
            Serial.print("  [2] Fan Kondensor Normal    : "); Serial.print(calibration.kondensor_normal_ampere); Serial.println(" A");
            Serial.print("  [3] Fan Evaporator Normal   : "); Serial.print(calibration.fan_evap_normal_ampere); Serial.println(" A");
            float total_estimated = calibration.compressor_normal_ampere + calibration.kondensor_normal_ampere + calibration.fan_evap_normal_ampere;
            Serial.print("  [*] Estimasi Total Peak ON  : ~"); Serial.print(total_estimated); Serial.println(" A");

            Serial.println("--- DIAGNOSA STATUS KOMPONEN ---");
            if (current < 0.2) {
                Serial.println("  Status: IDLE / STANDBY (Kompresor & Fan Mati / Defrost)");
            } else if (current >= (calibration.compressor_normal_ampere - calibration.ampere_tolerance)) {
                Serial.print("  Status: KOMPRESOR AKTIF (ON) - Arus Terdeteksi ");
                Serial.print(current);
                Serial.println(" A (Normal Range)");
            } else if (current > 0.5 && current < (calibration.compressor_normal_ampere - calibration.ampere_tolerance)) {
                Serial.print("  Status: HANYA FAN AKTIF (Kompresor OFF) - Arus Terdeteksi ");
                Serial.print(current);
                Serial.println(" A");
            } else {
                Serial.print("  Status: BEBAN TIDAK DIKENAL / ANOMALI (");
                Serial.print(current);
                Serial.println(" A)");
            }
        }

        // ── 3. BACA SENSOR PINTU (D25, D26, D27, D14) ────────────────────
        int rawD25 = digitalRead(DOOR1_PIN);
        int rawD26 = digitalRead(DOOR2_PIN);
        int rawD27 = digitalRead(DOOR3_PIN);
        int rawD14 = digitalRead(DOOR4_PIN);

        // Dengan INPUT_PULLUP internal:
        //   Kabel nyambung / magnet dekat (closed) -> Pin terhubung ke GND -> LOW (0) -> isDoorOpen = false
        //   Kabel lepas / magnet jauh (open)     -> Ditarik pull-up ke 3.3V -> HIGH (1) -> isDoorOpen = true
        bool isDoor1Open = (rawD25 == HIGH);
        bool isDoor2Open = (rawD26 == HIGH);
        bool isDoor3Open = (rawD27 == HIGH);
        bool isDoor4Open = (rawD14 == HIGH);

        Serial.println("--- STATUS PINTU ---");
        Serial.print("Pintu 1 (D25): "); Serial.print(isDoor1Open ? "BUKA (OPEN)" : "TUTUP (CLOSED)");
        Serial.print("  [Raw Pin: "); Serial.print(rawD25); Serial.println("]");
        Serial.print("Pintu 2 (D26): "); Serial.print(isDoor2Open ? "BUKA (OPEN)" : "TUTUP (CLOSED)");
        Serial.print("  [Raw Pin: "); Serial.print(rawD26); Serial.println("]");
        Serial.print("Pintu 3 (D27): "); Serial.print(isDoor3Open ? "BUKA (OPEN)" : "TUTUP (CLOSED)");
        Serial.print("  [Raw Pin: "); Serial.print(rawD27); Serial.println("]");
        Serial.print("Pintu 4 (D14): "); Serial.print(isDoor4Open ? "BUKA (OPEN)" : "TUTUP (CLOSED)");
        Serial.print("  [Raw Pin: "); Serial.print(rawD14); Serial.println("]");

        // Semua pintu harus tertutup agar dihitung door_closed
        bool allDoorsClosed = (!isDoor1Open && !isDoor2Open && !isDoor3Open && !isDoor4Open);

        // ── 4. HITUNG HEALTH STATUS ──────────────────────────────────────
        HealthStatus health = calculateHealthStatus(
            tempCabinet, tempEvaporator, tempCondenser,
            voltage, current,
            allDoorsClosed
        );

        Serial.println("--- HEALTH STATUS ---");
        Serial.print("Status : "); Serial.println(health.status);
        Serial.print("Pesan  : "); Serial.println(health.alert_message);
        Serial.print("Teknisi: "); Serial.println(health.technician_dispatch ? "DIPERLUKAN" : "TIDAK");

        // ── 5. BUAT PAYLOAD JSON (4 Pintu) ──────────────────────────────
        StaticJsonDocument<512> doc;

        doc["unitId"]         = unit_id;
        doc["tempCabinet"]    = tempCabinet;
        doc["tempEvaporator"] = tempEvaporator;
        doc["tempCondenser"]  = tempCondenser;
        doc["voltage"]        = voltage;
        doc["current"]        = current;
        doc["power"]          = power;
        doc["isDoor1Open"]    = isDoor1Open;
        doc["isDoor2Open"]    = isDoor2Open;
        doc["isDoor3Open"]    = isDoor3Open;
        doc["isDoor4Open"]    = isDoor4Open;

        // Data tambahan health (referensi)
        doc["healthStatus"]   = health.status;
        doc["healthMsg"]      = health.alert_message;
        doc["techDispatch"]   = health.technician_dispatch;

        char jsonBuffer[512];
        serializeJson(doc, jsonBuffer);

        // ── 6. KIRIM KE MQTT ─────────────────────────────────────────────
        Serial.println("--- MQTT PUBLISH ---");
        Serial.println(jsonBuffer);

        bool ok = client.publish(mqtt_topic, jsonBuffer);
        Serial.println(ok ? "✅ Terkirim!" : "❌ Gagal kirim MQTT");
        Serial.println();
    }
}
