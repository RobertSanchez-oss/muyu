import './style.css'

const woodenFish = document.getElementById('woodenFish')
const stage = document.getElementById('stage')
const counterEl = document.getElementById('counter')
const ripple = document.getElementById('ripple')
const resetBtn = document.getElementById('resetBtn')
const logBtn = document.getElementById('logBtn')
const modal = document.getElementById('modal')
const modalClose = document.getElementById('modalClose')
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

// 从 localStorage 获取计数
let count = parseInt(localStorage.getItem('muyuCount') || '0', 10)
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
  localStorage.setItem('muyuCount', count.toString())
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
  localStorage.setItem('muyuCount', '0')
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

// 绑定事件
woodenFish.addEventListener('click', handleTap)
woodenFish.addEventListener('touchstart', handleTap, { passive: false })
resetBtn.addEventListener('click', handleReset)
logBtn.addEventListener('click', openModal)
modalClose.addEventListener('click', closeModal)
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal()
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
