import { useRef, useCallback } from 'react'

/**
 * Returns touch event handlers that mirror HTML5 drag-and-drop for sortable lists.
 * Usage: spread dragProps(i) onto each list item alongside the existing drag* props.
 */
export function useTouchDrag<T>(
  items: T[],
  setItems: (items: T[]) => void,
  setDragOver: (i: number | null) => void,
) {
  const touchSrc = useRef<number | null>(null)
  const touchEl  = useRef<HTMLElement | null>(null)
  const clone    = useRef<HTMLElement | null>(null)

  const onTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    touchSrc.current = index
    touchEl.current  = e.currentTarget as HTMLElement

    // ghost clone that follows the finger
    const el   = touchEl.current
    const rect = el.getBoundingClientRect()
    const ghost = el.cloneNode(true) as HTMLElement
    ghost.style.cssText = `
      position:fixed; left:${rect.left}px; top:${rect.top}px;
      width:${rect.width}px; height:${rect.height}px;
      opacity:0.75; pointer-events:none; z-index:9999;
      border:1px dashed var(--c-cyan); background:rgba(34,211,238,0.08);
      border-radius:6px; box-shadow:0 4px 20px rgba(0,0,0,0.4);
      transform:scale(1.02);
    `
    document.body.appendChild(ghost)
    clone.current = ghost
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchSrc.current === null || !clone.current) return
    e.preventDefault()

    const touch = e.touches[0]

    // move ghost
    const el   = touchEl.current!
    const rect = el.getBoundingClientRect()
    clone.current.style.left = `${touch.clientX - rect.width / 2}px`
    clone.current.style.top  = `${touch.clientY - rect.height / 2}px`

    // find which list item is under the touch point
    clone.current.style.display = 'none'
    const target = document.elementFromPoint(touch.clientX, touch.clientY)
    clone.current.style.display = ''

    // walk up to find a [data-drag-index] attribute
    let el2: Element | null = target
    while (el2 && !el2.hasAttribute('data-drag-index')) el2 = el2.parentElement
    if (el2) {
      const idx = parseInt(el2.getAttribute('data-drag-index')!, 10)
      if (!isNaN(idx)) setDragOver(idx)
    }
  }, [setDragOver])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (clone.current) { document.body.removeChild(clone.current); clone.current = null }

    if (touchSrc.current === null) return

    const touch = e.changedTouches[0]
    let target: Element | null = document.elementFromPoint(touch.clientX, touch.clientY)
    while (target && !target.hasAttribute('data-drag-index')) target = target.parentElement

    if (target) {
      const dst = parseInt(target.getAttribute('data-drag-index')!, 10)
      if (!isNaN(dst) && dst !== touchSrc.current) {
        const next = [...items]
        const [moved] = next.splice(touchSrc.current, 1)
        next.splice(dst, 0, moved)
        setItems(next)
      }
    }

    touchSrc.current = null
    setDragOver(null)
  }, [items, setItems, setDragOver])

  /** Spread these onto each draggable item div. Also set data-drag-index={i} on the element. */
  const dragProps = useCallback((index: number) => ({
    'data-drag-index': index,
    onTouchStart: (e: React.TouchEvent) => onTouchStart(index, e),
    onTouchMove,
    onTouchEnd,
  }), [onTouchStart, onTouchMove, onTouchEnd])

  return { dragProps }
}
