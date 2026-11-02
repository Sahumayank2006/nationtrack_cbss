import { generateLiveDelta } from '@/lib/automobiles-service';

export const runtime = 'nodejs';

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stopStream = () => {
    closed = true;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const safeEnqueue = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    payload: string
  ) => {
    if (closed) return;

    try {
      controller.enqueue(encoder.encode(payload));
    } catch {
      stopStream();
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      safeEnqueue(controller, `event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`);

      interval = setInterval(() => {
        const delta = generateLiveDelta();
        safeEnqueue(
          controller,
          `event: vehicle-delta\ndata: ${JSON.stringify({ timestamp: new Date().toISOString(), delta })}\n\n`
        );
      }, 6000);
    },
    cancel() {
      stopStream();
      return;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
