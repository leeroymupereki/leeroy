import React, { useState } from 'react'
import axios from 'axios'

export default function Login({ onLogin }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  async function submit(e){
    e.preventDefault()
    const res = await axios.post('http://localhost:3000/api/login', { email, password })
    onLogin(res.data.token)
  }
  return (
    <form onSubmit={submit} className="bg-slate-800 p-6 rounded">
      <h3 className="mb-3 font-semibold">Login</h3>
      <label className="block">Email<input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 p-2 w-full rounded bg-slate-700" /></label>
      <label className="block mt-2">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 p-2 w-full rounded bg-slate-700" /></label>
      <button type="submit" className="mt-4 bg-rose-500 px-4 py-2 rounded">Login</button>
    </form>
  )
}
