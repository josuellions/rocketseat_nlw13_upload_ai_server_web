import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post("/video/:videoId/transcription", async (req, replay) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    });

    const bodySchema = z.object({
      prompt: z.string(),
    });

    const { videoId } = paramsSchema.parse(req.params);
    const { prompt } = bodySchema.parse(req.body);

    return replay.send({ message: `videoId: ${videoId}, prompt: ${prompt}  ` });
  });
}
