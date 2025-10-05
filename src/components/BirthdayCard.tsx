"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"

interface BirthdayCardProps {
  isOpen: boolean
  onCardOpen: () => void
  onCardComplete: () => void
  onCordPull?: () => void
}

const BirthdayCard: React.FC<BirthdayCardProps> = ({ isOpen, onCardOpen, onCardComplete, onCordPull }) => {
  const [currentStep, setCurrentStep] = useState<"initial" | "question" | "celebration">("initial")
  const cardRef = useRef<HTMLDivElement>(null)
  const cordWrapperRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [engine, setEngine] = useState<any>(null)
  const [points, setPoints] = useState<any[]>([])
  const [constraints, setConstraints] = useState<any[]>([])

  useEffect(() => {
    // Initialize Matter.js when component mounts
    const initMatter = async () => {
      const Matter = (window as any).Matter
      if (!Matter || !canvasContainerRef.current || !cardRef.current) return

      const newEngine = Matter.Engine.create()
      const world = newEngine.world

      const render = Matter.Render.create({
        element: canvasContainerRef.current,
        engine: newEngine,
        options: {
          width: window.innerWidth,
          height: window.innerHeight,
          wireframes: false,
          background: "transparent",
        },
      })

      // Create a chain of points for the ribbon
      const segments = 10
      const segmentHeight = 150 / segments
      const newPoints: any[] = []
      const newConstraints: any[] = []

      // Get card position
      const cardRect = cardRef.current.getBoundingClientRect()
      const startX = window.innerWidth / 2
      const startY = cardRect.top

      // Create points
      for (let i = 0; i <= segments; i++) {
        const point = Matter.Bodies.circle(startX, startY + i * segmentHeight, 2, {
          friction: 0.5,
          restitution: 0.5,
          isStatic: i === 0,
          render: {
            visible: true,
            fillStyle: "#000000",
            strokeStyle: "#000000",
          },
        })
        newPoints.push(point)
        Matter.World.add(world, point)
      }

      // Connect points with constraints
      for (let i = 0; i < newPoints.length - 1; i++) {
        const constraint = Matter.Constraint.create({
          bodyA: newPoints[i],
          bodyB: newPoints[i + 1],
          stiffness: 0.1,
          damping: 0.05,
          length: segmentHeight,
          render: {
            visible: true,
            strokeStyle: "#fe3a65",
            lineWidth: 1,
          },
        })
        newConstraints.push(constraint)
        Matter.World.add(world, constraint)
      }

      // Create and start the runner
      const runner = Matter.Runner.create()
      Matter.Runner.run(runner, newEngine)
      Matter.Render.run(render)

      setEngine(newEngine)
      setPoints(newPoints)
      setConstraints(newConstraints)
    }

    // Load Matter.js and canvas-confetti
    const loadScripts = () => {
      const matterScript = document.createElement("script")
      matterScript.src = "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"
      matterScript.onload = () => {
        const confettiScript = document.createElement("script")
        confettiScript.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"
        confettiScript.onload = initMatter
        document.head.appendChild(confettiScript)
      }
      document.head.appendChild(matterScript)
    }

    if (!(window as any).Matter) {
      loadScripts()
    } else {
      initMatter()
    }

    return () => {
      // Cleanup Matter.js
      if (engine) {
        const Matter = (window as any).Matter
        Matter.Engine.clear(engine)
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen && cardRef.current) {
      gsap.to(cardRef.current, {
        rotateX: 0,
        duration: 1,
        ease: "back.out(1.7)",
      })

      gsap.to(".card-content", {
        opacity: 1,
        delay: 0.5,
        duration: 0.5,
      })

      // Confetti effect
      gsap.to(".sparkle", {
        scale: 1.2,
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: "none",
        stagger: 0.1,
      })

      const t = gsap.timeline({ delay: 0.6 })
      t.fromTo(cardRef.current, { rotateY: -8 }, { rotateY: 180, duration: 0.8, ease: "power2.inOut" }).to(
        cardRef.current,
        { rotateY: 0, duration: 0.8, ease: "power2.inOut" },
      )
    }
  }, [isOpen])

  const updateRibbon = () => {
    if (!points.length || !cordWrapperRef.current) return

    const segments = points.length
    const ribbon = cordWrapperRef.current.querySelector(".ribbon")
    const plug = cordWrapperRef.current.querySelector(".plug")
    const cardRect = cardRef.current?.getBoundingClientRect()

    if (!ribbon || !plug || !cardRect) return

    const startX = window.innerWidth / 2
    const startY = cardRect.top

    for (let i = 0; i < segments - 1; i++) {
      const current = points[i]
      const next = points[i + 1]

      const dx = next.position.x - current.position.x
      const dy = next.position.y - current.position.y
      const angle = Math.atan2(dy, dx)

      const segmentLength = Math.sqrt(dx * dx + dy * dy)
      gsap.set(ribbon, {
        height: segmentLength,
        rotation: angle * (180 / Math.PI),
        x: current.position.x - startX,
        y: current.position.y - startY,
      })

      // Update plug position and rotation
      if (i === segments - 2) {
        gsap.set(plug, {
          x: next.position.x - startX,
          y: next.position.y - startY - 20,
          rotation: angle * (180 / Math.PI) - 90,
          transformOrigin: "50% 0%",
        })
      }
    }
  }

  const handleCordPull = () => {
    if (isDragging || !points.length) return
    setIsDragging(true)
    onCardOpen()

    // Trigger butterflies to fly away
    if (onCordPull) {
      onCordPull()
    }

    const cordWrapper = cordWrapperRef.current
    if (!cordWrapper) return

    const plug = cordWrapper.querySelector(".plug")
    if (plug) {
      gsap.to(plug, {
        y: 50,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(plug, {
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)",
          })
          setIsDragging(false)
        },
      })
    }
  }

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const plug = cordWrapperRef.current?.querySelector(".plug") as HTMLElement
    if (plug) {
      plug.style.cursor = "grabbing"
    }
  }

  const drag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !points.length) return

    const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX
    const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY

    const Matter = (window as any).Matter
    const lastPoint = points[points.length - 1]
    Matter.Body.setPosition(lastPoint, {
      x: clientX,
      y: clientY,
    })

    updateRibbon()

    const cardRect = cardRef.current?.getBoundingClientRect()
    if (cardRect && clientY > cardRect.top + 300 && !cardRef.current?.classList.contains("open")) {
      openCard()
    }
  }

  const endDrag = () => {
    setIsDragging(false)
    const plug = cordWrapperRef.current?.querySelector(".plug") as HTMLElement
    if (plug) {
      plug.style.cursor = "grab"
    }
  }

  const openCard = () => {
    if (!cardRef.current || !cordWrapperRef.current) return

    cardRef.current.classList.add("open")

    // Trigger butterflies to fly away
    if (onCordPull) {
      onCordPull()
    }

    // Shock effect (vibration)
    gsap.to(cardRef.current, {
      y: "+=30",
      yoyo: true,
      repeat: 5,
      duration: 0.05,
      onComplete: () => {
        gsap.set(cardRef.current, { x: 0 })
      },
    })

    // Confetti effect
    const confetti = (window as any).confetti
    if (confetti) {
      confetti({
        particleCount: 300,
        spread: 100,
        origin: { y: 0.6 },
      })
    }

    // Show content
    gsap.to(".card-content", {
      opacity: 1,
      duration: 0.5,
      delay: 0.3,
    })

    // Hide ribbon and cord
    const ribbon = cordWrapperRef.current.querySelector(".ribbon")
    gsap.to([cordWrapperRef.current, ribbon], {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        if (cordWrapperRef.current) {
          cordWrapperRef.current.style.display = "none"
        }
        if (ribbon) {
          ;(ribbon as HTMLElement).style.display = "none"
        }
      },
    })

    const tl = gsap.timeline()
    tl.to(cardRef.current, { rotateX: -10, duration: 0.2 })
      .to(cardRef.current, { rotateX: 0, duration: 0.1 })
      .to(cardRef.current, { rotateX: 10, duration: 0.14 })
      .to(cardRef.current, { rotateX: 0, duration: 0.05 })
      .repeat(2)

    // Hide Matter.js points and constraints
    points.forEach((point) => {
      point.render.visible = false
    })
    constraints.forEach((constraint) => {
      constraint.render.visible = false
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => drag(e)
    const handleTouchMove = (e: TouchEvent) => drag(e)
    const handleMouseUp = () => endDrag()
    const handleTouchEnd = () => endDrag()

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchend", handleTouchEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isDragging, points])

  // Animation frame for updating ribbon
  useEffect(() => {
    let animationId: number
    const animate = () => {
      updateRibbon()
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [points])

  const handleYes = () => {
    setCurrentStep("celebration")
    // Trigger celebration animations
    gsap.to(".celebration-hearts", {
      scale: 1.5,
      rotation: 360,
      duration: 1,
      ease: "back.out(1.7)",
      onComplete: () => {
        // Close the card after celebration and show cake
        setTimeout(() => {
          gsap.to(cardRef.current, {
            rotateX: -90,
            duration: 1,
            ease: "power2.inOut",
            onComplete: () => {
              onCardComplete()
            },
          })
        }, 3000)
      },
    })
  }

  const handleNo = () => {
    // Fun bouncing animation
    gsap.to(cardRef.current, {
      x: 10,
      duration: 0.1,
      repeat: 5,
      yoyo: true,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.set(cardRef.current, { x: 0 })
      },
    })
  }

  const handleTryAgainHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const minDisplacement = 100 // Minimum move distance
    const maxDisplacement = 500 // Maximum move distance

    const getRandomDisplacement = (min: number, max: number) => {
      const displacement = Math.random() * (max - min) + min
      return Math.random() < 0.5 ? -displacement : displacement
    }

    const buttonRect = button.getBoundingClientRect()
    const viewportWidth = window.innerWidth - buttonRect.width
    const viewportHeight = window.innerHeight - buttonRect.height

    let x = getRandomDisplacement(minDisplacement, maxDisplacement)
    let y = getRandomDisplacement(minDisplacement, maxDisplacement)

    // Ensure button stays within screen boundaries
    if (buttonRect.left + x < 0) x = Math.abs(x) // Prevent moving past left boundary
    if (buttonRect.right + x > viewportWidth) x = -Math.abs(x) // Prevent moving past right boundary
    if (buttonRect.top + y < 0) y = Math.abs(y) // Prevent moving past top boundary
    if (buttonRect.bottom + y > viewportHeight) y = -Math.abs(y) // Prevent moving past bottom boundary

    gsap.to(button, {
      x: `+=${x}`, // Move relative to current position
      y: `+=${y}`,
      duration: 0.1,
      delay: 0.2,
      ease: "power2.out",
    })
  }
  return (
    <div className="birthday-card-container">
      <div ref={canvasContainerRef} id="canvas-container"></div>

      {!isOpen && (
        <div ref={cordWrapperRef} className="cord-wrapper">
          <svg width="40" height="200" className="cord">
            <path className="cord-path" d="M20,0 C20,50 20,150 20,200" />
          </svg>
          <svg
            className="plug"
            y="140"
            viewBox="0 0 100 160"
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            onClick={handleCordPull}
          >
            <path d="M30,0 L70,0 L90,40 L90,140 L10,140 L10,40 Z" />
            <circle cx="35" cy="20" r="5" fill="white" />
            <circle cx="65" cy="20" r="5" fill="white" />
          </svg>
          <div className="ribbon"></div>
          <p className="text-intro">Pull the cord to open Gayathri's surprise!</p>
        </div>
      )}

      <div className="card-3d">
        <div
          ref={cardRef}
          className={`card glass ${isOpen ? "open" : ""}`}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            borderRadius: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
            backdropFilter: "blur(14px) saturate(120%)",
            WebkitBackdropFilter: "blur(14px) saturate(120%)",
            transformStyle: "preserve-3d",
            transform: isOpen ? "rotateX(0deg)" : "rotateX(-90deg)",
          }}
        >
          <div className="card-content">
            {currentStep === "initial" && (
              <div className="initial-content text-center">
                {/* removed the sparkles-container that rendered <Sparkles /> icons */}

                <img
                  src="/images/birthday-hero.png"
                  alt="Friends celebrating Gayathri's birthday with balloons and cake"
                  className="mx-auto w-full max-w-[560px] rounded-2xl shadow-2xl ring-1 ring-white/30 mb-4 object-cover"
                  style={{ maxHeight: 200 }}
                  loading="lazy"
                />

                <h1 className="card__greeting-title mb-3">{"Happy Birthday Gayathri"}</h1>

                <div className="birthday-message card-message text-sm md:text-base leading-relaxed mb-5">
                  <p className="mb-3">{"Another year of amazing memories!"}</p>
                  <p className="mb-3">{"You light up every room you enter"}</p>
                  <p className="mb-3">{"Hope your special day is as wonderful as you are!"}</p>
                </div>

                <button
                  onClick={() => setCurrentStep("question")}
                  className="bg-pink-500/90 hover:bg-pink-500 text-white font-bold py-4 px-10 rounded-full transform hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  {"Continue Celebration! 🎂"}
                </button>
              </div>
            )}

            {currentStep === "question" && (
              <div className="question-content text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">💖 Special Birthday Question 💖</h1>
                <div className="mb-8">
                  <img
                    className="please mx-auto rounded-lg shadow-lg mb-4"
                    src="/images/design-mode/pexels-photo-1587927.jpeg"
                    alt="Birthday celebration"
                  />
                  <p className="text-white text-base md:text-lg mb-6">
                    Are you ready for the most amazing birthday year ahead, Gayathri? 🌈
                  </p>
                </div>
                <div className="buttons">
                  <button onClick={handleYes} className="yes">
                    YES! 🎉
                  </button>
                  <button onClick={handleNo} onMouseOver={handleTryAgainHover} className="no">
                    Try Again! 😄
                  </button>
                </div>
              </div>
            )}

            {currentStep === "celebration" && (
              <div className="celebration-content text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">🎊 WOOHOO! 🎊</h1>
                <div className="mb-6">
                  <img
                    className="congrats mx-auto rounded-lg shadow-lg mb-4"
                    src="/images/celebration-hero.png"
                    alt="Celebration"
                  />
                  <div className="text-white text-base md:text-lg space-y-3">
                    <p>🎈 That's the birthday spirit, Gayathri! 🎈</p>
                    <p>✨ May this year bring you endless joy, laughter, and beautiful moments! ✨</p>
                    <p>🎂 You deserve all the happiness in the world! 🎂</p>
                    <p className="text-xl md:text-2xl font-bold mt-3">🎉 Have an absolutely FANTASTIC birthday! 🎉</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BirthdayCard
