import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="app-shell">
      <Outlet />
    </div>
  );
}

export default App;

