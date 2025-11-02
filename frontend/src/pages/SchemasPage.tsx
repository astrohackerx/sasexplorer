import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Schema = Database['public']['Tables']['schemas']['Row'];

export function SchemasPage() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const credentialFilter = searchParams.get('credential');

  useEffect(() => {
    loadSchemas();
  }, [credentialFilter]);

  async function loadSchemas() {
    setLoading(true);
    let query = supabase
      .from('schemas')
      .select('*')
      .order('created_at', { ascending: false });

    if (credentialFilter) {
      query = query.eq('credential_pubkey', credentialFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading schemas:', error);
    } else {
      setSchemas(data || []);
    }
    setLoading(false);
  }

  const filteredSchemas = schemas.filter(
    (schema) =>
      schema.pubkey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schema.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schema.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schema.credential_pubkey?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (isPaused: boolean | null) => {
    return isPaused ? 'Paused' : 'Active';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attestation Schemas</h1>
          <p className="page-subtitle">Define the structure and fields of attestations that can be issued</p>
        </div>
        <div className="page-stats">
          <span className="stat-badge">{schemas.length} Schemas</span>
          {credentialFilter && (
            <Link to="/schemas" className="clear-filter">
              Clear Filter
            </Link>
          )}
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by address, credential, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading schemas...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Name</th>
                <th>Description</th>
                <th>Credential</th>
                <th>Version</th>
                <th>Status</th>
                <th>Fields</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemas.map((schema) => (
                <tr key={schema.pubkey}>
                  <td>
                    <Link to={`/schema/${schema.pubkey}`} className="address-link">
                      {schema.pubkey?.slice(0, 8)}...{schema.pubkey?.slice(-6)}
                    </Link>
                  </td>
                  <td>{schema.name}</td>
                  <td className="description">{schema.description}</td>
                  <td>
                    <Link to={`/credential/${schema.credential_pubkey}`} className="address">
                      {schema.credential_pubkey?.slice(0, 8)}...{schema.credential_pubkey?.slice(-6)}
                    </Link>
                  </td>
                  <td>
                    <span className="badge">v{schema.version || 1}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${schema.is_paused ? '1' : '0'}`}>
                      {getStatusLabel(schema.is_paused)}
                    </span>
                  </td>
                  <td>
                    <span className="badge">{schema.field_names?.length || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredSchemas.length === 0 && (
        <div className="empty-state">
          {searchTerm ? 'No schemas found matching your search' : 'No schemas yet'}
        </div>
      )}
    </div>
  );
}
