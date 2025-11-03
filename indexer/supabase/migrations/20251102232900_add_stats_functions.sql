/*
  # Add Statistics Functions

  Creates database functions to calculate top issuers and most used schemas.

  ## New Functions

  ### `get_top_issuers()`
  Returns the top credentials ranked by number of attestations issued
  - Groups attestations by credential
  - Joins with credentials table to get issuer name
  - Orders by attestation count descending
  - Returns: name, pubkey, attestation_count

  ### `get_top_schemas()`
  Returns the most used schemas ranked by attestation count
  - Groups attestations by schema
  - Joins with schemas table to get schema name and credential info
  - Orders by attestation count descending
  - Returns: name, pubkey, attestation_count, credential_name

  ## Security
  
  Both functions are marked as SECURITY DEFINER but only perform read operations
  Public access is granted for read-only statistics
*/

-- Function to get top issuers by attestation count
CREATE OR REPLACE FUNCTION get_top_issuers()
RETURNS TABLE (
  name text,
  pubkey text,
  attestation_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    c.name,
    c.pubkey,
    COUNT(a.id) as attestation_count
  FROM credentials c
  LEFT JOIN attestations a ON a.credential_pubkey = c.pubkey
  GROUP BY c.id, c.name, c.pubkey
  HAVING COUNT(a.id) > 0
  ORDER BY attestation_count DESC;
$$;

-- Function to get most used schemas by attestation count
CREATE OR REPLACE FUNCTION get_top_schemas()
RETURNS TABLE (
  name text,
  pubkey text,
  attestation_count bigint,
  credential_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    s.name,
    s.pubkey,
    COUNT(a.id) as attestation_count,
    s.credential_name
  FROM schemas s
  LEFT JOIN attestations a ON a.schema_pubkey = s.pubkey
  GROUP BY s.id, s.name, s.pubkey, s.credential_name
  HAVING COUNT(a.id) > 0
  ORDER BY attestation_count DESC;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_top_issuers() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_schemas() TO anon, authenticated;
