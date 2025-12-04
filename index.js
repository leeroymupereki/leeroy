require('dotenv').config()
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const Queue = require('bull')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const upload = multer({ dest: 'uploads/', limits: { fileSize: 300 * 1024 * 1024 } })

app.use(rateLimit({ windowMs: 15*60*1000, max: 300 }))

const s3 = new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT ? `http://${process.env.MINIO_ENDPOINT}` : undefined,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
  }
})
const BUCKET = process.env.MINIO_BUCKET || 'shanduko'

// Auth
app.post('/api/signup', async (req, res) => {
  try{
    const { email, password, name } = req.body
    if(!email || !password) return res.status(400).json({ message: 'Email and password required' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { email, password: hashed, name } })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '12h' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  }catch(err){ console.error(err); res.status(500).json({ message: err.message }) }
})

app.post('/api/login', async (req, res) => {
  try{
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if(!user) return res.status(401).json({ message: 'Invalid' })
    const ok = await bcrypt.compare(password, user.password)
    if(!ok) return res.status(401).json({ message: 'Invalid' })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '12h' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  }catch(err){ console.error(err); res.status(500).json({ message: err.message }) }
})

function auth(req,res,next){
  const h = req.headers.authorization
  if(!h) return res.status(401).json({ message: 'Missing' })
  const parts = h.split(' ')
  try{
    const payload = jwt.verify(parts[1], JWT_SECRET)
    req.userId = payload.userId
    next()
  }catch(e){ return res.status(401).json({ message: 'Invalid token' }) }
}

// Projects
app.post('/api/projects', auth, async (req,res)=>{
  const { title, data } = req.body
  const p = await prisma.project.create({ data: { title, data, userId: req.userId } })
  res.json({ project: p })
})
app.get('/api/projects', auth, async (req,res)=>{
  const list = await prisma.project.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } })
  res.json({ projects: list })
})

// Upload to MinIO
app.post('/api/upload', auth, upload.single('file'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({ message: 'No file' })
    const key = `uploads/${Date.now()}-${req.file.originalname}`
    const body = fs.createReadStream(req.file.path)
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body }))
    fs.unlinkSync(req.file.path)
    res.json({ key })
  }catch(err){ console.error(err); res.status(500).json({ message: err.message }) }
})

// Enqueue job (saves upload locally for worker to process)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
const videoQueue = new Queue('video-queue', redisUrl)
app.post('/api/enqueue', auth, upload.single('video'), async (req,res)=>{
  if(!req.file) return res.status(400).json({ message: 'No file' })
  const start = parseFloat(req.body.start) || 0
  const end = parseFloat(req.body.end) || (start + 5)
  const job = await videoQueue.add({ path: req.file.path, original: req.file.originalname, userId: req.userId, start, end })
  res.json({ jobId: job.id })
})

app.get('/api/job/:id', auth, async (req,res)=>{
  const job = await videoQueue.getJob(req.params.id)
  if(!job) return res.status(404).json({ status: 'not-found' })
  const state = await job.getState()
  res.json({ status: state, data: job.data, result: job.returnvalue })
})

app.get('/health', (req,res)=> res.json({ ok:true }))

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log('Server listening on', PORT))
