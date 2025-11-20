import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
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

	async execute(this: any) {
		const items = this.getInputData();
		const results = [];
		const credentials = await this.getCredentials('screenshotOneCredentialsApi');
		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i);
			const url = this.getNodeParameter('url', i);
			const cache = this.getNodeParameter('cache', i, false);
			const cache_ttl = this.getNodeParameter('cache_ttl', i, 0);
			const cache_key = this.getNodeParameter('cache_key', i, '');
			const response_type = this.getNodeParameter('response_type', i, 'json');
			let data;
			const cacheParams = cache
				? {
						cache: cache ? 'true' : undefined,
						cache_ttl: cache_ttl > 0 ? String(cache_ttl) : undefined,
						cache_key: cache_key || undefined,
					}
				: {};
			if (operation === 'screenshot') {
				const format = this.getNodeParameter('format', i);
				const full_page = this.getNodeParameter('full_page', i, false);
				data = await screenshotOneRequest({
					endpoint: 'take',
					url,
					access_key: credentials.access_key,
					extra: {
						response_type,
						format,
						full_page: full_page ? 'true' : undefined,
						...cacheParams,
					},
				});
			} else if (operation === 'pdf') {
				const pdf_landscape = this.getNodeParameter('pdf_landscape', i, false);
				const pdf_print_background = this.getNodeParameter('pdf_print_background', i, false);
				data = await screenshotOneRequest({
					endpoint: 'take',
					url,
					access_key: credentials.access_key,
					extra: {
						response_type,
						format: 'pdf',
						pdf_landscape: pdf_landscape ? 'true' : undefined,
						pdf_print_background: pdf_print_background ? 'true' : undefined,
						...cacheParams,
					},
				});
			} else if (operation === 'full_page') {
				const format = this.getNodeParameter('format', i);
				const full_page_scroll_delay = this.getNodeParameter('full_page_scroll_delay', i, 0);
				data = await screenshotOneRequest({
					endpoint: 'take',
					url,
					access_key: credentials.access_key,
					extra: {
						response_type,
						format,
						full_page: 'true',
						full_page_scroll: 'true',
						full_page_scroll_delay: full_page_scroll_delay
							? String(full_page_scroll_delay)
							: undefined,
						...cacheParams,
					},
				});
			} else if (operation === 'scrolling_screenshot') {
				const format = this.getNodeParameter('video_format', i, 'mp4');
				const duration = this.getNodeParameter('duration', i);
				const scroll_complete = this.getNodeParameter('scroll_complete', i, false);
				data = await screenshotOneRequest({
					endpoint: 'take',
					url,
					access_key: credentials.access_key,
					extra: {
						response_type,
						format,
						scroll_complete: scroll_complete ? 'true' : undefined,
						duration,
						...cacheParams,
					},
				});
			} else if (operation === 'short_video') {
				const format = this.getNodeParameter('video_format', i, 'mp4');
				const scenario = this.getNodeParameter('scenario', i, 'default');
				const duration = this.getNodeParameter('duration', i);
				data = await screenshotOneRequest({
					endpoint: 'animate',
					url,
					access_key: credentials.access_key,
					scenario,
					extra: {
						response_type,
						format,
						duration,
						...cacheParams,
					},
				});
			}
			results.push({ json: data || {} });
		}
		return [results];
	}
}
