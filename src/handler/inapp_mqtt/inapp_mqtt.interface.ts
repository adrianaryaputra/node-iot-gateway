export interface MQTTTopic {
    main: string,
    command?: string,
    response?: string,
    error?: string
}

export interface MQTTMessage {
    uniqueID: string,
    message: any,
    date: Date,
}