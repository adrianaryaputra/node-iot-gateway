import { SerialPort } from 'serialport';
import { PortInfo } from '@serialport/bindings-interface';
import { DevicePortInfo } from './serialport.interface';

// device port driver
class SerialportDriver {
    ports: PortInfo[] = [];

    /**
     * async detect
     */
    public async detect(): Promise<{result: DevicePortInfo[], error?: string, date: Date}> {
        try {
            this.ports = await SerialPort.list();
            return {
                result: this.ports.map((port) => ({
                    path: port.path,
                    manufacturer: port.manufacturer,
                    serialNumber: port.serialNumber,
                    pnpId: port.pnpId,
                    locationId: port.locationId,
                    vendorId: port.vendorId,
                    productId: port.productId
                })),
                date: new Date()
            }
        }
        catch(error) {
            console.error('Error detecting serial ports:', error);
            return { result: [], error: (error as Error).message, date: new Date() };
        }
    }
}

export var serialportDriver = new SerialportDriver()