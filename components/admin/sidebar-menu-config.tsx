'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, FolderPlus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SidebarIconPicker } from '@/components/admin/sidebar-icon-picker'
import { getSidebarIconComponent } from '@/components/sidebar-icon-map'
import {
  normalizeSidebarSections,
  type SidebarSectionKey,
  type SidebarSectionOrder,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'
import { normalizeSidebarIcons, type SidebarSectionIcons } from '@/lib/sidebar-icons'
import {
  MAX_SIDEBAR_GROUPS,
  MIN_SECTIONS_TO_GROUP,
  assignSectionToGroup,
  buildFullSidebarTree,
  moveSidebarNode,
  removeSidebarGroup,
  toSidebarGroupKey,
  uniqueSidebarGroupKey,
  type SidebarGroupDefinition,
  type SidebarSectionGroups,
} from '@/lib/sidebar-groups'

/**
 * Configuração do menu lateral — a tela inteira, num módulo só.
 *
 * Isto morava solto dentro de `app/admin/settings/page.tsx`, junto de Mercado
 * Pago, planos, chaves de IA e landing page: 1.500 linhas em que mexer no menu
 * significava rolar até achar o pedaço certo. Aqui o menu é um componente
 * fechado — recebe o estado e devolve alterações — e é o único lugar a mudar
 * quando o menu ganhar uma dimensão nova.
 *
 * O que o admin controla daqui: quais áreas existem para o usuário comum, em
 * que ordem, com qual ícone, dentro de qual grupo, e como cada grupo se
 * apresenta (nome, ícone, aberto ou fechado por padrão).
 */

export interface SidebarMenuConfigValue {
  sections: SidebarSectionSettings
  order: SidebarSectionOrder
  icons: SidebarSectionIcons
  groups: SidebarGroupDefinition[]
  sectionGroups: SidebarSectionGroups
}

interface SidebarMenuConfigProps {
  value: SidebarMenuConfigValue
  onChange: (patch: Partial<SidebarMenuConfigValue>) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

export function SidebarMenuConfig({
  value,
  onChange,
  saving,
  onSave,
  onCancel,
}: SidebarMenuConfigProps) {
  const sections = normalizeSidebarSections(value.sections)
  const icons = normalizeSidebarIcons(value.icons)
  const groups = value.groups
  const sectionGroups = value.sectionGroups

  const tree = useMemo(
    () => buildFullSidebarTree(value.order, groups, sectionGroups),
    [value.order, groups, sectionGroups]
  )

  const [novoGrupo, setNovoGrupo] = useState('')

  function toggleSection(sectionKey: SidebarSectionKey) {
    onChange({ sections: { ...sections, [sectionKey]: !sections[sectionKey] } })
  }

  function setSectionIcon(sectionKey: SidebarSectionKey, iconName: string) {
    onChange({ icons: { ...icons, [sectionKey]: iconName } })
  }

  function moveSection(sectionKey: SidebarSectionKey, direction: -1 | 1) {
    onChange({
      order: moveSidebarNode(
        value.order,
        groups,
        sectionGroups,
        { type: 'section', key: sectionKey },
        direction
      ),
    })
  }

  function moveGroup(groupKey: string, direction: -1 | 1) {
    onChange({
      order: moveSidebarNode(
        value.order,
        groups,
        sectionGroups,
        { type: 'group', key: groupKey },
        direction
      ),
    })
  }

  function setSectionGroup(sectionKey: SidebarSectionKey, groupKey: string | null) {
    const resultado = assignSectionToGroup(
      value.order,
      groups,
      sectionGroups,
      sectionKey,
      groupKey
    )
    onChange({ order: resultado.order, sectionGroups: resultado.assignments })
  }

  function criarGrupo() {
    const nome = novoGrupo.trim()
    if (!nome || groups.length >= MAX_SIDEBAR_GROUPS) return

    const key = uniqueSidebarGroupKey(
      toSidebarGroupKey(nome),
      groups.map((group) => group.key)
    )
    onChange({
      groups: [...groups, { key, label: nome.slice(0, 40), icon: 'folder', defaultOpen: false }],
    })
    setNovoGrupo('')
  }

  function atualizarGrupo(groupKey: string, patch: Partial<SidebarGroupDefinition>) {
    onChange({
      groups: groups.map((group) => (group.key === groupKey ? { ...group, ...patch } : group)),
    })
  }

  function apagarGrupo(groupKey: string) {
    const grupo = groups.find((item) => item.key === groupKey)
    const quantas = Object.values(sectionGroups).filter((key) => key === groupKey).length
    const aviso = quantas
      ? `Apagar o grupo "${grupo?.label}"? As ${quantas} áreas dentro dele voltam para o primeiro nível do menu.`
      : `Apagar o grupo "${grupo?.label}"?`
    if (!confirm(aviso)) return

    const resultado = removeSidebarGroup(value.order, groups, sectionGroups, groupKey)
    onChange({
      groups: resultado.groups,
      sectionGroups: resultado.assignments,
      order: resultado.order,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu lateral</CardTitle>
        <CardDescription>
          Controle o que o usuário comum vê no menu: quais áreas existem, em que ordem, com
          qual ícone e dentro de qual grupo. Ordem e ícone valem também para o carrossel do
          início. Administradores continuam enxergando tudo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ── Grupos ─────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">Grupos</h3>
            <p className="text-sm text-muted-foreground">
              Um grupo junta áreas irmãs sob um item que abre e fecha. Serve para conjuntos
              grandes — o Manual Clínico e suas subáreas são o caso clássico. O que o aluno
              usa todo dia deve continuar no primeiro nível: esconder atrás de um clique o
              que ele mais abre troca um problema por outro.
            </p>
          </div>

          <div className="grid gap-3">
            {groups.map((group) => {
              const membros = Object.values(sectionGroups).filter(
                (key) => key === group.key
              ).length

              return (
                <div
                  key={group.key}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <SidebarIconPicker
                    value={group.icon}
                    sectionLabel={group.label}
                    onChange={(iconName) => atualizarGrupo(group.key, { icon: iconName })}
                  />

                  <div className="min-w-[180px] flex-1 space-y-1">
                    <Input
                      value={group.label}
                      maxLength={40}
                      onChange={(event) =>
                        atualizarGrupo(group.key, { label: event.target.value })
                      }
                      aria-label={`Nome do grupo ${group.label}`}
                    />
                    <p className="font-mono text-xs text-muted-foreground">
                      {group.key} · {membros} {membros === 1 ? 'área' : 'áreas'}
                      {membros > 0 && membros < MIN_SECTIONS_TO_GROUP && (
                        <span className="ml-2 font-sans text-amber-600 dark:text-amber-400">
                          com uma área só, o grupo não aparece — a área vai direto para o menu
                        </span>
                      )}
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={group.defaultOpen}
                      onChange={(event) =>
                        atualizarGrupo(group.key, { defaultOpen: event.target.checked })
                      }
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    Nasce aberto
                  </label>

                  <button
                    type="button"
                    onClick={() => apagarGrupo(group.key)}
                    aria-label={`Apagar grupo ${group.label}`}
                    className="rounded-md border p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}

            {groups.length === 0 && (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Nenhum grupo. O menu fica inteiramente plano — todas as áreas ligadas
                aparecem no primeiro nível.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={novoGrupo}
              maxLength={40}
              placeholder="Nome do novo grupo (ex.: Estudar)"
              onChange={(event) => setNovoGrupo(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  criarGrupo()
                }
              }}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              onClick={criarGrupo}
              disabled={!novoGrupo.trim() || groups.length >= MAX_SIDEBAR_GROUPS}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Criar grupo
            </Button>
            {groups.length >= MAX_SIDEBAR_GROUPS && (
              <span className="text-xs text-muted-foreground">
                Limite de {MAX_SIDEBAR_GROUPS} grupos atingido.
              </span>
            )}
          </div>
        </section>

        {/* ── Áreas, na estrutura em que aparecem ────────────────── */}
        <section className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">Áreas</h3>
            <p className="text-sm text-muted-foreground">
              A lista abaixo é o menu como ele vai aparecer. As setas movem o item na
              posição: um grupo anda inteiro, uma área dentro de um grupo anda entre os
              irmãos dela.
            </p>
          </div>

          <div className="grid gap-3">
            {tree.map((node, index) => {
              if (node.type === 'section') {
                return (
                  <SectionRow
                    key={node.id}
                    section={node.section}
                    enabled={sections[node.section.key]}
                    icon={icons[node.section.key]}
                    groups={groups}
                    groupKey={sectionGroups[node.section.key] ?? null}
                    canMoveUp={index > 0}
                    canMoveDown={index < tree.length - 1}
                    onMove={(direction) => moveSection(node.section.key, direction)}
                    onToggle={() => toggleSection(node.section.key)}
                    onIconChange={(iconName) => setSectionIcon(node.section.key, iconName)}
                    onGroupChange={(key) => setSectionGroup(node.section.key, key)}
                  />
                )
              }

              const GroupIcon = getSidebarIconComponent(node.group.icon)

              return (
                <div key={node.id} className="rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 border-b p-3">
                    <div className="flex shrink-0 flex-col gap-1">
                      <MoveButton
                        direction={-1}
                        disabled={index === 0}
                        label={`Mover grupo ${node.group.label} para cima`}
                        onClick={() => moveGroup(node.group.key, -1)}
                      />
                      <MoveButton
                        direction={1}
                        disabled={index === tree.length - 1}
                        label={`Mover grupo ${node.group.label} para baixo`}
                        onClick={() => moveGroup(node.group.key, 1)}
                      />
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <GroupIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{node.group.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Grupo · {node.sections.length}{' '}
                        {node.sections.length === 1 ? 'área' : 'áreas'} ·{' '}
                        {node.group.defaultOpen ? 'nasce aberto' : 'nasce fechado'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 p-3 pl-6">
                    {node.sections.map((section, childIndex) => (
                      <SectionRow
                        key={section.key}
                        section={section}
                        enabled={sections[section.key]}
                        icon={icons[section.key]}
                        groups={groups}
                        groupKey={sectionGroups[section.key] ?? null}
                        canMoveUp={childIndex > 0}
                        canMoveDown={childIndex < node.sections.length - 1}
                        onMove={(direction) => moveSection(section.key, direction)}
                        onToggle={() => toggleSection(section.key)}
                        onIconChange={(iconName) => setSectionIcon(section.key, iconName)}
                        onGroupChange={(key) => setSectionGroup(section.key, key)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            Ao desabilitar uma área, usuários comuns deixam de vê-la no menu e são
            redirecionados caso tentem abrir a rota diretamente. As subáreas do Manual
            Clínico (Ferramentas, Farmacologia, Domine Anatomia, Histologia, Exames,
            Radiologia e Eletrocardiograma) vêm desligadas: ligue as que quiser oferecer —
            agrupadas, elas cabem no menu sem empurrar o resto para fora da tela.
          </p>
        </div>

        <div className="flex gap-3 border-t pt-4">
          <Button onClick={onSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Salvando...' : 'Salvar menu'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MoveButton({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: -1 | 1
  disabled: boolean
  label: string
  onClick: () => void
}) {
  const Icon = direction === -1 ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-md border p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

function SectionRow({
  section,
  enabled,
  icon,
  groups,
  groupKey,
  canMoveUp,
  canMoveDown,
  onMove,
  onToggle,
  onIconChange,
  onGroupChange,
}: {
  section: { key: SidebarSectionKey; label: string; description: string; href: string }
  enabled: boolean
  icon: string
  groups: SidebarGroupDefinition[]
  groupKey: string | null
  canMoveUp: boolean
  canMoveDown: boolean
  onMove: (direction: -1 | 1) => void
  onToggle: () => void
  onIconChange: (iconName: string) => void
  onGroupChange: (groupKey: string | null) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50">
      <div className="flex shrink-0 flex-col gap-1">
        <MoveButton
          direction={-1}
          disabled={!canMoveUp}
          label={`Mover ${section.label} para cima`}
          onClick={() => onMove(-1)}
        />
        <MoveButton
          direction={1}
          disabled={!canMoveDown}
          label={`Mover ${section.label} para baixo`}
          onClick={() => onMove(1)}
        />
      </div>

      <SidebarIconPicker value={icon} sectionLabel={section.label} onChange={onIconChange} />

      <div className="min-w-[180px] flex-1 space-y-1">
        <Label className="text-base font-semibold">{section.label}</Label>
        <p className="text-sm text-muted-foreground">{section.description}</p>
        <p className="font-mono text-xs text-muted-foreground">{section.href}</p>
      </div>

      <div className="shrink-0 space-y-1">
        <Label className="text-xs text-muted-foreground">Grupo</Label>
        <select
          value={groupKey ?? ''}
          onChange={(event) => onGroupChange(event.target.value || null)}
          aria-label={`Grupo de ${section.label}`}
          className="h-9 w-[170px] rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Primeiro nível</option>
          {groups.map((group) => (
            <option key={group.key} value={group.key}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`hidden text-xs font-medium sm:inline ${
            enabled
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {enabled ? 'Habilitada' : 'Desabilitada'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? 'Desabilitar' : 'Habilitar'} ${section.label}`}
          onClick={onToggle}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
