import {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ScreenshotOneCredentialsApi implements ICredentialType {
	name = 'screenshotOneCredentialsApi';
	displayName = 'ScreenshotOne Credentials API';

	icon: Icon = {
		light: 'file:../nodes/ScreenshotOne/screenshotone.svg',
		dark: 'file:../nodes/ScreenshotOne/screenshotone.dark.svg',
	};

	documentationUrl = 'https://screenshotone.com/docs/';

	properties: INodeProperties[] = [
		{
			displayName: 'API (Access) Key',
			name: 'access_key',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				access_key: '={{ $credentials.access_key }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.screenshotone.com',
			url: '/usage',
			qs: {
				access_key: '={{ $credentials.access_key }}',
			},
		},
	};
}
