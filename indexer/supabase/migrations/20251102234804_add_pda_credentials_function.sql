/*
  # Add PDA Credentials Function

  Creates a function to retrieve PDA-owned credentials with their attestation counts.

  ## New Function

  ### `get_pda_owned_credentials()`
  Returns credentials where the authority is a PDA (Program Derived Address)
  - Filters for credentials with is_pda_owned = true
  - Joins with attestations to count usage
  - Orders by attestation count descending
  - Returns: name, pubkey, authority, attestation_count

  ## Security
  
  Function is marked as SECURITY DEFINER for read-only access
  Public access is granted for statistics
*/

-- Function to get PDA-owned credentials with attestation counts
CREATE OR REPLACE FUNCTION get_pda_owned_credentials()
RETURNS TABLE (
  name text,
  pubkey text,
  authority text,
  attestation_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    c.name,
    c.pubkey,
    c.authority,
    COUNT(a.id) as attestation_count
  FROM credentials c
  LEFT JOIN attestations a ON a.credential_pubkey = c.pubkey
  WHERE c.is_pda_owned = true
  GROUP BY c.id, c.name, c.pubkey, c.authority
  ORDER BY attestation_count DESC;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_pda_owned_credentials() TO anon, authenticated;
