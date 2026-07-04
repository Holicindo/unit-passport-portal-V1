#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <PZEM004Tv30.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// --- KONFIGURASI WIFI & MQTT ---
// Ganti bagian ini nanti sesuai dengan WiFi yang Anda pakai untuk testing
const char* ssid = "HDA";
const char* password = "Kerjadulu2026";
const char* mqtt_server = "broker.hivemq.com"; // MQTT Publik gratis untuk tes POC
const int mqtt_port = 1883;

// --- IDENTITAS ALAT ---
const char* unit_id = "HC-0001";
const char* mqtt_topic = "holicindo/units/HC-0001/telemetry";

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
  delay(10);
  Serial.println();
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
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
    float tempCabinet = sensors.getTempCByIndex(0);
    float tempEvaporator = sensors.getTempCByIndex(1);
    float tempCondenser = sensors.getTempCByIndex(2);

    // Jika sensor belum dicolok, nilainya akan -127.0 (DEVICE_DISCONNECTED_C)
    // Anda bisa membiarkannya agar tahu sensor mana yang copot di lapangan.

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
