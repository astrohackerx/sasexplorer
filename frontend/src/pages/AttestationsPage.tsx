import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Attestation = Database['public']['Tables']['attestations']['Row'];

const PAGE_SIZE = 100;

export function AttestationsPage() {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const credentialFilter = searchParams.get('credential');
  const schemaFilter = searchParams.get('schema');

  useEffect(() => {
    setCurrentPage(1);
    loadAttestations(1);
  }, [credentialFilter, schemaFilter]);

  useEffect(() => {
    loadAttestations(currentPage);
  }, [currentPage]);

  async function loadAttestations(page: number) {
    setLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('attestations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (credentialFilter) {
      query = query.eq('credential_pubkey', credentialFilter);
    }
    if (schemaFilter) {
      query = query.eq('schema_pubkey', schemaFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error loading attestations:', error);
    } else {
      setAttestations(data || []);
      setTotalCount(count || 0);
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
          <span className="stat-badge">{totalCount.toLocaleString()} Attestations</span>
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

      {!loading && totalCount > PAGE_SIZE && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)}
            <span className="pagination-range">
              {' '}(showing {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()})
            </span>
          </span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
