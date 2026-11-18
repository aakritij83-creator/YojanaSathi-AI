import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  ChatMessageRecord,
  EligibilityResult,
  GovernmentScheme,
  GroundedSourceCitation,
  LanguageCode,
  RejectionAnalysisResult,
  UserProfile,
} from '../types/index.ts';

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  bn: 'Bengali (বাংলা)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
  gu: 'Gujarati (ગુજરાતી)',
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    const err = new Error('Gemini API key is not configured on the server.');
    (err as Error & { statusCode?: number; code?: string }).statusCode = 503;
    (err as Error & { statusCode?: number; code?: string }).code = 'GEMINI_NOT_CONFIGURED';
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 30000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function mapGeminiError(error: unknown): { status: number; code: string; message: string } {
  const errorCode = (error as { code?: string })?.code;
  const statusCode = (error as { status?: number; statusCode?: number })?.statusCode ||
    (error as { status?: number })?.status;
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (errorCode === 'GEMINI_NOT_CONFIGURED') {
    return {
      status: 503,
      code: 'GEMINI_NOT_CONFIGURED',
      message:
        'AI service is unavailable because GEMINI_API_KEY is not configured in server secrets. Please configure GEMINI_API_KEY in Settings > Secrets.',
    };
  }

  console.error('[Gemini Upstream Error]', { statusCode, message: rawMessage.slice(0, 300) });

  if (statusCode === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      code: 'GEMINI_QUOTA_EXHAUSTED',
      message:
        'Gemini API quota or rate limit was reached. Please wait a moment and retry, or check your Gemini API quota in Settings > Secrets.',
    };
  }
  if (statusCode === 503 || rawMessage.includes('UNAVAILABLE')) {
    return {
      status: 503,
      code: 'GEMINI_UNAVAILABLE',
      message: 'Gemini AI is temporarily busy or unavailable. Please retry in a few moments.',
    };
  }
  if (statusCode === 403 || statusCode === 400 || rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('PERMISSION_DENIED')) {
    return {
      status: 502,
      code: 'GEMINI_AUTH_ERROR',
      message: 'The server Gemini API request was rejected. Please verify GEMINI_API_KEY and model permissions in Settings > Secrets.',
    };
  }
  return {
    status: 502,
    code: 'GEMINI_UPSTREAM_ERROR',
    message: 'Unable to reach Gemini AI right now. Please retry in a few seconds.',
  };
}

export async function generateAssistantReply(params: {
  userMessage: string;
  history: ChatMessageRecord[];
  language: LanguageCode;
  userProfile?: UserProfile | null;
  schemes: GovernmentScheme[];
  eligibilityResults?: EligibilityResult[];
}): Promise<{ answer: string; citations: GroundedSourceCitation[]; couldVerify: boolean }> {
  const ai = getGeminiClient();
  const targetLang = LANGUAGE_LABELS[params.language] || 'English';

  const activeSchemes = params.schemes.filter((s) => s.verificationStatus !== 'Archived');
  const schemeContext = activeSchemes
    .map((s) => {
      const elig = params.eligibilityResults?.find((e) => e.schemeId === s.id);
      return [
        `ID: ${s.id}`,
        `Name: ${s.name}`,
        `Classification: ${s.classification} (${s.applicableState})`,
        `Department: ${s.department}`,
        `VerificationStatus: ${s.verificationStatus} (Last verified: ${s.lastVerifiedDate})`,
        `OfficialSourceURL: ${s.officialSourceUrl}`,
        `OfficialApplicationURL: ${s.officialApplicationUrl}`,
        `Description: ${s.officialDescription}`,
        `Benefits: ${s.benefits.join(' | ')}`,
        `EligibilitySummary: ${s.eligibilityRequirementsSummary.join(' | ')}`,
        `Documents: ${s.requiredDocuments.join(', ')}`,
        `Procedure: ${s.applicationProcedure.join(' -> ')}`,
        elig ? `DeterministicEligibilityForUser: ${elig.classification} (${elig.reason})` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n---\n');

  const profileSummary = params.userProfile
    ? `Authorized User Profile:
State: ${params.userProfile.state || 'Not provided'}, Residence: ${params.userProfile.residence || 'Not provided'}, Age: ${params.userProfile.age ?? 'Not provided'}, Income: ${params.userProfile.incomeRange || 'Not provided'}, Education: ${params.userProfile.educationLevel || 'Not provided'}, Employment: ${params.userProfile.employmentStatus || 'Not provided'}, Farmer: ${params.userProfile.isFarmer === null || params.userProfile.isFarmer === undefined ? 'Not provided' : params.userProfile.isFarmer}, Disability: ${params.userProfile.hasDisability === null || params.userProfile.hasDisability === undefined ? 'Not provided' : params.userProfile.hasDisability}.`
    : 'No user profile provided.';

  const conversationHistoryText = params.history
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Citizen' : 'YojanaSathi AI'}: ${m.content}`)
    .join('\n');

  const systemInstruction = `You are YojanaSathi AI Assistant, a grounded, citizen-friendly Indian public scheme advisor.
CRITICAL RULES:
1. Respond strictly in ${targetLang}. Keep official scheme names, statutory portal names, and legal terms in their authentic wording alongside your explanation where translation could alter official meaning.
2. Ground all scheme answers strictly in the Verified Scheme Registry provided below.
3. NEVER invent government schemes, benefits, deadlines, or official URLs.
4. If the user asks about a scheme or policy NOT present in the registry, or if reliable details are unavailable, set couldVerify to false and state clearly in ${targetLang} that the requested scheme/policy could not be verified in the current verified registry, advising the user to verify on myscheme.gov.in or the official ministry portal.
5. NEVER guarantee approval or claim to submit an application on the user's behalf.
6. Respect deterministic eligibility results when provided; never override a deterministic failure.
7. Include the exact scheme IDs referenced in citedSchemeIds.`;

  const prompt = `${profileSummary}

VERIFIED SCHEME REGISTRY:
${schemeContext}

RECENT CONVERSATION:
${conversationHistoryText || '(New conversation)'}

CITIZEN QUESTION:
${params.userMessage}`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: {
            type: Type.STRING,
            description: `Clear, structured explanation written in ${targetLang}.`,
          },
          citedSchemeIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exact IDs from the Verified Scheme Registry referenced in the answer.',
          },
          couldVerify: {
            type: Type.BOOLEAN,
            description: 'True if the answer is grounded in the Verified Scheme Registry; false if reliable info was unavailable.',
          },
        },
        required: ['answer', 'citedSchemeIds', 'couldVerify'],
      },
    },
  });

  const rawText = (response.text || '{}').trim();
  let parsed: { answer?: string; citedSchemeIds?: string[]; couldVerify?: boolean } = {};
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { answer: rawText, citedSchemeIds: [], couldVerify: true };
  }

  const citedIds = Array.isArray(parsed.citedSchemeIds) ? parsed.citedSchemeIds : [];
  const citations: GroundedSourceCitation[] = [];
  for (const id of citedIds) {
    const matched = activeSchemes.find((s) => s.id === id);
    if (matched) {
      citations.push({
        schemeName: matched.name,
        officialSourceUrl: matched.officialSourceUrl,
        lastVerifiedDate: matched.lastVerifiedDate,
        verificationStatus: matched.verificationStatus,
      });
    }
  }

  return {
    answer: parsed.answer || 'I could not generate a response for that query. Please try rephrasing.',
    citations,
    couldVerify: parsed.couldVerify !== false,
  };
}

export async function analyzeRejectionNotice(params: {
  fileBuffer?: Buffer;
  mimeType?: string;
  rawText?: string;
  schemeNameHint?: string;
  language: LanguageCode;
}): Promise<RejectionAnalysisResult> {
  const ai = getGeminiClient();
  const targetLang = LANGUAGE_LABELS[params.language] || 'English';

  const systemInstruction = `You are "Understand My Rejection", a careful, non-hallucinating Indian government notice analyzer inside YojanaSathi AI.
CRITICAL RULES:
1. Respond in ${targetLang}, keeping official document names or statutory codes clear.
2. STRICTLY separate CONFIRMED reasons (explicitly stated verbatim or unmistakably in the notice) from POSSIBLE CONTRIBUTING reasons (reasonable hypotheses when the notice is vague or uses generic codes).
3. If the notice does not clearly state a reason, leave confirmedReasons minimal/empty or state that no specific reason was explicitly written, and put observations into possibleContributingReasons or missingInformation.
4. NEVER invent rejection reasons or guarantee appeal success.
5. If the uploaded document is unreadable, blurry, or unrelated to an application/rejection notice, clearly explain that in summary and missingInformation.
6. Provide practical, respectful corrective steps and verified Indian public grievance channels (e.g., CPGRAMS pgportal.gov.in, concerned state portal / Tehsil / Institute Nodal Officer / bank NPCI branch) without inventing fake URLs.`;

  const textPrompt = `Analyze this government scheme/scholarship/benefit rejection notice${
    params.schemeNameHint ? ` (User indicated scheme: ${params.schemeNameHint})` : ''
  }.
${params.rawText ? `\nPASTE / EXTRACTED TEXT:\n${params.rawText}` : '\nExamine the attached rejection notice file carefully.'}`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (params.fileBuffer && params.mimeType) {
    parts.push({
      inlineData: {
        mimeType: params.mimeType,
        data: params.fileBuffer.toString('base64'),
      },
    });
  }
  parts.push({ text: textPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: { parts },
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          explicitlyStatedReason: { type: Type.STRING },
          confirmedReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
          possibleContributingReasons: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
          documentsRequiringCorrection: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedCorrectiveSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          possibleNextActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          verifiedGrievanceResources: { type: Type.ARRAY, items: { type: Type.STRING } },
          disclaimer: { type: Type.STRING },
        },
        required: [
          'summary',
          'explicitlyStatedReason',
          'confirmedReasons',
          'possibleContributingReasons',
          'missingInformation',
          'documentsRequiringCorrection',
          'suggestedCorrectiveSteps',
          'possibleNextActions',
          'verifiedGrievanceResources',
          'disclaimer',
        ],
      },
    },
  });

  const rawJson = (response.text || '{}').trim();
  const parsed = JSON.parse(rawJson) as RejectionAnalysisResult;
  return {
    summary: parsed.summary || 'Unable to summarize notice.',
    explicitlyStatedReason: parsed.explicitlyStatedReason || 'Not explicitly stated in the provided notice.',
    confirmedReasons: Array.isArray(parsed.confirmedReasons) ? parsed.confirmedReasons : [],
    possibleContributingReasons: Array.isArray(parsed.possibleContributingReasons)
      ? parsed.possibleContributingReasons
      : [],
    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
    documentsRequiringCorrection: Array.isArray(parsed.documentsRequiringCorrection)
      ? parsed.documentsRequiringCorrection
      : [],
    suggestedCorrectiveSteps: Array.isArray(parsed.suggestedCorrectiveSteps) ? parsed.suggestedCorrectiveSteps : [],
    possibleNextActions: Array.isArray(parsed.possibleNextActions) ? parsed.possibleNextActions : [],
    verifiedGrievanceResources: Array.isArray(parsed.verifiedGrievanceResources)
      ? parsed.verifiedGrievanceResources
      : ['CPGRAMS Central Grievance Portal (https://pgportal.gov.in/)'],
    disclaimer:
      parsed.disclaimer ||
      'This analysis is an informational aid and does not guarantee appeal approval. Final decisions rest with the issuing government authority.',
  };
}
