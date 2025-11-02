import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Attestation = Database['public']['Tables']['attestations']['Row'];

export function AttestationsPage() {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const credentialFilter = searchParams.get('credential');
  const schemaFilter = searchParams.get('schema');

  useEffect(() => {
    loadAttestations();
  }, [credentialFilter, schemaFilter]);

  async function loadAttestations() {
    setLoading(true);
    let query = supabase
      .from('attestations')
      .select('*')
      .order('created_at', { ascending: false });

    if (credentialFilter) {
      query = query.eq('credential_pubkey', credentialFilter);
    }
    if (schemaFilter) {
      query = query.eq('schema_pubkey', schemaFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading attestations:', error);
    } else {
      setAttestations(data || []);
    }
    setLoading(false);
  }

  const filteredAttestations = attestations.filter(
    (attestation) =>
      attestation.pubkey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attestation.nonce?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attestation.signer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attestation.credential_pubkey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attestation.schema_pubkey?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Issued Attestations</h1>
          <p className="page-subtitle">Verifiable credentials issued by authorized signers to holders</p>
        </div>
        <div className="page-stats">
          <span className="stat-badge">{attestations.length} Attestations</span>
          {(credentialFilter || schemaFilter) && (
            <Link to="/attestations" className="clear-filter">
              Clear Filter
            </Link>
          )}
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by address, nonce, signer, credential, or schema..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading attestations...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Signer</th>
                <th>Credential</th>
                <th>Schema</th>
                <th>Tokenized</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttestations.map((attestation) => (
                <tr key={attestation.pubkey}>
                  <td>
                    <Link to={`/attestation/${attestation.pubkey}`} className="address-link">
                      {attestation.pubkey?.slice(0, 8)}...{attestation.pubkey?.slice(-6)}
                    </Link>
                  </td>
                  <td>
                    <span className="address">
                      {attestation.signer?.slice(0, 8)}...{attestation.signer?.slice(-6)}
                    </span>
                  </td>
                  <td>
                    <Link to={`/credential/${attestation.credential_pubkey}`} className="address">
                      {attestation.credential_pubkey?.slice(0, 8)}...{attestation.credential_pubkey?.slice(-6)}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/schema/${attestation.schema_pubkey}`} className="address">
                      {attestation.schema_pubkey?.slice(0, 8)}...{attestation.schema_pubkey?.slice(-6)}
                    </Link>
                  </td>
                  <td>
                    {attestation.is_tokenized ? (
                      <span className="badge badge-success">Yes</span>
                    ) : (
                      <span className="badge badge-neutral">No</span>
                    )}
                  </td>
                  <td className="date">
                    {attestation.created_at && new Date(attestation.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredAttestations.length === 0 && (
        <div className="empty-state">
          {searchTerm ? 'No attestations found matching your search' : 'No attestations yet'}
        </div>
      )}
    </div>
  );
}
