'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FolderOpen, FolderPlus, Home, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExamContextMenuProps {
  examId: string
  examGroupId: string | null
  isPersonalExam: boolean
  createdBy: string
  currentUserId: string
  userRole: 'admin' | 'user'
  groups: any[]
  onMoveToGroup: (groupId: string | null) => Promise<void>
  onCreateGroup?: (name: string, type: 'personal' | 'general') => Promise<void>
  position: { x: number; y: number } | null
  onClose: () => void
}

export function ExamContextMenu({
  examId,
  examGroupId,
  isPersonalExam,
  createdBy,
  currentUserId,
  userRole,
  groups,
  onMoveToGroup,
  onCreateGroup,
  position,
  onClose,
}: ExamContextMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showGroupSubmenu, setShowGroupSubmenu] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupType, setNewGroupType] = useState<'personal' | 'general'>('personal')
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Fechar menu ao clicar fora (mas não se o modal está aberto)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showCreateGroupModal) return // Não fechar se modal está aberto
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (position && !showCreateGroupModal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [position, onClose, showCreateGroupModal])

  if (!position) return null

  // Determinar permissões
  const isCreator = createdBy === currentUserId
  const isAdmin = userRole === 'admin'
  const isInGeneralGroup = examGroupId ? groups.find(g => g._id === examGroupId)?.type === 'general' : false

  // Validações de permissão
  const canMoveFromGroup = isAdmin || !isInGeneralGroup
  const canMoveToMainPage = isAdmin || !isInGeneralGroup

  // Filtrar grupos disponíveis
  const availableGroups = groups.filter(group => {
    // Grupos pessoais: apenas do usuário
    if (group.type === 'personal') {
      return group.createdBy === currentUserId
    }
    // Grupos gerais: apenas para admin
    if (group.type === 'general') {
      return isAdmin
    }
    return false
  })

  const handleMoveToGroup = async (groupId: string) => {
    setIsLoading(true)
    try {
      await onMoveToGroup(groupId)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleMoveToMainPage = async () => {
    setIsLoading(true)
    try {
      await onMoveToGroup(null)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Digite um nome para o grupo')
      return
    }

    if (newGroupType === 'general' && userRole !== 'admin') {
      alert('Apenas administradores podem criar grupos gerais')
      return
    }

    setIsCreatingGroup(true)
    try {
      if (onCreateGroup) {
        await onCreateGroup(newGroupName, newGroupType)
        setNewGroupName('')
        setShowCreateGroupModal(false)
        onClose()
      }
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error)
      alert(`Erro ao criar grupo: ${error.message || 'Tente novamente'}`)
    } finally {
      setIsCreatingGroup(false)
    }
  }

  return (
    <>
      {/* Menu de Contexto */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-background border border-muted rounded-lg shadow-lg overflow-visible"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="py-1">
          {/* Mover para Grupo */}
          {canMoveFromGroup && (
            <div 
              className="relative"
              onMouseEnter={() => setShowGroupSubmenu(true)}
              onMouseLeave={() => setShowGroupSubmenu(false)}
            >
              <button
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                Mover para Grupo
              </button>

              {/* Submenu de Grupos */}
              {showGroupSubmenu && (
                <div
                  className="absolute left-full top-0 ml-0 bg-background border border-muted rounded-lg shadow-lg min-w-56 z-50"
                  style={{ marginLeft: '-4px' }}
                >
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {availableGroups.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-muted-foreground">
                        Nenhum grupo disponível
                      </div>
                    ) : (
                      availableGroups.map((group) => (
                        <button
                          key={group._id}
                          onClick={() => handleMoveToGroup(group._id)}
                          disabled={isLoading}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.color || '#3B82F6' }}
                          />
                          <span className="flex-1">{group.name}</span>
                          {group.type === 'general' && (
                            <span className="text-xs text-muted-foreground">Geral</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mover para Página Principal */}
          {canMoveToMainPage && examGroupId && (
            <button
              onClick={handleMoveToMainPage}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted disabled:opacity-50 flex items-center gap-2 transition-colors border-t border-muted"
            >
              <Home className="h-4 w-4" />
              Mover para Página Principal
            </button>
          )}

          {/* Criar Novo Grupo */}
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors border-t border-muted"
          >
            <FolderPlus className="h-4 w-4" />
            Criar Novo Grupo
          </button>
        </div>
      </div>

      {/* Modal de Criar Grupo */}
      {showCreateGroupModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Fechar apenas se clicar no fundo (fora do card)
            if (e.target === e.currentTarget) {
              setShowCreateGroupModal(false)
            }
          }}
        >
          <Card 
            ref={modalRef}
            className="w-96 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Criar Novo Grupo</h2>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Nome do Grupo</Label>
                <Input
                  id="group-name"
                  placeholder="Ex: Matemática, Simulados, etc"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  disabled={isCreatingGroup}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-type">Tipo de Grupo</Label>
                <select
                  id="group-type"
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value as 'personal' | 'general')}
                  disabled={isCreatingGroup || userRole !== 'admin'}
                  className="w-full px-3 py-2 border border-muted rounded-md bg-background text-sm"
                >
                  <option value="personal">Pessoal (apenas para você)</option>
                  {userRole === 'admin' && (
                    <option value="general">Geral (para todos)</option>
                  )}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateGroupModal(false)}
                  disabled={isCreatingGroup}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={isCreatingGroup || !newGroupName.trim()}
                  className="flex-1"
                >
                  {isCreatingGroup ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
