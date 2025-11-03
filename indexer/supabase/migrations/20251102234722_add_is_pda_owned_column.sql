/*
  # Add PDA Detection Column

  Adds a column to track whether a credential's authority is a PDA (Program Derived Address).

  ## Changes
  
  1. New Column
    - `is_pda_owned` (boolean) - Indicates if the credential authority is a PDA
    - Defaults to false
    - Can be updated by the indexer to identify PDA-owned credentials
  
  ## Notes
  
  PDAs are addresses that are off the ed25519 curve and cannot sign transactions.
  They are controlled programmatically rather than by a keypair.
  This flag helps identify credentials with programmatic control.
*/

-- Add is_pda_owned column to credentials table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credentials' AND column_name = 'is_pda_owned'
  ) THEN
    ALTER TABLE credentials 
    ADD COLUMN is_pda_owned boolean DEFAULT false;
  END IF;
END $$;

-- Create index for efficient PDA credential queries
CREATE INDEX IF NOT EXISTS idx_credentials_is_pda_owned 
ON credentials(is_pda_owned) 
WHERE is_pda_owned = true;
