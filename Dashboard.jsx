import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Dashboard({ token }){
  const [projects, setProjects] = useState([])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('My project')

  useEffect(()=>{ fetchProjects() },[])

  async function fetchProjects(){
    const res = await axios.get('http://localhost:3000/api/projects', { headers: { Authorization: 'Bearer ' + token } })
    setProjects(res.data.projects)
  }

  async function uploadFile(){
    if(!file) return alert('pick a file')
    const fd = new FormData()
    fd.append('file', file)
    const res = await axios.post('http://localhost:3000/api/upload', fd, { headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' } })
    await axios.post('http://localhost:3000/api/projects', { title, data: { fileKey: res.data.key } }, { headers: { Authorization: 'Bearer ' + token } })
    fetchProjects()
    alert('uploaded and project created')
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-slate-800 p-4 rounded">
        <h3 className="font-semibold mb-2">Create project</h3>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 rounded bg-slate-700 mb-2" />
        <input type="file" onChange={e=>setFile(e.target.files[0])} className="mb-2" />
        <button onClick={uploadFile} className="bg-rose-500 px-3 py-1 rounded">Upload & Save</button>
      </div>

      <div className="bg-slate-800 p-4 rounded">
        <h3 className="font-semibold">Your projects</h3>
        <ul className="mt-2 space-y-2">
          {projects.map(p=>(
            <li key={p.id} className="p-2 bg-slate-700 rounded">{p.title} — {new Date(p.createdAt).toLocaleString() }</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
