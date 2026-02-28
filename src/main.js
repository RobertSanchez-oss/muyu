import './style.css'

// ============ API 模块 ============
const API_BASE = '/api'

async function apiCall(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    return await res.json()
  } catch (e) {
    console.warn('API 调用失败:', e)
    return null
  }
}

// 获取或创建用户
async function initUser() {
  let userId = localStorage.getItem('muyu_user_id')
  const res = await apiCall('/user', {
    method: 'POST',
    body: JSON.stringify({ userId })
  })
  if (res?.success) {
    localStorage.setItem('muyu_user_id', res.user.id)
    return res.user
  }
  return null
}

// 同步功德到服务器
let syncTimer = null
function syncMerit(merit, rankIndex) {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    const userId = localStorage.getItem('muyu_user_id')
    if (userId) {
      await apiCall('/merit', {
        method: 'POST',
        body: JSON.stringify({ userId, merit, rankIndex })
      })
    }
  }, 1000) // 防抖 1 秒
}

// 获取排名信息
async function fetchRankInfo() {
  const userId = localStorage.getItem('muyu_user_id')
  if (!userId) return null
  return await apiCall(`/rank/${userId}`)
}

// 获取排行榜
async function fetchLeaderboard() {
  return await apiCall('/leaderboard?limit=20')
}

// ============ 数据安全模块 ============
const SECRET_KEY = 'muyu_2024_gongde'

function encrypt(data) {
  const str = JSON.stringify(data)
  let result = ''
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(
      str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
    )
  }
  return btoa(result)
}

function decrypt(encoded) {
  try {
    const str = atob(encoded)
    let result = ''
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(
        str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
      )
    }
    return JSON.parse(result)
  } catch {
    return null
  }
}

function generateChecksum(count, timestamp) {
  const data = `${count}_${timestamp}_${SECRET_KEY}`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

function saveData(count) {
  const timestamp = Date.now()
  const checksum = generateChecksum(count, timestamp)
  const data = { c: count, t: timestamp, h: checksum }
  localStorage.setItem('muyu_data', encrypt(data))
}

function loadData() {
  const encoded = localStorage.getItem('muyu_data')
  if (!encoded) return { count: 0, valid: true }

  const data = decrypt(encoded)
  if (!data) return { count: 0, valid: false, reason: '数据损坏' }

  const expectedChecksum = generateChecksum(data.c, data.t)
  if (data.h !== expectedChecksum) {
    return { count: 0, valid: false, reason: '数据被篡改' }
  }

  if (data.c < 0 || data.c > 10000000) {
    return { count: 0, valid: false, reason: '数据异常' }
  }

  return { count: data.c, valid: true }
}

// ============ DOM 元素 ============
const woodenFish = document.getElementById('woodenFish')
const stage = document.getElementById('stage')
const counterEl = document.getElementById('counter')
const ripple = document.getElementById('ripple')
const resetBtn = document.getElementById('resetBtn')
const logBtn = document.getElementById('logBtn')
const rankBtn = document.getElementById('rankBtn')
const modal = document.getElementById('modal')
const modalClose = document.getElementById('modalClose')
const rankModal = document.getElementById('rankModal')
const rankClose = document.getElementById('rankClose')
const rankCount = document.getElementById('rankCount')
const rankLevel = document.getElementById('rankLevel')
const rankScope = document.getElementById('rankScope')
const rankBox = document.getElementById('rankBox')
const rankIcon = document.getElementById('rankIcon')
const rankName = document.getElementById('rankName')
const rankProgressBar = document.getElementById('rankProgressBar')
const rankInfo = document.getElementById('rankInfo')
const levelUp = document.getElementById('levelUp')
const levelUpIcon = document.getElementById('levelUpIcon')
const levelUpRank = document.getElementById('levelUpRank')

// 段位配置
const RANKS = [
  { min: 0, name: '初入佛门', icon: '🙏' },
  { min: 100, name: '善男信女', icon: '📿' },
  { min: 500, name: '虔诚居士', icon: '🪷' },
  { min: 1000, name: '苦行僧', icon: '🧘' },
  { min: 3000, name: '罗汉', icon: '☸️' },
  { min: 10000, name: '菩萨', icon: '🪬' },
  { min: 50000, name: '佛陀', icon: '🌟' },
  { min: 100000, name: '功德圆满', icon: '✨' }
]

// 初始化
const loadedData = loadData()
let count = loadedData.count

if (!loadedData.valid) {
  console.warn('功德数据异常，已重置:', loadedData.reason)
  saveData(0)
}

const oldCount = localStorage.getItem('muyuCount')
if (oldCount && !localStorage.getItem('muyu_data')) {
  count = parseInt(oldCount, 10) || 0
  saveData(count)
  localStorage.removeItem('muyuCount')
}

let currentRankIndex = getRankIndex(count)

counterEl.textContent = count.toLocaleString()
updateRankDisplay()

// 初始化用户并同步
initUser().then(user => {
  if (user && count > 0) {
    syncMerit(count, currentRankIndex)
  }
})

function getRankIndex(merit) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (merit >= RANKS[i].min) return i
  }
  return 0
}

function updateRankDisplay() {
  const rankIndex = getRankIndex(count)
  const rank = RANKS[rankIndex]
  const nextRank = RANKS[rankIndex + 1]

  rankBox.dataset.rank = rankIndex
  rankIcon.textContent = rank.icon
  rankName.textContent = rank.name

  if (nextRank) {
    const progress = ((count - rank.min) / (nextRank.min - rank.min)) * 100
    rankProgressBar.style.width = `${Math.min(progress, 100)}%`
    rankInfo.textContent = `距离 ${nextRank.name}: ${(nextRank.min - count).toLocaleString()}`
  } else {
    rankProgressBar.style.width = '100%'
    rankInfo.textContent = '已达最高段位'
  }
}

function showLevelUp(rankIndex) {
  const rank = RANKS[rankIndex]
  levelUpIcon.textContent = rank.icon
  levelUpRank.textContent = rank.name
  levelUp.classList.add('show')

  setTimeout(() => {
    levelUp.classList.remove('show')
  }, 2000)
}

function triggerRipple() {
  ripple.classList.remove('active')
  void ripple.offsetWidth
  ripple.classList.add('active')
}

function createMerit() {
  const merit = document.createElement('span')
  merit.className = 'merit'
  merit.textContent = '功德 +1'
  merit.style.setProperty('--offset', `${(Math.random() - 0.5) * 50}px`)

  stage.appendChild(merit)

  requestAnimationFrame(() => {
    merit.classList.add('fly')
  })

  merit.addEventListener('animationend', () => merit.remove(), { once: true })
}

function handleTap(e) {
  e.preventDefault()

  count++
  saveData(count)
  counterEl.textContent = count.toLocaleString()

  const newRankIndex = getRankIndex(count)
  if (newRankIndex > currentRankIndex) {
    currentRankIndex = newRankIndex
    showLevelUp(newRankIndex)
  }

  updateRankDisplay()
  syncMerit(count, currentRankIndex)

  woodenFish.classList.remove('tapped')
  void woodenFish.offsetWidth
  woodenFish.classList.add('tapped')

  counterEl.classList.remove('pop')
  void counterEl.offsetWidth
  counterEl.classList.add('pop')

  triggerRipple()
  createMerit()
}

function handleReset() {
  count = 0
  currentRankIndex = 0
  saveData(0)
  counterEl.textContent = '0'
  updateRankDisplay()
  syncMerit(0, 0)
}

function openModal() {
  modal.classList.add('show')
}

function closeModal() {
  modal.classList.remove('show')
}

async function openRankModal() {
  const rank = RANKS[getRankIndex(count)]
  rankCount.textContent = count.toLocaleString()
  rankLevel.textContent = rank.name
  rankScope.textContent = '加载中...'
  rankModal.classList.add('show')

  // 获取真实排名
  const res = await fetchRankInfo()
  if (res?.success) {
    rankScope.textContent = `第 ${res.rank} 名 (${res.percentile})`
  } else {
    rankScope.textContent = '暂无排名'
  }
}

function closeRankModal() {
  rankModal.classList.remove('show')
}

// 绑定事件
woodenFish.addEventListener('click', handleTap)
woodenFish.addEventListener('touchstart', handleTap, { passive: false })
resetBtn.addEventListener('click', handleReset)
logBtn.addEventListener('click', openModal)
rankBtn.addEventListener('click', openRankModal)
modalClose.addEventListener('click', closeModal)
rankClose.addEventListener('click', closeRankModal)
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal()
})
rankModal.addEventListener('click', (e) => {
  if (e.target === rankModal) closeRankModal()
})
levelUp.addEventListener('click', () => {
  levelUp.classList.remove('show')
})

woodenFish.addEventListener('animationend', (e) => {
  if (e.animationName === 'fishIn') {
    woodenFish.style.animation = 'none'
  }
  woodenFish.classList.remove('tapped')
})

counterEl.addEventListener('animationend', () => {
  counterEl.classList.remove('pop')
})
