import { NextResponse } from 'next/server';

const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

export async function GET() {
  if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    return NextResponse.json(
      { error: 'Jira credentials not configured. Please set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN in your environment variables.' },
      { status: 500 }
    );
  }

  try {
    // Fetch high priority tasks assigned to the user
    const jql = encodeURIComponent(
      'priority = Highest AND status != Done AND assignee = currentUser() ORDER BY updated DESC'
    );

    // Use the new /rest/api/3/search/jql endpoint (migrated from /rest/api/3/search)
    const response = await fetch(
      `https://${JIRA_DOMAIN}/rest/api/3/search/jql?jql=${jql}&maxResults=10&fields=summary,status,priority,assignee,updated,issuetype`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira API error:', response.status, errorText);
      throw new Error(`Jira API error: ${response.status}`);
    }

    const data = await response.json();

    const tasks = data.issues.map((issue: any) => ({
      id: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name || 'Unknown',
      type: issue.fields.issuetype?.name || 'Task',
      updated: issue.fields.updated,
      url: `https://${JIRA_DOMAIN}/browse/${issue.key}`,
    }));

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Jira API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Jira tasks' },
      { status: 500 }
    );
  }
}

