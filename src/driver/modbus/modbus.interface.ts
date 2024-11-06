// Define Modbus method types

import ModbusRTU from "modbus-serial";
import { ConnectionType, ModbusMethod } from "./modbus.enum";

// Interface for interval configuration
export interface ModbusInterval {
    timeout: NodeJS.Timeout;
    duration: number;
}

// Interface for each Modbus connection
export interface ModbusConnection {
    client: ModbusRTU;
    connected: boolean;
    intervals: Map<string, ModbusInterval>;
}

// Interface for connection parameters
export interface ConnectionParams {
    type: ConnectionType;
    address: string;
    slaveId: number;
    baudRate?: number;
    port?: number;
}

// Interface for method parameters
export interface MethodParams {
    address: string;
    slaveId: number;
    addressOffset: number;
    length?: number;
    value?: number | boolean;
    values?: number[] | boolean[];
}

// Interface for interval parameters
export interface IntervalParams extends MethodParams {
    methodName: ModbusMethod;
    interval: number;
}

// Interface for interval removal parameters
export interface RemoveIntervalParams {
    address: string;
    slaveId: number;
    methodName: ModbusMethod;
    addressOffset: number;
}