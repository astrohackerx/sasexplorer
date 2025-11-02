import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Credential = Database['public']['Tables']['credentials']['Row'];

export function CredentialDetailPage() {
  const { address: pubkey } = useParams<{ address: string }>();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [schemaCount, setSchemaCount] = useState(0);
  const [attestationCount, setAttestationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pubkey) {
      loadCredential();
    }
  }, [pubkey]);

  async function loadCredential() {
    if (!pubkey) return;
    setLoading(true);

    const [credResult, schemaResult, attestationResult] = await Promise.all([
      supabase.from('credentials').select('*').eq('pubkey', pubkey).maybeSingle(),
      supabase.from('schemas').select('pubkey', { count: 'exact' }).eq('credential_pubkey', pubkey),
      supabase.from('attestations').select('pubkey', { count: 'exact' }).eq('credential_pubkey', pubkey),
    ]);

    if (credResult.error) {
      console.error('Error loading credential:', credResult.error);
    } else {
      setCredential(credResult.data);
    }

    setSchemaCount(schemaResult.count || 0);
    setAttestationCount(attestationResult.count || 0);
    setLoading(false);
  }

  if (loading) {
    return <div className="loading">Loading credential...</div>;
  }

  if (!credential) {
    return <div className="error">Credential not found</div>;
  }

  return (
    <div className="page">
      <div className="detail-header">
        <h1>Attestation Issuer</h1>
        <p className="page-subtitle">An authority that can issue attestations through authorized signers</p>
        <div className="address-display">{credential.pubkey}</div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h2>Overview</h2>
          <div className="detail-row">
            <span className="label">Address:</span>
            <span className="value address">{credential.pubkey}</span>
          </div>
          <div className="detail-row">
            <span className="label">Name:</span>
            <span className="value">{credential.name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Authority:</span>
            <span className="value address">{credential.authority}</span>
          </div>
          <div className="detail-row">
            <span className="label">Created:</span>
            <span className="value">{new Date(credential.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="detail-card">
          <h2>Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{schemaCount}</div>
              <div className="stat-label">Schemas</div>
              {schemaCount > 0 && (
                <Link to={`/schemas?credential=${credential.pubkey}`} className="stat-link">
                  View All →
                </Link>
              )}
            </div>
            <div className="stat-item">
              <div className="stat-value">{attestationCount}</div>
              <div className="stat-label">Attestations</div>
              {attestationCount > 0 && (
                <Link to={`/attestations?credential=${credential.pubkey}`} className="stat-link">
                  View All →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-card" style={{ marginTop: '2rem' }}>
        <h2>Authorized Signers ({credential.authorized_signers.length})</h2>
        <div className="signers-list">
          {credential.authorized_signers.map((signer, index) => (
            <div key={index} className="signer-item">
              <span className="signer-index">{index + 1}.</span>
              <span className="address">{signer}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
