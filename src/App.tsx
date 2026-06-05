import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ItemDetailPage from './pages/ItemDetailPage'
import BoxDetailPage from './pages/BoxDetailPage'
import CreateBoxPage from './pages/CreateBoxPage'
import CreateItemPage from './pages/CreateItemPage'

function App() {
  return (
    <BrowserRouter basename="/stuff">
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/boxes/new" element={<CreateBoxPage />} />
          <Route path="/items/new" element={<CreateItemPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/boxes/:id" element={<BoxDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
