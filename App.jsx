import React, { useState } from 'react'
import Login from './auth/Login'
import Signup from './auth/Signup'
import Dashboard from './pages/Dashboard'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  function onLogin(t){ localStorage.setItem('token', t); setToken(t) }
  function onLogout(){ localStorage.removeItem('token'); setToken('') }
  return (
    <div className="min-h-screen bg-slate-900 text-sky-50 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shanduko</h1>
        {token ? <button onClick={onLogout} className="bg-rose-500 px-3 py-1 rounded">Logout</button> : null}
      </header>
      {!token ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Login onLogin={onLogin} />
          <Signup onLogin={onLogin} />
        </div>
      ) : (
        <Dashboard token={token} />
      )}
    </div>
  )
}
