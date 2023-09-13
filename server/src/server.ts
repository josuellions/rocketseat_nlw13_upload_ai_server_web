import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import { getAllPromptsRoute } from "./routes/get-all-prompts";
import { uploadVideoRoute } from "./routes/upload-video";
import { createTranscriptionRoute } from "./routes/create-transcription";
import { generateAICompletionRoute } from "./routes/generate-ai-completion";

const port = 3333;
const app = fastify();

app.register(fastifyCors, {
  origin: "*",
});

app.get("/", () => {
  return "Hello Word - AI";
});

app.register(getAllPromptsRoute);
app.register(uploadVideoRoute);
app.register(createTranscriptionRoute);
app.register(generateAICompletionRoute);

app
  .listen({
    port,
  })
  .then(() => {
    console.log(`HTTP Server Running port: ${port}!`);
  });
