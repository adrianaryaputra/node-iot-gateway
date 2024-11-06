import ModbusRTU from "modbus-serial";
import { ConnectionParams, IntervalParams, MethodParams, ModbusConnection, RemoveIntervalParams } from "./modbus.interface";
import { ConnectionType, ModbusMethod } from "./modbus.enum";

// Main Modbus driver class
class ModbusDriver {
    private connections: Map<string, ModbusConnection>;

    constructor() {
        this.connections = new Map();
    }

    private getConnectionId(address: string, slaveId: number): string {
        return `${address}_${slaveId}`;
    }

    getConnections(): { result: { address: string; slaveId: number }[], date: Date } {
        const activeConnections = Array.from(this.connections.entries()).map(([key]) => {
            const [address, slaveId] = key.split('_');
            return { address, slaveId: parseInt(slaveId) };
        });

        return { result: activeConnections, date: new Date() };
    }

    async connect(params: ConnectionParams): Promise<{ result: string; error?: string; date: Date }> {
        const { type, address, slaveId, baudRate = 9600, port = 502 } = params;
        const connectionId = this.getConnectionId(address, slaveId);

        if (this.connections.has(connectionId)) {
            return { result: "Device already connected", date: new Date() };
        }

        const client = new ModbusRTU();
        try {
            if (type === ConnectionType.RTU) {
                await client.connectRTUBuffered(address, { baudRate });
            } else if (type === ConnectionType.TCP) {
                await client.connectTCP(address, { port });
            }
            client.setID(slaveId);

            this.connections.set(connectionId, { client, connected: true, intervals: new Map() });
            return { result: `Connected to Modbus ${type} device at ${address} with slave ID ${slaveId}`, date: new Date() };
        } catch (error) {
            return { result: "", error: (error as Error).message, date: new Date() };
        }
    }

    async disconnect(params: { address: string; slaveId: number }): Promise<{ result: string; error?: string; date: Date }> {
        const { address, slaveId } = params;
        const connectionId = this.getConnectionId(address, slaveId);
        const connection = this.connections.get(connectionId);

        if (connection && connection.connected) {
            try {
                await connection.client.close(() => {});
                this.connections.delete(connectionId);
                return { result: `Disconnected from device at ${address} with slave ID ${slaveId}`, date: new Date() };
            } catch (error) {
                return { result: "", error: (error as Error).message, date: new Date() };
            }
        } else {
            return { result: "", error: "Device not connected", date: new Date() };
        }
    }

    async once(methodName: ModbusMethod, params: MethodParams): Promise<{ result: any; error?: string; date: Date }> {
        const { address, slaveId, addressOffset, length, value, values } = params;
        const connectionId = this.getConnectionId(address, slaveId);
        const connection = this.connections.get(connectionId);

        if (!connection || !connection.connected) {
            return { result: null, error: "Device not connected", date: new Date() };
        }

        if (methodName in connection.client) {
            try {
                const response = await (connection.client[methodName as keyof ModbusRTU] as any)(addressOffset, length || value || values);
                return { result: response?.data || response, date: new Date() };
            } catch (error) {
                return { result: null, error: (error as Error).message, date: new Date() };
            }
        } else {
            return { result: null, error: `Method ${methodName} not supported`, date: new Date() };
        }
    }

    async setInterval(params: IntervalParams): Promise<{ result: string; date: Date }> {
        const { address, slaveId, methodName, addressOffset, interval } = params;
        const connectionId = this.getConnectionId(address, slaveId);
        const connection = this.connections.get(connectionId);

        if (!connection || !connection.connected) {
            throw new Error("Device not connected");
        }

        const intervalId = `${methodName}_${addressOffset}`;
        if (connection.intervals.has(intervalId)) {
            clearInterval(connection.intervals.get(intervalId)!.timeout);
        }

        const task = () => {
            this.once(methodName, { address, slaveId, addressOffset, length: params.length, value: params.value, values: params.values })
                .then(response => {
                    console.log(`Polling result for ${methodName}:`, response.result);
                })
                .catch(error => {
                    console.error(`Polling error for ${methodName}:`, error);
                });
        };

        connection.intervals.set(intervalId, {
            timeout: setInterval(task, interval),
            duration: interval,
        });

        console.log(`Interval polling set for ${methodName} at ${address}, slaveId ${slaveId}, every ${interval} ms`);

        return { result: `Interval polling set for ${methodName} at ${address}, slaveId ${slaveId}, every ${interval} ms`, date: new Date() };
    }

    async removeInterval(params: RemoveIntervalParams): Promise<{ result: string; error?: string; date: Date }> {
        const { address, slaveId, methodName, addressOffset } = params;
        const connectionId = this.getConnectionId(address, slaveId);
        const connection = this.connections.get(connectionId);

        if (!connection || !connection.connected) {
            throw new Error("Device not connected");
        }

        const intervalId = `${methodName}_${addressOffset}`;
        if (connection.intervals.has(intervalId)) {
            clearInterval(connection.intervals.get(intervalId)!.timeout);
            connection.intervals.delete(intervalId);
            console.log(`Interval polling for ${methodName} at ${address}, slaveId ${slaveId} removed`);
            return { result: `Interval polling removed for ${methodName} at ${address}, slaveId ${slaveId}`, date: new Date() };
        } else {
            return { result: "", error: `No interval polling found for ${methodName} at ${address}, slaveId ${slaveId}`, date: new Date() };
        }
    }

    getIntervals(): { result: { address: string; slaveId: number; methodName: string; addressOffset: number; intervalId: string; duration: number }[], date: Date } {
        const activeIntervals: { address: string; slaveId: number; methodName: string; addressOffset: number; intervalId: string; duration: number }[] = [];

        this.connections.forEach((connection, connectionId) => {
            const [address, slaveId] = connectionId.split('_');
            connection.intervals.forEach((intervalData, intervalId) => {
                const [methodName, addressOffset] = intervalId.split('_');
                activeIntervals.push({
                    address,
                    slaveId: parseInt(slaveId),
                    methodName,
                    addressOffset: parseInt(addressOffset),
                    intervalId,
                    duration: intervalData.duration,
                });
            });
        });

        return { result: activeIntervals, date: new Date() };
    }
}

export const modbusDriver = new ModbusDriver();