export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      credentials: {
        Row: {
          id: string
          pubkey: string
          authority: string
          name: string
          authorized_signers: string[]
          created_at: string
          signature: string
        }
        Insert: {
          id?: string
          pubkey: string
          authority: string
          name: string
          authorized_signers?: string[]
          created_at?: string
          signature?: string
        }
        Update: {
          id?: string
          pubkey?: string
          authority?: string
          name?: string
          authorized_signers?: string[]
          created_at?: string
          signature?: string
        }
      }
      schemas: {
        Row: {
          id: string
          pubkey: string
          credential_pubkey: string
          credential_name: string | null
          name: string
          description: string | null
          layout: Json
          field_names: string[]
          is_paused: boolean | null
          version: number | null
          is_tokenized: boolean | null
          tokenized_mint: string | null
          created_at: string
          signature: string
        }
        Insert: {
          id?: string
          pubkey: string
          credential_pubkey: string
          credential_name?: string | null
          name: string
          description?: string | null
          layout: Json
          field_names?: string[]
          is_paused?: boolean | null
          version?: number | null
          is_tokenized?: boolean | null
          tokenized_mint?: string | null
          created_at?: string
          signature?: string
        }
        Update: {
          id?: string
          pubkey?: string
          credential_pubkey?: string
          credential_name?: string | null
          name?: string
          description?: string | null
          layout?: Json
          field_names?: string[]
          is_paused?: boolean | null
          version?: number | null
          is_tokenized?: boolean | null
          tokenized_mint?: string | null
          created_at?: string
          signature?: string
        }
      }
      attestations: {
        Row: {
          id: string
          pubkey: string
          nonce: string
          credential_pubkey: string
          schema_pubkey: string
          schema_name: string | null
          data_raw: string
          data_decoded: Json | null
          signer: string
          expiry: number | null
          is_tokenized: boolean | null
          token_account: string | null
          attestation_mint: string | null
          is_closed: boolean | null
          created_at: string
          closed_at: string | null
          signature: string
        }
        Insert: {
          id?: string
          pubkey: string
          nonce: string
          credential_pubkey: string
          schema_pubkey: string
          schema_name?: string | null
          data_raw: string
          data_decoded?: Json | null
          signer: string
          expiry?: number | null
          is_tokenized?: boolean | null
          token_account?: string | null
          attestation_mint?: string | null
          is_closed?: boolean | null
          created_at?: string
          closed_at?: string | null
          signature?: string
        }
        Update: {
          id?: string
          pubkey?: string
          nonce?: string
          credential_pubkey?: string
          schema_pubkey?: string
          schema_name?: string | null
          data_raw?: string
          data_decoded?: Json | null
          signer?: string
          expiry?: number | null
          is_tokenized?: boolean | null
          token_account?: string | null
          attestation_mint?: string | null
          is_closed?: boolean | null
          created_at?: string
          closed_at?: string | null
          signature?: string
        }
      }
      indexer_state: {
        Row: {
          id: number
          last_processed_signature: string | null
          last_processed_slot: number | null
          last_run_at: string
        }
        Insert: {
          id?: number
          last_processed_signature?: string | null
          last_processed_slot?: number | null
          last_run_at?: string
        }
        Update: {
          id?: number
          last_processed_signature?: string | null
          last_processed_slot?: number | null
          last_run_at?: string
        }
      }
    }
  }
}
