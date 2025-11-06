import { z } from "zod";

export const createSectorSchema = z.object({
  name: z
    .string()
    .min(1, "Sector name is required")
    .max(100, "Sector name must be less than 100 characters"),
  type: z.enum(["live_trading", "paper_trading", "experimental"], {
    errorMap: () => ({ message: "Please select a sector type" }),
  }),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export type CreateSectorFormData = z.infer<typeof createSectorSchema>;
