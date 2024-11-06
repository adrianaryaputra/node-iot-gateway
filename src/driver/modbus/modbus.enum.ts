export enum ModbusMethod {
    ReadCoils = "readCoils",
    ReadDiscreteInputs = "readDiscreteInputs",
    ReadHoldingRegisters = "readHoldingRegisters",
    ReadInputRegisters = "readInputRegisters",
    WriteCoil = "writeCoil",
    WriteRegister = "writeRegister",
    WriteCoils = "writeCoils",
    WriteRegisters = "writeRegisters",
}

export enum ConnectionType {
    RTU = "RTU",
    TCP = "TCP",
}