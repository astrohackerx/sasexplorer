import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Credential = Database['public']['Tables']['credentials']['Row'];

export function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    setLoading(true);
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading credentials:', error);
    } else {
      setCredentials(data || []);
    }
    setLoading(false);
  }

  const filteredCredentials = credentials.filter(
    (cred) =>
      cred.pubkey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.authority?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attestation Issuers</h1>
          <p className="page-subtitle">Credentials define who can issue attestations and authorized signers</p>
        </div>
        <div className="page-stats">
          <span className="stat-badge">{credentials.length} Issuers</span>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search issuers by address, name, or authority..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading credentials...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Name</th>
                <th>Authority</th>
                <th>Signers</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredentials.map((credential) => (
                <tr key={credential.pubkey}>
                  <td>
                    <Link to={`/credential/${credential.pubkey}`} className="address-link">
                      {credential.pubkey?.slice(0, 8)}...{credential.pubkey?.slice(-6)}
                    </Link>
                  </td>
                  <td>{credential.name}</td>
                  <td>
                    <span className="address">
                      {credential.authority?.slice(0, 8)}...{credential.authority?.slice(-6)}
                    </span>
                  </td>
                  <td>
                    <span className="badge">{credential.authorized_signers?.length || 0}</span>
                  </td>
                  <td className="date">
                    {credential.created_at && new Date(credential.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredCredentials.length === 0 && (
        <div className="empty-state">
          {searchTerm ? 'No credentials found matching your search' : 'No credentials yet'}
        </div>
      )}
    </div>
  );
}
