import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ItemDetailPage from './pages/ItemDetailPage'
import BoxDetailPage from './pages/BoxDetailPage'
import CreateBoxPage from './pages/CreateBoxPage'
import CreateItemPage from './pages/CreateItemPage'
import BulkCreateItemsPage from './pages/BulkCreateItemsPage'
import PasskeyAuthGate from './components/PasskeyAuthGate'

function App() {
  return (
    <BrowserRouter basename="/stuff">
      <PasskeyAuthGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/boxes/new" element={<CreateBoxPage />} />
          <Route path="/items/new" element={<CreateItemPage />} />
          <Route path="/items/bulk" element={<BulkCreateItemsPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/boxes/:id" element={<BoxDetailPage />} />
        </Routes>
      </PasskeyAuthGate>
    </BrowserRouter>
  )
}

export default App
