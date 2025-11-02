import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Schema = Database['public']['Tables']['schemas']['Row'];

export function SchemaDetailPage() {
  const { address: pubkey } = useParams<{ address: string }>();
  const [schema, setSchema] = useState<Schema | null>(null);
  const [attestationCount, setAttestationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pubkey) {
      loadSchema();
    }
  }, [pubkey]);

  async function loadSchema() {
    if (!pubkey) return;
    setLoading(true);

    const [schemaResult, attestationResult] = await Promise.all([
      supabase.from('schemas').select('*').eq('pubkey', pubkey).maybeSingle(),
      supabase.from('attestations').select('pubkey', { count: 'exact' }).eq('schema_pubkey', pubkey),
    ]);

    if (schemaResult.error) {
      console.error('Error loading schema:', schemaResult.error);
    } else {
      setSchema(schemaResult.data);
    }

    setAttestationCount(attestationResult.count || 0);
    setLoading(false);
  }

  const getStatusLabel = (isPaused: boolean | null) => {
    return isPaused ? 'Paused' : 'Active';
  };

  const getFieldType = (typeData: any): string => {
    if (typeof typeData === 'string') return typeData;
    if (typeof typeData === 'object' && typeData !== null) {
      const keys = Object.keys(typeData);
      if (keys.length > 0) return keys[0];
    }
    return 'Unknown';
  };

  if (loading) {
    return <div className="loading">Loading schema...</div>;
  }

  if (!schema) {
    return <div className="error">Schema not found</div>;
  }

  return (
    <div className="page">
      <div className="detail-header">
        <h1>Schema Details</h1>
        <div className="address-display">{schema.pubkey}</div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h2>Overview</h2>
          <div className="detail-row">
            <span className="label">Address:</span>
            <span className="value address">{schema.pubkey}</span>
          </div>
          <div className="detail-row">
            <span className="label">Name:</span>
            <span className="value">{schema.name}</span>
          </div>
          <div className="detail-row">
            <span className="label">Description:</span>
            <span className="value">{schema.description || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Credential:</span>
            <Link to={`/credential/${schema.credential_pubkey}`} className="value address">
              {schema.credential_pubkey}
            </Link>
          </div>
          <div className="detail-row">
            <span className="label">Version:</span>
            <span className="value badge">v{schema.version || 1}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className={`value status-badge status-${schema.is_paused ? '1' : '0'}`}>
              {getStatusLabel(schema.is_paused)}
            </span>
          </div>
          {schema.is_tokenized && schema.tokenized_mint && (
            <div className="detail-row">
              <span className="label">Token Mint:</span>
              <span className="value address">{schema.tokenized_mint}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="label">Created:</span>
            <span className="value">{new Date(schema.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="detail-card">
          <h2>Schema Layout ({schema.field_names.length} fields)</h2>
          <div className="schema-fields">
            {schema.field_names.map((name, index) => {
              const layoutArray = Array.isArray(schema.layout) ? schema.layout : [];
              return (
                <div key={index} className="field-item">
                  <span className="field-index">{index + 1}.</span>
                  <span className="field-name">{name}</span>
                  <span className="field-type">{getFieldType(layoutArray[index])}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="detail-card">
          <h2>Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{attestationCount}</div>
              <div className="stat-label">Attestations</div>
              {attestationCount > 0 && (
                <Link to={`/attestations?schema=${schema.pubkey}`} className="stat-link">
                  View All →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
