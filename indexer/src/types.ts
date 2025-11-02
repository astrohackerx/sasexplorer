export interface Credential {
  pubkey: string;
  authority: string;
  name: string;
  authorized_signers: string[];
  signature: string;
}

export interface Schema {
  pubkey: string;
  credential_pubkey: string;
  credential_name: string;
  name: string;
  description: string;
  layout: number[];
  field_names: string[];
  is_paused: boolean;
  version: number;
  is_tokenized: boolean;
  tokenized_mint: string | null;
  signature: string;
}

export interface Attestation {
  pubkey: string;
  nonce: string;
  credential_pubkey: string;
  schema_pubkey: string;
  schema_name: string;
  data_raw: Buffer;
  data_decoded: Record<string, unknown> | null;
  signer: string;
  expiry: number;
  is_tokenized: boolean;
  token_account: string | null;
  attestation_mint: string | null;
  is_closed: boolean;
  signature: string;
}

export interface Transaction {
  signature: string;
  slot: number;
  block_time: Date;
  instruction_type: string;
  success: boolean;
  error_message: string | null;
  accounts_involved: string[];
}

export type InstructionType =
  | 'CreateCredential'
  | 'CreateSchema'
  | 'ChangeSchemaStatus'
  | 'ChangeAuthorizedSigners'
  | 'ChangeSchemaDescription'
  | 'ChangeSchemaVersion'
  | 'CreateAttestation'
  | 'CloseAttestation'
  | 'TokenizeSchema'
  | 'CreateTokenizedAttestation'
  | 'CloseTokenizedAttestation'
  | 'EmitEvent'
  | 'Unknown';
