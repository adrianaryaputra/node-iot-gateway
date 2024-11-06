import mqtt, { MqttClient } from "mqtt";
import { MQTTTopic } from "./inapp_mqtt.interface";
import { v4 as uuidv4 } from 'uuid';

// DRIVER LOAD
import { devicePorts } from "../../driver/port/port_serial";

export class InAppMQTTHandler {

    private client: MqttClient;
    private topicCommand: string;
    private topicResponse: string;
    private topicError: string;
    private classes: Record<string, any>;

    constructor(brokerURL: string, topic: MQTTTopic) {
        
        this.client = mqtt.connect(brokerURL);
        this.topicCommand = topic.command || topic.main + "/command"
        this.topicResponse = topic.response || topic.main + "/response"
        this.topicError = topic.error || topic.main + "/error"
        this.classes = {}

        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.client.subscribe(this.topicCommand, (err) => {
                if (err) {
                    console.error('Failed to subscribe to command topic:', err);
                    this.client.publish(this.topicError, JSON.stringify({
                        uniqueID: uuidv4(),
                        message: 'Failed to subscribe to command topic: ' + err,
                        date: new Date()
                    }))
                } else {
                    console.log(`Subscribed to command topic: ${this.topicCommand}`);
                }
            });
        })

        this.client.on('message', async (topic, message) => {
            if (topic === this.topicCommand) {
                const command = JSON.parse(message.toString());
                console.log(`Received command:`, command);
                await this.handleCommand(command);
            }
        })
            
    }


    private async handleCommand(command: { uniqueID: string; className: string; methodName: string; params?: any[] | Record<string, any> }): Promise<void> {
        const { uniqueID, className, methodName, params } = command;
        const targetClass = this.classes[className];

        if (targetClass && typeof targetClass[methodName] === 'function') {
            try {
                let res: { result: any, error?: string, date: Date };

                // Check if params is an array or an object and call the method accordingly
                if (Array.isArray(params)) {
                    res = await targetClass[methodName](...params);
                } else if (typeof params === 'object') {
                    res = await targetClass[methodName](params);
                } else {
                    throw new Error("Invalid params format");
                }

                // Check for errors in response
                if (res.error) {
                    const message = JSON.stringify({ uniqueID, date: res.date, message: res.error });
                    this.client.publish(this.topicError, message, (err) => {
                        if (err) {
                            console.error('Failed to publish error result:', err);
                        } else {
                            console.log('Error result sent to MQTT topic:', this.topicResponse);
                        }
                    });
                } else {
                    const message = JSON.stringify({ uniqueID, date: res.date, message: res.result });
                    this.client.publish(this.topicResponse, message, (err) => {
                        if (err) {
                            console.error('Failed to publish result:', err);
                        } else {
                            console.log('Result sent to MQTT topic:', this.topicResponse);
                        }
                    });
                }

            } catch (error) {
                const errorMessage = JSON.stringify({
                    uniqueID,
                    date: new Date(),
                    message: (error as Error).message
                });
                this.client.publish(this.topicError, errorMessage, (err) => {
                    if (err) {
                        console.error('Failed to publish error message:', err);
                    } else {
                        console.log('Error message sent to MQTT topic:', this.topicError);
                    }
                });
            }

        } else {
            console.error(`Unknown command or method: ${className}.${methodName}`);

            const message = JSON.stringify({ uniqueID, date: new Date(), message: `Unknown command or method: ${className}.${methodName}` });
            this.client.publish(this.topicError, message, (err) => {
                if (err) {
                    console.error('Failed to publish result:', err);
                } else {
                    console.log('Result sent to MQTT topic:', this.topicResponse);
                }
            });
        }
    }



    setDriver(name: string, classObj: any): void {
        // check if classes exist
        this.classes[name] = classObj;
    }

}