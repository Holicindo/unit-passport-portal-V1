import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { IotService } from './iot.service';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client!: mqtt.MqttClient;
  private readonly brokerUrl = 'mqtt://broker.hivemq.com:1883';
  private readonly topic = 'holicindo/units/+/telemetry';

  constructor(private readonly iotService: IotService) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
    }
  }

  private connect() {
    this.logger.log(`Menghubungkan ke MQTT Broker: ${this.brokerUrl}`);

    this.client = mqtt.connect(this.brokerUrl, {
      clientId: `holicindo-backend-${Math.random().toString(16).slice(2, 8)}`,
      reconnectPeriod: 5000, // Auto-reconnect setiap 5 detik jika terputus
      connectTimeout: 30000,
    });

    this.client.on('connect', () => {
      this.logger.log('✅ MQTT Broker terkoneksi!');
      this.client.subscribe(this.topic, (err) => {
        if (err) {
          this.logger.error(`Gagal subscribe ke topik: ${err.message}`);
        } else {
          this.logger.log(`📡 Berhasil subscribe ke topik: ${this.topic}`);
        }
      });
    });

    this.client.on('message', (topic: string, payload: Buffer) => {
      try {
        const data = JSON.parse(payload.toString());
        const doorStatus = [
          data.isDoor1Open !== undefined ? (data.isDoor1Open ? 'P1:OPEN' : 'P1:CLOSED') : null,
          data.isDoor2Open !== undefined ? (data.isDoor2Open ? 'P2:OPEN' : 'P2:CLOSED') : null,
          data.isDoor3Open !== undefined ? (data.isDoor3Open ? 'P3:OPEN' : 'P3:CLOSED') : null,
          data.isDoor4Open !== undefined ? (data.isDoor4Open ? 'P4:OPEN' : 'P4:CLOSED') : null,
        ].filter(Boolean).join(' | ');

        const tempCond = data.tempCondenser !== undefined && data.tempCondenser !== -127 ? `${data.tempCondenser}°C` : '—';
        const tempEvap = data.tempEvaporator !== undefined && data.tempEvaporator !== -127 ? `${data.tempEvaporator}°C` : '—';
        const tempCab = data.tempCabinet !== undefined && data.tempCabinet !== -127 ? `${data.tempCabinet}°C` : '—';

        this.logger.log(`📡 [MQTT TELEMETRY] SN: ${data.unitId} | Suhu: [Kabinet: ${tempCab} | Evap: ${tempEvap} | Cond: ${tempCond}] | Pintu: [${doorStatus}] | Volt: ${data.voltage}V`);

        // Teruskan ke IoT Service untuk diproses
        this.iotService.processTelemetry(data).catch((err) => {
          this.logger.error(`Error memproses telemetry: ${err.message}`);
        });
      } catch (err) {
        this.logger.error(`Gagal parse JSON dari topik [${topic}]: ${payload.toString()}`);
      }
    });

    this.client.on('reconnect', () => {
      this.logger.warn('🔄 Mencoba reconnect ke MQTT Broker...');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`MQTT Error: ${err.message}`);
    });

    this.client.on('offline', () => {
      this.logger.warn('📵 MQTT Client offline.');
    });
  }
}
