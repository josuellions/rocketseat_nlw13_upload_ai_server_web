import { fastify } from "fastify";
import { getAllPromptsRoute } from "./routes/get-all-prompts";
import { uploadVideoRoute } from "./routes/upload-video";
import { createTranscriptionRoute } from "./routes/create-transcription";

const app = fastify();
const port = 3333;

app.get("/", () => {
  return "Hello Word - AI";
});

app.register(getAllPromptsRoute);
app.register(uploadVideoRoute);
app.register(createTranscriptionRoute);

app
  .listen({
    port,
  })
  .then(() => {
    console.log(`HTTP Server Running port: ${port}!`);
  });
