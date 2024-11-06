import ModbusRTU from "modbus-serial";

interface ModbusConnection {
    client: ModbusRTU;
    connected: boolean;
}

class ModbusDriver {
    private connections: Map<string, ModbusConnection>;

    constructor() {
        this.connections = new Map();
    }

    private getConnectionId(port: string, slaveId: number): string {
        return `${port}_${slaveId}`;
    }

    getConnections(): { result: { port: string, slaveId: number }[], date: Date } {
        const activeConnections = Array.from(this.connections.entries()).map(([key, connection]) => {
            const [port, slaveId] = key.split('_');
            return { port, slaveId: parseInt(slaveId) };
        });

        return { result: activeConnections, date: new Date() };
    }

    async connect(params: { port: string; slaveId: number; baudRate?: number }): Promise<{ result: string, error?: string, date: Date }> {
        const { port, slaveId, baudRate = 9600 } = params;
        const connectionId = this.getConnectionId(port, slaveId);

        if (this.connections.has(connectionId)) {
            return { result: "Device already connected", date: new Date() };
        }

        const client = new ModbusRTU();
        try {
            await client.connectRTUBuffered(port, { baudRate });
            client.setID(slaveId);

            this.connections.set(connectionId, { client, connected: true });
            return { result: `Connected to Modbus device on port ${port} with slave ID ${slaveId}`, date: new Date() };
        } catch (error) {
            return { result: "", error: (error as Error).message, date: new Date() };
        }
    }

    async readHoldingRegisters(params: { port: string; slaveId: number; address: number; length: number }): Promise<{ result: number[], error?: string, date: Date }> {
        const { port, slaveId, address, length } = params;
        const connectionId = this.getConnectionId(port, slaveId);
        const connection = this.connections.get(connectionId);

        if (!connection || !connection.connected) {
            return { result: [], error: "Device not connected", date: new Date() };
        }

        try {
            const response = await connection.client.readHoldingRegisters(address, length);
            return { result: response.data, date: new Date() };
        } catch (error) {
            return { result: [], error: (error as Error).message, date: new Date() };
        }
    }

    async writeSingleRegister(params: { port: string; slaveId: number; address: number; value: number }): Promise<{ result: string, error?: string, date: Date }> {
        const { port, slaveId, address, value } = params;
        const connectionId = this.getConnectionId(port, slaveId);
        const connection = this.connections.get(connectionId);

        if (!connection || !connection.connected) {
            return { result: "", error: "Device not connected", date: new Date() };
        }

        try {
            await connection.client.writeRegister(address, value);
            return { result: `Register ${address} written with value ${value}`, date: new Date() };
        } catch (error) {
            return { result: "", error: (error as Error).message, date: new Date() };
        }
    }

    async disconnect(params: { port: string; slaveId: number }): Promise<{ result: string, error?: string, date: Date }> {
        const { port, slaveId } = params;
        const connectionId = this.getConnectionId(port, slaveId);
        const connection = this.connections.get(connectionId);

        if (connection && connection.connected) {
            try {
                await connection.client.close();
                this.connections.delete(connectionId);
                return { result: `Disconnected from device on port ${port} with slave ID ${slaveId}`, date: new Date() };
            } catch (error) {
                return { result: "", error: (error as Error).message, date: new Date() };
            }
        } else {
            return { result: "", error: "Device not connected", date: new Date() };
        }
    }
}

export const modbusDriver = new ModbusDriver();
