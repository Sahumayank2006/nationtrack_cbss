import { NextResponse } from 'next/server';

type TranslateRequest = {
  text?: string;
  targetLang?: string;
};

const MAX_TEXT_LENGTH = 3000;

const isValidLanguageCode = (value: string) => /^[a-z]{2}(-[A-Z]{2})?$/.test(value);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateRequest;
    const rawText = body.text?.trim() ?? '';
    const targetLang = body.targetLang?.trim() ?? '';

    if (!rawText) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    if (!targetLang || !isValidLanguageCode(targetLang)) {
      return NextResponse.json({ error: 'Invalid target language code.' }, { status: 400 });
    }

    if (rawText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds ${MAX_TEXT_LENGTH} character limit.` },
        { status: 400 }
      );
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(rawText)}`;
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Translation provider request failed.' }, { status: 502 });
    }

    const payload = (await response.json()) as unknown;
    const translatedText =
      Array.isArray(payload) && Array.isArray(payload[0])
        ? (payload[0] as Array<unknown[]>)
            .map((part) => (Array.isArray(part) ? String(part[0] ?? '') : ''))
            .join('')
        : '';

    if (!translatedText) {
      return NextResponse.json({ error: 'Unable to parse translated text.' }, { status: 502 });
    }

    return NextResponse.json({ translatedText });
  } catch {
    return NextResponse.json({ error: 'Unexpected translation error.' }, { status: 500 });
  }
}
