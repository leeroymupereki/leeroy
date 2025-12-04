import React, { useState } from 'react'
import axios from 'axios'

export default function Signup({ onLogin }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  async function submit(e){
    e.preventDefault()
    const res = await axios.post('http://localhost:3000/api/signup', { email, password, name })
    onLogin(res.data.token)
  }
  return (
    <form onSubmit={submit} className="bg-slate-800 p-6 rounded">
      <h3 className="mb-3 font-semibold">Sign up</h3>
      <label className="block">Name<input value={name} onChange={e=>setName(e.target.value)} className="mt-1 p-2 w-full rounded bg-slate-700" /></label>
      <label className="block mt-2">Email<input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 p-2 w-full rounded bg-slate-700" /></label>
      <label className="block mt-2">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 p-2 w-full rounded bg-slate-700" /></label>
      <button type="submit" className="mt-4 bg-rose-500 px-4 py-2 rounded">Create account</button>
    </form>
  )
}
