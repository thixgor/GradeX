import Image from 'next/image'

export function PremiumLogo() {
  return (
    <div className="relative w-16 h-16">
      <Image
        src="https://i.imgur.com/RZLujWN.png"
        alt="DomineAqui Premium"
        width={64}
        height={64}
        className="rounded-lg w-auto h-auto"
      />
    </div>
  )
}
