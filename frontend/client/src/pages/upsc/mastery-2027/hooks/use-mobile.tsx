import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * A custom hook to determine if the current viewport is a mobile device.
 *
 * This hook checks the window width against a predefined breakpoint and
 * returns a boolean value indicating whether the screen size corresponds
 * to a mobile device. It also listens for window resize events to provide
 * real-time updates.
 *
 * @returns {boolean} True if the viewport width is less than the mobile breakpoint, otherwise false.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
