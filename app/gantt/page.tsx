'use client'

import { useState } from 'react'
import GanttTable from '@/components/gantt/GanttTable'
import ProjectModal from '@/components/modals/ProjectModal'
import AssignmentModal from '@/components/modals/AssignmentModal'
import type { Assignment, Project, Resource } from '@/types'

export default function GanttPage() {
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [editAssignment, setEditAssignment] = useState<(Assignment & { project: Project; resource: Resource }) | null>(null)

  const handleEditAssignment = (a: Assignment & { project: Project; resource: Resource }) => {
    setEditAssignment(a)
    setShowAssignmentModal(true)
  }

  const handleCloseAssignmentModal = () => {
    setShowAssignmentModal(false)
    setEditAssignment(null)
  }

  return (
    <div className="flex flex-col h-screen">
      <GanttTable
        onNewAssignment={() => { setEditAssignment(null); setShowAssignmentModal(true) }}
        onNewProject={() => setShowProjectModal(true)}
        onEditAssignment={handleEditAssignment}
      />

      <ProjectModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
      />
      <AssignmentModal
        open={showAssignmentModal}
        editAssignment={editAssignment}
        onClose={handleCloseAssignmentModal}
      />
    </div>
  )
}
