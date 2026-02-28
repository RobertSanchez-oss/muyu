import './style.css'

// ============ 数据安全模块 ============
const SECRET_KEY = 'muyu_2024_gongde'

// 简单加密
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

// 解密
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

// 生成校验和
function generateChecksum(count, timestamp) {
  const data = `${count}_${timestamp}_${SECRET_KEY}`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

// 安全存储
function saveData(count) {
  const timestamp = Date.now()
  const checksum = generateChecksum(count, timestamp)
  const data = { c: count, t: timestamp, h: checksum }
  localStorage.setItem('muyu_data', encrypt(data))
}

// 安全读取
function loadData() {
  const encoded = localStorage.getItem('muyu_data')
  if (!encoded) return { count: 0, valid: true }

  const data = decrypt(encoded)
  if (!data) return { count: 0, valid: false, reason: '数据损坏' }

  // 验证校验和
  const expectedChecksum = generateChecksum(data.c, data.t)
  if (data.h !== expectedChecksum) {
    return { count: 0, valid: false, reason: '数据被篡改' }
  }

  // 验证数值合理性
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

// 从安全存储获取计数
const loadedData = loadData()
let count = loadedData.count

// 如果数据被篡改，显示警告
if (!loadedData.valid) {
  console.warn('功德数据异常，已重置:', loadedData.reason)
  saveData(0)
}

// 兼容旧版数据迁移
const oldCount = localStorage.getItem('muyuCount')
if (oldCount && !localStorage.getItem('muyu_data')) {
  count = parseInt(oldCount, 10) || 0
  saveData(count)
  localStorage.removeItem('muyuCount')
}

let currentRankIndex = getRankIndex(count)

counterEl.textContent = count.toLocaleString()
updateRankDisplay()

// 获取段位索引
function getRankIndex(merit) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (merit >= RANKS[i].min) return i
  }
  return 0
}

// 更新段位显示
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

// 显示升级动画
function showLevelUp(rankIndex) {
  const rank = RANKS[rankIndex]
  levelUpIcon.textContent = rank.icon
  levelUpRank.textContent = rank.name
  levelUp.classList.add('show')

  setTimeout(() => {
    levelUp.classList.remove('show')
  }, 2000)
}

// 触发涟漪
function triggerRipple() {
  ripple.classList.remove('active')
  void ripple.offsetWidth
  ripple.classList.add('active')
}

// 创建功德飘字
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

// 点击处理
function handleTap(e) {
  e.preventDefault()

  // 增加计数
  count++
  saveData(count)
  counterEl.textContent = count.toLocaleString()

  // 检查是否升级
  const newRankIndex = getRankIndex(count)
  if (newRankIndex > currentRankIndex) {
    currentRankIndex = newRankIndex
    showLevelUp(newRankIndex)
  }

  // 更新段位显示
  updateRankDisplay()

  // 触发木鱼动画
  woodenFish.classList.remove('tapped')
  void woodenFish.offsetWidth
  woodenFish.classList.add('tapped')

  // 触发计数器动画
  counterEl.classList.remove('pop')
  void counterEl.offsetWidth
  counterEl.classList.add('pop')

  // 特效
  triggerRipple()
  createMerit()
}

// 重置功德
function handleReset() {
  count = 0
  currentRankIndex = 0
  saveData(0)
  counterEl.textContent = '0'
  updateRankDisplay()
}

// 模态框控制
function openModal() {
  modal.classList.add('show')
}

function closeModal() {
  modal.classList.remove('show')
}

function getLocalPercentile(merit) {
  if (merit >= 100000) return '前 1%'
  if (merit >= 50000) return '前 3%'
  if (merit >= 10000) return '前 10%'
  if (merit >= 3000) return '前 20%'
  if (merit >= 1000) return '前 35%'
  if (merit >= 500) return '前 50%'
  if (merit >= 100) return '前 70%'
  return '前 100%'
}

function openRankModal() {
  const rank = RANKS[getRankIndex(count)]
  rankCount.textContent = count.toLocaleString()
  rankLevel.textContent = rank.name
  rankScope.textContent = getLocalPercentile(count)
  rankModal.classList.add('show')
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

// 入场动画完成后清除，避免干扰点击动画
woodenFish.addEventListener('animationend', (e) => {
  if (e.animationName === 'fishIn') {
    woodenFish.style.animation = 'none'
  }
  woodenFish.classList.remove('tapped')
})

counterEl.addEventListener('animationend', () => {
  counterEl.classList.remove('pop')
})
