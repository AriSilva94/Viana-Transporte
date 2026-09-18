import { useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import backgroundVideo from '@renderer/assets/video/login-background.mp4'
import backgroundPoster from '@renderer/assets/img/login-background.jpg'

export function AuthVideoPanel(): JSX.Element {
  const { t } = useTranslation('auth')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [reduceMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )

  async function togglePlayback(): Promise<void> {
    const video = videoRef.current
    if (!video) return
    if (!video.paused) {
      video.pause()
      return
    }
    try {
      await video.play()
    } catch {
      setHasError(true)
    }
  }

  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-brand-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <img
          src={backgroundPoster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!hasError && (
          <video
            ref={videoRef}
            src={backgroundVideo}
            poster={backgroundPoster}
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => setHasError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      {!hasError && (
        <button
          type="button"
          onClick={() => void togglePlayback()}
          aria-label={isPlaying ? t('background.pause') : t('background.play')}
          title={isPlaying ? t('background.pause') : t('background.play')}
          className="absolute bottom-6 right-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-brand-ink/80 text-white transition-colors hover:bg-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}
