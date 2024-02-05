import {BrowserRouter,Route,Routes} from 'react-router-dom';
import './App.css';
import Root from './pages/Root';
import NewDIY from './pages/NewDIY';

function App() {

  return (
    <BrowserRouter basename='/'>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/new" element={<NewDIY />} />
        <Route path="/editor/:session_id" element={<Root />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
