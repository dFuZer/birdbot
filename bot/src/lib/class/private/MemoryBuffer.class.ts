import Logger from "../Logger.class";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type ArrayType = Uint8Array | ArrayBuffer;
type SizeType = number | "uint8" | "uint16" | "uint32";
type Endianness = boolean;
type TypedArray = Uint8Array | Uint16Array | Uint32Array | Int8Array | Float32Array | Float64Array;

export default class MemoryBuffer {
    public array: Uint8Array;
    private dataView: DataView;
    public cursor = 0;

    constructor(buffer: ArrayType) {
        this.array = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
        this.dataView = new DataView(this.array.buffer, this.array.byteOffset, this.array.byteLength);
    }

    clone(): MemoryBuffer {
        const clone = new MemoryBuffer(this.array.slice());
        clone.cursor = this.cursor;
        return clone;
    }

    trim(): Uint8Array {
        return this.array.slice(0, this.cursor);
    }

    log(): void {
        Logger.log({
            message: Array.from(this.array)
                .map((b) => b.toString(16).padStart(2, "0"))
                .slice(0, this.cursor)
                .join(" "),
            path: "MemoryBuffer.class.ts",
        });
    }

    readUint8(): number {
        const value = this.dataView.getUint8(this.cursor);
        this.cursor += 1;
        return value;
    }

    readInt8(): number {
        const value = this.dataView.getInt8(this.cursor);
        this.cursor += 1;
        return value;
    }

    readUint16(littleEndian: Endianness = true): number {
        const value = this.dataView.getUint16(this.cursor, littleEndian);
        this.cursor += 2;
        return value;
    }

    readInt16(littleEndian: Endianness = true): number {
        const value = this.dataView.getInt16(this.cursor, littleEndian);
        this.cursor += 2;
        return value;
    }

    readUint32(littleEndian: Endianness = true): number {
        const value = this.dataView.getUint32(this.cursor, littleEndian);
        this.cursor += 4;
        return value;
    }

    readInt32(littleEndian: Endianness = true): number {
        const value = this.dataView.getInt32(this.cursor, littleEndian);
        this.cursor += 4;
        return value;
    }

    readFloat32(littleEndian: Endianness = true): number {
        const value = this.dataView.getFloat32(this.cursor, littleEndian);
        this.cursor += 4;
        return value;
    }

    readFloat64(littleEndian: Endianness = true): number {
        const value = this.dataView.getFloat64(this.cursor, littleEndian);
        this.cursor += 8;
        return value;
    }

    readBigint(): bigint {
        const bytes = this.readUint8Array("uint16");
        let result = 0n;
        for (const [i, byte] of bytes.entries()) {
            result += BigInt(byte) << BigInt(i * 8);
        }
        return result;
    }

    readBoolean(): boolean {
        const value = this.readUint8();
        if (value === 6) return true;
        if (value === 5) return false;
        throw new Error("Value isn't a boolean");
    }

    readUint8Array(size: SizeType, littleEndian: Endianness = true): Uint8Array {
        const length =
            typeof size === "number" ? size : size === "uint16" ? this.readUint16(littleEndian) : this.readUint32(littleEndian);
        const result = this.array.slice(this.cursor, this.cursor + length);
        this.cursor += length;
        return result;
    }

    readUint16Array(size: SizeType, littleEndian: Endianness = true): Uint16Array {
        const length =
            typeof size === "number" ? size : size === "uint16" ? this.readUint16(littleEndian) : this.readUint32(littleEndian);
        const result = new Uint16Array(
            this.array.buffer.slice(this.array.byteOffset + this.cursor, this.array.byteOffset + this.cursor + length * 2),
        );
        this.cursor += length * 2;
        return result;
    }

    readUint32Array(size: SizeType, littleEndian: Endianness = true): Uint32Array {
        const length =
            typeof size === "number" ? size : size === "uint16" ? this.readUint16(littleEndian) : this.readUint32(littleEndian);
        const result = new Uint32Array(
            this.array.buffer.slice(this.array.byteOffset + this.cursor, this.array.byteOffset + this.cursor + length * 4),
        );
        this.cursor += length * 4;
        return result;
    }

    readFloat32Array(size: SizeType, littleEndian: Endianness = true): Float32Array {
        const length =
            typeof size === "number" ? size : size === "uint16" ? this.readUint16(littleEndian) : this.readUint32(littleEndian);
        const result = new Float32Array(
            this.array.buffer.slice(this.array.byteOffset + this.cursor, this.array.byteOffset + this.cursor + length * 4),
        );
        this.cursor += length * 4;
        return result;
    }

    readFloat64Array(size: SizeType, littleEndian: Endianness = true): Float64Array {
        const length =
            typeof size === "number" ? size : size === "uint16" ? this.readUint16(littleEndian) : this.readUint32(littleEndian);
        const result = new Float64Array(
            this.array.buffer.slice(this.array.byteOffset + this.cursor, this.array.byteOffset + this.cursor + length * 8),
        );
        this.cursor += length * 8;
        return result;
    }

    readInt8Array(size: SizeType, littleEndian: Endianness = true): Int8Array {
        const length =
            typeof size === "number" ? size : size === "uint16" ? this.readUint16(littleEndian) : this.readUint32(littleEndian);
        const result = new Int8Array(
            this.array.buffer.slice(this.array.byteOffset + this.cursor, this.array.byteOffset + this.cursor + length),
        );
        this.cursor += length;
        return result;
    }

    readString(sizeType: SizeType = "uint16", littleEndian: Endianness = true): string {
        const length =
            typeof sizeType === "number" ? sizeType : sizeType === "uint16" ? this.readUint16(littleEndian) : this.readUint8();
        const result = textDecoder.decode(this.array.subarray(this.cursor, this.cursor + length));
        this.cursor += length;
        return result;
    }

    readString8(littleEndian: Endianness = true): string {
        return this.readString("uint8", littleEndian);
    }

    readString16(littleEndian: Endianness = true): string {
        return this.readString("uint16", littleEndian);
    }

    readArray(): unknown[] {
        const length = this.readUint16();
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readUnknown();
        }
        return result;
    }

    readUnknown(): unknown {
        const type = this.readUint8();
        switch (type) {
            case 0:
                return null;
            case 1:
                return this.readInt8();
            case 2:
                return this.readInt16();
            case 3:
                return this.readInt32();
            case 4:
                return this.readFloat64();
            case 5:
                return false;
            case 6:
                return true;
            case 7:
                return this.readString();
            case 8:
                return this.readArray();
            case 9:
                return this.readUint8Array("uint32");
            case 10:
                return this.readUint16Array("uint32");
            case 11:
                return this.readUint32Array("uint32");
            case 12:
                return this.readFloat32Array("uint32");
            case 13:
                return this.readFloat64Array("uint32");
            case 14: {
                const length = this.readUint16();
                const result: Record<string, unknown> = {};
                for (let i = 0; i < length; i++) {
                    result[this.readString()] = this.readUnknown();
                }
                return result;
            }
            case 15:
                return this.readBigint();
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }

    readEnum<T>(values: readonly T[]): T {
        if (values.length > 65535) {
            throw new Error("Enum is too big");
        }
        const index = values.length > 255 ? this.readUint16() : this.readUint8();
        if (index >= values.length) {
            throw new Error("Value isn't in enum range");
        }
        return values[index]!;
    }

    readRangeInt(range: { min: number; max: number; step?: number }): number {
        const { min, max, step } = range;
        if (!Number.isInteger(min) || !Number.isInteger(max) || min > max || (step != null && !Number.isInteger(step))) {
            throw new Error("Invalid range");
        }
        let value: number;
        if (min < 0) {
            if (min < 32768 || max > 32767) {
                value = this.readInt32();
            } else if (min < -128 || max > 127) {
                value = this.readInt16();
            } else {
                value = this.readInt8();
            }
        } else {
            if (max > 65535) {
                value = this.readUint32();
            } else if (max > 255) {
                value = this.readUint16();
            } else {
                value = this.readUint8();
            }
        }
        if (value < min || value > max) {
            throw new Error("Value isn't in range");
        }
        if (step != null && (value - min) % step !== 0) {
            throw new Error("Value isn't in range");
        }
        return value;
    }

    reset(): this {
        this.cursor = 0;
        return this;
    }

    writeUint8(value: number): this {
        this.ensureCapacity(1);
        this.dataView.setUint8(this.cursor, value);
        this.cursor += 1;
        return this;
    }

    writeInt8(value: number): this {
        this.ensureCapacity(1);
        this.dataView.setInt8(this.cursor, value);
        this.cursor += 1;
        return this;
    }

    writeUint16(value: number, littleEndian: Endianness = true): this {
        this.ensureCapacity(2);
        this.dataView.setUint16(this.cursor, value, littleEndian);
        this.cursor += 2;
        return this;
    }

    writeInt16(value: number, littleEndian: Endianness = true): this {
        this.ensureCapacity(2);
        this.dataView.setInt16(this.cursor, value, littleEndian);
        this.cursor += 2;
        return this;
    }

    writeUint32(value: number, littleEndian: Endianness = true): this {
        this.ensureCapacity(4);
        this.dataView.setUint32(this.cursor, value, littleEndian);
        this.cursor += 4;
        return this;
    }

    writeInt32(value: number, littleEndian: Endianness = true): this {
        this.ensureCapacity(4);
        this.dataView.setInt32(this.cursor, value, littleEndian);
        this.cursor += 4;
        return this;
    }

    writeFloat32(value: number, littleEndian: Endianness = true): this {
        this.ensureCapacity(4);
        this.dataView.setFloat32(this.cursor, value, littleEndian);
        this.cursor += 4;
        return this;
    }

    writeFloat64(value: number, littleEndian: Endianness = true): this {
        this.ensureCapacity(8);
        this.dataView.setFloat64(this.cursor, value, littleEndian);
        this.cursor += 8;
        return this;
    }

    writeBigint(value: bigint): this {
        if (value < 0n) {
            throw new Error("Negative BigInts are not supported yet");
        }
        let remaining = value;
        const bytes: number[] = [];
        while (remaining !== 0n) {
            bytes.push(Number(remaining & 0xffn));
            remaining >>= 8n;
        }
        this.writeTypedArray(new Uint8Array(bytes), "uint16");
        return this;
    }

    writeBoolean(value: boolean): this {
        this.writeUint8(value ? 6 : 5);
        return this;
    }

    writeTypedArray(array: TypedArray, sizeType: "uint16" | "uint32"): this {
        if (sizeType === "uint16") {
            this.writeUint16(array.length);
        } else if (sizeType === "uint32") {
            this.writeUint32(array.length);
        }
        this.ensureCapacity(array.buffer.byteLength);
        this.array.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), this.cursor);
        this.cursor += array.byteLength;
        return this;
    }

    writeString(value: string, sizeType: "uint8" | "uint16" | "none", littleEndian: Endianness = true): this {
        if (sizeType === "uint8") {
            this.writeUint8(0);
        } else if (sizeType === "uint16") {
            this.writeUint16(0, littleEndian);
        }
        this.ensureCapacity(value.length * 3);
        const { read, written } = textEncoder.encodeInto(
            value,
            new Uint8Array(this.array.buffer, this.array.byteOffset + this.cursor),
        );
        if (read < value.length) {
            throw new Error(`String didn't fit in buffer, read ${read} but needed ${value.length} (String was: [[[${value}]]])`);
        }
        if (sizeType === "uint8") {
            if (written > 255) {
                throw new Error("String is longer than max size");
            }
            this.cursor -= 1;
            this.writeUint8(written);
        } else if (sizeType === "uint16") {
            if (written > 65535) {
                throw new Error("String is longer than max size");
            }
            this.cursor -= 2;
            this.writeUint16(written, littleEndian);
        }
        this.cursor += written;
        return this;
    }

    writeString0(value: string, littleEndian: Endianness = true): this {
        return this.writeString(value, "none", littleEndian);
    }

    writeString8(value: string, littleEndian: Endianness = true): this {
        return this.writeString(value, "uint8", littleEndian);
    }

    writeString16(value: string, littleEndian: Endianness = true): this {
        return this.writeString(value, "uint16", littleEndian);
    }

    writeArray(array: unknown[]): this {
        if (array.length > 65535) {
            throw new Error("Array is too big");
        }
        this.writeUint16(array.length);
        for (const item of array) {
            this.writeUnknown(item);
        }
        return this;
    }

    writeUnknown(value: unknown): this {
        if (value == null) {
            this.writeUint8(0);
        } else if (typeof value === "number") {
            if (Number.isInteger(value)) {
                if (value >= -128 && value <= 127) {
                    this.writeUint8(1);
                    this.writeInt8(value);
                } else if (value >= -32768 && value <= 32767) {
                    this.writeUint8(2);
                    this.writeInt16(value);
                } else if (value >= -2147483648 && value <= 2147483647) {
                    this.writeUint8(3);
                    this.writeInt32(value);
                } else {
                    this.writeUint8(4);
                    this.writeFloat64(value);
                }
            } else {
                this.writeUint8(4);
                this.writeFloat64(value);
            }
        } else if (typeof value === "boolean") {
            this.writeBoolean(value);
        } else if (typeof value === "string") {
            this.writeUint8(7);
            this.writeString(value, "uint16");
        } else if (Array.isArray(value)) {
            this.writeUint8(8);
            this.writeArray(value);
        } else if (value instanceof Uint8Array) {
            this.writeUint8(9);
            this.writeTypedArray(value, "uint32");
        } else if (value instanceof Uint16Array) {
            this.writeUint8(10);
            this.writeTypedArray(value, "uint32");
        } else if (value instanceof Uint32Array) {
            this.writeUint8(11);
            this.writeTypedArray(value, "uint32");
        } else if (value instanceof Float32Array) {
            this.writeUint8(12);
            this.writeTypedArray(value, "uint32");
        } else if (value instanceof Float64Array) {
            this.writeUint8(13);
            this.writeTypedArray(value, "uint32");
        } else if (typeof value === "object") {
            this.writeUint8(14);
            const entries = Object.entries(value);
            if (entries.length > 65535) {
                throw new Error("Object has too many entries");
            }
            this.writeUint16(entries.length);
            for (const [key, val] of entries) {
                this.writeString(key, "uint16");
                this.writeUnknown(val);
            }
        } else if (typeof value === "bigint") {
            this.writeUint8(15);
            this.writeBigint(value);
        } else {
            throw new Error("Unsupported type: " + typeof value);
        }
        return this;
    }

    writeEnum<T>(value: T, values: readonly T[]): this {
        if (values.length > 65535) {
            throw new Error("Enum is too big");
        }
        const index = values.indexOf(value);
        if (index === -1) {
            throw new Error(`Value ${value} isn't in enum [${values}]`);
        }
        return values.length > 255 ? this.writeUint16(index) : this.writeUint8(index);
    }

    writeRangeInt(value: number, range: { min: number; max: number; step?: number }): this {
        const { min, max, step } = range;
        if (!Number.isInteger(min) || !Number.isInteger(max) || min > max || (step != null && !Number.isInteger(step))) {
            throw new Error("Invalid range");
        }
        if (step != null && (value - min) % step !== 0) {
            throw new Error("Value isn't in range");
        }
        return min < 0
            ? min < 32768 || max > 32767
                ? this.writeInt32(value)
                : min < -128 || max > 127
                  ? this.writeInt16(value)
                  : this.writeInt8(value)
            : max > 65535
              ? this.writeUint32(value)
              : max > 255
                ? this.writeUint16(value)
                : this.writeUint8(value);
    }

    private ensureCapacity(requiredBytes: number): void {
        const newSize = this.cursor + requiredBytes;
        if (newSize > this.array.byteLength) {
            let newLength = this.array.byteLength;
            while (newLength < newSize) {
                newLength *= 2;
            }
            const oldArray = this.array;
            this.array = new Uint8Array(newLength);
            this.array.set(oldArray);
            this.dataView = new DataView(this.array.buffer, this.array.byteOffset, this.array.byteLength);
        }
    }

    getData(): Uint8Array {
        return this.array.slice(0, this.cursor);
    }
}
