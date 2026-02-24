import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AlertManager from './components/AlertManager';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import RiskIntel from './pages/RiskIntel';
import OpsStrategy from './pages/OpsStrategy';
import Analytics from './pages/Analytics';
import FlightSearch from './pages/FlightSearch';
import Settings from './pages/Settings';
import Crew from './pages/Crew';
import './App.css';

function App() {
  return (
    <AlertManager>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<LiveMap />} />
            <Route path="/risk" element={<RiskIntel />} />
            <Route path="/strategy" element={<OpsStrategy />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/search" element={<FlightSearch />} />
            <Route path="/crew" element={<Crew />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AlertManager>
  );
}

export default App;
