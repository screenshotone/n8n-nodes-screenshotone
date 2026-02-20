import { IDataObject, IHttpRequestOptions, IN8nHttpFullResponse } from 'n8n-workflow';

type ScreenshotOneRequestWithAuthentication = (
	requestOptions: IHttpRequestOptions,
) => Promise<IN8nHttpFullResponse>;

export async function screenshotOneRequest({
	endpoint,
	url,
	scenario,
	extra = {},
	requestWithAuthentication,
}: {
	endpoint: 'take' | 'animate';
	url: string;
	scenario?: string;
	extra?: Record<string, unknown>;
	requestWithAuthentication: ScreenshotOneRequestWithAuthentication;
}): Promise<Record<string, any>> {
	const params: Record<string, string> = { url };
	for (const [key, value] of Object.entries(extra)) {
		if (value !== undefined && value !== null) {
			params[key] = String(value);
		}
	}

	if (endpoint === 'animate' && scenario) {
		params.scenario = scenario;
	}

	const response = await requestWithAuthentication({
		url: `https://api.screenshotone.com/${endpoint}`,
		method: 'GET',
		qs: params,
		returnFullResponse: true,
		encoding: 'arraybuffer',
	});
	const contentType = getHeaderValue(response.headers, 'content-type');
	const body = response.body;

	let type: 'json' | 'text' | 'base64';
	let data: any;
	if (contentType.includes('application/json')) {
		data = parseJsonBody(body);
		type = 'json';
	} else if (contentType.includes('text/')) {
		if (typeof body === 'string') {
			data = body;
		} else if (Buffer.isBuffer(body)) {
			data = body.toString('utf8');
		} else {
			data = String(body ?? '');
		}
		type = 'text';
	} else if (isDataObject(body)) {
		data = body;
		type = 'json';
	} else {
		const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? ''));
		data = { base64: buffer.toString('base64') };
		type = 'base64';
	}

	return { content_type: contentType, type, response: data };
}

function parseJsonBody(body: unknown): IDataObject {
	if (isDataObject(body)) {
		return body;
	}

	const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body ?? '{}');
	const parsed = JSON.parse(text);

	if (isDataObject(parsed)) {
		return parsed;
	}

	return { data: parsed };
}

function getHeaderValue(headers: IDataObject, targetHeader: string): string {
	const target = targetHeader.toLowerCase();
	for (const [headerName, value] of Object.entries(headers)) {
		if (headerName.toLowerCase() !== target || value === undefined || value === null) {
			continue;
		}

		if (Array.isArray(value)) {
			return String(value[0] ?? '');
		}

		return String(value);
	}

	return '';
}

function isDataObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Buffer.isBuffer(value);
}
