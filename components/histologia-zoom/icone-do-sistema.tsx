import {
  Activity,
  Baby,
  Bone,
  Brain,
  CircleDot,
  Dna,
  Droplet,
  Dumbbell,
  Egg,
  Eye,
  Filter,
  FlaskRound,
  Hand,
  HeartPulse,
  Layers,
  Microscope,
  ShieldPlus,
  Smile,
  Soup,
  Wind,
  type LucideIcon,
} from 'lucide-react'

const ICONES: Record<string, LucideIcon> = {
  Activity,
  Baby,
  Bone,
  Brain,
  CircleDot,
  Dna,
  Droplet,
  Dumbbell,
  Egg,
  Eye,
  Filter,
  FlaskRound,
  Hand,
  HeartPulse,
  Layers,
  ShieldPlus,
  Smile,
  Soup,
  Wind,
}

export function IconeDoSistema({ nome, className }: { nome: string; className?: string }) {
  const Icone = ICONES[nome] ?? Microscope
  return <Icone className={className} aria-hidden />
}
