import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Attestation = Database['public']['Tables']['attestations']['Row'];

export function AttestationDetailPage() {
  const { address: pubkey } = useParams<{ address: string }>();
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pubkey) {
      loadAttestation();
    }
  }, [pubkey]);

  async function loadAttestation() {
    if (!pubkey) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('attestations')
      .select('*')
      .eq('pubkey', pubkey)
      .maybeSingle();

    if (error) {
      console.error('Error loading attestation:', error);
    } else {
      setAttestation(data);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="loading">Loading attestation...</div>;
  }

  if (!attestation) {
    return <div className="error">Attestation not found</div>;
  }

  return (
    <div className="page">
      <div className="detail-header">
        <h1>Attestation Details</h1>
        <div className="address-display">{attestation.pubkey}</div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h2>Overview</h2>
          <div className="detail-row">
            <span className="label">Address:</span>
            <span className="value address">{attestation.pubkey}</span>
          </div>
          <div className="detail-row">
            <span className="label">Nonce:</span>
            <span className="value address">{attestation.nonce}</span>
          </div>
          <div className="detail-row">
            <span className="label">Signer:</span>
            <span className="value address">{attestation.signer}</span>
          </div>
          <div className="detail-row">
            <span className="label">Credential:</span>
            <Link to={`/credential/${attestation.credential_pubkey}`} className="value address">
              {attestation.credential_pubkey}
            </Link>
          </div>
          <div className="detail-row">
            <span className="label">Schema:</span>
            <Link to={`/schema/${attestation.schema_pubkey}`} className="value address">
              {attestation.schema_pubkey}
            </Link>
          </div>
          {attestation.schema_name && (
            <div className="detail-row">
              <span className="label">Schema Name:</span>
              <span className="value">{attestation.schema_name}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="label">Tokenized:</span>
            <span className="value">
              {attestation.is_tokenized ? (
                <span className="badge badge-success">Yes</span>
              ) : (
                <span className="badge badge-neutral">No</span>
              )}
            </span>
          </div>
          {attestation.attestation_mint && (
            <div className="detail-row">
              <span className="label">Token Mint:</span>
              <span className="value address">{attestation.attestation_mint}</span>
            </div>
          )}
          {attestation.is_closed && attestation.closed_at && (
            <div className="detail-row">
              <span className="label">Closed At:</span>
              <span className="value">{new Date(attestation.closed_at).toLocaleString()}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="label">Created:</span>
            <span className="value">{new Date(attestation.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="detail-card">
          <h2>Decoded Data</h2>
          {attestation.data_decoded ? (
            <div className="schema-fields">
              {Object.entries(attestation.data_decoded as Record<string, any>).map(([key, value], index) => (
                <div key={index} className="field-item">
                  <span className="field-index">{index + 1}.</span>
                  <span className="field-name">{key}</span>
                  <span className="field-type">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No decoded data available</div>
          )}
        </div>

        <div className="detail-card">
          <h2>Raw Data</h2>
          <div className="raw-data">
            <div className="data-bytes">
              {attestation.data_raw ? `${attestation.data_raw.length} bytes` : 'N/A'}
            </div>
            {attestation.data_raw && (
              <pre className="hex-data">
                {attestation.data_raw}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
