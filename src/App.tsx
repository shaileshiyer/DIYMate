import {BrowserRouter,Route,Routes} from 'react-router-dom';
import './App.css';
import Root from './Root';

function App() {

  return (
    <BrowserRouter basename='/'>
      <Routes>
        <Route path="/" element={<Root />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
