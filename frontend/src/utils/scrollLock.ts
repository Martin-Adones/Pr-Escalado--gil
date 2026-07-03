let previousPadding = ''

export function lockBodyScroll(lock: boolean): void {
  if (lock) {
    previousPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollbarWidth}px`
  } else {
    document.body.style.overflow = 'unset'
    document.body.style.paddingRight = previousPadding
    previousPadding = ''
  }
}
