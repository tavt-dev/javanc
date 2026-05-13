import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MotionDialog } from "@/components/motion/MotionDialog";
import { PageTransition } from "@/components/motion/PageTransition";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import {
  useProjectsByProfileQuery,
  useSaveProjectMutation,
  useUpdateProjectMutation,
} from "@/features/projects/hooks/use-project-queries";
import {
  isProfileMissingError,
  useMyProfileQuery,
} from "@/features/profiles/hooks/use-profile-queries";
import type { ProjectDTO, ProjectFormValues } from "@/types/project";

export function ProjectsPage() {
  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.profile;
  const projectsQuery = useProjectsByProfileQuery(profile?.id);
  const saveMutation = useSaveProjectMutation(profile?.id ?? 0);
  const updateMutation = useUpdateProjectMutation(profile?.id ?? 0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDTO | null>(null);

  const closeForm = () => {
    setFormOpen(false);
    setEditingProject(null);
  };

  const openCreate = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const openEdit = (project: ProjectDTO) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const submitProject = (values: ProjectFormValues) => {
    if (!profile) return;
    if (editingProject) {
      updateMutation.mutate(
        { ...values, id: editingProject.id },
        { onSuccess: closeForm },
      );
      return;
    }
    saveMutation.mutate(values, { onSuccess: closeForm });
  };

  if (profileQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="My Projects" description="Loading your profile." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (profileQuery.error && !isProfileMissingError(profileQuery.error)) {
    return (
      <PageTransition>
        <PageHeader title="My Projects" description="Manage portfolio work." />
        <RetryState error={profileQuery.error} onRetry={profileQuery.refetch} />
      </PageTransition>
    );
  }

  if (!profile) {
    return (
      <PageTransition>
        <PageHeader
          title="My Projects"
          description="Portfolio projects are attached to your profile."
        />
        <EmptyState
          icon={FileText}
          title="Create your profile first"
          description="A profile is required before projects can be attached and shown publicly."
          action={
            <Link
              to="/profile"
              className="btn-primary focus-ring"
            >
              Go to profile
            </Link>
          }
        />
      </PageTransition>
    );
  }

  const projects = projectsQuery.data ?? [];

  return (
    <PageTransition>
      <PageHeader
        title="My Projects"
        description="Create and maintain project entries shown on your profile."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary focus-ring"
          >
            <Plus size={16} />
            New project
          </button>
        }
      />

      {projectsQuery.isLoading ? (
        <LoadingSkeleton variant="cardGrid" />
      ) : projectsQuery.error ? (
        <RetryState error={projectsQuery.error} onRetry={projectsQuery.refetch} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No projects yet"
          description="Add your strongest project work and choose whether each item is public."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary focus-ring"
            >
              New project
            </button>
          }
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <StaggerItem key={project.id} index={index}>
              <ProjectCard project={project} onEdit={openEdit} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      <MotionDialog open={formOpen} onClose={closeForm}>
        <ProjectForm
          project={editingProject}
          loading={saveMutation.isPending || updateMutation.isPending}
          error={saveMutation.error || updateMutation.error}
          onSubmit={submitProject}
          onCancel={closeForm}
        />
      </MotionDialog>
    </PageTransition>
  );
}
