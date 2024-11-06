import { InAppMQTTHandler } from "./handler/inapp_mqtt/inapp_mqtt_handle";

// driver list
import { devicePorts } from "./driver/port/port_serial";


const inappMQTTHandler = new InAppMQTTHandler('mqtt://127.0.0.1:21883', { main: 'device' });

inappMQTTHandler.setDriver('port', devicePorts);