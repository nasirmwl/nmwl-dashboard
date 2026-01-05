import { NextResponse } from 'next/server';

// Hardcoded Jira credentials
const JIRA_DOMAIN = 'nasirmovlamov-1754308528391.atlassian.net';
const JIRA_EMAIL = 'nasirmovlamov@gmail.com';
const JIRA_API_TOKEN = 'ATATT3xFfGF0Ob4obI2N7NqUUIrZmMyctUptKlkoCyCBJnJpnyWVcUIZYC1xGTvOC6MNNL4V0v3am3H5xMnsJoy7n3HMRPIhQGbw79OdUox4gW8cqcdpJj6IevpSB80T-Em27NYLlcqSO3XVxSMZitD-i5Ie9p-pdUvFkJGFSEyfZYgJvS0RNqI=72F39ED5';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const issueKey = searchParams.get('issueKey');

  if (!issueKey) {
    return NextResponse.json(
      { error: 'Issue key is required' },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `https://${JIRA_DOMAIN}/rest/api/3/issue/${issueKey}/transitions`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Jira authentication failed. Please check your credentials.');
      }
      if (response.status === 403) {
        throw new Error('Jira access forbidden. Please check your API token permissions.');
      }
      if (response.status === 404) {
        throw new Error(`Jira issue not found: ${issueKey}`);
      }
      throw new Error(`Failed to fetch transitions: ${response.status}`);
    }

    const data = await response.json();
    const transitions = data.transitions || [];

    return NextResponse.json({ transitions });
  } catch (error: any) {
    console.error('Jira transitions API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Jira transitions' },
      { status: 500 }
    );
  }
}

