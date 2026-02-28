import './style.css'

const woodenFish = document.getElementById('woodenFish')
const stage = document.getElementById('stage')
const counterEl = document.getElementById('counter')
const ripple = document.getElementById('ripple')
const resetBtn = document.getElementById('resetBtn')
const logBtn = document.getElementById('logBtn')
const modal = document.getElementById('modal')
const modalClose = document.getElementById('modalClose')

// 从 localStorage 获取计数
let count = parseInt(localStorage.getItem('muyuCount') || '0', 10)
counterEl.textContent = count.toLocaleString()

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
  localStorage.setItem('muyuCount', '0')
  counterEl.textContent = '0'
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
