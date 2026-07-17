import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Verify from './pages/Verify.jsx'
import Student from './pages/Student.jsx'
import Supervisor from './pages/Supervisor.jsx'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Verify />} />
          <Route path="/student" element={<Student />} />
          <Route path="/supervisor" element={<Supervisor />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
