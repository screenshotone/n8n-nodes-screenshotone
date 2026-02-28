import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { screenshotOneRequest } from '../ScreenshotOneApi';

export class ScreenshotOne implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ScreenshotOne',
		name: 'screenshotOne',
		group: ['transform'],
		icon: 'file:screenshotone.svg',
		version: 1,
		description:
			'Render PDFs, screenshots, scrolling screenshots, and short videos using ScreenshotOne',
		defaults: {
			name: 'ScreenshotOne',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'screenshotOneCredentialsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'Full Page Screenshot', value: 'full_page' },
					{ name: 'PDF', value: 'pdf' },
					{ name: 'Record Short Video', value: 'short_video' },
					{ name: 'Screenshot', value: 'screenshot' },
					{ name: 'Scrolling Screenshot', value: 'scrolling_screenshot' },
				],
				noDataExpression: true,
				required: true,
				default: 'screenshot',
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{ name: 'URL', value: 'url' },
					{ name: 'HTML', value: 'html' },
					{ name: 'Markdown', value: 'markdown' },
				],
				default: 'url',
				description: 'The type of input to render',
				required: true,
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				description: 'The URL to render',
				required: true,
				displayOptions: {
					show: {
						source: ['url'],
					},
				},
			},
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				default: '',
				description: 'The HTML to render',
				required: true,
				displayOptions: {
					show: {
						source: ['html'],
					},
				},
			},
			{
				displayName: 'Markdown',
				name: 'markdown',
				type: 'string',
				default: '',
				description: 'The Markdown to render',
				required: true,
				displayOptions: {
					show: {
						source: ['markdown'],
					},
				},
			},
			{
				displayName: 'Response Type',
				name: 'response_type',
				description: 'To get the URL of the rendering result, use the JSON response type',
				type: 'options',
				options: [
					{ name: 'JSON', value: 'json' },
					{
						name: 'Binary (By Format)',
						value: 'by_format',
						description:
							'The binary representation of the rendering result as a base64-encoded string',
					},
					{ name: 'Empty', value: 'empty' },
				],
				default: 'json',
			},
			// Screenshot options
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				options: [
					{ name: 'PNG', value: 'png' },
					{ name: 'JPG', value: 'jpg' },
					{ name: 'WEBP', value: 'webp' },
				],
				default: 'jpg',
				displayOptions: {
					show: {
						operation: ['screenshot', 'full_page'],
					},
				},
			},
			{
				displayName: 'Format',
				name: 'video_format',
				type: 'options',
				options: [
					{ name: 'MP4', value: 'mp4' },
					{ name: 'GIF', value: 'gif' },
				],
				default: 'mp4',
				displayOptions: {
					show: {
						operation: ['short_video', 'scrolling_screenshot'],
					},
				},
			},
			{
				displayName: 'Full Page Scroll Delay (Milliseconds)',
				name: 'full_page_scroll_delay',
				type: 'number',
				default: 400,
				typeOptions: {
					minValue: 400,
				},
				displayOptions: {
					show: {
						operation: ['full_page', 'screenshot'],
					},
				},
			},
			{
				displayName: 'Full Page',
				name: 'full_page',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['screenshot'],
					},
				},
			},
			// PDF options
			{
				displayName: 'Landscape',
				name: 'pdf_landscape',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['pdf'],
					},
				},
			},
			{
				displayName: 'Print Background',
				name: 'pdf_print_background',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['pdf'],
					},
				},
			},
			// Scrolling Screenshot options
			{
				displayName: 'Scroll Complete',
				name: 'scroll_complete',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['scrolling_screenshot'],
					},
				},
			},
			// Record Short Video options
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'number',
				default: 5,
				description: 'Video duration in seconds',
				displayOptions: {
					show: {
						operation: ['short_video', 'scrolling_screenshot'],
					},
				},
			},
			// Caching options
			{
				displayName: 'Cache',
				name: 'cache',
				type: 'boolean',
				default: false,
				description: 'Whether to enable or disable caching for this request',
			},
			{
				displayName: 'Cache TTL (Seconds)',
				name: 'cache_ttl',
				type: 'number',
				default: 14400,
				typeOptions: {
					minValue: 14400,
					maxValue: 2592000,
				},
				description: 'Time to live for cache in seconds (0 for default)',
			},
			{
				displayName: 'Cache Key',
				name: 'cache_key',
				type: 'string',
				default: '',
				description: 'Custom cache key for this request',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];
		const requestWithAuthentication = async (
			requestOptions: IHttpRequestOptions,
		): Promise<IN8nHttpFullResponse> =>
			(await this.helpers.httpRequestWithAuthentication.call(
				this,
				'screenshotOneCredentialsApi',
				requestOptions,
			)) as IN8nHttpFullResponse;

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const source = this.getNodeParameter('source', i, 'url') as 'url' | 'html' | 'markdown';
				const sourceData: Partial<Record<'url' | 'html' | 'markdown', string>> = {};
				if (source === 'url') {
					sourceData.url = this.getNodeParameter('url', i) as string;
				} else if (source === 'html') {
					sourceData.html = this.getNodeParameter('html', i) as string;
				} else if (source === 'markdown') {
					sourceData.markdown = this.getNodeParameter('markdown', i) as string;
				} else {
					throw new NodeOperationError(this.getNode(), `The source "${source}" is not supported`, {
						itemIndex: i,
					});
				}
				const cache = this.getNodeParameter('cache', i, false) as boolean;
				const cacheTtl = this.getNodeParameter('cache_ttl', i, 0) as number;
				const cacheKey = this.getNodeParameter('cache_key', i, '') as string;
				const responseType = this.getNodeParameter('response_type', i, 'json') as string;
				let data: IDataObject | undefined;
				const cacheParams = cache
					? {
							cache: 'true',
							cache_ttl: cacheTtl > 0 ? String(cacheTtl) : undefined,
							cache_key: cacheKey || undefined,
						}
					: {};

				if (operation === 'screenshot') {
					const format = this.getNodeParameter('format', i) as string;
					const fullPage = this.getNodeParameter('full_page', i, false) as boolean;
					data = await screenshotOneRequest({
						endpoint: 'take',
						source: sourceData,
						requestWithAuthentication,
						extra: {
							response_type: responseType,
							format,
							full_page: fullPage ? 'true' : undefined,
							...cacheParams,
						},
					});
				} else if (operation === 'pdf') {
					const pdfLandscape = this.getNodeParameter('pdf_landscape', i, false) as boolean;
					const pdfPrintBackground = this.getNodeParameter(
						'pdf_print_background',
						i,
						false,
					) as boolean;
					data = await screenshotOneRequest({
						endpoint: 'take',
						source: sourceData,
						requestWithAuthentication,
						extra: {
							response_type: responseType,
							format: 'pdf',
							pdf_landscape: pdfLandscape ? 'true' : undefined,
							pdf_print_background: pdfPrintBackground ? 'true' : undefined,
							...cacheParams,
						},
					});
				} else if (operation === 'full_page') {
					const format = this.getNodeParameter('format', i) as string;
					const fullPageScrollDelay = this.getNodeParameter(
						'full_page_scroll_delay',
						i,
						0,
					) as number;
					data = await screenshotOneRequest({
						endpoint: 'take',
						source: sourceData,
						requestWithAuthentication,
						extra: {
							response_type: responseType,
							format,
							full_page: 'true',
							full_page_scroll: 'true',
							full_page_scroll_delay: fullPageScrollDelay ? String(fullPageScrollDelay) : undefined,
							...cacheParams,
						},
					});
				} else if (operation === 'scrolling_screenshot') {
					const format = this.getNodeParameter('video_format', i, 'mp4') as string;
					const duration = this.getNodeParameter('duration', i) as number;
					const scrollComplete = this.getNodeParameter('scroll_complete', i, false) as boolean;
					data = await screenshotOneRequest({
						endpoint: 'take',
						source: sourceData,
						requestWithAuthentication,
						extra: {
							response_type: responseType,
							format,
							scroll_complete: scrollComplete ? 'true' : undefined,
							duration,
							...cacheParams,
						},
					});
				} else if (operation === 'short_video') {
					const format = this.getNodeParameter('video_format', i, 'mp4') as string;
					const scenario = this.getNodeParameter('scenario', i, 'default') as string;
					const duration = this.getNodeParameter('duration', i) as number;
					data = await screenshotOneRequest({
						endpoint: 'animate',
						source: sourceData,
						scenario,
						requestWithAuthentication,
						extra: {
							response_type: responseType,
							format,
							duration,
							...cacheParams,
						},
					});
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported`,
						{ itemIndex: i },
					);
				}

				results.push({ json: data || {}, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					results.push({
						json: { error: getErrorMessage(error) },
						pairedItem: { item: i },
					});
					continue;
				}

				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error;
				}

				throw new NodeApiError(
					this.getNode(),
					{ message: getErrorMessage(error) },
					{ itemIndex: i },
				);
			}
		}
		return [results];
	}
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}
