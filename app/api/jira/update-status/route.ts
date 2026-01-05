import { NextResponse } from 'next/server';

// Hardcoded Jira credentials
const JIRA_DOMAIN = 'nasirmovlamov-1754308528391.atlassian.net';
const JIRA_EMAIL = 'nasirmovlamov@gmail.com';
const JIRA_API_TOKEN = 'ATATT3xFfGF0Ob4obI2N7NqUUIrZmMyctUptKlkoCyCBJnJpnyWVcUIZYC1xGTvOC6MNNL4V0v3am3H5xMnsJoy7n3HMRPIhQGbw79OdUox4gW8cqcdpJj6IevpSB80T-Em27NYLlcqSO3XVxSMZitD-i5Ie9p-pdUvFkJGFSEyfZYgJvS0RNqI=72F39ED5';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { issueKey, transitionId } = body;

    if (!issueKey || !transitionId) {
      return NextResponse.json(
        { error: 'Issue key and transition ID are required' },
        { status: 400 }
      );
    }

    const apiUrl = `https://${JIRA_DOMAIN}/rest/api/3/issue/${issueKey}/transitions`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transition: {
          id: transitionId,
        },
      }),
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
      const errorText = await response.text();
      throw new Error(`Failed to update status: ${response.status} - ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Jira update status API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Jira status' },
      { status: 500 }
    );
  }
}

