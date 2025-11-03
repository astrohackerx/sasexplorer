import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Stats {
  credentials: number;
  schemas: number;
  attestations: number;
  tokenizedAttestations: number;
}

interface TopIssuer {
  name: string;
  pubkey: string;
  attestation_count: number;
}

interface TopSchema {
  name: string;
  pubkey: string;
  attestation_count: number;
  credential_name: string;
}

interface PdaCredential {
  name: string;
  pubkey: string;
  authority: string;
  attestation_count: number;
}

export function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topIssuers, setTopIssuers] = useState<TopIssuer[]>([]);
  const [topSchemas, setTopSchemas] = useState<TopSchema[]>([]);
  const [pdaCredentials, setPdaCredentials] = useState<PdaCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [credentialsResult, schemasResult, attestationsResult, tokenizedResult] = await Promise.all([
        supabase.from('credentials').select('*', { count: 'exact', head: true }),
        supabase.from('schemas').select('*', { count: 'exact', head: true }),
        supabase.from('attestations').select('*', { count: 'exact', head: true }),
        supabase.from('attestations').select('*', { count: 'exact', head: true }).eq('is_tokenized', true),
      ]);

      setStats({
        credentials: credentialsResult.count || 0,
        schemas: schemasResult.count || 0,
        attestations: attestationsResult.count || 0,
        tokenizedAttestations: tokenizedResult.count || 0,
      });

      const { data: issuersData } = await supabase.rpc('get_top_issuers') as { data: TopIssuer[] | null };
      if (issuersData && Array.isArray(issuersData)) {
        setTopIssuers(issuersData.slice(0, 10));
      }

      const { data: schemasData } = await supabase.rpc('get_top_schemas') as { data: TopSchema[] | null };
      if (schemasData && Array.isArray(schemasData)) {
        setTopSchemas(schemasData.slice(0, 10));
      }

      const { data: pdaData } = await supabase.rpc('get_pda_owned_credentials') as { data: PdaCredential[] | null };
      if (pdaData && Array.isArray(pdaData)) {
        setPdaCredentials(pdaData.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  const tokenizationRate = stats?.attestations ? Math.round((stats.tokenizedAttestations / stats.attestations) * 100) : 0;

  return (
    <div className="page home-page">


      <div className="stats-overview">
        <div className="stats-grid">
          <Link to="/credentials" className="stat-card">
            <div className="stat-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.credentials || 0}</div>
              <div className="stat-label">Credentials</div>
              <div className="stat-description">Issuer identities</div>
            </div>
          </Link>

          <Link to="/schemas" className="stat-card">
            <div className="stat-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.schemas || 0}</div>
              <div className="stat-label">Schemas</div>
              <div className="stat-description">Attestation templates</div>
            </div>
          </Link>

          <Link to="/attestations" className="stat-card">
            <div className="stat-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.attestations || 0}</div>
              <div className="stat-label">Attestations</div>
              <div className="stat-description">Total issued</div>
            </div>
          </Link>

          <div className="stat-card stat-card-neutral">
            <div className="stat-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.tokenizedAttestations || 0}</div>
              <div className="stat-label">Tokenized</div>
              <div className="stat-description">{tokenizationRate}% of total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="diagram-section">
        <h2>System Overview</h2>

        <div className="diagram-grid">
          <div className="diagram-card">
            <h3>Attestation Flow</h3>
            <div className="flow-diagram">
              <div className="flow-step">
                <div className="flow-node flow-node-primary">
                  <span className="flow-number">1</span>
                  <span className="flow-label">Credential</span>
                </div>
                <div className="flow-description">Issuer creates credential with authority</div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="flow-node flow-node-secondary">
                  <span className="flow-number">2</span>
                  <span className="flow-label">Schema</span>
                </div>
                <div className="flow-description">Define attestation structure and fields</div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="flow-node flow-node-tertiary">
                  <span className="flow-number">3</span>
                  <span className="flow-label">Attestation</span>
                </div>
                <div className="flow-description">Issue attestations using the schema</div>
              </div>
            </div>
          </div>

          <div className="diagram-card">
            <h3>Top PDA-Owned Issuers</h3>
            <div className="pda-list">
              {pdaCredentials.length > 0 ? (
                pdaCredentials.map((cred) => (
                  <Link key={cred.pubkey} to={`/credential/${cred.pubkey}`} className="pda-item">
                    <div className="pda-info">
                      <div className="pda-name">{cred.name}</div>
                      <div className="pda-address">
                        {cred.authority.slice(0, 8)}...{cred.authority.slice(-6)}
                      </div>
                    </div>
                    <div className="pda-count">{cred.attestation_count}</div>
                  </Link>
                ))
              ) : (
                <div className="pda-empty">No PDA-owned credentials found</div>
              )}
            </div>
            <div className="pda-summary">
              <div className="pda-total">
                {pdaCredentials.length} PDA credential{pdaCredentials.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="diagram-card">
            <h3>Tokenization Stats</h3>
            <div className="status-breakdown">
              <div className="status-item status-item-active">
                <div className="status-bar">
                  <div
                    className="status-fill status-fill-active"
                    style={{ width: `${tokenizationRate}%` }}
                  ></div>
                </div>
                <div className="status-info">
                  <span className="status-label">Tokenized</span>
                  <span className="status-count">{stats?.tokenizedAttestations || 0}</span>
                </div>
              </div>
              <div className="status-item status-item-revoked">
                <div className="status-bar">
                  <div
                    className="status-fill status-fill-revoked"
                    style={{ width: `${100 - tokenizationRate}%` }}
                  ></div>
                </div>
                <div className="status-info">
                  <span className="status-label">Standard</span>
                  <span className="status-count">{(stats?.attestations || 0) - (stats?.tokenizedAttestations || 0)}</span>
                </div>
              </div>
            </div>
            <div className="status-summary">
              <div className="status-percentage">
                {tokenizationRate}% Tokenized
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="top-lists-section">
        <div className="top-list-container">
          <h2>Top Issuers</h2>
          <div className="top-list">
            {topIssuers.length > 0 ? (
              topIssuers.map((issuer, index) => (
                <Link key={issuer.pubkey} to={`/credential/${issuer.pubkey}`} className="top-list-item">
                  <div className="top-list-rank">#{index + 1}</div>
                  <div className="top-list-info">
                    <div className="top-list-name">{issuer.name}</div>
                    <div className="top-list-address">
                      {issuer.pubkey.slice(0, 8)}...{issuer.pubkey.slice(-6)}
                    </div>
                  </div>
                  <div className="top-list-stat">
                    <div className="top-list-value">{issuer.attestation_count.toLocaleString()}</div>
                    <div className="top-list-label">attestations</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="top-list-empty">No issuers found</div>
            )}
          </div>
        </div>

        <div className="top-list-container">
          <h2>Most Used Schemas</h2>
          <div className="top-list">
            {topSchemas.length > 0 ? (
              topSchemas.map((schema, index) => (
                <Link key={schema.pubkey} to={`/schema/${schema.pubkey}`} className="top-list-item">
                  <div className="top-list-rank">#{index + 1}</div>
                  <div className="top-list-info">
                    <div className="top-list-name">{schema.name}</div>
                    <div className="top-list-address">{schema.credential_name}</div>
                  </div>
                  <div className="top-list-stat">
                    <div className="top-list-value">{schema.attestation_count.toLocaleString()}</div>
                    <div className="top-list-label">attestations</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="top-list-empty">No schemas found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
