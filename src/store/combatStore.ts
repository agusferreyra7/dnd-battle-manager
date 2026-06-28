import { create } from 'zustand'
import type { Participant } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DamageModalState {
  isOpen: boolean
  targetParticipant: Participant | null
}

interface CombatUIState {
  // Damage/heal modal (single target)
  damageModal: DamageModalState
  openDamageModal: (participant: Participant) => void
  closeDamageModal: () => void

  // AOE damage/heal modal (multi-target)
  aoeModalOpen: boolean
  openAoeModal: () => void
  closeAoeModal: () => void

  // Add participant modal (mid-combat)
  addParticipantModalOpen: boolean
  openAddParticipantModal: () => void
  closeAddParticipantModal: () => void

  // Combat log drawer
  logDrawerOpen: boolean
  openLogDrawer: () => void
  closeLogDrawer: () => void

  // Confirm delete combat modal
  deleteConfirmOpen: boolean
  openDeleteConfirm: () => void
  closeDeleteConfirm: () => void

  // Tie-break modal
  tieBreakOpen: boolean
  openTieBreak: () => void
  closeTieBreak: () => void

  // Which participant card is expanded (for notes / conditions)
  expandedParticipantId: string | null
  setExpandedParticipant: (id: string | null) => void
  toggleExpandedParticipant: (id: string) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCombatUIStore = create<CombatUIState>((set) => ({
  // Damage modal
  damageModal: { isOpen: false, targetParticipant: null },
  openDamageModal: (participant) =>
    set({ damageModal: { isOpen: true, targetParticipant: participant } }),
  closeDamageModal: () =>
    set({ damageModal: { isOpen: false, targetParticipant: null } }),

  // AOE modal
  aoeModalOpen: false,
  openAoeModal: () => set({ aoeModalOpen: true }),
  closeAoeModal: () => set({ aoeModalOpen: false }),

  // Add participant modal
  addParticipantModalOpen: false,
  openAddParticipantModal: () => set({ addParticipantModalOpen: true }),
  closeAddParticipantModal: () => set({ addParticipantModalOpen: false }),

  // Log drawer
  logDrawerOpen: false,
  openLogDrawer: () => set({ logDrawerOpen: true }),
  closeLogDrawer: () => set({ logDrawerOpen: false }),

  // Delete confirm
  deleteConfirmOpen: false,
  openDeleteConfirm: () => set({ deleteConfirmOpen: true }),
  closeDeleteConfirm: () => set({ deleteConfirmOpen: false }),

  // Tie-break modal
  tieBreakOpen: false,
  openTieBreak: () => set({ tieBreakOpen: true }),
  closeTieBreak: () => set({ tieBreakOpen: false }),

  // Expanded participant
  expandedParticipantId: null,
  setExpandedParticipant: (id) => set({ expandedParticipantId: id }),
  toggleExpandedParticipant: (id) =>
    set((state) => ({
      expandedParticipantId: state.expandedParticipantId === id ? null : id,
    })),
}))
