import mqtt from "mqtt"
import Switchbot from "node-switchbot"
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config()

dotenv.config({path: __dirname + '/../../.env'})

const switchbot: Switchbot = new Switchbot();

const mqttClient = mqtt.connect(process.env.MQTT_HOST, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    port: +process.env.MQTT_USERNAME
  }
).on("error", function (error) {
  throw new Error(error.message)
});

const mainTopic = "iot/switchbot";
const mapBots: { [key: string]: string } = JSON.parse(fs.readFileSync(__dirname + '/../bots.json', 'utf8'));
const advertisedCollection = new Map();

switchbot.onadvertisement = (ad): void => {
  const name = mainTopic + "/" + mapBots[ad.address];
  const advertised = JSON.stringify(ad)
  advertisedCollection.set(name,advertised)
};

const delay = (ms: number): Promise<unknown> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const loop = true;
while (loop) {
  await switchbot.startScan()
    .then(async () => {
      await delay(1000);
      return switchbot.wait(1000);
    });
  advertisedCollection.forEach((value: string, key: string) => {
    mqttClient.publish(
      key,
      value,
      {
        retain: true,
        qos: 1
      }
    );
  });
}
