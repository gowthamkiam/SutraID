interface SutraLogoIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SutraLogoIcon({ size = 36, className, style }: SutraLogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      width={size}
      height={size}
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="sutra-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="sutra-inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
      </defs>
      <path
        d="M256 28L60 120v152c0 108 84 190 196 212 112-22 196-104 196-212V120L256 28z"
        fill="url(#sutra-shield)"
      />
      <path
        d="M256 60L88 140v124c0 92 72 164 168 184 96-20 168-92 168-184V140L256 60z"
        fill="#0f172a"
        opacity="0.85"
      />
      <path
        d="M310 180c0-24-20-40-54-40-30 0-54 14-54 38 0 20 14 32 42 38l40 8c38 8 56 28 56 56 0 38-32 62-78 62-50 0-82-24-84-60h36c2 22 20 34 50 34 30 0 50-14 50-36 0-18-14-30-42-36l-40-8c-34-8-54-26-54-56 0-36 30-62 80-62 46 0 76 24 78 62h-26z"
        fill="url(#sutra-inner)"
      />
    </svg>
  );
}

interface SutraLogoProps {
  size?: number;
  iconSize?: number;
  showText?: boolean;
  textColor?: string;
  fontSize?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SutraLogo({
  size = 32,
  iconSize,
  showText = true,
  textColor,
  fontSize = '1.4rem',
  className,
  style,
}: SutraLogoProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        ...style,
      }}
    >
      <SutraLogoIcon size={iconSize ?? size} />
      {showText && (
        <span
          style={{
            fontSize,
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          <span style={{ color: '#6366f1' }}>S</span>
          <span style={{ color: textColor ?? '#ffffff' }}>utra</span>
          <span style={{ color: '#6366f1' }}>ID</span>
        </span>
      )}
    </span>
  );
}
