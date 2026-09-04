import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

/**
 * O desenho de cada ícone do menu.
 *
 * ## Por que Phosphor, e não mais lucide
 *
 * O lucide virou o padrão de fábrica de todo template e todo gerador de UI, e
 * o efeito colateral é que produtos diferentes passaram a ter exatamente a
 * mesma cara — a mesma casinha, o mesmo cilindro de banco de dados, o mesmo
 * cérebro. Num menu que é a moldura permanente da plataforma, isso custa
 * identidade: a coluna da esquerda é a primeira coisa que se vê em toda tela e
 * era a mais genérica de todas.
 *
 * O Phosphor resolve isso com um traço próprio (terminações arredondadas,
 * desenho mais cheio) e, principalmente, com SEIS PESOS do mesmo ícone. É esse
 * segundo ponto que muda o menu de verdade: o item ativo passa a ser o mesmo
 * desenho em `fill`, e não o mesmo desenho com outra cor de fundo — a
 * hierarquia deixa de depender só de cor, que é o que falha para quem não
 * distingue bem o verde.
 *
 * ## Os NOMES não mudaram
 *
 * As chaves aqui continuam sendo as do lucide (`heart-pulse`, `flask-conical`,
 * `gamepad-2`), e é de propósito: elas estão gravadas no banco, escolhidas uma
 * a uma pelo admin em /admin (ver lib/sidebar-icons.ts). Renomear o catálogo
 * para os nomes do Phosphor faria `normalizeSidebarIcons` não reconhecer nada e
 * devolver todo mundo ao padrão — cada seção que alguém configurou à mão
 * voltaria à estaca zero, em silêncio. Trocamos o DESENHO, não o endereço.
 *
 * Onde o Phosphor não tem equivalente exato, vale o parente mais próximo pelo
 * que o rótulo do catálogo promete (o `beaker`/"Béquer" vira `Flask`, o
 * `orbit` vira `Planet`); o teste em __tests__/sidebar/icones.test.ts garante
 * que nenhum nome fique sem desenho.
 *
 * Import um a um por `dist/ssr/<Nome>`: o barril do pacote traz os ~1.500
 * ícones e nenhum bundler os remove depois. Nunca `import * as Icons`.
 */

import { AppleLogo } from '@phosphor-icons/react/dist/ssr/AppleLogo'
import { Atom } from '@phosphor-icons/react/dist/ssr/Atom'
import { Baby } from '@phosphor-icons/react/dist/ssr/Baby'
import { Barbell } from '@phosphor-icons/react/dist/ssr/Barbell'
import { Bed } from '@phosphor-icons/react/dist/ssr/Bed'
import { Bell } from '@phosphor-icons/react/dist/ssr/Bell'
import { Biohazard } from '@phosphor-icons/react/dist/ssr/Biohazard'
import { Bone } from '@phosphor-icons/react/dist/ssr/Bone'
import { Book } from '@phosphor-icons/react/dist/ssr/Book'
import { BookBookmark } from '@phosphor-icons/react/dist/ssr/BookBookmark'
import { BookOpen } from '@phosphor-icons/react/dist/ssr/BookOpen'
import { BookOpenText } from '@phosphor-icons/react/dist/ssr/BookOpenText'
import { BookmarkSimple } from '@phosphor-icons/react/dist/ssr/BookmarkSimple'
import { Books } from '@phosphor-icons/react/dist/ssr/Books'
import { Brain } from '@phosphor-icons/react/dist/ssr/Brain'
import { Calculator } from '@phosphor-icons/react/dist/ssr/Calculator'
import { Calendar } from '@phosphor-icons/react/dist/ssr/Calendar'
import { CalendarDots } from '@phosphor-icons/react/dist/ssr/CalendarDots'
import { Camera } from '@phosphor-icons/react/dist/ssr/Camera'
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar'
import { ChartPie } from '@phosphor-icons/react/dist/ssr/ChartPie'
import { ChatCircle } from '@phosphor-icons/react/dist/ssr/ChatCircle'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr/ClipboardText'
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock'
import { Coins } from '@phosphor-icons/react/dist/ssr/Coins'
import { Compass } from '@phosphor-icons/react/dist/ssr/Compass'
import { Cpu } from '@phosphor-icons/react/dist/ssr/Cpu'
import { Crosshair } from '@phosphor-icons/react/dist/ssr/Crosshair'
import { Database } from '@phosphor-icons/react/dist/ssr/Database'
import { DeviceMobile } from '@phosphor-icons/react/dist/ssr/DeviceMobile'
import { DiceFive } from '@phosphor-icons/react/dist/ssr/DiceFive'
import { Dna } from '@phosphor-icons/react/dist/ssr/Dna'
import { Drop } from '@phosphor-icons/react/dist/ssr/Drop'
import { DropHalfBottom } from '@phosphor-icons/react/dist/ssr/DropHalfBottom'
import { Ear } from '@phosphor-icons/react/dist/ssr/Ear'
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye'
import { FileArrowDown } from '@phosphor-icons/react/dist/ssr/FileArrowDown'
import { FileMagnifyingGlass } from '@phosphor-icons/react/dist/ssr/FileMagnifyingGlass'
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText'
import { Files } from '@phosphor-icons/react/dist/ssr/Files'
import { FilmStrip } from '@phosphor-icons/react/dist/ssr/FilmStrip'
import { Fire } from '@phosphor-icons/react/dist/ssr/Fire'
import { FirstAid } from '@phosphor-icons/react/dist/ssr/FirstAid'
import { Flask } from '@phosphor-icons/react/dist/ssr/Flask'
import { Folder } from '@phosphor-icons/react/dist/ssr/Folder'
import { FolderOpen } from '@phosphor-icons/react/dist/ssr/FolderOpen'
import { FolderStar } from '@phosphor-icons/react/dist/ssr/FolderStar'
import { Footprints } from '@phosphor-icons/react/dist/ssr/Footprints'
import { GameController } from '@phosphor-icons/react/dist/ssr/GameController'
import { Gauge } from '@phosphor-icons/react/dist/ssr/Gauge'
import { Globe } from '@phosphor-icons/react/dist/ssr/Globe'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { HeadCircuit } from '@phosphor-icons/react/dist/ssr/HeadCircuit'
import { Heart } from '@phosphor-icons/react/dist/ssr/Heart'
import { Heartbeat } from '@phosphor-icons/react/dist/ssr/Heartbeat'
import { HighlighterCircle } from '@phosphor-icons/react/dist/ssr/HighlighterCircle'
import { House } from '@phosphor-icons/react/dist/ssr/House'
import { Image } from '@phosphor-icons/react/dist/ssr/Image'
import { Key } from '@phosphor-icons/react/dist/ssr/Key'
import { Leaf } from '@phosphor-icons/react/dist/ssr/Leaf'
import { Lightbulb } from '@phosphor-icons/react/dist/ssr/Lightbulb'
import { Lightning } from '@phosphor-icons/react/dist/ssr/Lightning'
import { List } from '@phosphor-icons/react/dist/ssr/List'
import { ListChecks } from '@phosphor-icons/react/dist/ssr/ListChecks'
import { Lock } from '@phosphor-icons/react/dist/ssr/Lock'
import { MagicWand } from '@phosphor-icons/react/dist/ssr/MagicWand'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass'
import { MapTrifold } from '@phosphor-icons/react/dist/ssr/MapTrifold'
import { Medal } from '@phosphor-icons/react/dist/ssr/Medal'
import { Megaphone } from '@phosphor-icons/react/dist/ssr/Megaphone'
import { Microscope } from '@phosphor-icons/react/dist/ssr/Microscope'
import { Money } from '@phosphor-icons/react/dist/ssr/Money'
import { Monitor } from '@phosphor-icons/react/dist/ssr/Monitor'
import { Moon } from '@phosphor-icons/react/dist/ssr/Moon'
import { Newspaper } from '@phosphor-icons/react/dist/ssr/Newspaper'
import { Package } from '@phosphor-icons/react/dist/ssr/Package'
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { Percent } from '@phosphor-icons/react/dist/ssr/Percent'
import { PersonSimple } from '@phosphor-icons/react/dist/ssr/PersonSimple'
import { Pill } from '@phosphor-icons/react/dist/ssr/Pill'
import { Planet } from '@phosphor-icons/react/dist/ssr/Planet'
import { Pulse } from '@phosphor-icons/react/dist/ssr/Pulse'
import { PuzzlePiece } from '@phosphor-icons/react/dist/ssr/PuzzlePiece'
import { Radioactive } from '@phosphor-icons/react/dist/ssr/Radioactive'
import { RocketLaunch } from '@phosphor-icons/react/dist/ssr/RocketLaunch'
import { Ruler } from '@phosphor-icons/react/dist/ssr/Ruler'
import { Scales } from '@phosphor-icons/react/dist/ssr/Scales'
import { Scan } from '@phosphor-icons/react/dist/ssr/Scan'
import { Scroll } from '@phosphor-icons/react/dist/ssr/Scroll'
import { SealCheck } from '@phosphor-icons/react/dist/ssr/SealCheck'
import { ShareNetwork } from '@phosphor-icons/react/dist/ssr/ShareNetwork'
import { Shield } from '@phosphor-icons/react/dist/ssr/Shield'
import { ShieldPlus } from '@phosphor-icons/react/dist/ssr/ShieldPlus'
import { ShoppingBag } from '@phosphor-icons/react/dist/ssr/ShoppingBag'
import { ShoppingCart } from '@phosphor-icons/react/dist/ssr/ShoppingCart'
import { Smiley } from '@phosphor-icons/react/dist/ssr/Smiley'
import { Sparkle } from '@phosphor-icons/react/dist/ssr/Sparkle'
import { StackSimple } from '@phosphor-icons/react/dist/ssr/StackSimple'
import { Star } from '@phosphor-icons/react/dist/ssr/Star'
import { Stethoscope } from '@phosphor-icons/react/dist/ssr/Stethoscope'
import { Storefront } from '@phosphor-icons/react/dist/ssr/Storefront'
import { Sun } from '@phosphor-icons/react/dist/ssr/Sun'
import { Sword } from '@phosphor-icons/react/dist/ssr/Sword'
import { Syringe } from '@phosphor-icons/react/dist/ssr/Syringe'
import { Table } from '@phosphor-icons/react/dist/ssr/Table'
import { Tag } from '@phosphor-icons/react/dist/ssr/Tag'
import { Target } from '@phosphor-icons/react/dist/ssr/Target'
import { TestTube } from '@phosphor-icons/react/dist/ssr/TestTube'
import { Thermometer } from '@phosphor-icons/react/dist/ssr/Thermometer'
import { Ticket } from '@phosphor-icons/react/dist/ssr/Ticket'
import { Timer } from '@phosphor-icons/react/dist/ssr/Timer'
import { TreeStructure } from '@phosphor-icons/react/dist/ssr/TreeStructure'
import { TrendUp } from '@phosphor-icons/react/dist/ssr/TrendUp'
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy'
import { User } from '@phosphor-icons/react/dist/ssr/User'
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree'
import { VideoCamera } from '@phosphor-icons/react/dist/ssr/VideoCamera'
import { Wallet } from '@phosphor-icons/react/dist/ssr/Wallet'
import { Waveform } from '@phosphor-icons/react/dist/ssr/Waveform'
import { Wheelchair } from '@phosphor-icons/react/dist/ssr/Wheelchair'
import { Wind } from '@phosphor-icons/react/dist/ssr/Wind'

/**
 * O tipo de um ícone do Phosphor. Substitui o `LucideIcon` de antes — a
 * assinatura é compatível no que o menu usa (`className`, `size`), e ainda
 * aceita `weight`.
 */
export type SidebarIcon = PhosphorIcon

export const SIDEBAR_ICON_COMPONENTS: Record<string, SidebarIcon> = {
  'stethoscope': Stethoscope,
  'heart-pulse': Heartbeat,
  'activity': Pulse,
  'heart': Heart,
  'pill': Pill,
  'syringe': Syringe,
  'thermometer': Thermometer,
  'cross': FirstAid,
  'shield-plus': ShieldPlus,
  'clipboard-check': ClipboardText,
  'clipboard-list': ListChecks,
  'bed': Bed,
  'brain': Brain,
  'brain-circuit': HeadCircuit,
  'bone': Bone,
  'dna': Dna,
  'ear': Ear,
  'eye': Eye,
  'footprints': Footprints,
  'person-standing': PersonSimple,
  'accessibility': Wheelchair,
  'baby': Baby,
  'microscope': Microscope,
  'test-tube': TestTube,
  'test-tubes': TestTube,
  'test-tube-2': TestTube,
  'flask-conical': Flask,
  'flask-round': Flask,
  'beaker': Flask,
  'atom': Atom,
  'biohazard': Biohazard,
  'droplet': Drop,
  'droplets': DropHalfBottom,
  'scan-line': Scan,
  'scan': Scan,
  'radiation': Radioactive,
  'waves': Waveform,
  'orbit': Planet,
  'gauge': Gauge,
  'camera': Camera,
  'image': Image,
  'film': FilmStrip,
  'video': VideoCamera,
  'layers': StackSimple,
  'box': Package,
  'book-open': BookOpen,
  'book': Book,
  'book-marked': BookBookmark,
  'book-heart': BookOpenText,
  'book-open-check': BookOpenText,
  'library': Books,
  'graduation-cap': GraduationCap,
  'scroll': Scroll,
  'scroll-text': Scroll,
  'newspaper': Newspaper,
  'file-text': FileText,
  'file-check': FileArrowDown,
  'file-heart': FileText,
  'files': Files,
  'highlighter': HighlighterCircle,
  'pencil': PencilSimple,
  'folder': Folder,
  'folder-open': FolderOpen,
  'folder-heart': FolderStar,
  'bookmark': BookmarkSimple,
  'list': List,
  'list-checks': ListChecks,
  'table': Table,
  'database': Database,
  'network': TreeStructure,
  'calendar': Calendar,
  'calendar-days': CalendarDots,
  'clock': Clock,
  'timer': Timer,
  'calculator': Calculator,
  'ruler': Ruler,
  'scale': Scales,
  'compass': Compass,
  'target': Target,
  'crosshair': Crosshair,
  'search': MagnifyingGlass,
  'bar-chart': ChartBar,
  'pie-chart': ChartPie,
  'trending-up': TrendUp,
  'percent': Percent,
  'cpu': Cpu,
  'monitor': Monitor,
  'smartphone': DeviceMobile,
  'star': Star,
  'sparkles': Sparkle,
  'trophy': Trophy,
  'medal': Medal,
  'award': SealCheck,
  'flame': Fire,
  'rocket': RocketLaunch,
  'lightbulb': Lightbulb,
  'puzzle': PuzzlePiece,
  'gamepad-2': GameController,
  'dices': DiceFive,
  'swords': Sword,
  'zap': Lightning,
  'wand-2': MagicWand,
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  'store': Storefront,
  'ticket': Ticket,
  'tag': Tag,
  'banknote': Money,
  'coins': Coins,
  'wallet': Wallet,
  'users': UsersThree,
  'user': User,
  'message-circle': ChatCircle,
  'megaphone': Megaphone,
  'bell': Bell,
  'share-2': ShareNetwork,
  'leaf': Leaf,
  'apple': AppleLogo,
  'dumbbell': Barbell,
  'sun': Sun,
  'moon': Moon,
  'wind': Wind,
  'smile': Smiley,
  'globe': Globe,
  'map': MapTrifold,
  'shield': Shield,
  'lock': Lock,
  'key': Key,
  'home': House,
  'file-search': FileMagnifyingGlass,
}

/** O desenho de um nome do catálogo. Nome desconhecido cai no padrão. */
export function getSidebarIconComponent(name?: string | null): SidebarIcon {
  return (name && SIDEBAR_ICON_COMPONENTS[name]) || SIDEBAR_ICON_COMPONENTS['book-open']
}
