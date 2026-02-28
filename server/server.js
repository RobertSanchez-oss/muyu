const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

const app = express()
const PORT = 3000

// 初始化数据库
const db = new Database(path.join(__dirname, 'muyu.db'))
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT DEFAULT '匿名',
    merit INTEGER DEFAULT 0,
    rank_index INTEGER DEFAULT 0,
    invite_code TEXT UNIQUE,
    created_at INTEGER,
    updated_at INTEGER
  )
`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_merit ON users(merit DESC)`)

// 迁移：为旧数据库添加invite_code列
try {
  db.exec(`ALTER TABLE users ADD COLUMN invite_code TEXT`)
} catch (e) {
  // 列已存在，忽略错误
}

// 创建唯一索引
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_code ON users(invite_code)`)

// 生成6位邀请码
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 排除容易混淆的字符
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

app.use(cors())
app.use(express.json())

// 注册/获取用户
app.post('/api/user', (req, res) => {
  const { userId, nickname } = req.body

  if (userId) {
    // 已有用户，返回信息
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    if (user) {
      return res.json({ success: true, user })
    }
  }

  // 新用户
  const newId = uuidv4()
  const now = Date.now()
  db.prepare(`
    INSERT INTO users (id, nickname, merit, rank_index, created_at, updated_at)
    VALUES (?, ?, 0, 0, ?, ?)
  `).run(newId, nickname || '匿名', now, now)

  res.json({
    success: true,
    user: { id: newId, nickname: nickname || '匿名', merit: 0, rank_index: 0 }
  })
})

// 更新功德
app.post('/api/merit', (req, res) => {
  const { userId, merit, rankIndex } = req.body

  if (!userId || typeof merit !== 'number') {
    return res.status(400).json({ success: false, message: '参数错误' })
  }

  const now = Date.now()
  const result = db.prepare(`
    UPDATE users SET merit = ?, rank_index = ?, updated_at = ? WHERE id = ?
  `).run(merit, rankIndex || 0, now, userId)

  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: '用户不存在' })
  }

  res.json({ success: true })
})

// 获取排行榜
app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)

  const leaderboard = db.prepare(`
    SELECT id, nickname, merit, rank_index FROM users
    ORDER BY merit DESC
    LIMIT ?
  `).all(limit)

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count

  res.json({
    success: true,
    leaderboard,
    totalUsers
  })
})

// 获取用户排名
app.get('/api/rank/:userId', (req, res) => {
  const { userId } = req.params

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' })
  }

  const rank = db.prepare(`
    SELECT COUNT(*) as rank FROM users WHERE merit > ?
  `).get(user.merit).rank + 1

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  const percentile = Math.ceil((rank / totalUsers) * 100)

  res.json({
    success: true,
    user,
    rank,
    totalUsers,
    percentile: `前 ${percentile}%`
  })
})

// 修改昵称
app.post('/api/nickname', (req, res) => {
  const { userId, nickname } = req.body

  if (!userId || !nickname) {
    return res.status(400).json({ success: false, message: '参数错误' })
  }

  // 限制昵称长度
  const safeName = nickname.slice(0, 12)

  db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(safeName, userId)
  res.json({ success: true })
})

// 生成邀请码
app.post('/api/invite/generate', (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ success: false, message: '参数错误' })
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' })
  }

  // 如果已有邀请码，直接返回
  if (user.invite_code) {
    return res.json({ success: true, inviteCode: user.invite_code })
  }

  // 生成新邀请码，确保唯一
  let inviteCode
  let attempts = 0
  while (attempts < 10) {
    inviteCode = generateInviteCode()
    const existing = db.prepare('SELECT id FROM users WHERE invite_code = ?').get(inviteCode)
    if (!existing) break
    attempts++
  }

  if (attempts >= 10) {
    return res.status(500).json({ success: false, message: '生成邀请码失败，请重试' })
  }

  db.prepare('UPDATE users SET invite_code = ? WHERE id = ?').run(inviteCode, userId)
  res.json({ success: true, inviteCode })
})

// 使用邀请码绑定账号
app.post('/api/invite/bind', (req, res) => {
  const { userId, inviteCode } = req.body

  if (!userId || !inviteCode) {
    return res.status(400).json({ success: false, message: '参数错误' })
  }

  // 查找邀请码对应的用户
  const targetUser = db.prepare('SELECT * FROM users WHERE invite_code = ?').get(inviteCode.toUpperCase())
  if (!targetUser) {
    return res.status(404).json({ success: false, message: '邀请码无效' })
  }

  // 不能绑定自己
  if (targetUser.id === userId) {
    return res.status(400).json({ success: false, message: '不能绑定自己的邀请码' })
  }

  // 返回目标用户的ID，前端会更新本地存储
  res.json({
    success: true,
    targetUserId: targetUser.id,
    merit: targetUser.merit,
    rankIndex: targetUser.rank_index
  })
})

app.listen(PORT, () => {
  console.log(`木鱼后端服务运行在 http://localhost:${PORT}`)
})
