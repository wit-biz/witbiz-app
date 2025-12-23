// Este archivo contendrá la configuración para los servicios de IA,
// como los IDs de los procesadores de Document AI o las configuraciones de Vertex AI.

export const documentAIConfig = {
  location: "us",
  processors: {
    ocr: "projects/wit-biz-07943714-b10c8/locations/us/processors/ccc034091b3535ea",
    layout: "projects/wit-biz-07943714-b10c8/locations/us/processors/67705a0de2f97980",
    form: "projects/wit-biz-07943714-b10c8/locations/us/processors/a11519aee22cbe44",
    invoice: "projects/wit-biz-07943714-b10c8/locations/us/processors/13ca5aa76f60494c",
    expense: "projects/wit-biz-07943714-b10c8/locations/us/processors/71eb33aad7f0867e",
    bankStatement: "projects/wit-biz-07943714-b10c8/locations/us/processors/b081816fd5779a5d",
  },
} as const;

export type DocumentAIProcessorKey = keyof typeof documentAIConfig.processors;
