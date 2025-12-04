require('dotenv').config()
const Queue = require('bull')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const path = require('path')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
const videoQueue = new Queue('video-queue', redisUrl)

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

videoQueue.process(async (job) => {
  const { path: inputPath, original, start, end, userId } = job.data
  const outPath = path.join(__dirname, 'outputs', `${Date.now()}-job-${job.id}.mp4`)
  fs.mkdirSync(path.join(__dirname, 'outputs'), { recursive: true })
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(start || 0)
      .setDuration(Math.max(0.1, (end || start + 5) - (start || 0)))
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions('-preset veryfast', '-crf 23')
      .on('error', err => reject(err))
      .on('end', () => resolve())
      .save(outPath)
  })
  const stream = fs.createReadStream(outPath)
  const key = `outputs/${Date.now()}-job-${job.id}.mp4`
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: stream }))
  try{ fs.unlinkSync(inputPath) }catch(e){}
  try{ fs.unlinkSync(outPath) }catch(e){};
  return { outputKey: key }
})

console.log('Worker started; waiting for jobs...')
