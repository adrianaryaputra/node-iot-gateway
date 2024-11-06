import { InAppMQTTHandler } from "./handler/inapp_mqtt/inapp_mqtt_handle";

// driver list
import { serialportDriver } from "./driver/serialport/serialport";
import { modbusDriver } from "./driver/modbus/modbus";


const inappMQTTHandler = new InAppMQTTHandler('mqtt://127.0.0.1:21883', { main: 'device' });

inappMQTTHandler.setDriver('serialport', serialportDriver);
inappMQTTHandler.setDriver('modbus', modbusDriver)