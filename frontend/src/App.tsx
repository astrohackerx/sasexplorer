import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CredentialsPage } from './pages/CredentialsPage';
import { SchemasPage } from './pages/SchemasPage';
import { AttestationsPage } from './pages/AttestationsPage';
import { CredentialDetailPage } from './pages/CredentialDetailPage';
import { SchemaDetailPage } from './pages/SchemaDetailPage';
import { AttestationDetailPage } from './pages/AttestationDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CredentialsPage />} />
          <Route path="schemas" element={<SchemasPage />} />
          <Route path="attestations" element={<AttestationsPage />} />
          <Route path="credential/:address" element={<CredentialDetailPage />} />
          <Route path="schema/:address" element={<SchemaDetailPage />} />
          <Route path="attestation/:address" element={<AttestationDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
