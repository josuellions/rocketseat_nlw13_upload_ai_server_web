import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { Separator } from "@radix-ui/react-separator";
import { Bold, FileVideo, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status = "waiting" | "converting" | "uploading" | "generating" | "success";

const StatusMessage = {
  //waiting: "Carregar vídeo",
  converting: "Convertendo...",
  uploading: "Transcrevendo...",
  generating: "Carregando...",
  success: "Sucesso!",
};

interface VideoInputFormProps {
  onVideoUploaded: (id: string) => void;
}

export function VideoInputForm(props: VideoInputFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<Status>("waiting");

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;

    if (!files) {
      return;
    }

    const selectedFile = files[0];

    setVideoFile(selectedFile);
    setStatus("waiting");
  }

  async function convertVideoToAudio(video: File) {
    console.log(">>Convert started");

    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile("input.mp4", await fetchFile(video));

    /*ffmpeg.on('log', log => {
      console.log(log)
    })*/

    ffmpeg.on("progress", (process) => {
      console.log(`>> Convert progress: ${Math.round(process.progress * 100)}`);
    });

    //Convertendo
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-map",
      "0:a",
      "-b:a",
      "20k",
      "-acodec",
      "libmp3lame",
      "output.mp3",
    ]);

    //Salvando o audio
    const data = await ffmpeg.readFile("output.mp3");

    const audioFileBlod = new Blob([data], { type: "audio/mpeg" });
    const audioFile = new File([audioFileBlod], "audio.mp3", {
      type: "audio/mpeg",
    });

    console.log(">> Convert finished");

    return audioFile;
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) {
      return;
    }

    //Convertendo o vídeo em áudio
    setStatus("converting");
    const audiFile = await convertVideoToAudio(videoFile);

    //console.log(audiFile, prompt);

    //Enviar para backend
    setStatus("uploading");
    const data = new FormData();

    data.append("file", audiFile);

    const response = await api.post("/video", data);

    //console.log(response);

    //Realizar a transcrição do vídeo/áudio
    setStatus("generating");
    const videoId = response.data.video.id;

    await api.post(`/video/${videoId}/transcription`, {
      prompt,
    });

    setStatus("success");
    console.log(">> Finalizou");

    props.onVideoUploaded(videoId);
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null;
    }

    //cria uma URL de preview para qualque tipo de arquivo
    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  return (
    <form className="space-y-6" onSubmit={handleUploadVideo}>
      <label
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            className="pointer-events-none absolute inset-0"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Selecione vídeo
          </>
        )}
      </label>
      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelected}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea
          ref={promptInputRef}
          id="transcription_prompt"
          disabled={status !== "waiting"}
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)"
        />
      </div>
      <Button
        type="submit"
        className="w-full data-[success=true]:bg-violet-950"
        disabled={status !== "waiting"}
        data-success={status === "success"}
      >
        {status === "waiting" ? (
          <>
            Carregar vídeo
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : (
          StatusMessage[status]
        )}
      </Button>
    </form>
  );
}
