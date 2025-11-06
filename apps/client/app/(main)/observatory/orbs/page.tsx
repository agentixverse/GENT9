"use client";

import { useState } from "react";
import { OrbList } from "@/library/components/organisms/orb-list";
import { OrbCreateModal } from "@/library/components/organisms/orb-create-modal";
import { useOrbs, useCreateOrb, useDeleteOrb } from "@/library/api/hooks/use-orbs";
import { useSectorStore } from "@/library/store/sector-store";
import { useSectors } from "@/library/api/hooks/use-sectors";

export default function OrbsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { activeSectorId } = useSectorStore();
  const { data: sectors } = useSectors();

  // Use first sector if no active sector is set
  const sectorId = activeSectorId || sectors?.[0]?.id;

  const { data: orbs, isLoading } = useOrbs(sectorId);
  const { mutate: createOrb, isPending: isCreating } = useCreateOrb();
  const { mutate: deleteOrb } = useDeleteOrb();

  const handleCreateOrb = (data: any) => {
    createOrb(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
      },
    });
  };

  const handleDeleteOrb = (orbId: number) => {
    if (confirm("Are you sure you want to delete this orb?")) {
      deleteOrb(orbId);
    }
  };

  if (!sectorId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No Sector Selected</h3>
          <p className="text-muted-foreground mb-4 text-center max-w-sm">
            Please create a sector first before creating orbs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <OrbList
        orbs={orbs || []}
        sectorId={sectorId}
        onCreateNew={() => setIsCreateModalOpen(true)}
        onDelete={handleDeleteOrb}
        isLoading={isLoading}
      />

      <OrbCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateOrb}
        sectorId={sectorId}
        isCreating={isCreating}
      />
    </div>
  );
}
