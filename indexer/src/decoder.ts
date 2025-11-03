import { PublicKey } from '@solana/web3.js';
import { BorshSchema } from 'borsher';

const DEFAULT_PUBKEY = '11111111111111111111111111111111';

export const DISCRIMINATORS = {
  CREDENTIAL: 0,
  SCHEMA: 1,
  ATTESTATION: 2,
};

export const INSTRUCTION_DISCRIMINATORS: Record<number, string> = {
  0: 'CreateCredential',
  1: 'CreateSchema',
  2: 'ChangeSchemaStatus',
  3: 'ChangeAuthorizedSigners',
  4: 'ChangeSchemaDescription',
  5: 'ChangeSchemaVersion',
  6: 'CreateAttestation',
  7: 'CloseAttestation',
  9: 'TokenizeSchema',
  10: 'CreateTokenizedAttestation',
  11: 'CloseTokenizedAttestation',
  228: 'EmitEvent',
};

interface DecodedCredential {
  authority: string;
  name: string;
  authorized_signers: string[];
}

interface DecodedSchema {
  credential: string;
  name: string;
  description: string;
  layout: number[];
  field_names: string[];
  is_paused: boolean;
  version: number;
}

interface DecodedAttestation {
  nonce: string;
  credential: string;
  schema: string;
  data: Uint8Array;
  signer: string;
  expiry: bigint;
  token_account: string;
}

function readPubkey(buffer: Uint8Array, offset: number): [string, number] {
  const pubkey = new PublicKey(buffer.slice(offset, offset + 32)).toBase58();
  return [pubkey, offset + 32];
}

function readU32(buffer: Uint8Array, offset: number): [number, number] {
  const value = buffer[offset] |
                (buffer[offset + 1] << 8) |
                (buffer[offset + 2] << 16) |
                (buffer[offset + 3] << 24);
  return [value >>> 0, offset + 4];
}

function readI64(buffer: Uint8Array, offset: number): [bigint, number] {
  const low = buffer[offset] |
              (buffer[offset + 1] << 8) |
              (buffer[offset + 2] << 16) |
              (buffer[offset + 3] << 24);
  const high = buffer[offset + 4] |
               (buffer[offset + 5] << 8) |
               (buffer[offset + 6] << 16) |
               (buffer[offset + 7] << 24);
  const value = BigInt(low >>> 0) | (BigInt(high) << 32n);
  return [value, offset + 8];
}

function readVecU8(buffer: Uint8Array, offset: number): [Uint8Array, number] {
  const [len, newOffset] = readU32(buffer, offset);
  const data = buffer.slice(newOffset, newOffset + len);
  return [data, newOffset + len];
}

function readVecPubkey(buffer: Uint8Array, offset: number): [string[], number] {
  const [len, newOffset] = readU32(buffer, offset);
  const pubkeys: string[] = [];
  let currentOffset = newOffset;

  for (let i = 0; i < len; i++) {
    const [pubkey, nextOffset] = readPubkey(buffer, currentOffset);
    pubkeys.push(pubkey);
    currentOffset = nextOffset;
  }

  return [pubkeys, currentOffset];
}

function splitJoinedVecs(bytes: Uint8Array): Uint8Array[] {
  const result: Uint8Array[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    const [len, newOffset] = readU32(bytes, offset);
    result.push(bytes.slice(newOffset, newOffset + len));
    offset = newOffset + len;
  }

  return result;
}

export function decodeCredential(data: Uint8Array): DecodedCredential | null {
  try {
    if (data[0] !== DISCRIMINATORS.CREDENTIAL) {
      return null;
    }

    let offset = 1;
    const [authority, offset1] = readPubkey(data, offset);
    const [nameBytes, offset2] = readVecU8(data, offset1);
    const [authorizedSigners] = readVecPubkey(data, offset2);

    const name = new TextDecoder().decode(nameBytes);

    return {
      authority,
      name,
      authorized_signers: authorizedSigners,
    };
  } catch (error) {
    console.error('Error decoding credential:', error);
    return null;
  }
}

export function decodeSchema(data: Uint8Array): DecodedSchema | null {
  try {
    if (data[0] !== DISCRIMINATORS.SCHEMA) {
      return null;
    }

    let offset = 1;
    const [credential, offset1] = readPubkey(data, offset);
    const [nameBytes, offset2] = readVecU8(data, offset1);
    const [descBytes, offset3] = readVecU8(data, offset2);
    const [layoutBytes, offset4] = readVecU8(data, offset3);
    const [fieldNamesBytes, offset5] = readVecU8(data, offset4);

    const name = new TextDecoder().decode(nameBytes);
    const description = new TextDecoder().decode(descBytes);
    const layout = Array.from(layoutBytes);

    const fieldNameVecs = splitJoinedVecs(fieldNamesBytes);
    const field_names = fieldNameVecs.map(vec => new TextDecoder().decode(vec));

    const is_paused = data[offset5] === 1;
    const version = data[offset5 + 1];

    return {
      credential,
      name,
      description,
      layout,
      field_names,
      is_paused,
      version,
    };
  } catch (error) {
    console.error('Error decoding schema:', error);
    return null;
  }
}

export function decodeAttestation(data: Uint8Array): DecodedAttestation | null {
  try {
    if (data[0] !== DISCRIMINATORS.ATTESTATION) {
      return null;
    }

    let offset = 1;
    const [nonce, offset1] = readPubkey(data, offset);
    const [credential, offset2] = readPubkey(data, offset1);
    const [schema, offset3] = readPubkey(data, offset2);
    const [attestationData, offset4] = readVecU8(data, offset3);
    const [signer, offset5] = readPubkey(data, offset4);
    const [expiry, offset6] = readI64(data, offset5);
    const [token_account] = readPubkey(data, offset6);

    return {
      nonce,
      credential,
      schema,
      data: attestationData,
      signer,
      expiry,
      token_account,
    };
  } catch (error) {
    console.error('Error decoding attestation:', error);
    return null;
  }
}

const CHAR_SCHEMA = BorshSchema.Array(BorshSchema.u8, 4);

const compactLayoutMapping: Record<number, BorshSchema<any>> = {
  0: BorshSchema.u8,
  1: BorshSchema.u16,
  2: BorshSchema.u32,
  3: BorshSchema.u64,
  4: BorshSchema.u128,
  5: BorshSchema.i8,
  6: BorshSchema.i16,
  7: BorshSchema.i32,
  8: BorshSchema.i64,
  9: BorshSchema.i128,
  10: BorshSchema.bool,
  11: CHAR_SCHEMA,
  12: BorshSchema.String,
  13: BorshSchema.Vec(BorshSchema.u8),
  14: BorshSchema.Vec(BorshSchema.u16),
  15: BorshSchema.Vec(BorshSchema.u32),
  16: BorshSchema.Vec(BorshSchema.u64),
  17: BorshSchema.Vec(BorshSchema.u128),
  18: BorshSchema.Vec(BorshSchema.i8),
  19: BorshSchema.Vec(BorshSchema.i16),
  20: BorshSchema.Vec(BorshSchema.i32),
  21: BorshSchema.Vec(BorshSchema.i64),
  22: BorshSchema.Vec(BorshSchema.i128),
  23: BorshSchema.Vec(BorshSchema.bool),
  24: BorshSchema.Vec(BorshSchema.String),
  25: CHAR_SCHEMA,
};

function convertBigIntsToStrings(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings);
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertBigIntsToStrings(value);
    }
    return result;
  }

  return obj;
}

export function decodeAttestationData(
  schema: { layout: number[]; field_names: string[] },
  attestationData: Uint8Array
): Record<string, unknown> | null {
  try {
    if (schema.field_names.length !== schema.layout.length) {
      console.error('Schema field names and layout length mismatch');
      return null;
    }

    const fields: Record<string, BorshSchema<any>> = {};

    for (let i = 0; i < schema.field_names.length; i++) {
      const fieldName = schema.field_names[i];
      const layoutByte = schema.layout[i];

      if (layoutByte > 25) {
        console.error(`Invalid schema layout value: ${layoutByte}`);
        return null;
      }

      fields[fieldName] = compactLayoutMapping[layoutByte];
    }

    const borshSchema = BorshSchema.Struct(fields);
    const decoded = borshSchema.deserialize(attestationData);

    // Convert BigInt values to strings for JSON compatibility
    return convertBigIntsToStrings(decoded) as Record<string, unknown>;
  } catch (error) {
    console.error('Error decoding attestation data:', error);
    return null;
  }
}

export function isTokenized(tokenAccount: string): boolean {
  return tokenAccount !== DEFAULT_PUBKEY;
}

export function getInstructionType(discriminator: number): string {
  return INSTRUCTION_DISCRIMINATORS[discriminator] || 'Unknown';
}
